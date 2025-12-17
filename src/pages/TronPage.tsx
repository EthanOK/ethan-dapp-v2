import {
  OkxWalletAdapter,
  TokenPocketAdapter,
  TronLinkAdapter,
  //   WalletConnectAdapter,
} from '@tronweb3/tronwallet-adapters'
// import { ChainNetwork } from '@tronweb3/tronwallet-abstract-adapter'
import {
  WalletActionButton,
  WalletModalProvider,
} from '@tronweb3/tronwallet-adapter-react-ui'
import {
  useWallet,
  WalletProvider,
} from '@tronweb3/tronwallet-adapter-react-hooks'
import { useMemo } from 'react'
// import { metadata, projectId } from '../config'

export const TronPage = () => {
  const adapters = useMemo(() => {
    return [
      new TronLinkAdapter(),
      new OkxWalletAdapter(),
      new TokenPocketAdapter(),
      //   new WalletConnectAdapter({
      //     network: ChainNetwork.Nile,
      //     options: {
      //       relayUrl: 'wss://relay.walletconnect.com',
      //       // example walletconnect app project ID
      //       projectId: projectId,
      //       metadata: metadata,
      //     },
      //     // themeMode: 'dark',
      //     themeVariables: {
      //       '--w3m-z-index': 1000,
      //     },
      //   }),
    ]
  }, [])
  const onError = (error: Error) => {
    console.error('Error:', error)
  }
  return (
    <WalletProvider onError={onError} adapters={adapters}>
      <WalletModalProvider>
        <TronPageContent />
      </WalletModalProvider>
    </WalletProvider>
  )
}

const TronPageContent = () => {
  const { wallet } = useWallet()
  console.log('wallet: ', wallet?.adapter.name)
  return (
    <div className={'pages'}>
      <h1>Ethan Dapp V2 - Tron</h1>
      <WalletActionButton />
    </div>
  )
}
