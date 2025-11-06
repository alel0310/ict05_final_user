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
        // ✅ target 에 base path 넣지 말기 (중복 /user 방지)
        target: 'http://localhost:8082/user',
        changeOrigin: true,
        // ✅ /api/login -> /login
        // ✅ /api/user  -> /user
        //rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
})
