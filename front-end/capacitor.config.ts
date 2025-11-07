import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example.webviewapp',
  appName: 'Toast Lab App',
  webDir: 'build',
  server: {
    url: 'http://10.0.2.2:8082/user',
    cleartext: true,
  },
};

export default config;
