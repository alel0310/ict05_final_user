// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

// command는 'build' 또는 'serve'가 됩니다.
export default defineConfig(({ command, mode }) => {
  const baseConfig = {
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
          target: 'http://localhost:8082/user',
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, '/api'),
        },
      },
    },
  };

  // 'build' 명령이거나 'android' 모드일 때 base 경로를 추가합니다。
  if (command === 'build' || mode === 'android') {
    baseConfig.base = '/user/';
  }
  console.log('Vite command:', command);
  console.log('Vite mode:', mode);
  console.log('Vite base:', baseConfig.base);

  return baseConfig;
})
