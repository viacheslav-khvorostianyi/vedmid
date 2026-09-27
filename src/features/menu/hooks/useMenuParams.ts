import { useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { CATEGORIES } from '../categories';
import type { CategorySlug } from '../types';

const isSlug = (v: string | null): v is CategorySlug => CATEGORIES.some((c) => c.slug === v);

/**
 * Menu list state lives in the URL (?c=wine&q=сухе&s=12) so back navigation and deep links restore it.
 * Updates replace the history entry: typing in search must not add a step per keystroke.
 */
export function useMenuParams() {
  const [params, setParams] = useSearchParams();
  const c = params.get('c');
  const s = Number(params.get('s'));

  const update = useCallback(
    (changes: Record<string, string | null>) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(changes)) {
            if (v) next.set(k, v);
            else next.delete(k);
          }
          return next;
        },
        // flushSync: the search box is controlled by the URL, so the update must land before the next keystroke.
        { replace: true, preventScrollReset: true, flushSync: true },
      ),
    [setParams],
  );

  return {
    category: isSlug(c) ? c : null,
    query: params.get('q') ?? '',
    subcategoryId: Number.isInteger(s) && s > 0 ? s : null,
    search: params.toString() ? `?${params.toString()}` : '',
    setCategory: (slug: CategorySlug) => update({ c: slug, q: null, s: null }),
    setQuery: (q: string) => update({ q: q || null }),
    setSubcategory: (id: number) => update({ s: String(id), q: null }),
  };
}
