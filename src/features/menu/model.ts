import type { Tables } from '@/lib/db.types';
import { fromMenuItemRow, type MenuItemRow } from './mappers';
import { CATEGORIES } from './categories';
import type { Category, CategorySlug, MenuItem, Subcategory } from './types';

export interface MenuData {
  categories: Category[];
  subcategories: Subcategory[];
  /** Active items, ordered by subcategory then item sort */
  items: MenuItem[];
}

export interface MenuSection {
  subcategory: Subcategory;
  items: MenuItem[];
}

const SLUGS = new Set<string>(CATEGORIES.map((c) => c.slug));
const isSlug = (s: string): s is CategorySlug => SLUGS.has(s);

export function buildMenu(
  categoryRows: Pick<Tables<'categories'>, 'id' | 'slug' | 'name' | 'sort'>[],
  subcategoryRows: Pick<Tables<'subcategories'>, 'id' | 'category_id' | 'name' | 'sort'>[],
  itemRows: MenuItemRow[],
): MenuData {
  const slugById = new Map<number, CategorySlug>();
  const categories: Category[] = [];
  for (const c of [...categoryRows].sort((a, b) => a.sort - b.sort)) {
    if (!isSlug(c.slug)) continue;
    slugById.set(c.id, c.slug);
    categories.push({ slug: c.slug, name: c.name, sort: c.sort });
  }
  const catOrder = new Map(categories.map((c, i) => [c.slug, i]));

  const subcategories: Subcategory[] = subcategoryRows
    .filter((s) => slugById.has(s.category_id))
    .map((s) => ({ id: s.id, category: slugById.get(s.category_id)!, name: s.name, sort: s.sort }))
    .sort((a, b) => catOrder.get(a.category)! - catOrder.get(b.category)! || a.sort - b.sort || a.id - b.id);
  const subById = new Map(subcategories.map((s, i) => [s.id, { sub: s, order: i }]));

  const items = itemRows
    .filter((r) => r.is_active && subById.has(r.subcategory_id))
    .map((r) => fromMenuItemRow(r, subById.get(r.subcategory_id)!.sub))
    .sort(
      (a, b) =>
        subById.get(a.subcategoryId)!.order - subById.get(b.subcategoryId)!.order ||
        a.sort - b.sort ||
        a.title.localeCompare(b.title, 'uk'),
    );

  return { categories, subcategories, items };
}

/** Non-empty subcategories of a category, each with its items, in menu order. */
export function sectionsFor(menu: MenuData, category: CategorySlug): MenuSection[] {
  return menu.subcategories
    .filter((s) => s.category === category)
    .map((subcategory) => ({
      subcategory,
      items: menu.items.filter((i) => i.subcategoryId === subcategory.id),
    }))
    .filter((s) => s.items.length > 0);
}

/** Lowercase, drop apostrophes (' ’ ʼ `), collapse spaces. Ukrainian letters are kept as-is (є ≠ е, ї ≠ і). */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/['’ʼ`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function haystack(item: MenuItem): string {
  return normalize(
    [
      item.title,
      item.ingredients,
      item.allergens.join(' '),
      item.anchor,
      item.grapeVarieties ?? '',
      item.sweetness ?? '',
    ].join(' '),
  );
}

export const MIN_QUERY_LENGTH = 2;

/**
 * Every word of the query must appear somewhere in the item. Title matches rank first; otherwise menu order is kept.
 * Queries shorter than 2 characters return nothing (the caller shows the grouped menu instead).
 */
export function searchMenu(items: readonly MenuItem[], query: string): MenuItem[] {
  const q = normalize(query);
  if (q.length < MIN_QUERY_LENGTH) return [];
  const words = q.split(' ');
  const inTitle: MenuItem[] = [];
  const elsewhere: MenuItem[] = [];
  for (const item of items) {
    const text = haystack(item);
    if (!words.every((w) => text.includes(w))) continue;
    const title = normalize(item.title);
    (words.every((w) => title.includes(w)) ? inTitle : elsewhere).push(item);
  }
  return [...inTitle, ...elsewhere];
}

export type DetailTab = 'allergens' | 'grape' | 'ingredients' | 'profile' | 'pairing';

export const DETAIL_TAB_LABELS: Record<DetailTab, string> = {
  allergens: 'алергени',
  grape: 'сорт',
  ingredients: 'склад',
  profile: 'профіль',
  pairing: 'поєднання',
};

/**
 * Tabs shown on the item detail (DESIGN §5.2). Empty fields hide their tab, except pairing for food and wine,
 * which always shows (with an empty state) so managers notice it is missing.
 */
export function detailTabs(item: MenuItem): DetailTab[] {
  const tabs: DetailTab[] = [];
  if (item.category === 'wine') {
    if (item.grapeVarieties || item.sweetness || item.ingredients) tabs.push('grape');
  } else {
    if (item.allergens.length > 0) tabs.push('allergens');
    if (item.ingredients) tabs.push('ingredients');
  }
  if (item.tasteProfile && item.tasteProfile.labels.length > 0) tabs.push('profile');
  if (item.pairing || item.category === 'food' || item.category === 'wine') tabs.push('pairing');
  return tabs;
}

/** «оновлено 27.09.2026» */
export function formatUpdated(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit', year: 'numeric' });
}
