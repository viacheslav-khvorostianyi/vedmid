import type { MenuItem } from '@/features/menu/types';
import { shuffle } from '@/lib/shuffle';
import { pickDistinct } from './common';

// Recipe: pick exactly the ingredients that belong to the dish. 5 rounds, 8 choices, up to 4 correct.

export const RECIPE_ROUNDS = 5;
const CHOICES = 8;
const MAX_CORRECT = 4;

/** Splits «a, b (c, d), e.» on top-level commas only. */
export function splitIngredients(text: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of text) {
    if (ch === '(') depth++;
    if (ch === ')') depth = Math.max(depth - 1, 0);
    if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else current += ch;
  }
  parts.push(current);
  return parts
    .map((p) => p.trim().replace(/\.$/, '').trim())
    .filter((p) => p.length > 2)
    .map((p) => p.charAt(0).toLowerCase() + p.slice(1));
}

export interface RecipeOption {
  text: string;
  correct: boolean;
}

export interface RecipeRound {
  itemId: string;
  title: string;
  options: RecipeOption[];
}

export function buildRecipe(items: readonly MenuItem[], rng: () => number = Math.random): RecipeRound[] {
  const food = items.filter((i) => i.category === 'food');
  const parts = new Map(food.map((i) => [i.id, splitIngredients(i.ingredients)]));
  const dishes = shuffle(
    food.filter((i) => parts.get(i.id)!.length >= 3),
    rng,
  ).slice(0, RECIPE_ROUNDS);

  return dishes.map((dish) => {
    const own = parts.get(dish.id)!;
    const correct = shuffle(own, rng).slice(0, MAX_CORRECT);
    const pool = food.filter((i) => i.id !== dish.id).flatMap((i) => parts.get(i.id)!);
    // exclude every ingredient of the dish, not only the ones shown, so no distractor is secretly right
    const distractors = pickDistinct(pool, CHOICES - correct.length, own, rng);
    return {
      itemId: dish.id,
      title: dish.title,
      options: shuffle(
        [
          ...correct.map((text) => ({ text, correct: true })),
          ...distractors.map((text) => ({ text, correct: false })),
        ],
        rng,
      ),
    };
  });
}

export interface RecipeState {
  rounds: RecipeRound[];
  index: number;
  selected: number[];
  perfect: number;
  status: 'playing' | 'checked' | 'over';
}

export type RecipeAction = { type: 'toggle'; index: number } | { type: 'submit' } | { type: 'next' };

export function startRecipe(rounds: RecipeRound[]): RecipeState {
  return { rounds, index: 0, selected: [], perfect: 0, status: rounds.length ? 'playing' : 'over' };
}

/** Perfect = every correct option selected and nothing else. */
export function isPerfect(round: RecipeRound, selected: readonly number[]): boolean {
  return round.options.every((o, i) => o.correct === selected.includes(i));
}

export function recipeReducer(state: RecipeState, action: RecipeAction): RecipeState {
  switch (action.type) {
    case 'toggle': {
      if (state.status !== 'playing') return state;
      const selected = state.selected.includes(action.index)
        ? state.selected.filter((i) => i !== action.index)
        : [...state.selected, action.index];
      return { ...state, selected };
    }
    case 'submit':
      if (state.status !== 'playing' || state.selected.length === 0) return state;
      return {
        ...state,
        status: 'checked',
        perfect: state.perfect + (isPerfect(state.rounds[state.index], state.selected) ? 1 : 0),
      };
    case 'next':
      if (state.status !== 'checked') return state;
      if (state.index + 1 >= state.rounds.length) return { ...state, status: 'over' };
      return { ...state, index: state.index + 1, selected: [], status: 'playing' };
  }
}
