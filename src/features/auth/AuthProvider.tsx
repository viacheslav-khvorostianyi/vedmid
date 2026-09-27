import type { Session } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { queryPersister } from '@/lib/queryClient';
import { supabase } from '@/lib/supabase';
import { fetchProfile } from './api';
import { AuthContext, type AuthContextValue } from './context';

export default function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (active) setSession(data.session);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user.id;
  const profileQuery = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId!),
    enabled: !!userId,
    staleTime: 5 * 60_000,
  });

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    // Nothing from the previous user may survive on a shared phone.
    queryClient.clear();
    await queryPersister.removeClient();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(() => {
    if (session === undefined) return { status: 'loading', session: null, profile: null, signOut };
    if (session === null) return { status: 'signedOut', session: null, profile: null, signOut };
    return { status: 'signedIn', session, profile: profileQuery.data ?? null, signOut };
  }, [session, profileQuery.data, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
