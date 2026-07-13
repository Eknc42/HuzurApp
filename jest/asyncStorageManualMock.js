const store = new Map();

module.exports = {
  __esModule: true,
  default: {
    getItem: async (key) => (store.has(key) ? store.get(key) : null),
    setItem: async (key, value) => {
      store.set(key, String(value));
    },
    removeItem: async (key) => {
      store.delete(key);
    },
    clear: async () => {
      store.clear();
    },
    getAllKeys: async () => Array.from(store.keys()),
    multiGet: async (keys) => keys.map((k) => [k, store.has(k) ? store.get(k) : null]),
    multiSet: async (pairs) => {
      for (const [k, v] of pairs) {
        store.set(k, String(v));
      }
    },
  },
};
