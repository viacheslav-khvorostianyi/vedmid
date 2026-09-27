// POST /functions/v1/invite-staff  { email, display_name }  — manager only (ARCHITECTURE §4.4).
// Secrets: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (provided by Supabase), SITE_URL, ALLOWED_ORIGINS (comma-separated).
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { handleInvite } from './handler.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const SITE_URL = Deno.env.get('SITE_URL') ?? 'http://localhost:3000';
const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? SITE_URL).split(',').map((o) => o.trim());

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

Deno.serve((req) =>
  handleInvite(
    req,
    {
      async isManager() {
        const caller = createClient(SUPABASE_URL, ANON_KEY, {
          global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
          auth: { persistSession: false },
        });
        const { data, error } = await caller.rpc('is_manager');
        return !error && data === true;
      },
      async invite(email, displayName) {
        const { error } = await admin.auth.admin.inviteUserByEmail(email, {
          data: { display_name: displayName },
          redirectTo: `${SITE_URL}/login`,
        });
        return {
          error: error ? { status: error.status, code: error.code, message: error.message } : undefined,
        };
      },
    },
    ALLOWED_ORIGINS,
  ),
);
