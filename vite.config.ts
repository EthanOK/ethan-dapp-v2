import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // 只包含需要的 polyfills
      include: ['buffer'],
      // 全局变量名称
      globals: {
        Buffer: true,
      },
    }),
  ],
  define: {
    'process.env': {},
  },
})
