import type { StaffRole } from '@/features/auth/context';

export const DEMO_USER_ID = '00000000-0000-4000-8000-00000000de00';

export const DEMO_PEOPLE: Record<StaffRole, { name: string; email: string }> = {
  waiter: { name: 'Олена Коваль', email: 'olena@demo.prostolis.ua' },
  manager: { name: 'Ірина Мельник', email: 'iryna@demo.prostolis.ua' },
};

const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

export function demoUser(email: string) {
  return {
    id: DEMO_USER_ID,
    aud: 'authenticated',
    role: 'authenticated',
    email,
    app_metadata: { provider: 'email' },
    user_metadata: {},
    created_at: '2026-09-01T00:00:00Z',
  };
}

/** A session shaped like GoTrue's. The token is unsigned: nothing in demo mode verifies it. */
export function demoSession(email: string) {
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return {
    access_token: `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: DEMO_USER_ID, exp, role: 'authenticated', aud: 'authenticated', email })}.demo`,
    refresh_token: `demo-refresh-${exp}`,
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: exp,
    user: demoUser(email),
  };
}
