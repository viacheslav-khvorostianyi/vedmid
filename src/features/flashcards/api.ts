import { supabase } from '@/lib/supabase';
import { fromProgressRow } from './mappers';

/** The signed-in user's flashcard progress. Filtered by user: managers can read everyone's rows. */
export async function fetchCardProgress(userId: string) {
  const { data, error } = await supabase
    .from('card_progress')
    .select('item_id, box, last_result, reviewed_at')
    .eq('user_id', userId);
  if (error) throw error;
  return data.map(fromProgressRow);
}
