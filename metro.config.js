const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts = [...config.resolver.assetExts, 'txt'];

config.transformer = {
  ...config.transformer,
  unstable_transformProfile: 'default',
  hermesParser: false,
};

module.exports = config;
