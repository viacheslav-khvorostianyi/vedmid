import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useAuth } from '@/features/auth/context';
import { useRecordAnswer } from '@/features/progress/hooks';
import { flushPendingCalls } from '@/lib/rpc';
import { fetchCardProgress } from '../api';
import { applyAnswer, type CardProgress } from '../leitner';

export const progressKey = (userId: string | undefined) => ['progress', userId] as const;

// When this page load started. Progress cached before it was restored from the offline copy, which is saved
// with a short delay, so it can miss the last answers given right before a reload.
const PAGE_LOADED_AT = Date.now();

/** Progress restored from an earlier page load is checked with the server before a deck is built from it. */
export function isFromEarlierPageLoad(dataUpdatedAt: number, pageLoadedAt = PAGE_LOADED_AT): boolean {
  return dataUpdatedAt > 0 && dataUpdatedAt < pageLoadedAt;
}

export function useCardProgress() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: progressKey(userId),
    // Answers queued offline go first, so the server's progress includes them (a flush already running is shared).
    queryFn: async () => {
      await flushPendingCalls();
      return fetchCardProgress(userId!);
    },
    enabled: !!userId,
    refetchOnMount: (query) => (isFromEarlierPageLoad(query.state.dataUpdatedAt) ? 'always' : true),
  });
}

/** Updates the cached progress immediately (works offline too), then records the answer on the server. */
export function useAnswerCard() {
  const queryClient = useQueryClient();
  const recordAnswer = useRecordAnswer();
  const { session } = useAuth();
  const userId = session?.user.id;

  return useCallback(
    (itemId: string, known: boolean) => {
      queryClient.setQueryData<CardProgress[]>(progressKey(userId), (old) =>
        applyAnswer(old ?? [], itemId, known, Date.now()),
      );
      return recordAnswer({ itemId, correct: known, source: 'card' });
    },
    [queryClient, recordAnswer, userId],
  );
}
