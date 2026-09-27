import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useAuth } from '@/features/auth/context';
import { useRecordAnswer } from '@/features/progress/hooks';
import { fetchCardProgress } from '../api';
import { applyAnswer, type CardProgress } from '../leitner';

export const progressKey = (userId: string | undefined) => ['progress', userId] as const;

export function useCardProgress() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({
    queryKey: progressKey(userId),
    queryFn: () => fetchCardProgress(userId!),
    enabled: !!userId,
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
