// @vitest-environment node
import { handleInvite, type InviteDeps } from './handler';

const ORIGIN = 'https://vedmid.example';

function request(body: unknown, init: { method?: string; auth?: boolean; origin?: string } = {}) {
  return new Request('https://x.supabase.co/functions/v1/invite-staff', {
    method: init.method ?? 'POST',
    headers: {
      ...(init.auth === false ? {} : { Authorization: 'Bearer jwt' }),
      Origin: init.origin ?? ORIGIN,
      'Content-Type': 'application/json',
    },
    body:
      init.method === 'OPTIONS' || init.method === 'GET'
        ? undefined
        : typeof body === 'string'
          ? body
          : JSON.stringify(body),
  });
}

function deps(overrides: Partial<InviteDeps> = {}) {
  return {
    isManager: vi.fn(async () => true),
    invite: vi.fn(async () => ({})),
    ...overrides,
  } satisfies InviteDeps;
}

async function call(req: Request, d = deps()) {
  const res = await handleInvite(req, d, [ORIGIN]);
  return { status: res.status, body: res.status === 204 ? null : await res.json(), headers: res.headers, d };
}

describe('invite-staff handler', () => {
  it('invites with a normalised email and trimmed name', async () => {
    const { status, body, d } = await call(
      request({ email: ' Olena@ProstoLis.ua ', display_name: ' Олена К. ' }),
    );
    expect(status).toBe(200);
    expect(body).toEqual({ ok: true });
    expect(d.invite).toHaveBeenCalledWith('olena@prostolis.ua', 'Олена К.');
  });

  it('answers CORS preflight only for allowed origins', async () => {
    const ok = await call(request(null, { method: 'OPTIONS' }));
    expect(ok.status).toBe(204);
    expect(ok.headers.get('Access-Control-Allow-Origin')).toBe(ORIGIN);
    const other = await call(request(null, { method: 'OPTIONS', origin: 'https://evil.example' }));
    expect(other.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  it.each([
    ['non-POST', request(null, { method: 'GET' }), 405, 'method_not_allowed'],
    ['missing JWT', request({ email: 'a@b.ua', display_name: 'A' }, { auth: false }), 401, 'unauthorized'],
    ['bad JSON', request('{nope'), 400, 'invalid_body'],
    ['bad email', request({ email: 'not-an-email', display_name: 'A' }), 400, 'invalid_email'],
    ['empty name', request({ email: 'a@b.ua', display_name: '  ' }), 400, 'invalid_name'],
  ])('rejects %s', async (_, req, status, error) => {
    const { status: s, body, d } = await call(req);
    expect(s).toBe(status);
    expect(body).toEqual({ error });
    expect(d.invite).not.toHaveBeenCalled();
  });

  it('returns 403 for non-managers without inviting', async () => {
    const d = deps({ isManager: vi.fn(async () => false) });
    const { status, body } = await call(request({ email: 'a@b.ua', display_name: 'A' }), d);
    expect(status).toBe(403);
    expect(body).toEqual({ error: 'forbidden' });
    expect(d.invite).not.toHaveBeenCalled();
  });

  it('maps an existing user to 409 and other auth errors to 500', async () => {
    const exists = deps({
      invite: vi.fn(async () => ({ error: { status: 422, code: 'email_exists', message: 'exists' } })),
    });
    expect((await call(request({ email: 'a@b.ua', display_name: 'A' }), exists)).body).toEqual({
      error: 'already_invited',
    });
    const legacy = deps({
      invite: vi.fn(async () => ({
        error: { message: 'A user with this email address has already been registered' },
      })),
    });
    expect((await call(request({ email: 'a@b.ua', display_name: 'A' }), legacy)).status).toBe(409);
    const broken = deps({ invite: vi.fn(async () => ({ error: { status: 500, message: 'smtp down' } })) });
    expect((await call(request({ email: 'a@b.ua', display_name: 'A' }), broken)).body).toEqual({
      error: 'invite_failed',
    });
  });
});
