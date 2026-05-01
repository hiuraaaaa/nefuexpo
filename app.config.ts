import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'NefuSoft',
  slug: 'nefusoft-anime',
  version: '1.0.0',
  orientation: 'default',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0a0a0c'
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0a0a0c'
    },
    package: 'com.nefusoft.anime',
    permissions: [],
  },
  plugins: [
    'expo-router',
    'expo-av',
    'expo-screen-orientation',
    [
      'expo-font',
      {
        fonts: []
      }
    ]
  ],
  scheme: 'nefusoft',
  experiments: {
    typedRoutes: true
  }
});
