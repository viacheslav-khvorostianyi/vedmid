import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { useAuth } from '@/features/auth/context';
import type { Enums } from '@/lib/db.types';
import { callOrQueue } from '@/lib/rpc';
import { useToast } from '@/ui/Toast';
import { fetchAchievements, fetchStats } from './api';
import { levelFor, rankFor } from './rank';
import type { Achievement, PlayerStats } from './types';

export const statsKey = (userId: string | undefined) => ['stats', userId] as const;
export const ACHIEVEMENTS_KEY = ['achievements'] as const;

export function useStats() {
  const { session } = useAuth();
  const userId = session?.user.id;
  return useQuery({ queryKey: statsKey(userId), queryFn: () => fetchStats(userId!), enabled: !!userId });
}

export function useAchievements() {
  return useQuery({ queryKey: ACHIEVEMENTS_KEY, queryFn: fetchAchievements, staleTime: 60 * 60_000 });
}

export interface AnswerInput {
  itemId: string | null;
  correct: boolean;
  source: Enums<'answer_source'>;
}

/**
 * Records one answer through the server (XP, streak, achievements are computed there), updates the cached stats
 * and announces achievements and level-ups. Offline answers are queued and sent later.
 */
export function useRecordAnswer() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const { session } = useAuth();
  const userId = session?.user.id;
  const queuedNoticeShown = useRef(false);

  return useCallback(
    async ({ itemId, correct, source }: AnswerInput) => {
      const key = statsKey(userId);
      const before = queryClient.getQueryData<PlayerStats>(key);
      const result = await callOrQueue('record_answer', {
        p_item_id: itemId,
        p_correct: correct,
        p_source: source,
      });

      if (result.status === 'done') {
        const row = result.data[0];
        if (row) {
          queryClient.setQueryData<PlayerStats>(key, (old) => ({
            correctAnswers: (old?.correctAnswers ?? 0) + (correct ? 1 : 0),
            totalAnswers: (old?.totalAnswers ?? 0) + 1,
            xp: row.xp,
            level: levelFor(row.xp),
            streak: row.streak,
            maxStreak: row.max_streak,
          }));
          const titles = new Map(
            (queryClient.getQueryData<Achievement[]>(ACHIEVEMENTS_KEY) ?? []).map((a) => [a.id, a]),
          );
          for (const id of row.new_achievements) {
            const a = titles.get(id);
            toast(a ? `Досягнення: «${a.title}» (+${a.xpReward} XP)` : 'Нове досягнення!');
          }
          const level = levelFor(row.xp);
          if (before && level > before.level) toast(`Новий рівень ${level}: ${rankFor(level)}`);
          if (row.new_achievements.length)
            void queryClient.invalidateQueries({ queryKey: ['unlocked', userId] });
        }
      } else if (result.status === 'queued') {
        if (!queuedNoticeShown.current) {
          queuedNoticeShown.current = true;
          toast('Немає зв’язку: відповіді збережено, надішлемо пізніше.');
        }
      } else {
        toast('Не вдалося зберегти відповідь. Спробуй ще раз.');
      }
      return result;
    },
    [queryClient, toast, userId],
  );
}
