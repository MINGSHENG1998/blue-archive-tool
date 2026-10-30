// Global test setup. Mock AsyncStorage so any module that transitively imports it
// (e.g. the theme/language contexts) can be required in tests without the native
// module being present.
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

// Local notification scheduling is native-only; unit tests opt into grant/failure
// scenarios explicitly instead of touching a native permission dialog.
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(async () => ({ granted:false, status:'undetermined', canAskAgain:true })),
  requestPermissionsAsync: jest.fn(async () => ({ granted:true, status:'granted', canAskAgain:true })),
  setNotificationChannelAsync: jest.fn(async () => null),
  getAllScheduledNotificationsAsync: jest.fn(async () => []),
  cancelScheduledNotificationAsync: jest.fn(async () => {}),
  scheduleNotificationAsync: jest.fn(async request => request.identifier),
  setNotificationHandler: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(() => ({remove:jest.fn()})),
  getLastNotificationResponseAsync: jest.fn(async () => null),
  clearLastNotificationResponseAsync: jest.fn(async () => {}),
  IosAuthorizationStatus: {PROVISIONAL:3},
  AndroidImportance: {DEFAULT:3},
  SchedulableTriggerInputTypes: {DATE:'date'},
  DEFAULT_ACTION_IDENTIFIER: 'expo.modules.notifications.actions.DEFAULT',
}));
