// Pulls titles, descriptions and photos from the restaurant's public menu into the seed.
//   npx tsx scripts/choiceqr/sync.ts [--refresh-photos] [--report <file.md>]
// Writes supabase/seed/choiceqrMenu.ts and public/demo-photos/own/{legacyId}.webp:
// - items in mapping.ts get the site's title, composition, pairing and photo; anchor, sales phrase, fact,
//   allergens, taste profile and producer stay ours;
// - items only on the site are added (id `cq-<slug>`, placed by additions.ts) with empty training fields
//   for managers to fill in. A product listed twice (per glass and per bottle) is added once.
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { menuData } from '../../src/data/menuData';
import type { SeedMenuItem } from '../../src/data/types';
import type { ChoiceqrItem, ChoiceqrNewItem } from '../../supabase/seed/choiceqrMenu';
import {
  cleanTitle,
  isRenamed,
  listingKeys,
  listingTitle,
  parseDescription,
  pickIngredients,
} from '../../supabase/seed/choiceqrParse';
import { SYNC_HEADERS as HEADERS, savePhoto } from '../lib/photos';
import { SITE_CATEGORIES } from './additions';
import { CHOICEQR_MAPPING } from './mapping';

const ORIGIN = 'https://lis-resto.choiceqr.com';
const SECTIONS = ['menyu-684', 'napoyi', 'bar', 'vinna-karta', 'micniy-alkogol'];
const PHOTO_DIR = 'public/demo-photos/own';
const MANIFEST = 'supabase/seed/choiceqrMenu.ts';
// The site's names for these are reformatted brand names («REBREW TOLOKA», «Вино ігристе …»);
// our titles also carry the region, so they stay.
const KEEP_TITLE = /^(wine|sp|beer|cider)-/;

interface SiteMedia {
  big?: string;
  webp?: { big?: string };
}
interface SiteItem {
  hurl: string;
  name: string;
  description: string;
  media: SiteMedia[] | null;
  category: string;
}
interface Listing extends SiteItem {
  section: string;
  categoryName: string;
}

async function fetchSection(section: string): Promise<Listing[]> {
  const res = await fetch(`${ORIGIN}/section:${section}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`${section}: HTTP ${res.status}`);
  const html = await res.text();
  const json = /<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/.exec(html)?.[1];
  if (!json) throw new Error(`${section}: no __NEXT_DATA__ (the site changed its markup)`);
  const app = (
    JSON.parse(json) as {
      props?: { app?: { menu?: SiteItem[]; categories?: { _id: string; name: string }[] } };
    }
  ).props?.app;
  if (!Array.isArray(app?.menu) || !Array.isArray(app.categories))
    throw new Error(`${section}: no props.app.menu (the site changed its data shape)`);
  const names = new Map(app.categories.map((c) => [c._id, tidyCategory(c.name)]));
  return app.menu.map((item) => ({ ...item, section, categoryName: names.get(item.category) ?? '' }));
}

const tidyCategory = (name: string) => name.replace(/\s+/g, ' ').trim();
const photoOf = (s: SiteItem) => s.media?.[0]?.webp?.big ?? s.media?.[0]?.big;
const isWineListing = (s: Listing) => s.section === 'vinna-karta';

function changes(before: SeedMenuItem, after: ChoiceqrItem): string[] {
  const fields = ['title', 'ingredients', 'pairing', 'grapeVarieties', 'sweetness'] as const;
  return fields
    .filter((f) => after[f] !== undefined && after[f] !== (before[f] ?? undefined))
    .map((f) => `  - **${f}**: «${before[f] ?? '—'}» → «${after[f]}»`);
}

async function main() {
  const args = process.argv.slice(2);
  const refresh = args.includes('--refresh-photos');
  const reportFile = args.includes('--report') ? args[args.indexOf('--report') + 1] : undefined;

  const site = new Map<string, Listing>();
  for (const section of SECTIONS) for (const item of await fetchSection(section)) site.set(item.hurl, item);
  const missing = Object.entries(CHOICEQR_MAPPING).filter(([, slug]) => !site.has(slug));
  if (missing.length) {
    throw new Error(
      `Mapped items no longer on the site, update mapping.ts: ${missing.map(([id]) => id).join(', ')}`,
    );
  }

  await mkdir(PHOTO_DIR, { recursive: true });
  const legacy = new Map(menuData.map((m) => [m.id, m]));
  const items: Record<string, ChoiceqrItem> = {};
  const report: string[] = [];
  for (const [id, slug] of Object.entries(CHOICEQR_MAPPING)) {
    const s = site.get(slug)!;
    const parsed = parseDescription(s.description, id.startsWith('wine-') ? 'wine' : 'other');
    const photoUrl = photoOf(s);
    const file = `${PHOTO_DIR}/${id}.webp`;
    if (photoUrl && (refresh || !existsSync(file))) await savePhoto(photoUrl, file);
    const before = legacy.get(id);
    if (!before) throw new Error(`${id}: not in src/data (mapping.ts is out of date)`);
    const ingredients = pickIngredients(
      before.ingredients,
      parsed.ingredients,
      !KEEP_TITLE.test(id) && isRenamed(before.title, s.name),
    );
    const item: ChoiceqrItem = {
      slug,
      ...(KEEP_TITLE.test(id) ? {} : { title: cleanTitle(s.name) }),
      ...parsed,
      ingredients,
      photo: Boolean(photoUrl),
    };
    items[id] = item;
    const diff = changes(before, item);
    if (diff.length) report.push(`- \`${id}\` ${before.title}\n${diff.join('\n')}`);
  }

  // Items only on the site. Skip twins of what we already have and list each product once.
  const known = new Set(
    Object.values(CHOICEQR_MAPPING).flatMap((slug) => {
      const s = site.get(slug)!;
      return listingKeys(s.name, s.description, isWineListing(s));
    }),
  );
  const added: ChoiceqrNewItem[] = [];
  const unplaced = new Set<string>();
  const listings = [...site.values()].sort((a, b) => Number(!!photoOf(b)) - Number(!!photoOf(a)));
  for (const s of listings) {
    const keys = listingKeys(s.name, s.description, isWineListing(s));
    if (keys.some((k) => known.has(k))) continue;
    keys.forEach((k) => known.add(k));
    const place = SITE_CATEGORIES[s.categoryName];
    if (!place) {
      unplaced.add(s.categoryName);
      continue;
    }
    // the site shows «Класичний» under «Молочні коктейлі»; in our list it needs the full name
    const title =
      s.categoryName === 'Молочні коктейлі'
        ? `Молочний коктейль ${listingTitle(s.name)}`
        : listingTitle(s.name);
    // «Mova White non-alcohol» sits with the craft beer on the site; ours has a non-alcoholic shelf
    const subcategory =
      place[1] === 'Крафтове пиво' && /non.?alcohol|безалкоголь/i.test(title) ? 'Б/А пиво' : place[1];
    const id = `cq-${s.hurl}`;
    const photoUrl = photoOf(s);
    const file = `${PHOTO_DIR}/${id}.webp`;
    if (photoUrl && (refresh || !existsSync(file))) await savePhoto(photoUrl, file);
    added.push({
      id,
      slug: s.hurl,
      category: place[0],
      subcategory,
      title,
      ...parseDescription(s.description, isWineListing(s) ? 'wine' : 'other'),
      photo: Boolean(photoUrl),
    });
  }
  if (unplaced.size) {
    throw new Error(
      `Site categories with no place in the app, add them to additions.ts: ${[...unplaced].join(', ')}`,
    );
  }
  added.sort((a, b) => a.id.localeCompare(b.id));
  report.push(
    '',
    `## Added from the site (${added.length})`,
    ...added.map(
      (i) => `- \`${i.id}\` ${i.title} → ${i.category} / ${i.subcategory}${i.photo ? '' : ' (no photo)'}`,
    ),
  );

  const today = new Date().toISOString().slice(0, 10);
  await writeFile(
    MANIFEST,
    `// Generated by scripts/choiceqr/sync.ts from ${ORIGIN} — do not edit by hand.\n` +
      `// Applied by supabase/seed/buildSeed.ts. Photos: public/demo-photos/own/{id}.webp.\n` +
      `import type { SeedCategory } from '../../src/data/types';\n\n` +
      `export interface ChoiceqrItem {\n  /** item slug on the site */\n  slug: string;\n  title?: string;\n  ingredients?: string;\n` +
      `  pairing?: string;\n  grapeVarieties?: string;\n  sweetness?: string;\n  /** the restaurant's own photo exists */\n  photo: boolean;\n}\n\n` +
      `/** An item only on the site; training fields (anchor, sales, fact, allergens) start empty. */\n` +
      `export interface ChoiceqrNewItem extends ChoiceqrItem {\n  /** legacy id, \`cq-<slug>\` */\n  id: string;\n` +
      `  category: SeedCategory;\n  subcategory: string;\n  title: string;\n}\n\n` +
      `export const CHOICEQR_SYNCED_AT = '${today}';\n\n` +
      `/** Legacy item id → fields taken from the restaurant's menu. */\n` +
      `export const CHOICEQR_ITEMS: Record<string, ChoiceqrItem> = ${JSON.stringify(items, null, 2)};\n\n` +
      `/** Items only on the site, added to the seed after the legacy menu. */\n` +
      `export const CHOICEQR_NEW_ITEMS: ChoiceqrNewItem[] = ${JSON.stringify(added, null, 2)};\n`,
  );
  if (reportFile)
    await writeFile(reportFile, `# Menu changes from ${ORIGIN} (${today})\n\n${report.join('\n')}\n`);
  const withPhoto = Object.values(items).filter((i) => i.photo).length;
  console.log(
    `${Object.keys(items).length} items synced (${withPhoto} with photos), ${added.length} added → ${MANIFEST}`,
  );
}

await main();
