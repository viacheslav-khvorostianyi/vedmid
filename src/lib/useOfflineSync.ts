import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { flushPendingCalls } from './rpc';

/** Sends queued answers when the connection comes back, on app focus and at start; then refreshes progress. */
export function useOfflineSync(enabled: boolean) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;
    const flush = async () => {
      if (!navigator.onLine) return;
      const { sent } = await flushPendingCalls();
      if (sent > 0) {
        await queryClient.invalidateQueries({
          predicate: (q) => ['stats', 'progress', 'achievements'].includes(String(q.queryKey[0])),
        });
      }
    };
    const onVisible = () => document.visibilityState === 'visible' && flush();
    flush();
    window.addEventListener('online', flush);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('online', flush);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [enabled, queryClient]);
}
