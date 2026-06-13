module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo (SDK 53) automatically applies the react-native-reanimated
    // worklets plugin (must be last) when reanimated is installed.
    presets: ['babel-preset-expo'],
  };
};
