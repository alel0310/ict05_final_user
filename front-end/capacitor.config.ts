import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.webviewapp',
  appName: 'Toast Lab App',
  webDir: 'build',
  server: {
    cleartext: true,
  },
};

export default config;
