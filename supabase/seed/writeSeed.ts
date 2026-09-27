import { toMenuItemRow } from '../../src/features/menu/mappers';
import type { TablesInsert } from '../../src/lib/db.types';
import type { SeedPlan } from './buildSeed';

/**
 * `insert-missing` (default) never touches existing rows, so re-running the seed keeps managers' edits
 * and changes 0 rows. `overwrite` resets existing rows to the static data.
 */
export type SeedMode = 'insert-missing' | 'overwrite';

/** Storage-specific operations; implemented with supabase-js (seed.ts) and with PGlite (tests). */
export interface SeedWriter {
  /** Keyed on (category_id, name); returns id + key of every subcategory in the database afterwards. */
  upsertSubcategories(
    rows: TablesInsert<'subcategories'>[],
    mode: SeedMode,
  ): Promise<{ id: number; category_id: number; name: string }[]>;
  /** Keyed on legacy_id. */
  upsertMenuItems(rows: TablesInsert<'menu_items'>[], mode: SeedMode): Promise<void>;
  /** Keyed on id. */
  upsertGuestScenarios(rows: TablesInsert<'guest_scenarios'>[], mode: SeedMode): Promise<void>;
}

export async function writeSeed(plan: SeedPlan, writer: SeedWriter, mode: SeedMode = 'insert-missing') {
  const subs = await writer.upsertSubcategories(
    plan.subcategories.map((s) => ({ category_id: s.categoryId, name: s.name, sort: s.sort })),
    mode,
  );
  const idByKey = new Map(subs.map((s) => [`${s.category_id}:${s.name}`, s.id]));

  const rows = plan.items.map(({ subcategoryKey, input }) => {
    const subcategoryId = idByKey.get(subcategoryKey);
    if (!subcategoryId) throw new Error(`Subcategory ${subcategoryKey} was not upserted`);
    return toMenuItemRow({ ...input, subcategoryId });
  });
  await writer.upsertMenuItems(rows, mode);
  await writer.upsertGuestScenarios(plan.guestScenarios, mode);

  return {
    subcategories: plan.subcategories.length,
    items: rows.length,
    guestScenarios: plan.guestScenarios.length,
  };
}
