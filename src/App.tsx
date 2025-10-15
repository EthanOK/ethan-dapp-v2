import { createAppKit } from '@reown/appkit/react'
import { networks, projectId, metadata, ethersAdapter, solanaAdapter } from './config'
import { ActionButtonList } from './components/ActionButtonList'
import { SmartContractActionButtonList } from './components/SmartContractActionButtonList'
import { InfoList } from './components/InfoList'
import { useState } from 'react'

import "./App.css"

// Create a AppKit instance
createAppKit({
  adapters: [ethersAdapter, solanaAdapter],
  networks,
  metadata,
  projectId,
  themeMode: 'light',
  features: {
    analytics: true // Optional - defaults to your Cloud configuration
  },
  themeVariables: {
    '--w3m-accent': '#000000',
  }
})

export function App() {



  return (
    <div className={"pages"}>
      <img src="/reown.svg" alt="Reown" style={{ width: '150px', height: '150px' }} />
      <h1>Ethan Dapp V2</h1>
      <appkit-button />
      <InfoList hash={``} signedMsg={``} balance={``}/>
    </div>
  )
}

export default App
