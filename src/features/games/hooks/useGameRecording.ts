import { useCallback, useEffect, useRef, useState } from 'react';
import { useRecordAnswer, useStats } from '@/features/progress/hooks';
import { callOrQueue } from '@/lib/rpc';
import type { GameMode } from '../modes';

/**
 * Records answers (XP is computed on the server), stores the result once the game is over,
 * and reports the XP earned during this game (null while unknown, e.g. offline).
 */
export function useGameRecording(mode: GameMode, result: { over: boolean; score: number; total: number }) {
  const recordAnswer = useRecordAnswer();
  const stats = useStats();
  const [xpAtStart] = useState(() => stats.data?.xp ?? null);
  const { over, score, total } = result;
  // once per game, also under StrictMode's double effects
  const saved = useRef(false);

  useEffect(() => {
    if (!over || saved.current) return;
    saved.current = true;
    void callOrQueue('finish_game', { p_mode: mode, p_score: Math.min(score, total), p_total: total });
  }, [over, mode, score, total]);

  const record = useCallback(
    (itemId: string | null, correct: boolean) => recordAnswer({ itemId, correct, source: mode }),
    [recordAnswer, mode],
  );

  const xpNow = stats.data?.xp ?? null;
  return {
    recordAnswer: record,
    xpEarned: xpAtStart !== null && xpNow !== null ? xpNow - xpAtStart : null,
  };
}
