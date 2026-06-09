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
  updates: {
    url: 'https://u.expo.dev/84bec026-9bfb-4ff8-9ce2-eb8f8be30e45',
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/icon.png',
      backgroundColor: '#F4CB7A',
    },
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#0a0a0c',
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
        kotlinVersion: '2.1.20',
        newArchEnabled: true,
      }
    }],
    ['expo-video', {
      supportsBackgroundPlayback: true,
      supportsPictureInPicture: true,
    }],
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
      projectId: '84bec026-9bfb-4ff8-9ce2-eb8f8be30e45',
    },
  },
  owner: 'xena444',
});
