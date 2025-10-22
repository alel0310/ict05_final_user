import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      // ...기존 alias들 그대로...
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'build',
  },
  server: {
    port: 3000,          // ✅ 프런트 개발서버는 3000에서 실행 (백엔드 8082와 충돌 방지)
    strictPort: true,
    open: '/login',
    proxy: {
      '/api': {
        target: 'http://localhost:8082',   // ✅ 백엔드 포트
        changeOrigin: true,
        // /api/login  ->  http://localhost:8082/user/login
        rewrite: (path) => path.replace(/^\/api/, '/user'),
      },
    },
  },
});
