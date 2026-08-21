"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AdminAuthState {
  user: User | null;
  session: Session | null;
  /** Null while we haven't checked `profiles.is_admin` yet (or the user is logged out). */
  isAdmin: boolean | null;
  /** True until the initial session + profile check has resolved. */
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthState | undefined>(undefined);

/**
 * Wraps Supabase Auth for the /admin section only. Being logged in is not
 * enough to see admin screens — `profiles.is_admin` (checked server-side by
 * RLS on every query, and mirrored here client-side for the UI) is what
 * actually gates access. See the migration in supabase/migrations for how a
 * profile gets `is_admin = true`.
 */
export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async (currentUser: User | null) => {
    if (!currentUser) {
      setIsAdmin(null);
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', currentUser.id)
      .maybeSingle();

    if (error) {
      console.error('[admin-auth] Failed to load profile:', error.message);
      setIsAdmin(false);
      return;
    }
    // No row yet = not provisioned as an admin. Not an error state — most
    // logged-in Supabase users on this project simply aren't admins.
    setIsAdmin(Boolean(data?.is_admin));
  };

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (cancelled) return;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      await loadProfile(initialSession?.user ?? null);
      if (!cancelled) setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      // Fire and forget — UI shows a loading state via `loading` only for the
      // very first check, not on every token refresh.
      void loadProfile(newSession?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AdminAuthContext.Provider value={{ user, session, isAdmin, loading, signIn, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = (): AdminAuthState => {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  return ctx;
};
