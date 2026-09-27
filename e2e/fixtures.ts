import { test as base, type Page } from '@playwright/test';
import { buildFixtureRows, buildGuestRows } from '../supabase/seed/fixtureRows';

/** The real menu (197 items) as DB rows; item ids are `item-<legacy id>`. */
export const MENU_ROWS = buildFixtureRows();
export const GUEST_ROWS = buildGuestRows();

// Supabase is not running in e2e: we seed a session in localStorage and answer the HTTP calls the app makes.

const SUPABASE = 'http://127.0.0.1:54321';
// supabase-js default storage key: sb-<first label of the host>-auth-token
const STORAGE_KEY = 'sb-127-auth-token';
export const USER_ID = '00000000-0000-4000-8000-0000000000e2';

type Role = 'waiter' | 'manager';

function fakeJwt(sub: string) {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub, exp, role: 'authenticated', aud: 'authenticated' })}.sig`;
}

async function mockSupabase(page: Page, role: Role | null) {
  await page.route(`${SUPABASE}/rest/v1/profiles*`, (route) =>
    route.fulfill({
      json: { id: USER_ID, display_name: role === 'manager' ? 'Ірина Мельник' : 'Олена Коваль', role },
    }),
  );
  await page.route(`${SUPABASE}/rest/v1/rpc/**`, (route) =>
    route.fulfill({ json: [{ xp: 5, level: 1, streak: 1, max_streak: 1, new_achievements: [] }] }),
  );
  await page.route(`${SUPABASE}/rest/v1/card_progress*`, (route) => route.fulfill({ json: [] }));
  await page.route(`${SUPABASE}/rest/v1/player_stats*`, (route) => route.fulfill({ json: null }));
  await page.route(`${SUPABASE}/rest/v1/achievements*`, (route) => route.fulfill({ json: [] }));
  await page.route(`${SUPABASE}/rest/v1/guest_scenarios*`, (route) => route.fulfill({ json: GUEST_ROWS }));
  await page.route(`${SUPABASE}/rest/v1/categories*`, (route) =>
    route.fulfill({ json: MENU_ROWS.categories }),
  );
  await page.route(`${SUPABASE}/rest/v1/subcategories*`, (route) =>
    route.fulfill({ json: MENU_ROWS.subcategories }),
  );
  await page.route(`${SUPABASE}/rest/v1/menu_items*`, (route) => route.fulfill({ json: MENU_ROWS.items }));
  await page.route(`${SUPABASE}/auth/v1/logout*`, (route) => route.fulfill({ status: 204 }));
}

async function signIn(page: Page, role: Role) {
  const session = {
    access_token: fakeJwt(USER_ID),
    refresh_token: 'e2e-refresh',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: {
      id: USER_ID,
      aud: 'authenticated',
      role: 'authenticated',
      email: 'e2e@test.local',
      app_metadata: {},
      user_metadata: {},
    },
  };
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [STORAGE_KEY, JSON.stringify(session)],
  );
  await mockSupabase(page, role);
}

export const test = base.extend<{ asWaiter: Page; asManager: Page; signedOut: Page }>({
  asWaiter: async ({ page }, use) => {
    await signIn(page, 'waiter');
    await use(page);
  },
  asManager: async ({ page }, use) => {
    await signIn(page, 'manager');
    await use(page);
  },
  signedOut: async ({ page }, use) => {
    await mockSupabase(page, null);
    await use(page);
  },
});

export { expect } from '@playwright/test';
export { SUPABASE };
