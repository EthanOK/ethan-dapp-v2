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
import { WalletProvider } from '@tronweb3/tronwallet-adapter-react-hooks'
import { useMemo, useState } from 'react'
import { ActionButtonList } from '../components/ActionButtonListTron'
import { InfoList } from '../components/InfoListTron'
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
  const onAccountsChanged = (address: string, preAddr?: string) => {
    console.log('onAccountsChanged: ', preAddr, '->', address)
  }
  const onChainChanged = (chainData: unknown) => {
    console.log('onChainChanged: ', chainData)
  }
  return (
    <WalletProvider
      onError={onError}
      adapters={adapters}
      onAccountsChanged={onAccountsChanged}
      onChainChanged={onChainChanged}
    >
      <WalletModalProvider>
        <TronPageContent />
      </WalletModalProvider>
    </WalletProvider>
  )
}

const TronPageContent = () => {
  const [hash, setHash] = useState('')
  const [signedMsg, setSignedMsg] = useState('')
  const [balance, setBalance] = useState('')

  return (
    <div className={'pages'}>
      <h1>Ethan Dapp V2 - Tron</h1>
      <WalletActionButton />

      <ActionButtonList
        sendHash={setHash}
        sendSignMsg={setSignedMsg}
        sendBalance={setBalance}
      />
      <InfoList hash={hash} signedMsg={signedMsg} balance={balance} />
    </div>
  )
}
