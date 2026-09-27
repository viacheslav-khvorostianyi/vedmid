import { supabase } from '@/lib/supabase';
import { EMPTY_STATS, fromAchievementRow, fromStatsRow } from './mappers';

// Managers can read everyone's progress (RLS), so every query filters by the signed-in user explicitly.

export async function fetchStats(userId: string) {
  const { data, error } = await supabase.from('player_stats').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data ? fromStatsRow(data) : EMPTY_STATS;
}

export async function fetchAchievements() {
  const { data, error } = await supabase.from('achievements').select('*').order('sort');
  if (error) throw error;
  return data.map(fromAchievementRow);
}
