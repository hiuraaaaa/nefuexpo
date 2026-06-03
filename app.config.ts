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
    // Android TV — targetSdk 35 sudah default di SDK 56
    targetSdkVersion: 35,
  },
  // Android TV experimental
  // Buat asset tv-banner.png ukuran 320x180px dan taruh di ./assets/
  androidTVBanner: './assets/tv-banner.png',
  plugins: [
    'expo-router',
    ['expo-av', { microphonePermission: false }],
    'expo-screen-orientation',
    '@react-native-firebase/app',
    '@react-native-firebase/auth',
    '@react-native-google-signin/google-signin',
    ['expo-font', { fonts: [] }],
    // withAndroidSdk35 dihapus — SDK 56 sudah targetSdk 35 by default
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
    // React Compiler — optional, aktifkan kalau mau
    // reactCompiler: true,
  },
  extra: {
    eas: {
      projectId: '6e2fd9c8-8a82-474e-b71d-0428d2ce108b',
    },
  },
  owner: 'henxena',
});
