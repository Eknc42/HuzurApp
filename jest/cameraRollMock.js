module.exports = {
  __esModule: true,
  CameraRoll: {
    save: jest.fn(async (_uri, _opts) => 'mock-album-photo'),
    saveAsset: jest.fn(),
  },
};
