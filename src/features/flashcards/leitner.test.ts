import type { MenuItem } from '@/features/menu/types';
import { seededRng } from '@/lib/shuffle';
import { applyAnswer, boxDistribution, buildDeck, dueAt, nextBox, type CardProgress } from './leitner';

const DAY = 24 * 60 * 60 * 1000;
const NOW = Date.parse('2026-09-27T12:00:00Z');
const daysAgo = (d: number) => new Date(NOW - d * DAY).toISOString();
const item = (id: string) => ({ id, title: id }) as MenuItem;
const ITEMS = ['a', 'b', 'c', 'd', 'e', 'f'].map(item);
const p = (
  itemId: string,
  box: number,
  reviewedAt: string | null,
  lastResult: boolean | null = true,
): CardProgress => ({
  itemId,
  box,
  reviewedAt,
  lastResult,
});

describe('nextBox', () => {
  it('moves up one box when known, up to 5', () => {
    expect(nextBox(1, true)).toBe(2);
    expect(nextBox(4, true)).toBe(5);
    expect(nextBox(5, true)).toBe(5);
  });

  it('goes back to box 1 when not known', () => {
    expect(nextBox(4, false)).toBe(1);
  });

  it('treats out-of-range boxes as the nearest valid box', () => {
    expect(nextBox(0, true)).toBe(2);
    expect(nextBox(9, true)).toBe(5);
    expect(nextBox(Number.NaN, true)).toBe(2);
  });
});

describe('dueAt', () => {
  it('uses the box interval: 0, 2, 4, 7, 14 days', () => {
    const reviewed = daysAgo(0);
    expect([1, 2, 3, 4, 5].map((box) => (dueAt(p('a', box, reviewed)) - NOW) / DAY)).toEqual([
      0, 2, 4, 7, 14,
    ]);
  });

  it('is immediately due when never reviewed or the date is broken', () => {
    expect(dueAt(p('a', 3, null))).toBe(0);
    expect(dueAt(p('a', 3, 'not a date'))).toBe(0);
  });
});

describe('buildDeck', () => {
  it('puts due cards first (most overdue first), then unseen ones, and skips cards not yet due', () => {
    const progress = [
      p('a', 2, daysAgo(3)), // due 1 day ago
      p('b', 1, daysAgo(0)), // box 1 → due now
      p('c', 5, daysAgo(1)), // due in 13 days → skipped
      p('d', 3, daysAgo(10)), // due 6 days ago
    ];
    const deck = buildDeck(ITEMS, progress, NOW, seededRng(1)).map((i) => i.id);
    expect(deck.slice(0, 3)).toEqual(['d', 'a', 'b']);
    expect(deck.slice(3).sort()).toEqual(['e', 'f']);
    expect(deck).not.toContain('c');
  });

  it('shuffles unseen cards reproducibly with a seeded rng', () => {
    const one = buildDeck(ITEMS, [], NOW, seededRng(7)).map((i) => i.id);
    expect(buildDeck(ITEMS, [], NOW, seededRng(7)).map((i) => i.id)).toEqual(one);
    expect([...one].sort()).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);
  });

  it('is empty when everything was learned recently', () => {
    expect(buildDeck([item('a')], [p('a', 4, daysAgo(1))], NOW)).toEqual([]);
  });
});

describe('applyAnswer', () => {
  it('adds a first answer in box 2 (known) or 1 (not known)', () => {
    expect(applyAnswer([], 'a', true, NOW)).toEqual([p('a', 2, new Date(NOW).toISOString(), true)]);
    expect(applyAnswer([], 'a', false, NOW)[0]).toMatchObject({ box: 1, lastResult: false });
  });

  it('updates an existing card and leaves the others alone', () => {
    const before = [p('a', 3, daysAgo(5)), p('b', 2, daysAgo(1))];
    const after = applyAnswer(before, 'a', false, NOW);
    expect(after[0]).toEqual(p('a', 1, new Date(NOW).toISOString(), false));
    expect(after[1]).toBe(before[1]);
  });
});

describe('boxDistribution', () => {
  it('counts cards per box and unseen, for the given items only', () => {
    const progress = [
      p('a', 1, daysAgo(0)),
      p('b', 1, daysAgo(0)),
      p('c', 5, daysAgo(0)),
      p('zzz', 2, daysAgo(0)),
      p('d', 12, null),
    ];
    expect(boxDistribution(ITEMS, progress)).toEqual({ unseen: 2, boxes: [2, 0, 0, 0, 2] });
  });
});
