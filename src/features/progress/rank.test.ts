import { levelFor, rankFor } from './rank';

describe('levels and ranks', () => {
  it.each([
    [0, 1],
    [249, 1],
    [250, 2],
    [1000, 5],
    [-10, 1],
  ])('%i XP → level %i', (xp, level) => expect(levelFor(xp)).toBe(level));

  it.each([
    [1, 'Стажер ЛІСу'],
    [2, 'Офіціант'],
    [3, 'Офіціант'],
    [4, 'Профі Офіціант'],
    [6, 'Старший Офіціант'],
    [8, 'Шеф-Сомельє'],
    [12, 'Шеф-Сомельє'],
  ])('level %i → %s', (level, rank) => expect(rankFor(level)).toBe(rank));
});
