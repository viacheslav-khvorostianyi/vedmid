import { shuffle } from '@/lib/shuffle';

// Guest: a situation at the table, pick the best reply; the feedback explains why.

export interface GuestOption {
  text: string;
  correct: boolean;
  feedback: string;
}

export interface GuestScenario {
  id: string;
  persona: string;
  avatar: string;
  quote: string;
  options: GuestOption[];
}

/** Scenario order is kept (they are curated); options are shuffled so the right answer isn't always in one place. */
export function buildGuest(
  scenarios: readonly GuestScenario[],
  rng: () => number = Math.random,
): GuestScenario[] {
  return scenarios.map((s) => ({ ...s, options: shuffle(s.options, rng) }));
}

export interface GuestState {
  scenarios: GuestScenario[];
  index: number;
  choice: number | null;
  correct: number;
  status: 'playing' | 'answered' | 'over';
}

export type GuestAction = { type: 'choose'; index: number } | { type: 'next' };

export function startGuest(scenarios: GuestScenario[]): GuestState {
  return { scenarios, index: 0, choice: null, correct: 0, status: scenarios.length ? 'playing' : 'over' };
}

export function guestReducer(state: GuestState, action: GuestAction): GuestState {
  switch (action.type) {
    case 'choose': {
      const option = state.scenarios[state.index]?.options[action.index];
      if (state.status !== 'playing' || !option) return state;
      return {
        ...state,
        choice: action.index,
        status: 'answered',
        correct: state.correct + (option.correct ? 1 : 0),
      };
    }
    case 'next':
      if (state.status !== 'answered') return state;
      if (state.index + 1 >= state.scenarios.length) return { ...state, status: 'over' };
      return { ...state, index: state.index + 1, choice: null, status: 'playing' };
  }
}
