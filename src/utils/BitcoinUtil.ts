import {
  Psbt,
  networks as bitcoinNetworks,
  address as bitcoinAddress,
  Network,
  payments as bitcoinPayments,
} from 'bitcoinjs-lib'
import * as bitcoinPSBTUtils from 'bitcoinjs-lib/src/psbt/psbtutils'
import { bitcoinTestnet } from '@reown/appkit/networks'
import { CaipNetwork, CaipNetworkId } from '@reown/appkit'
import { BitcoinConnector } from '@reown/appkit-adapter-bitcoin'

export const IsBitcoinTestnet = (address: string) => {
  return detectNetwork(address) === 'testnet'
}

function detectNetwork(address: string) {
  try {
    bitcoinAddress.toOutputScript(address, bitcoinNetworks.bitcoin)
    return 'mainnet'
  } catch {
    //
  }

  try {
    bitcoinAddress.toOutputScript(address, bitcoinNetworks.testnet)
    return 'testnet'
  } catch {
    //
  }
  return 'invalid'
}

export const getBitcoinNetwork = (networkId: CaipNetworkId): Network => {
  return isTestnet(networkId)
    ? bitcoinNetworks.testnet
    : bitcoinNetworks.bitcoin
}

export const isTestnet = (networkId: CaipNetworkId): boolean => {
  return networkId === bitcoinTestnet.caipNetworkId
}

export type UTXO = {
  txid: string
  vout: number
  value: number
  status: {
    confirmed: boolean
    block_height: number
    block_hash: string
    block_time: number
  }
}

export const getUTXOs = async (
  address: string,
  isTestnet: boolean = false,
): Promise<UTXO[]> => {
  const response = await fetch(
    `https://mempool.space${isTestnet ? '/testnet' : ''}/api/address/${address}/utxo`,
  )
  return await response.json()
}

// export const getBalance = async (caipNetwork: CaipNetwork, address: string): Promise<number> => {
//     // get the utxos ... this is the list of unspent transactions that the sender has
//     const utxos = await getUTXOs(address, isTestnet(caipNetwork.caipNetworkId))
//     // return the sum of the utxos ... The balance of the sender
//     return utxos.reduce((sum, utxo) => sum + utxo.value, 0)
// }

export const getBitCoinBalance = async (address: string): Promise<number> => {
  // get the utxos ... this is the list of unspent transactions that the sender has
  const utxos = await getUTXOs(address, IsBitcoinTestnet(address))
  // return the sum of the utxos ... The balance of the sender
  return utxos.reduce((sum, utxo) => sum + utxo.value, 0)
}

export const getPaymentByAddress = (
  address: string,
  network: bitcoinNetworks.Network,
): bitcoinPayments.Payment => {
  const output = bitcoinAddress.toOutputScript(address, network)

  if (bitcoinPSBTUtils.isP2MS(output)) {
    return bitcoinPayments.p2ms({ output, network })
  } else if (bitcoinPSBTUtils.isP2PK(output)) {
    return bitcoinPayments.p2pk({ output, network })
  } else if (bitcoinPSBTUtils.isP2PKH(output)) {
    return bitcoinPayments.p2pkh({ output, network })
  } else if (bitcoinPSBTUtils.isP2WPKH(output)) {
    return bitcoinPayments.p2wpkh({ output, network })
  } else if (bitcoinPSBTUtils.isP2WSHScript(output)) {
    return bitcoinPayments.p2wsh({ output, network })
  } else if (bitcoinPSBTUtils.isP2SHScript(output)) {
    return bitcoinPayments.p2sh({ output, network })
  } else if (bitcoinPSBTUtils.isP2TR(output)) {
    return bitcoinPayments.p2tr({ output, network })
  }

  throw new Error('Unsupported payment type')
}

export const getFeeRate = async () => {
  const defaultFeeRate = 2
  try {
    const response = await fetch(
      'https://mempool.space/api/v1/fees/recommended',
    )
    if (response.ok) {
      const data = await response.json()

      if (data?.fastestFee) {
        return parseInt(data.fastestFee, 10)
      }
    }
  } catch (e) {
    console.error('Error fetching fee rate', e)
  }

  return defaultFeeRate
}

export const calculateChange = (
  utxos: UTXO[],
  amount: number,
  feeRate: number,
): number => {
  const inputSum = utxos.reduce((sum, utxo) => sum + utxo.value, 0)
  /**
   * 10 bytes: This is an estimated fixed overhead for the transaction.
   * 148 bytes: This is the average size of each input (UTXO).
   * 34 bytes: This is the size of each output.
   * The multiplication by 2 indicates that there are usually two outputs in a typical transaction (one for the recipient and one for change)
   */
  const estimatedSize = 10 + 148 * utxos.length + 34 * 2
  const fee = estimatedSize * feeRate
  const change = inputSum - amount - fee

  return change
}

export const createPSBT = async (
  caipNetwork: CaipNetwork,
  amount: number,
  address: string,
  recipientAddress: string,
  memo?: string,
): Promise<BitcoinConnector.SignPSBTParams> => {
  // get the bitcoin network from our caipNetwork
  const network = getBitcoinNetwork(caipNetwork.caipNetworkId)
  // get the payment by address ... this is the type of address that the sender has
  const payment = getPaymentByAddress(address, network)
  // get the utxos ... this is the list of unspent transactions that the sender has
  const utxos = await getUTXOs(address, isTestnet(caipNetwork.caipNetworkId))
  // get the fee rate ... this is the fee per byte
  const feeRate = await getFeeRate()
  // calculate the change ... this is the amount of satoshis that will be sent back to the sender
  const change = calculateChange(utxos, amount, feeRate)
  // the memo is the message that will be embedded in the transaction
  // const memo = 'Hello Reown AppKit!'

  const psbt = new Psbt({ network: network })

  // check if the payment output is valid
  if (!payment.output) throw new Error('Invalid payment output')
  // check if the change is greater than 0 ... this means the sender has enough funds
  //if (change < 0) throw new Error('Insufficient funds');

  if (change > 0) {
    psbt.addOutput({
      address: address,
      value: BigInt(change),
    })
  }

  // add the inputs to the psbt
  for (const utxo of utxos) {
    psbt.addInput({
      hash: utxo.txid,
      index: utxo.vout,
      witnessUtxo: {
        script: payment.output,
        value: BigInt(utxo.value),
      },
    })
  }

  // add the output to the psbt ... this is the recipient address and the amount of satoshis that will be sent to the recipient
  psbt.addOutput({
    address: recipientAddress,
    value: BigInt(amount),
  })

  if (memo) {
    const data = Buffer.from(memo, 'utf8')
    const embed = bitcoinPayments.embed({ data: [data] })

    if (!embed.output) throw new Error('Invalid embed output')

    psbt.addOutput({
      script: embed.output,
      value: 0n,
    })
  }

  return {
    psbt: psbt.toBase64(),
    signInputs: [],
    broadcast: false,
  }
}
