import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useState, type ReactNode } from 'react';
import { CACHE_BUSTER, createQueryClient, PERSIST_MAX_AGE, queryPersister } from '@/lib/queryClient';

/** Query cache persisted to IndexedDB, so the menu opens from cache on the floor even without Wi-Fi. */
export default function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(createQueryClient);
  return (
    <PersistQueryClientProvider
      client={client}
      persistOptions={{ persister: queryPersister, maxAge: PERSIST_MAX_AGE, buster: CACHE_BUSTER }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
