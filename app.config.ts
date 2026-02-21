import { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: 'Nose2Floor',
  slug: 'nose2floor',
  version: '1.0.0',
  scheme: 'nose2floor',
  jsEngine: 'jsc',
  icon: './assets/icon.png',
  ios: { icon: './assets/icon.png' },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/icon.png',
      backgroundColor: '#F5F0EB',
    },
  },
  web: { bundler: 'metro', favicon: './assets/favicon.png' },
  plugins: ['expo-router', 'expo-asset', 'expo-font'],
  experiments: {
    // Required for GitHub Pages: assets are served at /nose2floor/ not /
    // Set EXPO_BASE_URL in CI; leave unset for local dev.
    baseUrl: process.env.EXPO_BASE_URL ?? '',
  },
};

export default config;
