import type { MenuItemInput } from '@/features/manager/schema';
import type { Json, Tables, TablesInsert } from '@/lib/db.types';
import type { CategorySlug, MenuItem, Producer, TasteProfile } from './types';

// The only place where menu DB rows (snake_case) are mapped to domain types (camelCase).
// Pure (no Supabase client), so the seed script and e2e fixtures can use it in Node.

export type MenuItemRow = Tables<'menu_items'>;

export function fromMenuItemRow(
  row: MenuItemRow,
  subcategory: { name: string; category: CategorySlug },
): MenuItem {
  return {
    id: row.id,
    legacyId: row.legacy_id,
    category: subcategory.category,
    subcategoryId: row.subcategory_id,
    subcategory: subcategory.name,
    title: row.title,
    anchor: row.anchor,
    ingredients: row.ingredients,
    sales: row.sales,
    interestingFact: row.interesting_fact,
    pairing: row.pairing,
    allergens: row.allergens,
    grapeVarieties: row.grape_varieties,
    sweetness: row.sweetness,
    tasteProfile: row.taste_profile as TasteProfile | null,
    producer: row.producer as Producer | null,
    isBestseller: row.is_bestseller,
    isFinalist: row.is_finalist,
    photoPath: row.photo_path,
    sort: row.sort,
    isActive: row.is_active,
    updatedAt: row.updated_at,
  };
}

export function toMenuItemRow(input: MenuItemInput): TablesInsert<'menu_items'> {
  return {
    legacy_id: input.legacyId,
    subcategory_id: input.subcategoryId,
    title: input.title,
    anchor: input.anchor,
    ingredients: input.ingredients,
    sales: input.sales,
    interesting_fact: input.interestingFact,
    pairing: input.pairing,
    allergens: input.allergens,
    grape_varieties: input.grapeVarieties,
    sweetness: input.sweetness,
    taste_profile: input.tasteProfile as Json | null,
    producer: input.producer as Json | null,
    is_bestseller: input.isBestseller,
    is_finalist: input.isFinalist,
    is_active: input.isActive,
    sort: input.sort,
    photo_path: input.photoPath,
  };
}
