// Turns a venue's public expz.menu menu (static JSON cache) into seed items.
// Pure, so scripts/expz/sync.ts and the tests share it.
import { z } from 'zod';
import type { SeedCategory, SeedMenuItem } from '../../src/data/types';
import { tidy } from './choiceqrParse';

const named = z.object({ id: z.number(), name: z.string() });

export const expzMenuSchema = z.object({
  categories: z.array(named.extend({ menuId: z.number() })),
  allergens: z.array(named),
  dishes: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      description: z.string().nullish(),
      imageUrl: z.string().nullish(),
      categoryId: z.number(),
      allergens: z.array(z.number()).nullish(),
      active: z.boolean().optional(),
    }),
  ),
});
export type ExpzMenu = z.infer<typeof expzMenuSchema>;

/** Site category name → where it goes in the app, or `null` for sections that aren't food or drink (the shop). */
export type ExpzPlacement = Record<string, [SeedCategory, string] | null>;

export interface ExpzItem extends SeedMenuItem {
  photoUrl?: string;
}

// Emoji and the variation selectors / joiners that come with them
const EMOJI = /\p{Extended_Pictographic}|[\u{1F1E6}-\u{1F1FF}]|\u{FE0F}|\u{200D}/gu;
const SWEETNESS_SUFFIX = /,\s*(сухе|напівсухе|напівсолодке|солодке|брют)\s*$/i;

export const stripEmoji = (text: string) => text.replace(EMOJI, '');

/** «<p>Бітер Aperol,&nbsp;горілка</p><p><br></p>» → «Бітер Aperol, горілка». Paragraphs become lines. */
export function htmlToText(html: string): string {
  const text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
  return tidy(stripEmoji(text)).replace(/\n{2,}/g, '\n');
}

/** «🥐 масляний круасан ✨» → «Масляний круасан»; a wine's «…, сухе» moves to sweetness. */
export function expzTitle(raw: string): { title: string; sweetness?: string } {
  const title = tidy(stripEmoji(raw)).replace(/\s{2,}/g, ' ');
  const sweet = SWEETNESS_SUFFIX.exec(title);
  const base = sweet ? title.slice(0, sweet.index) : title;
  const capital = base.charAt(0).toLocaleUpperCase('uk') + base.slice(1);
  return sweet ? { title: capital, sweetness: sweet[1]!.toLowerCase() } : { title: capital };
}

/**
 * Maps the menu to seed items with ids `${prefix}-${dishId}`, in the order of the placement table (the site's own
 * order is arbitrary). A dish listed in two sections (a cake by the slice and whole) is added once, from the
 * earlier section. `skipTitle` drops non-dishes inside a section. Returns the site categories with no placement
 * so the sync can stop on them.
 */
export function parseExpzMenu(
  menu: ExpzMenu,
  placement: ExpzPlacement,
  prefix: string,
  skipTitle?: RegExp,
): { items: ExpzItem[]; unplaced: string[] } {
  const categories = new Map(menu.categories.map((c) => [c.id, tidy(stripEmoji(c.name))]));
  const allergens = new Map(menu.allergens.map((a) => [a.id, a.name.toLowerCase()]));
  const seen = new Set<string>();
  const unplaced = new Set<string>();
  const items: ExpzItem[] = [];

  const order = Object.keys(placement);
  const rank = (dish: ExpzMenu['dishes'][number]) => {
    const i = order.indexOf(categories.get(dish.categoryId) ?? '');
    return i === -1 ? order.length : i;
  };
  for (const dish of [...menu.dishes].sort((a, b) => rank(a) - rank(b))) {
    if (dish.active === false) continue;
    const categoryName = categories.get(dish.categoryId) ?? '';
    const place = placement[categoryName];
    if (place === null) continue;
    if (!place) {
      unplaced.add(categoryName);
      continue;
    }
    const { title, sweetness } = expzTitle(dish.title);
    if (skipTitle?.test(title)) continue;
    const key = title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    items.push({
      id: `${prefix}-${dish.id}`,
      category: place[0],
      subcategory: place[1],
      title,
      anchor: '',
      ingredients: htmlToText(dish.description ?? ''),
      sales: '',
      allergens: (dish.allergens ?? []).flatMap((id) => allergens.get(id) ?? []),
      ...(sweetness ? { sweetness } : {}),
      ...(dish.imageUrl ? { photoUrl: dish.imageUrl } : {}),
    });
  }
  return { items, unplaced: [...unplaced] };
}
