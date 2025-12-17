import { TronWeb } from 'tronweb'
import {
  DEFAULT_TRANSFER_AMOUNT,
  ETHAN_TRON_ADDRESS,
  TRON_NILE_NET_RPC_URL,
} from '../config/constant'
import { useWallet } from '@tronweb3/tronwallet-adapter-react-hooks'
import { useWalletModal } from '@tronweb3/tronwallet-adapter-react-ui'

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
          <button onClick={handleSendTx}>Send tx</button>
          <button onClick={handleGetBalance}>Get Balance</button>
        </div>
      ) : null}
    </div>
  )
}
