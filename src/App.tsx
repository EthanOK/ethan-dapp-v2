import { createAppKit } from '@reown/appkit/react'
import {
  networks,
  projectId,
  metadata,
  ethersAdapter,
  solanaAdapter,
} from './config'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { EthersPage } from './pages/EthersPage'
import { SolanaPage } from './pages/SolanaPage'
import { AutoRedirect } from './components/AutoRedirect'
import { TronPage } from './pages/TronPage'
import { Navigation } from './components/Navigation'
import { HomeRedirect } from './components/HomeRedirect'
import { ROUTES } from './config/constant'

import './App.css'

// Create a AppKit instance
createAppKit({
  adapters: [ethersAdapter, solanaAdapter],
  networks,
  metadata,
  projectId,
  themeMode: 'light',
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
  },
  themeVariables: {
    '--w3m-accent': '#000000',
  },
})

export function App() {
  return (
    <BrowserRouter>
      <Navigation />
      <AutoRedirect />
      <Routes>
        <Route path={ROUTES.HOME} element={<HomeRedirect />} />
        <Route path={ROUTES.ETHERS} element={<EthersPage />} />
        <Route path={ROUTES.SOLANA} element={<SolanaPage />} />
        <Route path={ROUTES.TRON} element={<TronPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
