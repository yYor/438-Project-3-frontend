// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Build blockList for Metro resolver
const blockList = [
  // Block test files from being processed as routes
  /.*\.test\.(js|jsx|ts|tsx)$/,
  /.*\.spec\.(js|jsx|ts|tsx)$/,
];

// Block react-native-maps on web since it's native-only
if (process.env.EXPO_PUBLIC_PLATFORM === 'web' || process.env.WEB) {
  blockList.push(/react-native-maps/);
}

// Apply blockList to resolver
config.resolver = {
  ...config.resolver,
  blockList: [
    ...(config.resolver.blockList || []),
    ...blockList,
  ],
};

module.exports = config;

