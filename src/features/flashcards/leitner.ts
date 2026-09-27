import { shuffle } from '@/lib/shuffle';
import type { MenuItem } from '@/features/menu/types';

// Leitner spaced repetition (ARCHITECTURE §4.5). The server applies the same box rule in record_answer.

export const MAX_BOX = 5;
/** Days until a card in box 1…5 is due again. */
export const BOX_INTERVAL_DAYS = [0, 2, 4, 7, 14] as const;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface CardProgress {
  itemId: string;
  box: number;
  lastResult: boolean | null;
  reviewedAt: string | null;
}

const clampBox = (box: number) => Math.min(Math.max(Math.trunc(box) || 1, 1), MAX_BOX);

export function nextBox(box: number, known: boolean): number {
  return known ? Math.min(clampBox(box) + 1, MAX_BOX) : 1;
}

/** When the card is due (ms since epoch). Never-reviewed cards are due immediately. */
export function dueAt(p: CardProgress): number {
  if (!p.reviewedAt) return 0;
  const reviewed = Date.parse(p.reviewedAt);
  if (Number.isNaN(reviewed)) return 0;
  return reviewed + BOX_INTERVAL_DAYS[clampBox(p.box) - 1] * DAY_MS;
}

/**
 * Today's deck: due cards first (most overdue first), then cards never seen, shuffled.
 * Cards reviewed recently enough are left out until they are due.
 */
export function buildDeck(
  items: readonly MenuItem[],
  progress: readonly CardProgress[],
  now: number,
  rng: () => number = Math.random,
): MenuItem[] {
  const byItem = new Map(progress.map((p) => [p.itemId, p]));
  const due: { item: MenuItem; at: number }[] = [];
  const unseen: MenuItem[] = [];
  for (const item of items) {
    const p = byItem.get(item.id);
    if (!p) unseen.push(item);
    else if (dueAt(p) <= now) due.push({ item, at: dueAt(p) });
  }
  due.sort((a, b) => a.at - b.at);
  return [...due.map((d) => d.item), ...shuffle(unseen, rng)];
}

/** Progress after answering a card (optimistic copy of what the server stores). */
export function applyAnswer(
  progress: readonly CardProgress[],
  itemId: string,
  known: boolean,
  now: number,
): CardProgress[] {
  const reviewedAt = new Date(now).toISOString();
  const existing = progress.find((p) => p.itemId === itemId);
  if (!existing) return [...progress, { itemId, box: known ? 2 : 1, lastResult: known, reviewedAt }];
  return progress.map((p) =>
    p.itemId === itemId ? { ...p, box: nextBox(p.box, known), lastResult: known, reviewedAt } : p,
  );
}

export interface BoxDistribution {
  unseen: number;
  /** count per box, index 0 = box 1 */
  boxes: number[];
}

export function boxDistribution(
  items: readonly MenuItem[],
  progress: readonly CardProgress[],
): BoxDistribution {
  const byItem = new Map(progress.map((p) => [p.itemId, p]));
  const boxes = Array.from({ length: MAX_BOX }, () => 0);
  let unseen = 0;
  for (const item of items) {
    const p = byItem.get(item.id);
    if (p) boxes[clampBox(p.box) - 1]++;
    else unseen++;
  }
  return { unseen, boxes };
}
