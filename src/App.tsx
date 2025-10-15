import { createAppKit } from '@reown/appkit/react'
import {
  networks,
  projectId,
  metadata,
  ethersAdapter,
  solanaAdapter,
} from './config'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { EthersPage } from './pages/EthersPage'
import { SolanaPage } from './pages/SolanaPage'
import { AutoRedirect } from './components/AutoRedirect'

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
      <AutoRedirect />
      <Routes>
        <Route path="/" element={<Navigate to="/ethers" replace />} />
        <Route path="/ethers" element={<EthersPage />} />
        <Route path="/solana" element={<SolanaPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
