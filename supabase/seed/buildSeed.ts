import type { SeedCategory, SeedMenuItem } from '../../src/data/types';
import { menuItemInputSchema, type MenuItemInput } from '../../src/features/manager/schema';
import type { TablesInsert } from '../../src/lib/db.types';
import type { SeedGuestScenario } from './guestScenarios';
import { CHOICEQR_ITEMS, CHOICEQR_NEW_ITEMS } from './choiceqrMenu';
import { STOCK_PHOTO_ITEMS, STOCK_PHOTOS } from './stockPhotos';

/** Mirrors the ids seeded into public.categories by 0001_init.sql. */
export const CATEGORY_IDS: Record<SeedCategory, number> = {
  Їжа: 1,
  Вино: 2,
  Коктейлі: 3,
  'Безалкогольні & Пиво': 4,
  'Міцні напої': 5,
};

/** Storage path of a stock photo in the dish-photos bucket. */
export const stockPhotoPath = (key: string) => `stock/${key}.webp`;

/** Storage path of the restaurant's own photo (from its online menu) in the dish-photos bucket. */
export const ownPhotoPath = (legacyId: string) => `own/${legacyId}.webp`;

const OWN_PHOTOS = new Set([
  ...Object.entries(CHOICEQR_ITEMS)
    .filter(([, item]) => item.photo)
    .map(([id]) => id),
  ...CHOICEQR_NEW_ITEMS.filter((item) => item.photo).map((item) => item.id),
]);

/** The restaurant's own photo wins over an illustrative stock photo, which wins over none. */
function photo(legacyId: string) {
  if (OWN_PHOTOS.has(legacyId)) return { photoPath: ownPhotoPath(legacyId), photoCredit: null };
  const key = STOCK_PHOTO_ITEMS[legacyId];
  const credit = key ? STOCK_PHOTOS[key] : undefined;
  return key && credit
    ? { photoPath: stockPhotoPath(key), photoCredit: credit }
    : { photoPath: null, photoCredit: null };
}

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
/**
 * Items that are only on the restaurant's online menu (scripts/choiceqr/sync.ts). Their training fields start
 * empty: managers fill in the anchor, sales phrase and allergens in the app.
 */
export const SITE_ONLY_ITEMS: SeedMenuItem[] = CHOICEQR_NEW_ITEMS.map((item) => ({
  id: item.id,
  category: item.category,
  subcategory: item.subcategory,
  title: item.title,
  anchor: '',
  ingredients: item.ingredients ?? '',
  sales: '',
  pairing: item.pairing,
  grapeVarieties: item.grapeVarieties,
  sweetness: item.sweetness,
}));

export function buildSeed(
  legacy: readonly SeedMenuItem[],
  scenarios: readonly SeedGuestScenario[],
): SeedPlan {
  const menu = [...legacy, ...SITE_ONLY_ITEMS];
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

    // Current titles, compositions and pairings from the restaurant's online menu (scripts/choiceqr/sync.ts)
    const site = CHOICEQR_ITEMS[m.id];
    const parsed = itemSchema.safeParse({
      legacyId: m.id,
      title: site?.title ?? m.title,
      anchor: m.anchor,
      ingredients: site?.ingredients ?? m.ingredients,
      sales: m.sales,
      interestingFact: optional(m.interestingFact),
      pairing: site?.pairing ?? optional(m.pairing),
      allergens: m.allergens ?? [],
      grapeVarieties: site?.grapeVarieties ?? optional(m.grapeVarieties),
      sweetness: site?.sweetness ?? optional(m.sweetness),
      tasteProfile: m.profile ?? null,
      producer: m.producer ?? null,
      isBestseller: m.isBestseller ?? false,
      isFinalist: m.isFinalist ?? false,
      isActive: true,
      sort,
      ...photo(m.id),
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
