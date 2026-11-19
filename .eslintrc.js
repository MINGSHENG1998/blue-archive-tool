// https://docs.expo.dev/guides/using-eslint/
module.exports = {
  extends: 'expo',
  ignorePatterns: ['/dist/*'],
  rules: {
    'no-restricted-syntax': [
      'error',
      {
        // Reanimated 3 layout animations crash Android Fabric in production
        // ("Unable to find viewState for tag N"). See constants/motion.ts.
        selector:
          "JSXOpeningElement[name.object.name='Animated'] > JSXAttribute[name.name=/^(entering|exiting|layout)$/]",
        message:
          'Reanimated layout animations crash Android Fabric. Use FadeInView (components/schale) or useAnimatedStyle instead.',
      },
    ],
  },
};
