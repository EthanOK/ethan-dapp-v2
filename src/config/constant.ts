export const ETHAN_ETH_ADDRESS: string =
  '0x6278A1E803A76796a3A1f7F6344fE874ebfe94B2'
export const ETHAN_SOL_ADDRESS: string =
  '6HmQJ6bn3AExJwKvdWZbN96kEJcKTgTnZ4szM5atYyC8'
export const ETHAN_TRON_ADDRESS: string = 'TJwsjYijRMZB88nmwexuiAQ3MJGct2s4wQ'
export const ETHAN_BTC_ADDRESS: string =
  'bc1qup358hl6xfumst8tz4q2l9hjfe7ek253h350p3'
export const ETHAN_TBTC_ADDRESS: string =
  'tb1qup358hl6xfumst8tz4q2l9hjfe7ek253ah0u6z'

export const GetRecipientBitcoinAddress = (isTestnet: boolean = false) => {
  return isTestnet ? ETHAN_TBTC_ADDRESS : ETHAN_BTC_ADDRESS
}

export const DEFAULT_TRANSFER_AMOUNT: number = 0.1 // 0.1 ETH or 0.1 SOL or 0.1 TRON or 0.1 BTC

export const DEFAULT_TRANSFER_BTC_AMOUNT: string = '0.00001'

// Route path constants
export const ROUTES = {
  HOME: '/',
  ETHERS: '/ethers',
  SOLANA: '/solana',
  TRON: '/tron',
  BITCOIN: '/bitcoin',
} as const

// Navigation items configuration
export const NAV_ITEMS = [
  { path: ROUTES.ETHERS, label: 'Ethereum' },
  { path: ROUTES.SOLANA, label: 'Solana' },
  { path: ROUTES.BITCOIN, label: 'Bitcoin' },
  { path: ROUTES.TRON, label: 'Tron' },
] as const

// Valid route paths list (derived from navigation to avoid config drift)
export const VALID_ROUTES = NAV_ITEMS.map((item) => item.path) as readonly (typeof NAV_ITEMS)[number]['path'][]

// Default route
export const DEFAULT_ROUTE = ROUTES.ETHERS

export const TRON_MAIN_NET_RPC_URL = 'https://api.trongrid.io'
export const TRON_NILE_NET_RPC_URL = 'https://nile.trongrid.io'

export const USDT_TRON_NILE_ADDRESS = 'TXYZopYRdj2D9XRtbG411XZZ3kM5VkAeBf'
