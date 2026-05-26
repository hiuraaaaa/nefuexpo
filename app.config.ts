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
    url: 'https://u.expo.dev/6e2fd9c8-8a82-474e-b71d-0428d2ce108b',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: '6e2fd9c8-8a82-474e-b71d-0428d2ce108b',
    },
  },
  owner: 'henxena', 
});
