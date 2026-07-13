module.exports = {
  preset: 'react-native',
  watchman: false,
  moduleNameMapper: {
    '^@react-native-async-storage/async-storage$':
      '<rootDir>/jest/asyncStorageManualMock.js',
    '^react-native-sound$': '<rootDir>/jest/reactNativeSoundMock.js',
    '^react-native-share$': '<rootDir>/jest/reactNativeShareMock.js',
    '^@react-native-camera-roll/camera-roll$':
      '<rootDir>/jest/cameraRollMock.js',
    '^react-native-view-shot$': '<rootDir>/jest/viewShotMock.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|react-navigation|@react-navigation|react-native-screens|react-native-safe-area-context|react-native-linear-gradient|react-native-svg|react-native-view-shot)',
  ],
};
