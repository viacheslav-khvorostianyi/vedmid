import { useMemo, useState } from 'react';
import { useMenu } from '@/features/menu/hooks/useMenu';
import { useCardProgress } from './useCardProgress';
import { useCardsFilter, type CardsFilter } from './useCardsFilter';

/** Everything both card layouts need around a session: filter, items, progress, and a key to restart. */
export function useCardsScreen() {
  const { filter, setFilter } = useCardsFilter();
  const menu = useMenu();
  const progress = useCardProgress();
  const [run, setRun] = useState({ n: 0, practiceAll: false });

  const items = useMemo(
    () =>
      menu.data
        ? filter === 'all'
          ? menu.data.items
          : menu.data.items.filter((i) => i.category === filter)
        : [],
    [menu.data, filter],
  );

  return {
    filter,
    setFilter: (next: CardsFilter) => {
      setRun({ n: run.n + 1, practiceAll: false });
      setFilter(next);
    },
    items,
    // Without saved progress (e.g. offline on first run) every card counts as new.
    progress: progress.data ?? [],
    ready: !!menu.data && (progress.isSuccess || progress.isError || progress.fetchStatus === 'idle'),
    failed: menu.isError && !menu.data,
    retry: () => menu.refetch(),
    practiceAll: run.practiceAll,
    sessionKey: `${filter}:${run.n}`,
    startPracticeAll: () => setRun({ n: run.n + 1, practiceAll: true }),
  };
}
