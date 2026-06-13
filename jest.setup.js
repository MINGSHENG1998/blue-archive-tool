// Global test setup. Mock AsyncStorage so any module that transitively imports it
// (e.g. the theme/language contexts) can be required in tests without the native
// module being present.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);
