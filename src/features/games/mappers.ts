import type { Json, Tables } from '@/lib/db.types';
import type { GuestOption, GuestScenario } from './engines/guest';

function toOption(raw: Json): GuestOption | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const { text, isCorrect, feedback } = raw as Record<string, Json | undefined>;
  if (typeof text !== 'string' || typeof isCorrect !== 'boolean') return null;
  return { text, correct: isCorrect, feedback: typeof feedback === 'string' ? feedback : '' };
}

/** Maps a guest_scenarios row; options with a broken shape are dropped, and scenarios without a right answer are skipped. */
export function fromGuestRow(row: Tables<'guest_scenarios'>): GuestScenario | null {
  const options = (Array.isArray(row.options) ? row.options : []).map(toOption).filter((o) => o !== null);
  if (options.length < 2 || !options.some((o) => o.correct)) return null;
  return { id: row.id, persona: row.persona, avatar: row.avatar, quote: row.quote, options };
}
