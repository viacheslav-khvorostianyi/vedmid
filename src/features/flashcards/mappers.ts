import type { Tables } from '@/lib/db.types';
import type { CardProgress } from './leitner';

export function fromProgressRow(
  row: Pick<Tables<'card_progress'>, 'item_id' | 'box' | 'last_result' | 'reviewed_at'>,
): CardProgress {
  return { itemId: row.item_id, box: row.box, lastResult: row.last_result, reviewedAt: row.reviewed_at };
}
