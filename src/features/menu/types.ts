// Domain types for the menu. Mirrors public.menu_items (supabase/migrations/0001_init.sql)
// in camelCase; rows are mapped in features/menu/api.ts.

export type CategorySlug = 'food' | 'wine' | 'cocktails' | 'beer_soft' | 'spirits';

export interface Category {
  slug: CategorySlug;
  /** Chip label, e.g. «їжа» */
  name: string;
  sort: number;
}

export interface Subcategory {
  id: number;
  category: CategorySlug;
  name: string;
  sort: number;
}

export interface TasteProfile {
  labels: string[];
  /** 0 (none) to 3 per label */
  values: number[];
}

export interface Producer {
  uniqueness: string;
  facilities: string;
  rawMaterials: string;
}

export interface MenuItem {
  id: string;
  legacyId: string | null;
  category: CategorySlug;
  subcategoryId: number;
  subcategory: string;
  title: string;
  anchor: string;
  ingredients: string;
  sales: string;
  interestingFact: string | null;
  pairing: string | null;
  allergens: string[];
  grapeVarieties: string | null;
  sweetness: string | null;
  tasteProfile: TasteProfile | null;
  producer: Producer | null;
  isBestseller: boolean;
  isFinalist: boolean;
  photoPath: string | null;
  sort: number;
  isActive: boolean;
  updatedAt: string;
}
