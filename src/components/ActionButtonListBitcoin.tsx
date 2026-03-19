import {
  useDisconnect,
  useAppKit,
  // useAppKitNetwork,
  useAppKitAccount,
  useAppKitProvider,
  useAppKitNetworkCore,
  CaipNetwork,
} from '@reown/appkit/react'

import { BitcoinConnector } from '@reown/appkit-adapter-bitcoin'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import {
  DEFAULT_TRANSFER_BTC_AMOUNT,
  GetRecipientBitcoinAddress,
} from '../config/constant'
import {
  createPSBT,
  getBitCoinBalance,
  IsBitcoinTestnet,
} from '../utils/BitcoinUtil'
import { formatUnits, parseUnits } from 'ethers'
import { verifyBitcoinSignedMessage } from '../utils/BitcoinMessageVerify'

interface ActionButtonListProps {
  sendHash: (hash: string) => void
  sendSignMsg: (hash: string) => void
  sendBalance: (balance: string) => void
  sendPublicKey?: (publicKey: string) => void
}

export const ActionButtonList = ({
  sendHash,
  sendSignMsg,
  sendBalance,
  sendPublicKey,
}: ActionButtonListProps) => {
  const DEFAULT_VERIFY_MESSAGE = 'Hello Reown AppKit!'
  const DEFAULT_VERIFY_SIGNATURE =
    'HxrvA5aF2/1v9XcYMphn4ykVoY2VCIABRS6eNqrccywpfkThkIIhjexziZntqv2ybyllPYpz6vWiuDTLncCpI98='
  const DEFAULT_VERIFY_ADDRESS = 'tb1qsdhrfg9yut9k4dm60jjnrvctpaxn8eex497xal'

  const { disconnect } = useDisconnect()
  const { open } = useAppKit()
  const { caipNetwork } = useAppKitNetworkCore()
  const { isConnected, address } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider<BitcoinConnector>('bip122')
  const [publicKey, setPublicKey] = useState<string | undefined>(undefined)

  const defaultRecipientAddress = useMemo(() => {
    if (!address) return ''
    return GetRecipientBitcoinAddress(IsBitcoinTestnet(address))
  }, [address])

  useEffect(() => {
    if (!sendPublicKey) return
    if (!isConnected || !walletProvider || !address) return
    if (publicKey) return

    let cancelled = false

    ;(async () => {
      try {
        const accounts = await walletProvider.getAccountAddresses()
        const current = accounts.find((a) => a.address === address)
        const publicKey = current?.publicKey

        if (
          !cancelled &&
          typeof publicKey === 'string' &&
          publicKey.length > 0
        ) {
          setPublicKey(publicKey)
          sendPublicKey(publicKey)
        }
      } catch (e) {
        // silent on auto-fetch to avoid toast spam
        console.debug('Failed to auto-fetch public key', e)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [address, isConnected, sendPublicKey, walletProvider, publicKey])

  const [psbtAmountBtc, setPsbtAmountBtc] = useState<string>('')
  const [psbtRecipientAddress, setPsbtRecipientAddress] = useState<string>('')
  const [psbtChangeMode, setPsbtChangeMode] = useState<'self' | 'other'>('self')
  const [psbtChangeAddressOther, setPsbtChangeAddressOther] =
    useState<string>('')
  const [isSendingPsbt, setIsSendingPsbt] = useState<boolean>(false)

  const [verifyMode, setVerifyMode] = useState<'address' | 'publicKey'>(
    'address',
  )
  const [verifyMessage, setVerifyMessage] = useState(DEFAULT_VERIFY_MESSAGE)
  const [verifySignature, setVerifySignature] = useState(
    DEFAULT_VERIFY_SIGNATURE,
  )
  const [verifyAddress, setVerifyAddress] = useState(DEFAULT_VERIFY_ADDRESS)
  const [verifyPublicKey, setVerifyPublicKey] = useState('')
  const [verifyResult, setVerifyResult] = useState<
    'idle' | 'passed' | 'failed' | 'error'
  >('idle')
  const [isVerifying, setIsVerifying] = useState(false)

  const handleDisconnect = async () => {
    try {
      await disconnect()
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
  }

  // function to send a tx
  const handleSendTx = async () => {
    if (!walletProvider || !address) throw Error('user is disconnected')

    const recipientAddress = GetRecipientBitcoinAddress(
      IsBitcoinTestnet(address),
    )

    const amount = parseUnits(DEFAULT_TRANSFER_BTC_AMOUNT, 8)
    const signature = await walletProvider.sendTransfer({
      recipient: recipientAddress,
      amount: amount.toString(),
    })

    sendHash(signature)
  }

  // function to sing a msg
  const handleSignMsg = async () => {
    if (!walletProvider || !address) throw Error('user is disconnected')

    const message = 'Hello Reown AppKit!'

    const signature = await walletProvider.signMessage({
      address,
      message,
    })

    // Pre-fill Verify Message form
    setVerifyMessage(message)
    setVerifySignature(signature)
    setVerifyAddress(address)
    setVerifyPublicKey(publicKey || '')
    setVerifyResult('idle')

    // verify the signature (client-side)
    try {
      const verified_address = await verifyBitcoinSignedMessage({
        address,
        message,
        signature,
      })
      const verified_pubkey = await verifyBitcoinSignedMessage({
        publicKey: publicKey,
        message,
        signature,
      })
      if (verified_address && verified_pubkey) {
        toast.success('Signature verified')
      } else {
        toast.error('Signature verification failed')
      }
    } catch {
      // toast.error('Failed to verify signature')
    }
    sendSignMsg(signature)
  }

  const handleSendPSBT = async () => {
    if (!walletProvider || !address) throw Error('user is disconnected')
    if (isSendingPsbt) return

    const amountBtc = psbtAmountBtc.trim() || DEFAULT_TRANSFER_BTC_AMOUNT
    const amount = parseUnits(amountBtc, 8)

    const recipientAddress =
      psbtRecipientAddress.trim() ||
      defaultRecipientAddress ||
      GetRecipientBitcoinAddress(IsBitcoinTestnet(address))

    const changeAddress =
      psbtChangeMode === 'self'
        ? address
        : psbtChangeAddressOther.trim() || address

    setIsSendingPsbt(true)
    try {
      const params = await createPSBT(
        caipNetwork as CaipNetwork,
        Number(amount),
        address,
        recipientAddress,
        changeAddress,
      )

      params.broadcast = true // change to true to broadcast the tx

      const signResponse = await walletProvider.signPSBT(params)

      sendHash(signResponse.txid || signResponse.psbt)
      if (signResponse.txid) {
        const explorerUrl = `https://mempool.space${
          IsBitcoinTestnet(address) ? '/testnet' : ''
        }/tx/${signResponse.txid}`
        toast.custom((t) => (
          <div
            style={{
              background: 'rgba(20,20,20,0.92)',
              color: '#fff',
              padding: '12px 14px',
              borderRadius: 12,
              boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
              maxWidth: 720,
              width: 'calc(100vw - 32px)',
              opacity: t.visible ? 1 : 0,
              transition: 'opacity 200ms ease',
            }}
          >
            <div
              style={{
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                fontSize: 12,
                opacity: 0.95,
                wordBreak: 'break-all',
              }}
            >
              Broadcasted TXID:{' '}
              <a
                href={explorerUrl}
                target="_blank"
                rel="noreferrer"
                style={{ color: '#8ab4ff', textDecoration: 'underline' }}
              >
                {signResponse.txid}
              </a>
            </div>
          </div>
        ))
      } else {
        toast.success('PSBT signed')
      }
    } catch (error) {
      const maybeObj = error as unknown as { code?: unknown; message?: unknown }
      const code =
        typeof maybeObj?.code === 'number'
          ? maybeObj.code
          : typeof maybeObj?.code === 'string'
            ? Number(maybeObj.code)
            : undefined

      const rawMessage =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : typeof maybeObj?.message === 'string'
              ? maybeObj.message
              : ''

      const normalized = rawMessage.toLowerCase()
      const isUserRejected =
        code === 4001 ||
        normalized.includes('user rejected') ||
        normalized.includes('user denied') ||
        normalized.includes('rejected') ||
        normalized.includes('denied') ||
        normalized.includes('cancelled') ||
        normalized.includes('canceled') ||
        normalized.includes('request rejected') ||
        normalized.includes('declined') ||
        normalized.includes('已拒絕') ||
        normalized.includes('拒绝') ||
        normalized.includes('拒絕')

      if (isUserRejected) {
        toast('Signature request was rejected')
        return
      }

      toast.error(rawMessage || 'Failed to send PSBT')
    } finally {
      setIsSendingPsbt(false)
    }
  }

  // function to get the balance
  const handleGetBalance = async () => {
    if (!walletProvider || !address) throw Error('user is disconnected')

    const balance = await getBitCoinBalance(address)
    sendBalance(`${formatUnits(balance, 8)} BTC`)
  }

  // function to get the public key for the current connected address
  // const handleGetPublicKey = async () => {
  //   if (!walletProvider || !address) throw Error('user is disconnected')

  //   const accounts = await walletProvider.getAccountAddresses()
  //   const current = accounts.find((a) => a.address === address)

  //   const publicKeyAny = current?.publicKey as unknown
  //   let publicKeyHex: string | undefined

  //   if (typeof publicKeyAny === 'string') {
  //     publicKeyHex = publicKeyAny
  //   } else if (publicKeyAny && publicKeyAny instanceof Uint8Array) {
  //     // Convert Uint8Array -> hex without relying on Buffer polyfills
  //     publicKeyHex = Array.from(publicKeyAny)
  //       .map((b) => b.toString(16).padStart(2, '0'))
  //       .join('')
  //   }

  //   if (!publicKeyHex) {
  //     toast.error('Public key is not available for this account')
  //     return
  //   }

  //   sendPublicKey?.(publicKeyHex)
  // }

  const handleVerifyMessage = async () => {
    if (isVerifying) return

    const message = verifyMessage.trim() || DEFAULT_VERIFY_MESSAGE
    const signature = verifySignature.trim() || DEFAULT_VERIFY_SIGNATURE
    const addressToUse =
      (verifyMode === 'address' ? verifyAddress.trim() : '') ||
      address ||
      DEFAULT_VERIFY_ADDRESS
    const publicKeyToUse = (
      verifyMode === 'publicKey' ? verifyPublicKey.trim() : publicKey || ''
    ).trim()

    if (!message) {
      toast.error('Message is required')
      return
    }
    if (!signature) {
      toast.error('Signature is required')
      return
    }
    if (verifyMode === 'address' && !addressToUse) {
      toast.error('Address is required')
      return
    }
    if (verifyMode === 'publicKey' && !publicKeyToUse) {
      toast.error('Public key is required')
      return
    }

    setIsVerifying(true)
    setVerifyResult('idle')
    try {
      const ok = await verifyBitcoinSignedMessage({
        message,
        signature,
        address: verifyMode === 'address' ? addressToUse : undefined,
        publicKey: verifyMode === 'publicKey' ? publicKeyToUse : undefined,
      })
      setVerifyResult(ok ? 'passed' : 'failed')
      if (ok) {
        toast.success('Signature verified')
      } else {
        toast.error('Signature verification failed')
      }
    } catch (e) {
      console.error('verifyBitcoinSignedMessage failed', e)
      setVerifyResult('error')
      toast.error('Verification error')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <div>
      {isConnected && publicKey ? (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            border: '1px solid rgba(0,0,0,0.12)',
            borderRadius: 12,
            maxWidth: 680,
            background: 'rgba(0,0,0,0.02)',
          }}
        >
          <div style={{ fontWeight: 650, marginBottom: 8 }}>Public Key</div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div
              style={{
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                fontSize: 12,
                lineHeight: 1.4,
                wordBreak: 'break-all',
                opacity: 0.9,
                flex: 1,
              }}
            >
              {publicKey}
            </div>
          </div>
        </div>
      ) : null}
      {isConnected ? (
        <div>
          <button onClick={() => open()}>Open</button>
          <button onClick={handleDisconnect}>Disconnect</button>
          {/* <button onClick={() => switchNetwork(networks[1])}>Switch</button> */}
          <button onClick={handleSignMsg}>Sign msg</button>
          {/* <button onClick={handleGetPublicKey}>Get PublicKey</button> */}
          <button onClick={handleSendTx}>Send tx</button>
          <button onClick={handleGetBalance}>Get Balance</button>
          <div
            style={{
              marginTop: 12,
              padding: 16,
              border: '1px solid rgba(0,0,0,0.12)',
              borderRadius: 12,
              maxWidth: 680,
            }}
          >
            <div style={{ fontWeight: 650, marginBottom: 12 }}>Send PSBT</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label
                style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
              >
                <span style={{ fontSize: 13, opacity: 0.85 }}>
                  Amount (BTC)
                </span>
                <input
                  inputMode="decimal"
                  value={psbtAmountBtc}
                  placeholder={DEFAULT_TRANSFER_BTC_AMOUNT}
                  onChange={(e) => setPsbtAmountBtc(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(0,0,0,0.18)',
                  }}
                />
              </label>

              <label
                style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
              >
                <span style={{ fontSize: 13, opacity: 0.85 }}>
                  Recipient address
                </span>
                <input
                  value={psbtRecipientAddress}
                  placeholder={defaultRecipientAddress || 'Enter a BTC address'}
                  onChange={(e) => setPsbtRecipientAddress(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(0,0,0,0.18)',
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  }}
                />
                <div style={{ fontSize: 12, opacity: 0.75 }}></div>
              </label>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>
                  Change address
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <label
                    style={{ display: 'flex', gap: 8, alignItems: 'center' }}
                  >
                    <input
                      type="radio"
                      checked={psbtChangeMode === 'self'}
                      onChange={() => setPsbtChangeMode('self')}
                    />
                    <span>Self</span>
                    <span style={{ fontSize: 12, opacity: 0.7 }}>
                      ({address})
                    </span>
                  </label>
                  <label
                    style={{ display: 'flex', gap: 8, alignItems: 'center' }}
                  >
                    <input
                      type="radio"
                      checked={psbtChangeMode === 'other'}
                      onChange={() => setPsbtChangeMode('other')}
                    />
                    <span>Other</span>
                  </label>
                </div>
                {psbtChangeMode === 'other' ? (
                  <input
                    value={psbtChangeAddressOther}
                    placeholder="Enter change address"
                    onChange={(e) => setPsbtChangeAddressOther(e.target.value)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid rgba(0,0,0,0.18)',
                      fontFamily:
                        'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                    }}
                  />
                ) : null}
              </div>

              <button
                onClick={handleSendPSBT}
                disabled={isSendingPsbt}
                style={{
                  marginTop: 4,
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: '1px solid rgba(0,0,0,0.25)',
                  fontWeight: 600,
                  opacity: isSendingPsbt ? 0.6 : 1,
                  cursor: isSendingPsbt ? 'not-allowed' : 'pointer',
                }}
              >
                {isSendingPsbt ? 'Sending…' : 'Send PSBT'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div
        style={{
          marginTop: 12,
          marginLeft: 'auto',
          marginRight: 'auto',
          padding: 16,
          border: '1px solid rgba(0,0,0,0.12)',
          borderRadius: 12,
          width: isConnected ? '100%' : 'calc(100vw - 32px)',
          maxWidth: isConnected ? 680 : 980,
        }}
      >
        <div style={{ fontWeight: 650, marginBottom: 12 }}>Verify Message</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, opacity: 0.85 }}>Message</span>
            <input
              value={verifyMessage}
              placeholder={DEFAULT_VERIFY_MESSAGE}
              onChange={(e) => setVerifyMessage(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid rgba(0,0,0,0.18)',
              }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 13, opacity: 0.85 }}>Signature</span>
            <textarea
              value={verifySignature}
              placeholder={DEFAULT_VERIFY_SIGNATURE}
              onChange={(e) => setVerifySignature(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: '1px solid rgba(0,0,0,0.18)',
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                minHeight: 84,
                resize: 'vertical',
              }}
            />
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: 13, opacity: 0.85 }}>Verify with</div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="radio"
                  checked={verifyMode === 'address'}
                  onChange={() => setVerifyMode('address')}
                />
                <span>Address</span>
              </label>
              <label style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  type="radio"
                  checked={verifyMode === 'publicKey'}
                  onChange={() => setVerifyMode('publicKey')}
                />
                <span>Public key</span>
              </label>
            </div>

            {verifyMode === 'address' ? (
              <>
                <input
                  value={verifyAddress}
                  placeholder={DEFAULT_VERIFY_ADDRESS}
                  onChange={(e) => setVerifyAddress(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(0,0,0,0.18)',
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  }}
                />
              </>
            ) : (
              <>
                <input
                  value={verifyPublicKey}
                  placeholder="Enter public key hex (33/65 bytes or x-only 32 bytes)"
                  onChange={(e) => setVerifyPublicKey(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 10,
                    border: '1px solid rgba(0,0,0,0.18)',
                    fontFamily:
                      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                  }}
                />
              </>
            )}

            {verifyResult !== 'idle' ? (
              <div style={{ fontSize: 12, opacity: 0.85 }}>
                Result:{' '}
                {verifyResult === 'passed'
                  ? 'Passed'
                  : verifyResult === 'failed'
                    ? 'Failed'
                    : 'Error'}
              </div>
            ) : null}
          </div>

          <button
            onClick={handleVerifyMessage}
            disabled={isVerifying}
            style={{
              marginTop: 4,
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid rgba(0,0,0,0.25)',
              fontWeight: 600,
              opacity: isVerifying ? 0.6 : 1,
              cursor: isVerifying ? 'not-allowed' : 'pointer',
            }}
          >
            {isVerifying ? 'Verifying…' : 'Verify'}
          </button>
        </div>
      </div>
    </div>
  )
}
