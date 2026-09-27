import { seededRng } from '@/lib/shuffle';
import { pickDistinct } from './common';

describe('pickDistinct', () => {
  it('skips blanks, duplicates (ignoring case and apostrophes) and excluded texts', () => {
    const out = pickDistinct(['М’ясо', "м'ясо", '  ', 'сир', 'Сир', 'хліб'], 5, ['хліб'], seededRng(1));
    expect(out).toHaveLength(2);
    expect(out.map((t) => t.toLowerCase().replace(/['’]/g, '')).sort()).toEqual(['мясо', 'сир']);
  });

  it('stops once it has enough', () => {
    expect(pickDistinct(['a1', 'b2', 'c3', 'd4'], 2, [], seededRng(2))).toHaveLength(2);
  });
});
