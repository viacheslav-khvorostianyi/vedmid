import { useSearchParams } from 'react-router';
import { CATEGORIES } from '@/features/menu/categories';
import type { CategorySlug } from '@/features/menu/types';

export type CardsFilter = CategorySlug | 'all';

export const FILTER_OPTIONS: readonly { value: CardsFilter; label: string }[] = [
  { value: 'all', label: 'усі' },
  ...CATEGORIES.map((c) => ({ value: c.slug, label: c.name })),
];

/** ?c= on /cards. Defaults to food, as in the PDF. */
export function useCardsFilter() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('c');
  const filter: CardsFilter = FILTER_OPTIONS.some((o) => o.value === raw) ? (raw as CardsFilter) : 'food';
  const setFilter = (next: CardsFilter) => setParams({ c: next }, { replace: true });
  return { filter, setFilter };
}
