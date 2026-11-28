// The restaurants the demo can show. Demo only: the real app serves one restaurant (multi-tenancy is out of v1).
import { menuData } from '../../src/data/menuData';
import type { SeedMenuItem } from '../../src/data/types';
import { CATEGORIES } from '../../src/features/menu/categories';
import type { CategorySlug } from '../../src/features/menu/types';
import { LIS_SOURCE, type SeedSource } from './buildSeed';
import { DELIKACIA_ITEMS, DELIKACIA_PHOTO_IDS } from './restaurants/delikaciaMenu';

export type RestaurantId = 'lis' | 'delikacia';

export interface Restaurant {
  id: RestaurantId;
  /** Full name, e.g. for the lockup's accessible label */
  name: string;
  /** The wordmark in the brand lockup */
  lockup: string;
  /** Chip labels of the five categories */
  tabLabels: Record<CategorySlug, string>;
  menu: () => readonly SeedMenuItem[];
  source: SeedSource;
}

const DEFAULT_LABELS = Object.fromEntries(CATEGORIES.map((c) => [c.slug, c.name])) as Record<
  CategorySlug,
  string
>;

export const RESTAURANTS: Record<RestaurantId, Restaurant> = {
  lis: {
    id: 'lis',
    name: 'Просто ЛІС',
    lockup: 'ПРОСТО ЛІС',
    tabLabels: DEFAULT_LABELS,
    menu: () => menuData,
    source: LIS_SOURCE,
  },
  // A café-bakery in Ivano-Frankivsk, from expz.menu (scripts/expz/sync.ts)
  delikacia: {
    id: 'delikacia',
    name: 'Delikacia',
    lockup: 'DELIKACIA',
    tabLabels: { ...DEFAULT_LABELS, beer_soft: 'кава й чай' },
    menu: () => DELIKACIA_ITEMS,
    source: {
      extraItems: [],
      overlay: {},
      ownPhotos: new Set(DELIKACIA_PHOTO_IDS),
      ownPhotoPath: (id) => `delikacia/${id}.webp`,
      stockPhotos: {},
    },
  },
};

export const RESTAURANT_IDS = Object.keys(RESTAURANTS) as RestaurantId[];
export const isRestaurantId = (value: unknown): value is RestaurantId =>
  typeof value === 'string' && value in RESTAURANTS;
