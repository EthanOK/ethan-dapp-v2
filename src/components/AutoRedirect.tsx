import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppKitAccount } from '@reown/appkit/react'
import { useChainDetection } from '../hooks/useChainDetection'

export const AutoRedirect = () => {
  const navigate = useNavigate()
  const { isConnected } = useAppKitAccount()
  const { chainType } = useChainDetection()

  useEffect(() => {
    if (isConnected && chainType) {
      if (chainType === 'ethers') {
        navigate('/ethers')
      } else if (chainType === 'solana') {
        navigate('/solana')
      }
    }
  }, [isConnected, chainType, navigate])

  return null
}
