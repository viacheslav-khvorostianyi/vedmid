import { supabase } from '@/lib/supabase';
import type { GuestScenario } from './engines/guest';
import { fromGuestRow } from './mappers';

export async function fetchGuestScenarios(): Promise<GuestScenario[]> {
  const { data, error } = await supabase
    .from('guest_scenarios')
    .select('*')
    .eq('is_active', true)
    .order('sort');
  if (error) throw error;
  return data.map(fromGuestRow).filter((s) => s !== null);
}
