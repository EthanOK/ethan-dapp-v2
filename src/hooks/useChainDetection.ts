import { useAppKitAccount, useAppKitNetworkCore } from '@reown/appkit/react'

export const useChainDetection = () => {
  const { caipAddress } = useAppKitAccount()
  const { chainId } = useAppKitNetworkCore()

  const getChainType = () => {
    if (!caipAddress) return null
    console.log('caipAddress: ', caipAddress)
    console.log('chainId: ', chainId)

    // CAIP地址格式: namespace:reference@address
    // 例如: eip155:1@0x... 或 solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp
    const [namespace] = caipAddress.split(':')

    switch (namespace) {
      case 'eip155':
        return 'ethers'
      case 'solana':
        return 'solana'
      default:
        return null
    }
  }

  const isEthereumChain = () => {
    return getChainType() === 'ethers'
  }

  const isSolanaChain = () => {
    return getChainType() === 'solana'
  }

  return {
    chainType: getChainType(),
    isEthereumChain,
    isSolanaChain,
    chainId,
    caipAddress,
  }
}
