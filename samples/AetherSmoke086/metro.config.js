const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * The SDK under test is linked via `file:../..`, which Metro sees as a symlink
 * pointing outside the project root. Watch the SDK root so Metro follows it, and
 * pin module resolution to this sample's node_modules so the SDK's bare imports
 * (react, react-native, hoist-non-react-statics) resolve to a single copy.
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const sdkRoot = path.resolve(__dirname, '../..');

const config = {
  watchFolders: [sdkRoot],
  resolver: {
    nodeModulesPaths: [path.resolve(__dirname, 'node_modules')],
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
