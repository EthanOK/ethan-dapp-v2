import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAppKitAccount } from '@reown/appkit/react'
import { useChainDetection } from '../hooks/useChainDetection'
import { ROUTES } from '../config/constant'

export const AutoRedirect = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isConnected } = useAppKitAccount()
  const { chainType } = useChainDetection()

  useEffect(() => {
    if (isConnected && chainType) {
      const currentPath = location.pathname

      // If already on the corresponding page, no redirect needed
      if (chainType === 'ethers' && currentPath !== ROUTES.ETHERS) {
        // Allow access to /tron page, no redirect
        if (currentPath !== ROUTES.TRON) {
          navigate(ROUTES.ETHERS)
        }
      } else if (chainType === 'solana' && currentPath !== ROUTES.SOLANA) {
        // Allow access to /tron page, no redirect
        if (currentPath !== ROUTES.TRON) {
          navigate(ROUTES.SOLANA)
        }
      }
    }
  }, [isConnected, chainType, navigate, location.pathname])

  return null
}
