import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'NefuSoft',
  slug: 'nefusoft',
  version: '1.0.0',
  orientation: 'default',
  icon: './assets/icon.png',
  userInterfaceStyle: 'dark',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0a0a0c',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/icon.png',
      backgroundColor: '#0a0a0c',
    },
    package: 'com.nefusoft.anime',
    googleServicesFile: './google-services.json',
    permissions: [],
    jsEngine: 'hermes',
    enableProguardInReleaseBuilds: true,
    enableShrinkResourcesInReleaseBuilds: true,
  },
  plugins: [
    'expo-router',
    ['expo-av', { microphonePermission: false }],
    'expo-screen-orientation',
    '@react-native-firebase/app',
    '@react-native-firebase/auth',
    '@react-native-google-signin/google-signin',
    ['expo-font', { fonts: [] }],
    './plugins/withAndroidSdk35',
  ],
  scheme: 'nefusoft',
  updates: {
    url: 'https://u.expo.dev/77dcd7b2-4f36-4f1e-92a9-fc8aa7915d1c',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: '84bec026-9bfb-4ff8-9ce2-eb8f8be30e45',
    },
  },
  owner: 'xena444',
});
