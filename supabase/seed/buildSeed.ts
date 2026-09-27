import type { SeedCategory, SeedMenuItem } from '../../src/data/types';
import { menuItemInputSchema, type MenuItemInput } from '../../src/features/manager/schema';
import type { TablesInsert } from '../../src/lib/db.types';
import type { SeedGuestScenario } from './guestScenarios';

/** Mirrors the ids seeded into public.categories by 0001_init.sql. */
export const CATEGORY_IDS: Record<SeedCategory, number> = {
  Їжа: 1,
  Вино: 2,
  Коктейлі: 3,
  'Безалкогольні & Пиво': 4,
  'Міцні напої': 5,
};

export interface SeedSubcategory {
  key: string;
  categoryId: number;
  name: string;
  sort: number;
}

export interface SeedItem {
  subcategoryKey: string;
  input: Omit<MenuItemInput, 'subcategoryId'>;
}

export interface SeedPlan {
  subcategories: SeedSubcategory[];
  items: SeedItem[];
  guestScenarios: TablesInsert<'guest_scenarios'>[];
}

const itemSchema = menuItemInputSchema.omit({ subcategoryId: true });

// The legacy data uses placeholders such as «Не вказано» for unknown values; store them as "not set".
const PLACEHOLDER = /^\s*(не вказано|невідомо|немає даних|—|-)\s*\.?\s*$/i;
export const optional = (value: string | undefined): string | null =>
  !value || PLACEHOLDER.test(value) ? null : value;
const subKey = (categoryId: number, name: string) => `${categoryId}:${name}`;

/** Turns the legacy static data into validated DB-ready rows. Throws listing every invalid item. */
export function buildSeed(menu: readonly SeedMenuItem[], scenarios: readonly SeedGuestScenario[]): SeedPlan {
  const subcategories = new Map<string, SeedSubcategory>();
  const perSubCount = new Map<string, number>();
  const items: SeedItem[] = [];
  const errors: string[] = [];

  for (const m of menu) {
    const categoryId = CATEGORY_IDS[m.category];
    const name = m.subcategory.trim();
    const key = subKey(categoryId, name);
    if (!subcategories.has(key)) {
      // sort = order of first appearance within the category
      const sort = [...subcategories.values()].filter((s) => s.categoryId === categoryId).length + 1;
      subcategories.set(key, { key, categoryId, name, sort });
    }
    const sort = (perSubCount.get(key) ?? 0) + 1;
    perSubCount.set(key, sort);

    const parsed = itemSchema.safeParse({
      legacyId: m.id,
      title: m.title,
      anchor: m.anchor,
      ingredients: m.ingredients,
      sales: m.sales,
      interestingFact: optional(m.interestingFact),
      pairing: optional(m.pairing),
      allergens: m.allergens ?? [],
      grapeVarieties: optional(m.grapeVarieties),
      sweetness: optional(m.sweetness),
      tasteProfile: m.profile ?? null,
      producer: m.producer ?? null,
      isBestseller: m.isBestseller ?? false,
      isFinalist: m.isFinalist ?? false,
      isActive: true,
      sort,
      photoPath: null,
    });
    if (parsed.success) items.push({ subcategoryKey: key, input: parsed.data });
    else
      errors.push(
        `${m.id}: ${parsed.error.issues.map((i) => `${i.path.join('.')} ${i.message}`).join('; ')}`,
      );
  }

  if (errors.length) throw new Error(`Invalid seed items:\n${errors.join('\n')}`);

  const guestScenarios = scenarios.map((g, i) => ({
    id: g.id,
    persona: g.role,
    avatar: g.avatar,
    quote: g.quote,
    options: g.options,
    sort: i + 1,
    is_active: true,
  }));

  return { subcategories: [...subcategories.values()], items, guestScenarios };
}
