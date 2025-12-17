import { TronWeb } from 'tronweb'
import {
  DEFAULT_TRANSFER_AMOUNT,
  ETHAN_TRON_ADDRESS,
  TRON_NILE_NET_RPC_URL,
} from '../config/constant'
import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks'
import { useWalletModal } from '@tronweb3/tronwallet-adapter-react-ui'
import { NetworkType } from '@tronweb3/tronwallet-abstract-adapter'
import { chainIdNetworkMap } from '@tronweb3/tronwallet-adapters'

const getChainIdByNetwork = (network: NetworkType) =>
  Object.entries(chainIdNetworkMap).find(([, v]) => v === network)?.[0]

// test transaction
const TEST_TX = {
  to: ETHAN_TRON_ADDRESS,
  value: Number(TronWeb.toSun(DEFAULT_TRANSFER_AMOUNT)),
}

const tronWeb = new TronWeb({
  fullHost: TRON_NILE_NET_RPC_URL,
})

interface ActionButtonListProps {
  sendHash: (hash: string) => void
  sendSignMsg: (hash: string) => void
  sendBalance: (balance: string) => void
}

export const ActionButtonList = ({
  sendHash,
  sendSignMsg,
  sendBalance,
}: ActionButtonListProps) => {
  const {
    disconnect,
    wallet,
    address: walletAddress,
    connected,
    signTransaction,
    signMessage,
  } = useWallet()
  const { setVisible } = useWalletModal()

  const handleChangeWallet = async () => {
    setVisible(true)
  }

  const handleDisconnect = async () => {
    try {
      await disconnect()
    } catch (error) {
      console.error('Failed to disconnect:', error)
    }
  }

  // function to send a tx
  const handleSendTx = async () => {
    if (!wallet || !connected || !walletAddress)
      throw Error('user is disconnected')

    // This will wait for the transaction to be mined

    const randomAddress = tronWeb.createRandom()

    const transaction = await tronWeb.transactionBuilder.sendTrx(
      TEST_TX.to.toLowerCase() === walletAddress.toLowerCase()
        ? randomAddress.address
        : TEST_TX.to,
      TEST_TX.value,
      walletAddress,
    )

    const signedTransaction = await signTransaction(transaction)

    const receipt = await tronWeb.trx.sendRawTransaction(signedTransaction)

    if (receipt.result) {
      sendHash(receipt.transaction.txID)
    } else {
      throw Error('Failed to send transaction')
    }
  }

  // function to sing a msg
  const handleSignMsg = async () => {
    if (!wallet || !connected || !walletAddress)
      throw Error('user is disconnected')

    // This will wait for the transaction to be mined
    const sig = await signMessage('Hello Reown AppKit!')

    sendSignMsg(sig)
  }

  const handleSignTypedData = async () => {
    const tron = window.tron
    if (!tron) throw Error('Tron is not installed')
    const tronWeb_ = tron.tronWeb

    if (!tronWeb_) throw Error('TronWeb is not available')

    // All properties on a domain are optional
    const domain = {
      name: 'TRON Mail',
      // version: '1',
      chainId: getChainIdByNetwork(NetworkType.Nile),
      verifyingContract: 'TUe6BwpA7sVTDKaJQoia7FWZpC9sK8WM2t',
    }

    // The named list of all type definitions
    const types = {
      Person: [
        { name: 'name', type: 'string' },
        { name: 'wallet', type: 'address' },
      ],
      Mail: [
        { name: 'from', type: 'Person' },
        { name: 'to', type: 'Person' },
        { name: 'contents', type: 'string' },
      ],
    }

    // The data to sign
    const value = {
      from: {
        name: 'Cow',
        wallet: 'TUg28KYvCXWW81EqMUeZvCZmZw2BChk1HQ',
      },
      to: {
        name: 'Bob',
        wallet: 'TT5rFsXYCrnzdE2q1WdR9F2SuVY59A4hoM',
      },
      contents: 'Hello, Bob!',
    }

    const tronlinkAddress = tronWeb_.defaultAddress.base58
    console.log('tronlinkAddress: ', tronlinkAddress)

    const signature = await tronWeb_.trx._signTypedData(domain, types, value)

    const result = await tronWeb_.trx.verifyTypedData(
      domain,
      types,
      value,
      signature,
      tronlinkAddress,
    )

    console.log('verify result: ', result)

    sendSignMsg(signature)
  }

  // function to get the balance
  const handleGetBalance = async () => {
    if (!wallet || !walletAddress) throw Error('user is disconnected')

    const balance = await tronWeb.trx.getBalance(walletAddress)

    sendBalance(`${TronWeb.fromSun(balance)} TRX`)
  }
  return (
    <div>
      {connected ? (
        <div>
          <button onClick={handleChangeWallet}>Change Wallet</button>
          <button onClick={handleDisconnect}>Disconnect</button>
          {/* <button onClick={() => switchNetwork(networks[1])}>Switch</button> */}
          <button onClick={handleSignMsg}>Sign msg</button>
          <button onClick={handleSignTypedData}>Sign TypedData</button>
          <button onClick={handleSendTx}>Send tx</button>
          <button onClick={handleGetBalance}>Get Balance</button>
        </div>
      ) : null}
    </div>
  )
}
