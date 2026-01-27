const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Exclude SQL files from being bundled
config.resolver.blockList = [/\.sql$/];

module.exports = withNativeWind(config, { input: './global.css', inlineRem: 16 });
