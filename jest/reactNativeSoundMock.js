function noop() {}

/** Jest için react-native-sound yedek nesnesi (native modül yok) */
function MockSound(uri, _, callback) {
  const impl = {
    play: (end) => {
      if (typeof end === 'function') {
        queueMicrotask(() => end(true));
      }
    },
    pause: noop,
    resume: noop,
    stop: noop,
    release: noop,
    setVolume: noop,
    setNumberOfLoops: noop,
    getDuration: () => 120,
    getCurrentTime: (cb) => {
      cb(0);
    },
    isPlaying: () => false,
    isLoaded: () => true,
  };
  queueMicrotask(() => callback && callback(null));
  return impl;
}

MockSound.setCategory = noop;
MockSound.enable = noop;
MockSound.enableInSilenceMode = noop;

module.exports = {
  __esModule: true,
  default: MockSound,
};
