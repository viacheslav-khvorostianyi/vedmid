import { supabase } from '@/lib/supabase';
import type { Profile } from './context';

export async function fetchProfile(userId: string): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, role')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return { id: data.id, displayName: data.display_name, role: data.role };
}

export type SignInErrorKind =
  'unknown_email' | 'invalid_email' | 'rate_limited' | 'invalid_code' | 'network' | 'other';

export const SIGN_IN_ERRORS: Record<SignInErrorKind, string> = {
  unknown_email: 'Цієї пошти немає в списку персоналу. Попроси менеджера надіслати запрошення.',
  invalid_email: 'Перевір адресу пошти — схоже, в ній помилка.',
  rate_limited: 'Забагато спроб. Зачекай хвилину й спробуй ще раз.',
  invalid_code: 'Код не підходить або застарів. Надішли посилання ще раз.',
  network: 'Немає з’єднання. Перевір інтернет і спробуй ще раз.',
  other: 'Не вдалося надіслати. Спробуй ще раз або звернись до менеджера.',
};

export function classifySignInError(error: {
  message: string;
  code?: string;
  status?: number;
}): SignInErrorKind {
  // Signups are disabled, so an unknown email is refused as "signups not allowed".
  if (
    error.code === 'otp_disabled' ||
    error.code === 'signup_disabled' ||
    /signups? not allowed/i.test(error.message)
  ) {
    return 'unknown_email';
  }
  if (error.status === 429 || error.code === 'over_email_send_rate_limit') return 'rate_limited';
  if (
    error.code === 'email_address_invalid' ||
    error.code === 'validation_failed' ||
    /validate email/i.test(error.message)
  ) {
    return 'invalid_email';
  }
  if (error.code === 'otp_expired' || /token has expired or is invalid/i.test(error.message))
    return 'invalid_code';
  if (!error.status || /fetch|network/i.test(error.message)) return 'network';
  return 'other';
}

/** Sends a magic link (with a 6-digit code). Never creates accounts: staff are invited. */
export async function sendMagicLink(email: string, next: string): Promise<SignInErrorKind | null> {
  const redirect = new URL(`${import.meta.env.BASE_URL}login`, window.location.origin);
  redirect.searchParams.set('next', next);
  try {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false, emailRedirectTo: redirect.toString() },
    });
    return error ? classifySignInError(error) : null;
  } catch {
    return 'network';
  }
}

export async function verifyEmailCode(email: string, token: string): Promise<SignInErrorKind | null> {
  try {
    const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
    return error ? classifySignInError(error) : null;
  } catch {
    return 'network';
  }
}
