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
      backgroundColor: '#F4CB7A',
    },
    package: 'com.nefusoft.anime',
    googleServicesFile: './google-services.json',
    permissions: [],
    jsEngine: 'hermes',
    enableProguardInReleaseBuilds: true,
    enableShrinkResourcesInReleaseBuilds: true,
    targetSdkVersion: 35,
  },
  androidTVBanner: './assets/tv-banner.png',
  plugins: [
    'expo-router',
    ['expo-build-properties', {
      android: {
        kotlinVersion: '2.1.20'
      }
    }],
    'expo-video',
    'expo-screen-orientation',
    '@react-native-firebase/app',
    '@react-native-firebase/auth',
    '@react-native-google-signin/google-signin',
    ['expo-font', { fonts: [] }],
  ],
  scheme: 'nefusoft',
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
