import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { createStore, del, get, set } from 'idb-keyval';

const WEEK = 7 * 24 * 60 * 60 * 1000;

/** Bump when cached query shapes change so stale caches are discarded. */
export const CACHE_BUSTER = 'v1';

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        // Keep data long enough for the persisted cache to be useful offline.
        gcTime: WEEK,
        retry: 2,
        refetchOnWindowFocus: true,
      },
    },
  });
}

const store = createStore('vedmid-cache', 'queries');

export const queryPersister = createAsyncStoragePersister({
  storage: {
    getItem: (key) => get<string>(key, store).then((v) => v ?? null),
    setItem: (key, value: string) => set(key, value, store),
    removeItem: (key) => del(key, store),
  },
  key: 'vedmid-query-cache',
  throttleTime: 1000,
});

export const PERSIST_MAX_AGE = WEEK;
