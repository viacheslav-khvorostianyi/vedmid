import { seededRng, shuffle } from './shuffle';

describe('shuffle', () => {
  it('returns a permutation without mutating the input', () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8];
    const out = shuffle(input, seededRng(42));
    expect(input).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect([...out].sort((a, b) => a - b)).toEqual(input);
  });

  it('is deterministic for the same seed', () => {
    const input = ['a', 'b', 'c', 'd', 'e'];
    expect(shuffle(input, seededRng(7))).toEqual(shuffle(input, seededRng(7)));
  });

  it('handles empty and single-item lists', () => {
    expect(shuffle([])).toEqual([]);
    expect(shuffle(['x'])).toEqual(['x']);
  });

  it('puts every item in every position roughly uniformly', () => {
    const rng = seededRng(1);
    const counts = [0, 0, 0];
    for (let i = 0; i < 3000; i++) counts[shuffle([0, 1, 2], rng).indexOf(0)]++;
    counts.forEach((c) => expect(c).toBeGreaterThan(850));
  });
});
