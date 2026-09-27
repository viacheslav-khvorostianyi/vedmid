// DB-shaped rows built from the real seed data, for unit tests (src/test/menuFixture.ts) and e2e mocks.
// Item ids are deterministic: `item-<legacy id>`.
import { menuData } from '../../src/data/menuData';
import { CATEGORIES } from '../../src/features/menu/categories';
import { toMenuItemRow } from '../../src/features/menu/mappers';
import type { Tables } from '../../src/lib/db.types';
import { buildSeed } from './buildSeed';
import { guestScenarios } from './guestScenarios';

export const FIXTURE_UPDATED_AT = '2026-09-26T10:00:00.000Z';

export function buildFixtureRows() {
  const plan = buildSeed(menuData, []);
  const categories: Tables<'categories'>[] = CATEGORIES.map((c, i) => ({
    id: i + 1,
    slug: c.slug,
    name: c.name,
    legacy_name: '',
    sort: c.sort,
  }));
  const subcategories: Tables<'subcategories'>[] = plan.subcategories.map((s, i) => ({
    id: i + 1,
    category_id: s.categoryId,
    name: s.name,
    sort: s.sort,
  }));
  const subId = new Map(plan.subcategories.map((s, i) => [s.key, i + 1]));
  const items: Tables<'menu_items'>[] = plan.items.map(({ subcategoryKey, input }) => {
    const row = toMenuItemRow({ ...input, subcategoryId: subId.get(subcategoryKey)! });
    return {
      ...row,
      id: `item-${input.legacyId}`,
      legacy_id: input.legacyId,
      subcategory_id: row.subcategory_id,
      title: row.title,
      anchor: row.anchor ?? '',
      ingredients: row.ingredients ?? '',
      sales: row.sales ?? '',
      interesting_fact: row.interesting_fact ?? null,
      pairing: row.pairing ?? null,
      allergens: row.allergens ?? [],
      grape_varieties: row.grape_varieties ?? null,
      sweetness: row.sweetness ?? null,
      taste_profile: row.taste_profile ?? null,
      producer: row.producer ?? null,
      is_bestseller: row.is_bestseller ?? false,
      is_finalist: row.is_finalist ?? false,
      photo_path: null,
      sort: row.sort ?? 0,
      is_active: true,
      updated_at: FIXTURE_UPDATED_AT,
      updated_by: null,
    };
  });
  return { categories, subcategories, items };
}

/** guest_scenarios rows as the database returns them. */
export function buildGuestRows(): Tables<'guest_scenarios'>[] {
  return guestScenarios.map((g, i) => ({
    id: g.id,
    persona: g.role,
    avatar: g.avatar,
    quote: g.quote,
    options: g.options,
    sort: i + 1,
    is_active: true,
  }));
}
