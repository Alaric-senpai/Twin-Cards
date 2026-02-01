const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Add SQL files to asset extensions so they're treated as raw text
config.resolver.assetExts.push('sql');

module.exports = withNativeWind(config, { input: './global.css', inlineRem: 16 });