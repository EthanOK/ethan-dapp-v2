import {
  useDisconnect,
  useAppKit,
  // useAppKitNetwork,
  useAppKitAccount,
  useAppKitProvider,
  useAppKitNetworkCore,
  type Provider,
} from '@reown/appkit/react'
import { BrowserProvider, JsonRpcSigner, formatEther, parseEther } from 'ethers'
import { ETHAN_ETH_ADDRESS, DEFAULT_TRANSFER_AMOUNT } from '../config/constant'

// test transaction
const TEST_TX = {
  to: ETHAN_ETH_ADDRESS,
  value: parseEther(DEFAULT_TRANSFER_AMOUNT.toString()),
}

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
  const { disconnect } = useDisconnect()
  const { open } = useAppKit()
  const { chainId } = useAppKitNetworkCore()
  // const { switchNetwork } = useAppKitNetwork()
  const { isConnected, address } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider<Provider>('eip155')

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

    const provider = new BrowserProvider(walletProvider, chainId)
    const signer = new JsonRpcSigner(provider, address)

    const tx = await signer.sendTransaction(TEST_TX)
    await tx.wait() // This will wait for the transaction to be mined

    sendHash(tx.hash)
  }

  // function to sing a msg
  const handleSignMsg = async () => {
    if (!walletProvider || !address) throw Error('user is disconnected')

    const provider = new BrowserProvider(walletProvider, chainId)
    const signer = new JsonRpcSigner(provider, address)
    const sig = await signer?.signMessage('Hello Reown AppKit!')

    sendSignMsg(sig)
  }

  // function to get the balance
  const handleGetBalance = async () => {
    if (!walletProvider || !address) throw Error('user is disconnected')

    const provider = new BrowserProvider(walletProvider, chainId)
    const balance = await provider.getBalance(address)
    const eth = formatEther(balance)
    sendBalance(`${eth} ETH`)
  }
  return (
    <div>
      {isConnected ? (
        <div>
          <button onClick={() => open()}>Open</button>
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
