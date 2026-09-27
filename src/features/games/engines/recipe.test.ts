import { normalize } from '@/features/menu/model';
import { seededRng } from '@/lib/shuffle';
import { MENU } from '@/test/menuFixture';
import {
  buildRecipe,
  isPerfect,
  RECIPE_ROUNDS,
  recipeReducer,
  splitIngredients,
  startRecipe,
  type RecipeRound,
} from './recipe';

const round: RecipeRound = {
  itemId: 'x',
  title: 'X',
  options: [
    { text: 'a', correct: true },
    { text: 'b', correct: false },
    { text: 'c', correct: true },
  ],
};

describe('splitIngredients', () => {
  it('splits on top-level commas only and tidies each part', () => {
    expect(splitIngredients('Вершкове пюре (молоко, масло), куряча котлета.')).toEqual([
      'вершкове пюре (молоко, масло)',
      'куряча котлета',
    ]);
  });

  it('drops fragments too short to be an ingredient and tolerates stray brackets', () => {
    expect(splitIngredients('сіль, і, перець)) , кріп')).toEqual(['сіль', 'перець))', 'кріп']);
  });
});

describe('buildRecipe', () => {
  const rounds = buildRecipe(MENU.items, seededRng(4));

  it('builds 5 food rounds of 8 options with 3–4 correct ingredients', () => {
    expect(rounds).toHaveLength(RECIPE_ROUNDS);
    for (const r of rounds) {
      expect(MENU.items.find((i) => i.id === r.itemId)!.category).toBe('food');
      expect(r.options).toHaveLength(8);
      const correct = r.options.filter((o) => o.correct).length;
      expect(correct).toBeGreaterThanOrEqual(3);
      expect(correct).toBeLessThanOrEqual(4);
    }
  });

  it('never offers a distractor that is actually in the dish', () => {
    for (const r of rounds) {
      const own = splitIngredients(MENU.items.find((i) => i.id === r.itemId)!.ingredients).map(normalize);
      r.options.filter((o) => !o.correct).forEach((o) => expect(own).not.toContain(normalize(o.text)));
    }
  });
});

describe('recipeReducer', () => {
  it('toggles options and needs a selection before checking', () => {
    let s = startRecipe([round]);
    expect(recipeReducer(s, { type: 'submit' })).toBe(s);
    s = recipeReducer(recipeReducer(s, { type: 'toggle', index: 1 }), { type: 'toggle', index: 1 });
    expect(s.selected).toEqual([]);
  });

  it('scores only a perfect selection', () => {
    let s = recipeReducer(recipeReducer(startRecipe([round, round]), { type: 'toggle', index: 0 }), {
      type: 'toggle',
      index: 2,
    });
    s = recipeReducer(s, { type: 'submit' });
    expect(s).toMatchObject({ status: 'checked', perfect: 1 });
    expect(recipeReducer(s, { type: 'toggle', index: 1 })).toBe(s);
    expect(recipeReducer(s, { type: 'submit' })).toBe(s);
    s = recipeReducer(s, { type: 'next' });
    s = recipeReducer(recipeReducer(s, { type: 'toggle', index: 0 }), { type: 'submit' });
    expect(s.perfect).toBe(1);
    expect(recipeReducer(s, { type: 'next' }).status).toBe('over');
  });

  it('isPerfect rejects extra or missing picks', () => {
    expect(isPerfect(round, [0, 2])).toBe(true);
    expect(isPerfect(round, [0, 1, 2])).toBe(false);
    expect(isPerfect(round, [0])).toBe(false);
  });

  it('next only works after checking; empty games are over', () => {
    const s = startRecipe([round]);
    expect(recipeReducer(s, { type: 'next' })).toBe(s);
    expect(startRecipe([]).status).toBe('over');
  });
});
