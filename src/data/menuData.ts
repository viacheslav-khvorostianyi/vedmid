import type { SeedMenuItem } from './types';
import { foodData } from './foodData';
import { wineData } from './wineData';
import { cocktailData } from './cocktailData';
import { barData } from './barData';
import { spiritData } from './spiritData';

// Combine all menu items into one single array
export const menuData: SeedMenuItem[] = [
  ...foodData,
  ...wineData,
  ...cocktailData,
  ...barData,
  ...spiritData
];
