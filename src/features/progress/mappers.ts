import type { Tables } from '@/lib/db.types';
import { levelFor } from './rank';
import type { Achievement, PlayerStats } from './types';

export function fromStatsRow(row: Tables<'player_stats'>): PlayerStats {
  return {
    xp: row.xp,
    level: levelFor(row.xp),
    streak: row.streak,
    maxStreak: row.max_streak,
    correctAnswers: row.correct_answers,
    totalAnswers: row.total_answers,
  };
}

export function fromAchievementRow(row: Tables<'achievements'>): Achievement {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    icon: row.icon,
    xpReward: row.xp_reward,
  };
}

export const EMPTY_STATS: PlayerStats = {
  xp: 0,
  level: 1,
  streak: 0,
  maxStreak: 0,
  correctAnswers: 0,
  totalAnswers: 0,
};
