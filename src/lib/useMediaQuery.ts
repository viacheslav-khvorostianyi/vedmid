import { useCallback, useSyncExternalStore } from 'react';

export const DESKTOP_QUERY = '(min-width: 1024px)';

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    [query],
  );
  const getSnapshot = () => window.matchMedia(query).matches;
  // No window during SSR/prerender: default to the mobile layout.
  const getServerSnapshot = () => false;
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function useIsDesktop(): boolean {
  return useMediaQuery(DESKTOP_QUERY);
}
