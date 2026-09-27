import { BORSCH_ID, MENU, MENU_ROWS, WINE_ID } from '@/test/menuFixture';
import { buildMenu, detailTabs, formatUpdated, normalize, searchMenu, sectionsFor } from './model';
import type { MenuItem } from './types';

const byId = (id: string) => MENU.items.find((i) => i.id === id)!;
const titles = (items: MenuItem[]) => items.map((i) => i.title);

describe('buildMenu', () => {
  it('maps all 197 active items with their category and subcategory', () => {
    expect(MENU.items).toHaveLength(197);
    expect(MENU.categories.map((c) => c.name)).toEqual(['їжа', 'вино', 'коктейлі', 'пиво', 'міцні']);
    expect(byId(BORSCH_ID)).toMatchObject({
      category: 'food',
      subcategory: 'Перші страви',
      allergens: ['глютен', 'лактоза'],
    });
  });

  it('drops inactive items and items whose subcategory is unknown', () => {
    const rows = structuredClone(MENU_ROWS);
    rows.items[0].is_active = false;
    rows.items[1].subcategory_id = 999;
    expect(buildMenu(rows.categories, rows.subcategories, rows.items).items).toHaveLength(195);
  });

  it('orders items by subcategory, then item sort', () => {
    const rows = structuredClone(MENU_ROWS);
    rows.items.reverse();
    const menu = buildMenu(rows.categories, rows.subcategories, rows.items);
    expect(menu.items.map((i) => i.id)).toEqual(MENU.items.map((i) => i.id));
  });
});

describe('sectionsFor', () => {
  it('groups a category by subcategory in menu order', () => {
    const food = sectionsFor(MENU, 'food');
    expect(food[0].subcategory.name).toBe('Дитяче меню');
    expect(food.find((s) => s.subcategory.name === 'Перші страви')!.items).toHaveLength(4);
    expect(food.reduce((n, s) => n + s.items.length, 0)).toBe(59);
  });

  it('skips empty subcategories', () => {
    const menu = { ...MENU, items: MENU.items.filter((i) => i.subcategory !== 'Перші страви') };
    expect(sectionsFor(menu, 'food').map((s) => s.subcategory.name)).not.toContain('Перші страви');
  });
});

describe('searchMenu', () => {
  it('finds the borscht by name, case-insensitively', () => {
    expect(titles(searchMenu(MENU.items, 'БОРЩ'))[0]).toBe('Борщ з пампушкою та салом із чорним часником');
  });

  it('finds every item with lactose among its allergens', () => {
    const withLactose = MENU.items.filter((i) => i.allergens.includes('лактоза'));
    const found = searchMenu(MENU.items, 'лактоза');
    expect(withLactose.length).toBeGreaterThan(5);
    for (const item of withLactose) expect(found).toContain(item);
  });

  it('requires every word and ranks title matches first', () => {
    const results = searchMenu(MENU.items, 'el capitan');
    expect(results.length).toBeGreaterThan(0);
    results.forEach((r) => expect(normalize(r.title)).toContain('el capitan'));
    const mixed = searchMenu(MENU.items, 'сало');
    expect(normalize(mixed[0].title)).toContain('сало');
  });

  it('ignores apostrophe variants', () => {
    expect(searchMenu(MENU.items, 'мясом')).toEqual(searchMenu(MENU.items, "м'ясом"));
    expect(searchMenu(MENU.items, 'м’ясом').length).toBeGreaterThan(0);
  });

  it('keeps Ukrainian letters distinct', () => {
    expect(normalize('Їжа Єва')).toBe('їжа єва');
  });

  it('returns nothing for empty or one-letter queries', () => {
    expect(searchMenu(MENU.items, '')).toEqual([]);
    expect(searchMenu(MENU.items, ' б ')).toEqual([]);
  });

  it('searches grape varieties', () => {
    expect(searchMenu(MENU.items, 'піно грі').every((i) => i.category === 'wine')).toBe(true);
  });
});

describe('detailTabs', () => {
  it('food: allergens, ingredients, pairing', () => {
    expect(detailTabs(byId(BORSCH_ID))).toEqual(['allergens', 'ingredients', 'pairing']);
  });

  it('food without allergens hides that tab but keeps pairing', () => {
    const noAllergens = MENU.items.find((i) => i.category === 'food' && i.allergens.length === 0)!;
    expect(detailTabs(noAllergens)).toEqual(['ingredients', 'pairing']);
  });

  it('wine: grape, profile, pairing', () => {
    expect(detailTabs(byId(WINE_ID))).toEqual(['grape', 'profile', 'pairing']);
  });

  it('other drinks: ingredients and profile, no empty pairing tab', () => {
    const cocktail = MENU.items.find((i) => i.category === 'cocktails')!;
    expect(detailTabs(cocktail)).toEqual(['ingredients', 'profile']);
  });
});

describe('formatUpdated', () => {
  it('formats as dd.mm.yyyy', () => {
    expect(formatUpdated('2026-09-26T10:00:00.000Z')).toBe('26.09.2026');
    expect(formatUpdated('nonsense')).toBe('');
  });
});
