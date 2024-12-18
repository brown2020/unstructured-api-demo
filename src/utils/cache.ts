const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
const cacheStore = new Map<string, { data: unknown; timestamp: number }>();

export const cache = {
  get: async <T>(key: string): Promise<T | null> => {
    const item = cacheStore.get(key);
    if (!item) return null;
    if (Date.now() - item.timestamp > CACHE_DURATION) {
      cacheStore.delete(key);
      return null;
    }
    return item.data as T;
  },

  set: async <T>(key: string, data: T): Promise<void> => {
    cacheStore.set(key, { data, timestamp: Date.now() });
  },
};
