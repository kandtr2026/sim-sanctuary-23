"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";

/**
 * Logs every page navigation to `public.page_visits` so the admin dashboard
 * can show which pages visitors actually look at (newest first).
 *
 * Throttling: one insert per path per 5 seconds per tab. The purpose is a
 * signal for the admin ("this page is being looked at"), not precise
 * analytics — 50 visitors refreshing once each should not produce 50 rows
 * every second. Deduping by path keeps the log readable.
 *
 * All failures are swallowed: tracking must never break the page. The RLS
 * policy allows anonymous INSERT, so this works for logged-out visitors.
 */
const THROTTLE_MS = 5_000;

const getPagePath = (pathname: string, searchParams: string): string => {
  // Checkout pages have a dynamic [simId] — fold them into one bucket so the
  // dashboard shows "/mua-ngay" instead of 1000 distinct /mua-ngay/SIMxxxx.
  const checkoutMatch = pathname.match(/^\/mua-ngay\//);
  if (checkoutMatch) return "/mua-ngay";
  return searchParams ? `${pathname}?${searchParams}` : pathname;
};

const stripReferrer = (raw: string | null): string | null => {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    // Only keep the path for same-site referrers, or the origin for external.
    return u.origin === window.location.origin ? u.pathname : u.origin;
  } catch {
    return raw;
  }
};

export function usePageVisitTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastLoggedRef = useRef<{ path: string; at: number } | null>(null);

  useEffect(() => {
    const path = getPagePath(pathname, searchParams.toString());
    const now = Date.now();

    const last = lastLoggedRef.current;
    if (last && last.path === path && now - last.at < THROTTLE_MS) return;

    lastLoggedRef.current = { path, at: now };

    const payload = {
      path,
      referrer: stripReferrer(document.referrer),
      user_agent: navigator.userAgent,
    };

    supabase
      .from("page_visits")
      .insert(payload)
      .then(({ error }) => {
        // Quietly ignore failures (RLS, network, anonymous insert blocked...)
        if (error) console.debug("[page_visit] not logged:", error.message);
      });
  }, [pathname, searchParams]);
}
