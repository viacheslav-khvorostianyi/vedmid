import type { Session } from '@supabase/supabase-js';
import { createContext, useContext } from 'react';
import type { Enums } from '@/lib/db.types';

export type StaffRole = Enums<'staff_role'>;

export interface Profile {
  id: string;
  displayName: string;
  role: StaffRole;
}

export type AuthState =
  | { status: 'loading'; session: null; profile: null }
  | { status: 'signedOut'; session: null; profile: null }
  /** profile is null while it loads (or if it could not be loaded) */
  | { status: 'signedIn'; session: Session; profile: Profile | null };

export type AuthContextValue = AuthState & {
  signOut: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
