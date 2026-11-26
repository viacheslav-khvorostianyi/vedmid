// Seeds subcategories, menu items and guest scenarios from the legacy static data (idempotent upserts).
//   npm run db:seed              → writes to SUPABASE_URL with SUPABASE_SERVICE_ROLE_KEY from .env.seed
//   npm run db:seed -- --dry-run → validates and prints counts, writes nothing
//   npm run db:seed -- --overwrite → also resets existing rows to the static data (discards manager edits)
// Stock photos (public/demo-photos) are uploaded to dish-photos/stock/ and set on items that have no photo.
import { createClient } from '@supabase/supabase-js';
import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { menuData } from '../src/data/menuData';
import type { Database } from '../src/lib/db.types';
import { buildSeed, stockPhotoPath } from './seed/buildSeed';
import { guestScenarios } from './seed/guestScenarios';
import { STOCK_PHOTO_ITEMS, STOCK_PHOTOS } from './seed/stockPhotos';
import { writeSeed, type SeedMode, type SeedWriter } from './seed/writeSeed';

const plan = buildSeed(menuData, guestScenarios);

const byCategory = Object.entries(
  plan.items.reduce<Record<string, number>>((acc, item) => {
    const cat = item.subcategoryKey.split(':')[0];
    acc[cat] = (acc[cat] ?? 0) + 1;
    return acc;
  }, {}),
);
console.log(
  `Validated ${plan.items.length} items in ${plan.subcategories.length} subcategories, ${plan.guestScenarios.length} guest scenarios.`,
);
console.log('Items per category id:', Object.fromEntries(byCategory));

const photoKeys = Object.keys(STOCK_PHOTOS);
const missingPhotos = photoKeys.filter((key) => !existsSync(`public/demo-photos/${key}.webp`));
if (missingPhotos.length) {
  console.error(`Missing stock photo files in public/demo-photos: ${missingPhotos.join(', ')}`);
  process.exit(1);
}
console.log(`Stock photos: ${photoKeys.length} files for ${Object.keys(STOCK_PHOTO_ITEMS).length} items.`);

if (process.argv.includes('--dry-run')) process.exit(0);

if (existsSync('.env.seed')) process.loadEnvFile('.env.seed');
const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.seed (see .env.example).');
  process.exit(1);
}

const supabase = createClient<Database>(url, serviceKey, { auth: { persistSession: false } });

const mode: SeedMode = process.argv.includes('--overwrite') ? 'overwrite' : 'insert-missing';

const writer: SeedWriter = {
  async upsertSubcategories(rows, mode) {
    const { error } = await supabase
      .from('subcategories')
      .upsert(rows, { onConflict: 'category_id,name', ignoreDuplicates: mode === 'insert-missing' });
    if (error) throw error;
    const { data, error: readError } = await supabase.from('subcategories').select('id, category_id, name');
    if (readError) throw readError;
    return data;
  },
  async upsertMenuItems(rows, mode) {
    const { error } = await supabase
      .from('menu_items')
      .upsert(rows, { onConflict: 'legacy_id', ignoreDuplicates: mode === 'insert-missing' });
    if (error) throw error;
  },
  async upsertGuestScenarios(rows, mode) {
    const { error } = await supabase
      .from('guest_scenarios')
      .upsert(rows, { onConflict: 'id', ignoreDuplicates: mode === 'insert-missing' });
    if (error) throw error;
  },
};

const written = await writeSeed(plan, writer, mode);
console.log('Seeded:', written);

// Upload before pointing rows at the files. insert-missing keeps objects that are already there.
for (const key of photoKeys) {
  const body = await readFile(`public/demo-photos/${key}.webp`);
  const { error } = await supabase.storage
    .from('dish-photos')
    .upload(stockPhotoPath(key), body, { contentType: 'image/webp', upsert: mode === 'overwrite' });
  if (error && !/exists/i.test(error.message)) throw error;
}
// insert-missing skipped existing rows, so give the stock photo to items that still have none.
let photosSet = 0;
for (const key of photoKeys) {
  const ids = Object.entries(STOCK_PHOTO_ITEMS)
    .filter(([, k]) => k === key)
    .map(([legacyId]) => legacyId);
  const { data, error } = await supabase
    .from('menu_items')
    .update({ photo_path: stockPhotoPath(key), photo_credit: { ...STOCK_PHOTOS[key] } })
    .in('legacy_id', ids)
    .is('photo_path', null)
    .select('id');
  if (error) throw error;
  photosSet += data.length;
}
console.log(`Stock photos: ${photoKeys.length} uploaded, ${photosSet} items without a photo got one.`);
