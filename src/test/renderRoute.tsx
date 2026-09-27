import type { Session } from '@supabase/supabase-js';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { routes } from '@/app/router';
import { AuthContext, type AuthContextValue, type Profile, type StaffRole } from '@/features/auth/context';
import { progressKey } from '@/features/flashcards/hooks/useCardProgress';
import type { CardProgress } from '@/features/flashcards/leitner';
import { MENU_QUERY_KEY } from '@/features/menu/hooks/useMenu';
import type { GuestScenario } from '@/features/games/engines/guest';
import { GUEST_SCENARIOS_KEY } from '@/features/games/hooks/useGuestScenarios';
import { fromGuestRow } from '@/features/games/mappers';
import { ACHIEVEMENT_ROWS } from '../../supabase/seed/achievements';
import { buildGuestRows } from '../../supabase/seed/fixtureRows';
import { ACHIEVEMENTS_KEY, statsKey } from '@/features/progress/hooks';
import { EMPTY_STATS, fromAchievementRow } from '@/features/progress/mappers';
import type { Achievement, PlayerStats } from '@/features/progress/types';
import { ToastProvider } from '@/ui/Toast';
import { MENU_ROWS } from './menuFixture';

/** The seeded achievements, as the app sees them. */
export const ACHIEVEMENTS: Achievement[] = ACHIEVEMENT_ROWS.map(fromAchievementRow);

/** The 5 real guest scenarios, as the app loads them. */
export const GUEST_SCENARIOS: GuestScenario[] = buildGuestRows()
  .map(fromGuestRow)
  .filter((g) => g !== null);

export const TEST_USER_ID = '00000000-0000-4000-8000-000000000001';

export function signedIn(
  role: StaffRole = 'waiter',
  profile: Partial<Profile> | null = {},
): AuthContextValue {
  return {
    status: 'signedIn',
    session: { user: { id: TEST_USER_ID } } as Session,
    profile: profile && { id: TEST_USER_ID, displayName: 'Олена Коваль', role, ...profile },
    signOut: async () => {},
  };
}

export const signedOut: AuthContextValue = {
  status: 'signedOut',
  session: null,
  profile: null,
  signOut: async () => {},
};
export const loading: AuthContextValue = {
  status: 'loading',
  session: null,
  profile: null,
  signOut: async () => {},
};

/**
 * Renders the real route tree at `path` with a fake auth state and the real menu pre-cached (no network).
 * Pass `menu: null` to start with an empty cache.
 */
export function renderRoute(
  path: string,
  auth: AuthContextValue = signedIn(),
  options: {
    menu?: typeof MENU_ROWS | null;
    progress?: CardProgress[];
    stats?: PlayerStats;
    guest?: GuestScenario[];
  } = {},
) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  const menu = options.menu === undefined ? MENU_ROWS : options.menu;
  if (menu) client.setQueryData(MENU_QUERY_KEY, menu);
  client.setQueryData(progressKey(TEST_USER_ID), options.progress ?? []);
  client.setQueryData(statsKey(TEST_USER_ID), options.stats ?? EMPTY_STATS);
  client.setQueryData(ACHIEVEMENTS_KEY, ACHIEVEMENTS);
  client.setQueryData(GUEST_SCENARIOS_KEY, options.guest ?? GUEST_SCENARIOS);
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  const utils = render(
    <QueryClientProvider client={client}>
      <AuthContext.Provider value={auth}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
  return { router, client, ...utils };
}
