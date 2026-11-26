// Downloads the picked stock photos and writes the seed manifest.
//   npx tsx scripts/photos/download.ts <candidates.json> <picks.json>
// picks.json: { "<photo key>": pick } where pick is
//   2                 → candidate 2 of this key
//   ["scotch", 1]     → candidate 1 found for another key (downloaded as this key's own file)
//   "sparkling-wine"  → share that key's photo (no file of its own)
// Keys without a pick keep the placeholder.
// Output: public/demo-photos/{key}.webp (800×500, 16:10) and supabase/seed/stockPhotos.ts.
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { ITEM_PHOTO } from './queries';
import type { Candidate } from './search';

const OUT_DIR = 'public/demo-photos';
const MANIFEST = 'supabase/seed/stockPhotos.ts';

type Pick = number | string | [string, number];

// Wikimedia answers scripted requests for originals with 429, but serves its thumbnails;
// 960px is enough for an 800px crop.
function wikimediaThumb(url: string): string | null {
  const m = /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/(\w\/\w\w)\/([^/]+)$/.exec(url);
  return m ? `https://upload.wikimedia.org/wikipedia/commons/thumb/${m[1]}/${m[2]}/960px-${m[2]}` : null;
}

async function download(url: string): Promise<Buffer> {
  const thumb = wikimediaThumb(url);
  if (thumb) {
    try {
      return await fetchImage(thumb);
    } catch {
      // narrower than 960px: no such thumbnail, fall back to the original
    }
  }
  return fetchImage(url);
}

async function fetchImage(url: string): Promise<Buffer> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'vedmid-photo-script/1.0 (internal training app; one-off download)' },
      signal: AbortSignal.timeout(60_000),
    });
    if (res.ok) return Buffer.from(await res.arrayBuffer());
    if (attempt === 5 || (res.status !== 429 && res.status < 500))
      throw new Error(`HTTP ${res.status} for ${url}`);
    await new Promise((r) => setTimeout(r, attempt * 10_000));
  }
}

function licenseLabel(c: Candidate): string {
  if (c.license === 'pdm') return 'public domain';
  if (c.license === 'cc0') return 'CC0';
  return `CC ${c.license.toUpperCase()}${c.licenseVersion ? ` ${c.licenseVersion}` : ''}`;
}

async function main() {
  const [candidatesFile, picksFile] = process.argv.slice(2);
  if (!candidatesFile || !picksFile) throw new Error('usage: download.ts <candidates.json> <picks.json>');
  const candidates = JSON.parse(await readFile(candidatesFile, 'utf8')) as Record<string, Candidate[]>;
  const picks = JSON.parse(await readFile(picksFile, 'utf8')) as Record<string, Pick>;
  await mkdir(OUT_DIR, { recursive: true });

  const photos: Record<string, { text: string; url: string }> = {};
  const shared: Record<string, string> = {};
  for (const [key, pick] of Object.entries(picks).sort()) {
    if (typeof pick === 'string') {
      shared[key] = pick;
      continue;
    }
    const [from, index] = typeof pick === 'number' ? [key, pick] : pick;
    const c = candidates[from]?.[index];
    if (!c) throw new Error(`${key}: no candidate ${index} of ${from}`);
    const out = path.join(OUT_DIR, `${key}.webp`);
    if (!existsSync(out)) {
      await sharp(await download(c.url))
        .rotate()
        .resize(800, 500, { fit: 'cover', position: 'attention' })
        .webp({ quality: 70 })
        .toFile(out);
      await new Promise((r) => setTimeout(r, 1_000));
    }
    photos[key] = {
      text: `${c.creator?.trim() || 'автор невідомий'}, ${licenseLabel(c)}`,
      url: c.landingUrl,
    };
    console.log(`${key} ← ${c.url}`);
  }

  for (const [key, target] of Object.entries(shared)) {
    if (!photos[target]) throw new Error(`${key}: shares ${target}, which has no photo`);
  }
  const items = Object.fromEntries(
    Object.entries(ITEM_PHOTO)
      .map(([itemId, key]) => [itemId.replace(/^item-/, ''), shared[key] ?? key] as const)
      .filter(([, key]) => photos[key]),
  );
  const source = (await readFile(MANIFEST, 'utf8')).replace(
    /export const STOCK_PHOTOS[\s\S]*$/,
    `export const STOCK_PHOTOS: Record<string, StockPhoto> = ${JSON.stringify(photos, null, 2)};\n\n` +
      `/** Legacy item id → photo key. */\nexport const STOCK_PHOTO_ITEMS: Record<string, string> = ${JSON.stringify(items, null, 2)};\n`,
  );
  await writeFile(MANIFEST, source);
  console.log(`${Object.keys(photos).length} photos, ${Object.keys(items).length} items → ${MANIFEST}`);
}

await main();
