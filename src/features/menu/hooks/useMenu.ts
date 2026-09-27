import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchMenu } from '../api';
import { buildMenu, searchMenu, sectionsFor } from '../model';
import type { CategorySlug } from '../types';

export const MENU_QUERY_KEY = ['menu'] as const;

type MenuRows = Awaited<ReturnType<typeof fetchMenu>>;
// Stable reference so TanStack Query memoizes the built menu between renders.
const selectMenu = (rows: MenuRows) => buildMenu(rows.categories, rows.subcategories, rows.items);

/** Whole active menu, cached and persisted (works offline). Refreshed at most every 10 minutes. */
export function useMenu() {
  return useQuery({
    queryKey: MENU_QUERY_KEY,
    queryFn: fetchMenu,
    select: selectMenu,
    staleTime: 10 * 60_000,
  });
}

export function useMenuSections(category: CategorySlug) {
  const menu = useMenu();
  const sections = useMemo(() => (menu.data ? sectionsFor(menu.data, category) : []), [menu.data, category]);
  return { ...menu, sections };
}

export function useItem(id: string | undefined) {
  const menu = useMenu();
  const item = useMemo(() => menu.data?.items.find((i) => i.id === id), [menu.data, id]);
  return { ...menu, item };
}

export function useMenuSearch(query: string) {
  const menu = useMenu();
  const results = useMemo(() => (menu.data ? searchMenu(menu.data.items, query) : []), [menu.data, query]);
  return { ...menu, results };
}
