import { createClient } from '@supabase/supabase-js';
import type { Database } from './db.types';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are not set. Copy .env.example to .env.local and fill them in.',
  );
}

export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    flowType: 'pkce',
    persistSession: true,
    autoRefreshToken: true,
    // Magic links land on /login?code=… and are exchanged for a session automatically.
    detectSessionInUrl: true,
  },
});
