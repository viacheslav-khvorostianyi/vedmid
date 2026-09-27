// Runtime-agnostic request handler for the invite-staff Edge Function (Deno wiring lives in index.ts).
// Kept free of Deno/npm imports so it runs under Vitest too.

export interface InviteError {
  status?: number;
  code?: string;
  message: string;
}

export interface InviteDeps {
  /** Whether the caller (from the request's JWT) is a manager. */
  isManager(): Promise<boolean>;
  invite(email: string, displayName: string): Promise<{ error?: InviteError }>;
}

type ErrorCode =
  | 'method_not_allowed'
  | 'unauthorized'
  | 'forbidden'
  | 'invalid_body'
  | 'invalid_email'
  | 'invalid_name'
  | 'already_invited'
  | 'invite_failed';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function handleInvite(
  req: Request,
  deps: InviteDeps,
  allowedOrigins: readonly string[],
): Promise<Response> {
  const origin = req.headers.get('Origin') ?? '';
  const cors: Record<string, string> = allowedOrigins.includes(origin)
    ? {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        Vary: 'Origin',
      }
    : {};
  const json = (status: number, body: { ok: true } | { error: ErrorCode }) =>
    new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (req.method !== 'POST') return json(405, { error: 'method_not_allowed' });
  if (!req.headers.get('Authorization')) return json(401, { error: 'unauthorized' });
  if (!(await deps.isManager())) return json(403, { error: 'forbidden' });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: 'invalid_body' });
  }
  const { email, display_name } = (body ?? {}) as { email?: unknown; display_name?: unknown };
  if (typeof email !== 'string' || !EMAIL.test(email.trim()) || email.length > 254) {
    return json(400, { error: 'invalid_email' });
  }
  if (typeof display_name !== 'string' || !display_name.trim() || display_name.length > 80) {
    return json(400, { error: 'invalid_name' });
  }

  const { error } = await deps.invite(email.trim().toLowerCase(), display_name.trim());
  if (error) {
    const exists = error.code === 'email_exists' || /already (been )?registered/i.test(error.message);
    return exists ? json(409, { error: 'already_invited' }) : json(500, { error: 'invite_failed' });
  }
  return json(200, { ok: true });
}
