const createNoopStorage = () => ({
  getItem: async () => null,
  setItem: async () => undefined,
  removeItem: async () => undefined,
});

const createLocalStorage = () => ({
  getItem: (key: string) => Promise.resolve(window.localStorage.getItem(key)),
  setItem: (key: string, value: string) => {
    window.localStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    window.localStorage.removeItem(key);
    return Promise.resolve();
  },
});

export const persistStorage =
  typeof window !== "undefined" ? createLocalStorage() : createNoopStorage();
