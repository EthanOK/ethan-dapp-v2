import {
  address as bitcoinAddress,
  networks as bitcoinNetworks,
  payments as bitcoinPayments,
} from 'bitcoinjs-lib'
import ecc from '@bitcoinerlab/secp256k1'

type VerifyBitcoinMessageParams = {
  /**
   * Optional: expected address (used to infer network + match derived addresses)
   */
  address?: string
  /**
   * Optional: expected public key in hex.
   * - 33-byte compressed (starts with 02/03)
   * - 65-byte uncompressed (starts with 04)
   * - 32-byte x-only (taproot internal key)
   */
  publicKey?: string
  message: string
  signature: string
}

const textEncoder = new TextEncoder()

function concatBytes(...parts: Uint8Array[]) {
  const total = parts.reduce((sum, p) => sum + p.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const p of parts) {
    out.set(p, offset)
    offset += p.length
  }
  return out
}

function encodeVarInt(n: number) {
  if (!Number.isFinite(n) || n < 0) throw new Error('Invalid varint')
  if (n < 0xfd) return Uint8Array.of(n)
  if (n <= 0xffff) return Uint8Array.of(0xfd, n & 0xff, (n >> 8) & 0xff)
  if (n <= 0xffffffff) {
    return Uint8Array.of(
      0xfe,
      n & 0xff,
      (n >> 8) & 0xff,
      (n >> 16) & 0xff,
      (n >> 24) & 0xff,
    )
  }
  // JS number can't safely hold > 2^53-1; we don't expect messages this large.
  throw new Error('Varint too large')
}

async function sha256(data: Uint8Array) {
  // Pass an ArrayBuffer to satisfy TS BufferSource typing across lib versions
  // Ensure we always pass an actual ArrayBuffer (not SharedArrayBuffer/ArrayBufferLike)
  const copy = Uint8Array.from(data)
  const digest = await crypto.subtle.digest('SHA-256', copy.buffer)
  return new Uint8Array(digest)
}

async function hash256(data: Uint8Array) {
  return await sha256(await sha256(data))
}

function tryDecodeSignature(sig: string): Uint8Array | undefined {
  const s = sig.trim()

  // hex (130 chars => 65 bytes)
  if (/^[0-9a-fA-F]+$/.test(s) && s.length % 2 === 0) {
    const bytes = new Uint8Array(s.length / 2)
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(s.slice(i * 2, i * 2 + 2), 16)
    }
    return bytes
  }

  // base64
  try {
    const bin = atob(s)
    const bytes = new Uint8Array(bin.length)
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
    return bytes
  } catch {
    return undefined
  }
}

function detectNetworkByAddress(addr: string) {
  try {
    bitcoinAddress.toOutputScript(addr, bitcoinNetworks.bitcoin)
    return bitcoinNetworks.bitcoin
  } catch {
    //
  }
  try {
    bitcoinAddress.toOutputScript(addr, bitcoinNetworks.testnet)
    return bitcoinNetworks.testnet
  } catch {
    //
  }
  return undefined
}

function hexToBytes(hex: string): Uint8Array | undefined {
  const h = hex.trim().toLowerCase().replace(/^0x/, '')
  if (!/^[0-9a-f]+$/.test(h) || h.length % 2 !== 0) return undefined
  const out = new Uint8Array(h.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(h.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

function bytesEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

/**
 * Verify a "Bitcoin Signed Message" (compact ECDSA, 65-byte recoverable) signature.
 * This matches the common message signing format used by many Bitcoin wallets.
 *
 * Notes:
 * - Only supports ECDSA compact signatures (header + 64 bytes). BIP322 is not handled here.
 * - Tries to match the recovered pubkey against common address types (p2wpkh / p2pkh / p2sh-p2wpkh).
 */
export async function verifyBitcoinSignedMessage({
  address,
  publicKey,
  message,
  signature,
}: VerifyBitcoinMessageParams): Promise<boolean> {
  const network = address ? detectNetworkByAddress(address) : undefined

  const sigBytes = tryDecodeSignature(signature)
  if (!sigBytes || sigBytes.length !== 65) return false

  const header = sigBytes[0]
  // header is usually 27..34
  if (header < 27 || header > 34) return false

  const recoveryId = ((header - 27) & 3) as 0 | 1 | 2 | 3
  const compressed = ((header - 27) & 4) !== 0
  const compactSig = sigBytes.slice(1) // 64 bytes (r||s)

  const prefix = textEncoder.encode('\x18Bitcoin Signed Message:\n')
  const msgBytes = textEncoder.encode(message)
  const payload = concatBytes(prefix, encodeVarInt(msgBytes.length), msgBytes)
  const msgHash = await hash256(payload)

  const pubkey = ecc.recover(msgHash, compactSig, recoveryId, compressed)
  if (!pubkey) return false

  if (publicKey) {
    const expected = hexToBytes(publicKey)
    if (!expected) return false

    // full pubkey (compressed/uncompressed)
    if (expected.length === 33 || expected.length === 65) {
      if (!bytesEqual(pubkey, expected)) return false
    } else if (expected.length === 32) {
      // x-only pubkey (taproot internal key)
      const xonly = ecc.xOnlyPointFromPoint(pubkey)
      if (!bytesEqual(xonly, expected)) return false
    } else {
      return false
    }

    // If caller only cares about publicKey, we can return now.
    if (!address) return true
  }

  if (!address) return false
  if (!network) return false

  const candidates = [
    // Legacy P2PKH: 1... / m...n...
    bitcoinPayments.p2pkh({ pubkey, network }).address,
    // Native SegWit P2WPKH: bc1q... / tb1q...
    bitcoinPayments.p2wpkh({ pubkey, network }).address,
    // Nested SegWit P2SH-P2WPKH: 3... / 2...
    bitcoinPayments.p2sh({
      redeem: bitcoinPayments.p2wpkh({ pubkey, network }),
      network,
    }).address,
    // Taproot P2TR: bc1p... / tb1p...
    bitcoinPayments.p2tr({
      internalPubkey: ecc.xOnlyPointFromPoint(pubkey),
      network,
    }).address,
  ].filter(Boolean) as string[]

  return candidates.includes(address)
}
