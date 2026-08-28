"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { getPagePath, classifySource } from "@/lib/trackingUtils";
import { captureAttribution, getAttribution } from "@/lib/attribution";

/**
 * Logs every page navigation to `public.page_visits` so the admin dashboard
 * can show which pages visitors actually look at (newest first), and — from
 * the referrer — where they came from (Facebook / TikTok / Google / Zalo /
 * direct / internal).
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

export function usePageVisitTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastLoggedRef = useRef<{ path: string; at: number } | null>(null);

  useEffect(() => {
    // Admin panel is the owner's own tooling, not customer traffic. Skipping it
    // keeps "Trang khách đã xem" clean of the owner's own /admin visits.
    if (pathname.startsWith("/admin")) return;

    let cancelled = false;

    void (async () => {
      // A logged-in owner browsing their own public site must not be counted as
      // a customer visit either — their testing would flood the dashboard the
      // same way their /admin visits did.
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) return; // signed in (owner / admin) → not a customer
      } catch {
        // Session check is best-effort; fall through to tracking on failure.
      }

      // First-touch UTM/gclid capture — runs on first mount and is a no-op after
      // (sessionStorage guard), so later internal navigations keep the original.
      captureAttribution();

      const path = getPagePath(pathname, searchParams.toString());
      const now = Date.now();

      const last = lastLoggedRef.current;
      if (last && last.path === path && now - last.at < THROTTLE_MS) return;

      lastLoggedRef.current = { path, at: now };

      const { referrer, source } = classifySource(document.referrer);

      const payload = {
        path,
        referrer,
        source,
        user_agent: navigator.userAgent,
        ...getAttribution(),
      };

      if (cancelled) return;
      await supabase
        .from("page_visits")
        .insert(payload)
        .then(({ error }) => {
          // Quietly ignore failures (RLS, network, anonymous insert blocked...)
          if (error) console.debug("[page_visit] not logged:", error.message);
        });
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, searchParams]);
}
