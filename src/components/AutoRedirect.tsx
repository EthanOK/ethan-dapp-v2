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

      // 如果已经在对应的页面，就不需要重定向
      if (chainType === 'ethers' && currentPath !== ROUTES.ETHERS) {
        // 允许访问 /tron 页面，不进行重定向
        if (currentPath !== ROUTES.TRON) {
          navigate(ROUTES.ETHERS)
        }
      } else if (chainType === 'solana' && currentPath !== ROUTES.SOLANA) {
        // 允许访问 /tron 页面，不进行重定向
        if (currentPath !== ROUTES.TRON) {
          navigate(ROUTES.SOLANA)
        }
      }
    }
  }, [isConnected, chainType, navigate, location.pathname])

  return null
}
