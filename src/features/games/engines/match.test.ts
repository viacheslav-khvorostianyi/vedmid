import { normalize } from '@/features/menu/model';
import type { MenuItem } from '@/features/menu/types';
import { seededRng } from '@/lib/shuffle';
import { MENU } from '@/test/menuFixture';
import {
  buildMatch,
  isMatchFinished,
  MATCH_PAIRS,
  matchReducer,
  pairsTotal,
  startMatch,
  type MatchTile,
} from './match';

const tiles: MatchTile[] = ['a', 'b'].flatMap((id) => [
  { key: `item:${id}`, itemId: id, kind: 'item' as const, text: id },
  { key: `anchor:${id}`, itemId: id, kind: 'anchor' as const, text: `⚓${id}` },
]);
const tap = (key: string) => ({ type: 'tap' as const, key });

describe('buildMatch', () => {
  it('pairs 4 items with distinct anchors, shuffled', () => {
    const built = buildMatch(MENU.items, seededRng(5));
    expect(built).toHaveLength(MATCH_PAIRS * 2);
    const anchors = built.filter((t) => t.kind === 'anchor').map((t) => normalize(t.text));
    expect(new Set(anchors).size).toBe(MATCH_PAIRS);
    for (const t of built.filter((x) => x.kind === 'anchor')) {
      expect(MENU.items.find((i) => i.id === t.itemId)!.anchor).toBe(t.text);
    }
  });

  it('skips items without an anchor or with a duplicate one', () => {
    const [a, b] = MENU.items;
    const built = buildMatch(
      [a, { ...b, anchor: a.anchor }, { ...b, id: 'x', anchor: '' } as MenuItem],
      seededRng(1),
    );
    expect(built.map((t) => t.itemId)).toEqual(expect.arrayContaining([a.id]));
    expect(built).toHaveLength(2);
  });
});

describe('matchReducer', () => {
  it('matches an item with its anchor', () => {
    let s = matchReducer(startMatch(tiles), tap('item:a'));
    expect(s.selected).toBe('item:a');
    s = matchReducer(s, tap('anchor:a'));
    expect(s).toMatchObject({
      matched: ['a'],
      selected: null,
      event: { type: 'match', itemId: 'a', seq: 1 },
    });
  });

  it('counts a wrong pair as a mistake, attributed to the item tile', () => {
    let s = matchReducer(startMatch(tiles), tap('anchor:b'));
    s = matchReducer(s, tap('item:a'));
    expect(s).toMatchObject({
      mistakes: 1,
      miss: ['anchor:b', 'item:a'],
      event: { type: 'miss', itemId: 'a' },
    });
  });

  it('attributes the mistake to the item tile when the item was tapped first', () => {
    const s = matchReducer(matchReducer(startMatch(tiles), tap('item:b')), tap('anchor:a'));
    expect(s.event).toMatchObject({ type: 'miss', itemId: 'b' });
  });

  it('deselects on a second tap and switches between tiles of the same kind', () => {
    let s = matchReducer(startMatch(tiles), tap('item:a'));
    expect(matchReducer(s, tap('item:a')).selected).toBeNull();
    s = matchReducer(s, tap('item:b'));
    expect(s).toMatchObject({ selected: 'item:b', mistakes: 0 });
  });

  it('ignores matched and unknown tiles', () => {
    const s = matchReducer(matchReducer(startMatch(tiles), tap('item:a')), tap('anchor:a'));
    expect(matchReducer(s, tap('item:a'))).toBe(s);
    expect(matchReducer(s, tap('nope'))).toBe(s);
  });

  it('times the game until every pair is found', () => {
    let s = matchReducer(startMatch(tiles), { type: 'tick' });
    expect(s.elapsed).toBe(1);
    for (const key of ['item:a', 'anchor:a', 'anchor:b', 'item:b']) s = matchReducer(s, tap(key));
    expect(isMatchFinished(s)).toBe(true);
    expect(pairsTotal(s)).toBe(2);
    expect(matchReducer(s, { type: 'tick' })).toBe(s);
  });
});
