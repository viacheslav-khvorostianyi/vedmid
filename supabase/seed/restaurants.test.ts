import { buildFixtureRows } from './fixtureRows';
import { RESTAURANT_IDS, RESTAURANTS, isRestaurantId } from './restaurants';

describe('demo restaurants', () => {
  it('build valid rows for every restaurant, with its own tab labels', () => {
    for (const id of RESTAURANT_IDS) {
      const rows = buildFixtureRows(id);
      expect(rows.items.length).toBeGreaterThan(100);
      expect(rows.categories.map((c) => c.name)).toEqual(Object.values(RESTAURANTS[id].tabLabels));
    }
    expect(buildFixtureRows('delikacia').categories[3]).toMatchObject({
      slug: 'beer_soft',
      name: 'кава й чай',
    });
  });

  it('keep item ids unique across restaurants', () => {
    const ids = RESTAURANT_IDS.flatMap((id) => buildFixtureRows(id).items.map((i) => i.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('point every photo at a file the demo ships', async () => {
    const { existsSync } = await import('node:fs');
    const paths = buildFixtureRows('delikacia').items.flatMap((i) => i.photo_path ?? []);
    expect(paths.length).toBeGreaterThan(50);
    expect(paths.filter((p) => !existsSync(`public/demo-photos/${p}`))).toEqual([]);
  });

  it('recognise restaurant ids', () => {
    expect(isRestaurantId('delikacia')).toBe(true);
    expect(isRestaurantId('nope')).toBe(false);
    expect(isRestaurantId(null)).toBe(false);
  });
});
