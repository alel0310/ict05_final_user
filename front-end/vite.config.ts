// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: { target: 'esnext', outDir: 'build' },
  server: {
    port: 3000,
    strictPort: true,
    open: '/login',
    proxy: {
      '/api': {
        target: 'http://localhost:8082',   // 백엔드
        changeOrigin: true,
        // ✅ /api/user -> /user
        // ✅ /api/login -> /user/login  등으로 변환
        rewrite: (p) => p.replace(/^\/api/, '/user'),
      },
    },
  },
})
