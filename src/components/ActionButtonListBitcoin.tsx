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
  const { caipNetwork } = useAppKitNetworkCore()
  const { isConnected, address } = useAppKitAccount()
  const { walletProvider } = useAppKitProvider<BitcoinConnector>('bip122')

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

    const signature = await walletProvider.signMessage({
      address,
      message: 'Hello Reown AppKit!',
    })
    sendSignMsg(signature)
  }

  const handleSendPSBT = async () => {
    if (!walletProvider || !address) throw Error('user is disconnected')

    const amount = parseUnits(DEFAULT_TRANSFER_BTC_AMOUNT, 8)
    const recipientAddress = GetRecipientBitcoinAddress(
      IsBitcoinTestnet(address),
    )

    const params = await createPSBT(
      caipNetwork as CaipNetwork,
      Number(amount),
      address,
      recipientAddress,
    )

    params.broadcast = true // change to true to broadcast the tx

    const signResponse = await walletProvider.signPSBT(params)
    sendHash(signResponse.txid || signResponse.psbt)
  }

  // function to get the balance
  const handleGetBalance = async () => {
    if (!walletProvider || !address) throw Error('user is disconnected')


    const balance = await getBitCoinBalance(address)
    sendBalance(`${formatUnits(balance, 8)} BTC`)
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
          <button onClick={handleSendPSBT}>Send PSBT</button>
          <button onClick={handleGetBalance}>Get Balance</button>
        </div>
      ) : null}
    </div>
  )
}
