import type { Category } from './types';

// Mirrors the seeded public.categories rows. Order = chip order in the UI.
export const CATEGORIES: readonly Category[] = [
  { slug: 'food', name: 'їжа', sort: 1 },
  { slug: 'wine', name: 'вино', sort: 2 },
  { slug: 'cocktails', name: 'коктейлі', sort: 3 },
  { slug: 'beer_soft', name: 'пиво', sort: 4 },
  { slug: 'spirits', name: 'міцні', sort: 5 },
];
