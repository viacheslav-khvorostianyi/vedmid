// Mirrors public.player_stats plus the derived level (floor(xp / 250) + 1).
export interface PlayerStats {
  xp: number;
  level: number;
  streak: number;
  maxStreak: number;
  correctAnswers: number;
  totalAnswers: number;
}

// Mirrors public.achievements. Unlock rules are evaluated server-side in record_answer.
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
}

export interface UnlockedAchievement {
  achievementId: string;
  unlockedAt: string;
}
