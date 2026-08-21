"use client";

import { useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAdminAuth } from '@/hooks/useAdminAuth';

/**
 * Route guard for everything under /admin (except the login page itself).
 * Three states:
 *  - still checking session/profile -> spinner (avoids a login-page flash)
 *  - no session, or session but is_admin !== true -> bounce to /admin
 *  - admin confirmed -> render the protected screen
 *
 * This is a UX convenience only. The real gate is the RLS policies on
 * `blog_posts` (see supabase/migrations) — a logged-in non-admin who bypassed
 * this component would still get empty/rejected query results from Supabase.
 */
const RequireAdmin = ({ children }: { children: ReactNode }) => {
  const { loading, user, isAdmin } = useAdminAuth();
  const router = useRouter();

  const shouldRedirect = !loading && (!user || !isAdmin);

  useEffect(() => {
    if (shouldRedirect) router.replace('/admin');
  }, [shouldRedirect, router]);

  if (loading || shouldRedirect) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireAdmin;
