import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.de94fdad482b4f06be60839c8e302ebf',
  appName: 'Koji',
  webDir: 'dist',
  server: {
    url: 'https://de94fdad-482b-4f06-be60-839c8e302ebf.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1a0f28'
    },
    Keyboard: {
      resize: 'native',
      style: 'dark',
      resizeOnFullScreen: true
    }
  }
};

export default config;
