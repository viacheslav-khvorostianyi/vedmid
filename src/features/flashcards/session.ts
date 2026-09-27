import { shuffle } from '@/lib/shuffle';

// One run through a deck: which card is showing, whether it is flipped, and what was answered.

export interface SessionState {
  deck: string[];
  index: number;
  flipped: boolean;
  /** itemId → known, for this run */
  results: Record<string, boolean>;
}

export type SessionAction =
  | { type: 'flip' }
  | { type: 'answer'; known: boolean }
  | { type: 'restart'; mode: 'all' | 'mistakes'; rng?: () => number };

export function startSession(deck: string[]): SessionState {
  return { deck, index: 0, flipped: false, results: {} };
}

export const isFinished = (s: SessionState) => s.index >= s.deck.length;
export const currentCard = (s: SessionState): string | undefined => s.deck[s.index];

export function summary(s: SessionState) {
  const values = Object.values(s.results);
  const known = values.filter(Boolean).length;
  return { known, unknown: values.length - known };
}

export function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'flip':
      return isFinished(state) ? state : { ...state, flipped: !state.flipped };
    case 'answer': {
      const id = currentCard(state);
      if (!id) return state;
      return {
        ...state,
        index: state.index + 1,
        flipped: false,
        results: { ...state.results, [id]: action.known },
      };
    }
    case 'restart': {
      const ids =
        action.mode === 'mistakes' ? state.deck.filter((id) => state.results[id] === false) : state.deck;
      return startSession(shuffle(ids, action.rng));
    }
  }
}
