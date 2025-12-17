export const ETHAN_ETH_ADDRESS: string =
  '0x6278A1E803A76796a3A1f7F6344fE874ebfe94B2'
export const ETHAN_SOL_ADDRESS: string =
  '6HmQJ6bn3AExJwKvdWZbN96kEJcKTgTnZ4szM5atYyC8'
export const DEFAULT_TRANSFER_AMOUNT: number = 0.1 // 0.1 ETH or 0.1 SOL

// 路由路径常量
export const ROUTES = {
  HOME: '/',
  ETHERS: '/ethers',
  SOLANA: '/solana',
  TRON: '/tron',
} as const

// 有效的路由路径列表
export const VALID_ROUTES = [ROUTES.ETHERS, ROUTES.SOLANA, ROUTES.TRON] as const

// 默认路由
export const DEFAULT_ROUTE = ROUTES.ETHERS

// 导航项配置
export const NAV_ITEMS = [
  { path: ROUTES.ETHERS, label: 'Ethereum' },
  { path: ROUTES.SOLANA, label: 'Solana' },
  { path: ROUTES.TRON, label: 'Tron' },
] as const
