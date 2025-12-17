export const ETHAN_ETH_ADDRESS: string =
  '0x6278A1E803A76796a3A1f7F6344fE874ebfe94B2'
export const ETHAN_SOL_ADDRESS: string =
  '6HmQJ6bn3AExJwKvdWZbN96kEJcKTgTnZ4szM5atYyC8'
export const ETHAN_TRON_ADDRESS: string = 'TJwsjYijRMZB88nmwexuiAQ3MJGct2s4wQ'

export const DEFAULT_TRANSFER_AMOUNT: number = 0.1 // 0.1 ETH or 0.1 SOL or 0.1 TRON

// Route path constants
export const ROUTES = {
  HOME: '/',
  ETHERS: '/ethers',
  SOLANA: '/solana',
  TRON: '/tron',
} as const

// Valid route paths list
export const VALID_ROUTES = [ROUTES.ETHERS, ROUTES.SOLANA, ROUTES.TRON] as const

// Default route
export const DEFAULT_ROUTE = ROUTES.ETHERS

// Navigation items configuration
export const NAV_ITEMS = [
  { path: ROUTES.ETHERS, label: 'Ethereum' },
  { path: ROUTES.SOLANA, label: 'Solana' },
  { path: ROUTES.TRON, label: 'Tron' },
] as const

export const TRON_MAIN_NET_RPC_URL = 'https://api.trongrid.io'
export const TRON_NILE_NET_RPC_URL = 'https://nile.trongrid.io'

export const USDT_TRON_NILE_ADDRESS = 'TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf'
