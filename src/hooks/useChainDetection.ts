import { useAppKitAccount, useAppKitNetworkCore } from '@reown/appkit/react'

export const useChainDetection = () => {
  const { caipAddress } = useAppKitAccount()
  const { chainId } = useAppKitNetworkCore()

  const getChainType = () => {
    if (!caipAddress) return null
    console.log('caipAddress: ', caipAddress)
    console.log('chainId: ', chainId)

    // CAIP address format: namespace:reference@address
    // Example: eip155:1@0x... or solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp
    const [namespace] = caipAddress.split(':')

    switch (namespace) {
      case 'eip155':
        return 'ethers'
      case 'solana':
        return 'solana'
      case 'bip122':
        return 'bitcoin'
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

  const isBitcoinChain = () => {
    return getChainType() === 'bitcoin'
  }

  return {
    chainType: getChainType(),
    isEthereumChain,
    isSolanaChain,
    isBitcoinChain,
    chainId,
    caipAddress,
  }
}
