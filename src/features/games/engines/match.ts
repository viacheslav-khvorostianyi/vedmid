import type { MenuItem } from '@/features/menu/types';
import { normalize } from '@/features/menu/model';
import { shuffle } from '@/lib/shuffle';

// Match: pair 4 items with their «якір». Tapping two tiles of the same kind just switches the selection.

export const MATCH_PAIRS = 4;

export interface MatchTile {
  key: string;
  itemId: string;
  kind: 'item' | 'anchor';
  text: string;
}

export function buildMatch(items: readonly MenuItem[], rng: () => number = Math.random): MatchTile[] {
  const seen = new Set<string>();
  const chosen: MenuItem[] = [];
  for (const item of shuffle(items, rng)) {
    const anchor = normalize(item.anchor);
    if (!anchor || seen.has(anchor)) continue;
    seen.add(anchor);
    chosen.push(item);
    if (chosen.length === MATCH_PAIRS) break;
  }
  return shuffle(
    chosen.flatMap((i) => [
      { key: `item:${i.id}`, itemId: i.id, kind: 'item' as const, text: i.title },
      { key: `anchor:${i.id}`, itemId: i.id, kind: 'anchor' as const, text: i.anchor },
    ]),
    rng,
  );
}

export interface MatchEvent {
  type: 'match' | 'miss';
  itemId: string;
  /** increments per event, so effects can react to each one */
  seq: number;
}

export interface MatchState {
  tiles: MatchTile[];
  selected: string | null;
  matched: string[];
  mistakes: number;
  elapsed: number;
  /** the two tiles of the last wrong pair, for feedback */
  miss: [string, string] | null;
  event: MatchEvent | null;
}

export type MatchAction = { type: 'tap'; key: string } | { type: 'tick' };

export function startMatch(tiles: MatchTile[]): MatchState {
  return { tiles, selected: null, matched: [], mistakes: 0, elapsed: 0, miss: null, event: null };
}

export const pairsTotal = (s: MatchState) => s.tiles.length / 2;
export const isMatchFinished = (s: MatchState) => s.matched.length === pairsTotal(s);

export function matchReducer(state: MatchState, action: MatchAction): MatchState {
  if (action.type === 'tick')
    return isMatchFinished(state) ? state : { ...state, elapsed: state.elapsed + 1 };

  const tile = state.tiles.find((t) => t.key === action.key);
  if (!tile || state.matched.includes(tile.itemId)) return state;
  const selected = state.tiles.find((t) => t.key === state.selected);
  const seq = (state.event?.seq ?? 0) + 1;

  if (!selected) return { ...state, selected: tile.key, miss: null };
  if (selected.key === tile.key) return { ...state, selected: null };
  if (selected.kind === tile.kind) return { ...state, selected: tile.key, miss: null };
  if (selected.itemId === tile.itemId) {
    return {
      ...state,
      selected: null,
      miss: null,
      matched: [...state.matched, tile.itemId],
      event: { type: 'match', itemId: tile.itemId, seq },
    };
  }
  const itemTile = selected.kind === 'item' ? selected : tile;
  return {
    ...state,
    selected: null,
    mistakes: state.mistakes + 1,
    miss: [selected.key, tile.key],
    event: { type: 'miss', itemId: itemTile.itemId, seq },
  };
}
