import { http, HttpResponse, type HttpHandler, type JsonBodyType } from 'msw';
import type { StaffRole } from '@/features/auth/context';
import { ACHIEVEMENT_ROWS } from '../../supabase/seed/achievements';
import { buildFixtureRows, buildGuestRows } from '../../supabase/seed/fixtureRows';
import { finishGame, recordAnswer, type AnswerInput, type DemoState } from './server';
import { DEMO_PEOPLE, DEMO_USER_ID, demoSession, demoUser } from './session';

export interface DemoBackend {
  url: string;
  getState: () => DemoState;
  setState: (s: DemoState) => void;
  getRole: () => StaffRole;
  now?: () => Date;
}

/** PostgREST: `.single()` asks for an object; everything else gets an array. */
function rows(request: Request, list: JsonBodyType[]) {
  if ((request.headers.get('accept') ?? '').includes('vnd.pgrst.object')) {
    return list.length
      ? HttpResponse.json(list[0])
      : HttpResponse.json(
          {
            code: 'PGRST116',
            message: 'JSON object requested, multiple (or no) rows returned',
            details: null,
            hint: null,
          },
          { status: 406 },
        );
  }
  return HttpResponse.json(list);
}

/** Answers every Supabase request the app makes, from the real menu data and a local demo state. */
export function createDemoHandlers(backend: DemoBackend): HttpHandler[] {
  const { url } = backend;
  const now = backend.now ?? (() => new Date());
  const menu = buildFixtureRows();
  const guest = buildGuestRows();
  const person = () => DEMO_PEOPLE[backend.getRole()];

  return [
    // --- auth
    http.post(`${url}/auth/v1/otp`, () => HttpResponse.json({})),
    // any 6-digit code signs in (the magic link itself can't be delivered in a demo)
    http.post(`${url}/auth/v1/verify`, async ({ request }) => {
      const body = (await request.json()) as { token?: string; email?: string };
      if (!/^\d{6}$/.test(body.token ?? '')) {
        return HttpResponse.json(
          { code: 'otp_expired', msg: 'Token has expired or is invalid' },
          { status: 403 },
        );
      }
      return HttpResponse.json(demoSession(person().email));
    }),
    http.post(`${url}/auth/v1/token`, () => HttpResponse.json(demoSession(person().email))),
    http.get(`${url}/auth/v1/user`, () => HttpResponse.json(demoUser(person().email))),
    http.post(`${url}/auth/v1/logout`, () => new HttpResponse(null, { status: 204 })),

    // --- tables
    http.get(`${url}/rest/v1/profiles`, ({ request }) =>
      rows(request, [
        {
          id: DEMO_USER_ID,
          display_name: person().name,
          role: backend.getRole(),
          created_at: '2026-09-01T00:00:00Z',
        },
      ]),
    ),
    http.get(`${url}/rest/v1/categories`, ({ request }) => rows(request, menu.categories)),
    http.get(`${url}/rest/v1/subcategories`, ({ request }) => rows(request, menu.subcategories)),
    http.get(`${url}/rest/v1/menu_items`, ({ request }) => rows(request, menu.items)),
    http.get(`${url}/rest/v1/guest_scenarios`, ({ request }) => rows(request, guest)),
    http.get(`${url}/rest/v1/achievements`, ({ request }) => rows(request, ACHIEVEMENT_ROWS)),
    http.get(`${url}/rest/v1/player_stats`, ({ request }) =>
      rows(request, [
        { user_id: DEMO_USER_ID, updated_at: now().toISOString(), ...backend.getState().stats },
      ]),
    ),
    http.get(`${url}/rest/v1/card_progress`, ({ request }) =>
      rows(
        request,
        Object.entries(backend.getState().progress).map(([item_id, p]) => ({
          user_id: DEMO_USER_ID,
          item_id,
          ...p,
        })),
      ),
    ),
    http.get(`${url}/rest/v1/user_achievements`, ({ request }) =>
      rows(
        request,
        Object.entries(backend.getState().unlocked).map(([achievement_id, unlocked_at]) => ({
          user_id: DEMO_USER_ID,
          achievement_id,
          unlocked_at,
        })),
      ),
    ),

    // --- RPCs
    // Read the body before the state: concurrent answers must not start from the same snapshot.
    http.post(`${url}/rest/v1/rpc/record_answer`, async ({ request }) => {
      const input = (await request.json()) as AnswerInput;
      const { state, result } = recordAnswer(backend.getState(), input, now());
      backend.setState(state);
      return HttpResponse.json(result);
    }),
    http.post(`${url}/rest/v1/rpc/finish_game`, async ({ request }) => {
      const input = (await request.json()) as Parameters<typeof finishGame>[1];
      const out = finishGame(backend.getState(), input, now());
      if ('error' in out) return HttpResponse.json(out.error, { status: 400 });
      backend.setState(out.state);
      return new HttpResponse(null, { status: 204 });
    }),
    http.post(`${url}/rest/v1/rpc/is_manager`, () => HttpResponse.json(backend.getRole() === 'manager')),

    // photos: none in the demo; anything else unknown is refused so gaps are visible
    http.all(`${url}/*`, ({ request }) =>
      HttpResponse.json(
        { message: `Demo mode has no handler for ${request.method} ${new URL(request.url).pathname}` },
        { status: 501 },
      ),
    ),
  ];
}
