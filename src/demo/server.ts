// In-browser stand-in for the Supabase RPCs, used only by demo mode. Mirrors record_answer/finish_game in
// supabase/migrations/0001_init.sql so the demo behaves like the real thing (XP, streaks, Leitner boxes, achievements).
import { nextBox } from '@/features/flashcards/leitner';
import { levelFor } from '@/features/progress/rank';
import type { Enums } from '@/lib/db.types';
import { ACHIEVEMENT_ROWS } from '../../supabase/seed/achievements';

export interface DemoState {
  stats: { xp: number; streak: number; max_streak: number; correct_answers: number; total_answers: number };
  progress: Record<
    string,
    { box: number; last_result: boolean; reviewed_at: string; times_seen: number; times_known: number }
  >;
  unlocked: Record<string, string>;
  games: { mode: Enums<'game_mode'>; score: number; total: number; created_at: string }[];
}

export const emptyState = (): DemoState => ({
  stats: { xp: 0, streak: 0, max_streak: 0, correct_answers: 0, total_answers: 0 },
  progress: {},
  unlocked: {},
  games: [],
});

const XP: Record<Enums<'answer_source'>, number> = { card: 5, quiz: 10, match: 5, recipe: 15, guest: 20 };

export interface AnswerInput {
  p_item_id: string | null;
  p_correct: boolean;
  p_source: Enums<'answer_source'>;
}

export function recordAnswer(state: DemoState, input: AnswerInput, now: Date) {
  const s = structuredClone(state);
  const { p_item_id: itemId, p_correct: correct, p_source: source } = input;

  if (source === 'card' && itemId) {
    const p = s.progress[itemId];
    s.progress[itemId] = p
      ? {
          box: nextBox(p.box, correct),
          last_result: correct,
          reviewed_at: now.toISOString(),
          times_seen: p.times_seen + 1,
          times_known: p.times_known + Number(correct),
        }
      : {
          box: correct ? 2 : 1,
          last_result: correct,
          reviewed_at: now.toISOString(),
          times_seen: 1,
          times_known: Number(correct),
        };
  }

  const streak = correct ? s.stats.streak + 1 : 0;
  s.stats = {
    xp: s.stats.xp + (correct ? XP[source] : 0),
    streak,
    max_streak: Math.max(s.stats.max_streak, streak),
    correct_answers: s.stats.correct_answers + Number(correct),
    total_answers: s.stats.total_answers + 1,
  };

  // bonus XP can unlock further achievements, so repeat until nothing new unlocks (as in the SQL)
  const unlockedNow: string[] = [];
  for (;;) {
    const batch = ACHIEVEMENT_ROWS.filter((a) => {
      if (s.unlocked[a.id]) return false;
      const rule = a.rule as { metric: keyof DemoState['stats']; gte: number };
      return (s.stats[rule.metric] ?? 0) >= rule.gte;
    });
    if (batch.length === 0) break;
    for (const a of batch) {
      s.unlocked[a.id] = now.toISOString();
      s.stats.xp += a.xp_reward;
      unlockedNow.push(a.id);
    }
  }

  return {
    state: s,
    result: [
      {
        xp: s.stats.xp,
        level: levelFor(s.stats.xp),
        streak: s.stats.streak,
        max_streak: s.stats.max_streak,
        new_achievements: unlockedNow,
      },
    ],
  };
}

export function finishGame(
  state: DemoState,
  input: { p_mode: Enums<'game_mode'>; p_score: number; p_total: number },
  now: Date,
) {
  if (input.p_score < 0 || input.p_total < 0 || input.p_score > input.p_total || input.p_total > 100) {
    return { error: { code: '22023', message: 'invalid score' } } as const;
  }
  const s = structuredClone(state);
  s.games.push({
    mode: input.p_mode,
    score: input.p_score,
    total: input.p_total,
    created_at: now.toISOString(),
  });
  return { state: s } as const;
}
