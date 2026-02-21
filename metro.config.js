const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.transformer = {
  ...config.transformer,
  unstable_transformProfile: 'default',
  hermesParser: false,
};

module.exports = config;
