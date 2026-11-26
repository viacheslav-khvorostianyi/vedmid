import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { setupServer } from 'msw/node';
import { fetchProfile } from '@/features/auth/api';
import { fetchCardProgress } from '@/features/flashcards/api';
import { fetchGuestScenarios } from '@/features/games/api';
import { fetchMenu } from '@/features/menu/api';
import { photoUrl } from '@/lib/storage';
import { buildMenu } from '@/features/menu/model';
import { fetchAchievements, fetchStats } from '@/features/progress/api';
import type { StaffRole } from '@/features/auth/context';
import { callOrQueue } from '@/lib/rpc';
import { supabase } from '@/lib/supabase';
import { createDemoHandlers } from './handlers';
import { emptyState, type DemoState } from './server';
import { DEMO_USER_ID } from './session';

// The app's real data functions and supabase-js, answered by the demo handlers.
let state: DemoState = emptyState();
let role: StaffRole = 'waiter';
// Stands in for the demo build's static files: photo requests bypass the mocks, so they need a real server.
let photoBase = '';
const staticFiles: Server = createServer((req, res) => {
  if (req.url === '/demo-photos/stock/borscht.webp') res.writeHead(200).end('stock-bytes');
  else if (req.url === '/demo-photos/own/soup-1.webp') res.writeHead(200).end('own-bytes');
  else res.writeHead(404).end();
});
const server = setupServer(
  ...createDemoHandlers({
    url: import.meta.env.VITE_SUPABASE_URL,
    getState: () => state,
    setState: (s) => (state = s),
    getRole: () => role,
    get photoBase() {
      return photoBase;
    },
  }),
);

beforeAll(async () => {
  await new Promise<void>((resolve) => staticFiles.listen(0, '127.0.0.1', resolve));
  photoBase = `http://127.0.0.1:${(staticFiles.address() as AddressInfo).port}/demo-photos/`;
  server.listen({ onUnhandledRequest: 'error' });
});
beforeEach(() => {
  state = emptyState();
  role = 'waiter';
});
afterAll(() => {
  server.close();
  staticFiles.close();
});

describe('demo handlers', () => {
  it('serve the full menu, guest scenarios and achievements', async () => {
    const rows = await fetchMenu();
    expect(buildMenu(rows.categories, rows.subcategories, rows.items).items).toHaveLength(197);
    expect(await fetchGuestScenarios()).toHaveLength(5);
    expect((await fetchAchievements()).map((a) => a.id)).toEqual([
      'ach-1',
      'ach-2',
      'ach-3',
      'ach-4',
      'ach-5',
    ]);
  });

  it('serve the profile for the chosen role (.single())', async () => {
    expect(await fetchProfile(DEMO_USER_ID)).toMatchObject({ role: 'waiter', displayName: 'Олена Коваль' });
    role = 'manager';
    expect(await fetchProfile(DEMO_USER_ID)).toMatchObject({ role: 'manager', displayName: 'Ірина Мельник' });
  });

  it('record answers through the RPC and reflect them in stats and progress (.maybeSingle())', async () => {
    const res = await callOrQueue('record_answer', {
      p_item_id: 'item-soup-1',
      p_correct: true,
      p_source: 'card',
    });
    expect(res).toMatchObject({ status: 'done', data: [{ xp: 5, streak: 1 }] });
    expect(await fetchStats(DEMO_USER_ID)).toMatchObject({ xp: 5, level: 1, totalAnswers: 1 });
    expect(await fetchCardProgress(DEMO_USER_ID)).toEqual([
      expect.objectContaining({ itemId: 'item-soup-1', box: 2 }),
    ]);
  });

  it('do not lose answers sent at the same time', async () => {
    await Promise.all(
      ['a', 'b', 'c'].map((id) =>
        callOrQueue('record_answer', { p_item_id: `item-${id}`, p_correct: true, p_source: 'card' }),
      ),
    );
    expect(state.stats.total_answers).toBe(3);
    expect(Object.keys(state.progress).sort()).toEqual(['item-a', 'item-b', 'item-c']);
  });

  it('store finished games and reject bad scores', async () => {
    expect(await callOrQueue('finish_game', { p_mode: 'guest', p_score: 4, p_total: 5 })).toMatchObject({
      status: 'done',
    });
    expect(state.games).toHaveLength(1);
    expect(await callOrQueue('finish_game', { p_mode: 'guest', p_score: 6, p_total: 5 })).toMatchObject({
      status: 'failed',
    });
  });

  it('sign in with any 6-digit code and reject anything else', async () => {
    expect(
      (await supabase.auth.signInWithOtp({ email: 'a@b.ua', options: { shouldCreateUser: false } })).error,
    ).toBeNull();
    expect(
      (await supabase.auth.verifyOtp({ email: 'a@b.ua', token: '12', type: 'email' })).error,
    ).not.toBeNull();
    const ok = await supabase.auth.verifyOtp({ email: 'a@b.ua', token: '123456', type: 'email' });
    expect(ok.error).toBeNull();
    expect(ok.data.session?.user.id).toBe(DEMO_USER_ID);
    await supabase.auth.signOut();
  });

  it('serve stock and own photos from the demo build and 404 unknown ones', async () => {
    const ok = await fetch(photoUrl('stock/borscht.webp')!);
    expect(ok.headers.get('content-type')).toBe('image/webp');
    expect(await ok.text()).toBe('stock-bytes');
    expect(await (await fetch(photoUrl('own/soup-1.webp')!)).text()).toBe('own-bytes');
    expect((await fetch(photoUrl('stock/nope.webp')!)).status).toBe(404);
    expect((await fetch(photoUrl('other/soup-1.webp')!)).status).toBe(404);
  });
});
