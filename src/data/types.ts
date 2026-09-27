// Shape of the legacy static menu files in this folder.
// These files are the seed source for Supabase (supabase/seed.ts) and must not be imported by app code.
// The app's domain type is `MenuItem` in src/features/menu/types.ts.
export type SeedCategory = 'Їжа' | 'Вино' | 'Коктейлі' | 'Безалкогольні & Пиво' | 'Міцні напої';

export interface SeedMenuItem {
  id: string;
  category: SeedCategory;
  subcategory: string;
  title: string;
  anchor: string;
  ingredients: string;
  sales: string;
  profile?: {
    labels: string[];
    values: number[];
  };
  interestingFact?: string;
  pairing?: string;
  allergens?: string[];
  grapeVarieties?: string;
  sweetness?: string;
  producer?: {
    uniqueness: string;
    facilities: string;
    rawMaterials: string;
  };
  isBestseller?: boolean;
  isFinalist?: boolean;
}
