// Seeds subcategories, menu items and guest scenarios from the legacy static data (idempotent upserts).
//   npm run db:seed              → writes to SUPABASE_URL with SUPABASE_SERVICE_ROLE_KEY from .env.seed
//   npm run db:seed -- --dry-run → validates and prints counts, writes nothing
//   npm run db:seed -- --overwrite → also resets existing rows to the static data (discards manager edits)
import { createClient } from '@supabase/supabase-js';
import { existsSync } from 'node:fs';
import { menuData } from '../src/data/menuData';
import type { Database } from '../src/lib/db.types';
import { buildSeed } from './seed/buildSeed';
import { guestScenarios } from './seed/guestScenarios';
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
