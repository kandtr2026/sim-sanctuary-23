"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";

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

const getPagePath = (pathname: string, searchParams: string): string => {
  // Checkout pages have a dynamic [simId] — fold them into one bucket so the
  // dashboard shows "/mua-ngay" instead of 1000 distinct /mua-ngay/SIMxxxx.
  const checkoutMatch = pathname.match(/^\/mua-ngay\//);
  if (checkoutMatch) return "/mua-ngay";
  return searchParams ? `${pathname}?${searchParams}` : pathname;
};

/**
 * Normalise a raw referrer URL into a coarse source bucket, so the dashboard
 * can answer "khách đến từ đâu" without parsing URLs by hand. `internal` means
 * the referrer is our own site (e.g. navigated from homepage to a category).
 */
const classifySource = (raw: string | null): { referrer: string | null; source: string } => {
  if (!raw) return { referrer: null, source: "direct" };

  let host: string;
  try {
    host = new URL(raw).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return { referrer: raw, source: "other" };
  }

  // Internal navigation (same origin) → keep the path, bucket as internal.
  if (typeof window !== "undefined" && new URL(raw).origin === window.location.origin) {
    return { referrer: new URL(raw).pathname, source: "internal" };
  }

  const map: [RegExp, string][] = [
    [/facebook\.com$|fb\.com$|messenger\.com$/, "facebook"],
    [/tiktok\.com$/, "tiktok"],
    [/google\.[a-z.]+$/, "google"],
    [/zalo\.me$|chat\.zalo\.me$/, "zalo"],
    [/instagram\.com$/, "instagram"],
    [/youtube\.com$/, "youtube"],
    [/m\.me$|telegram\.org$/, "telegram"],
    [/linkedin\.com$/, "linkedin"],
    [/bing\.com$/, "bing"],
    [/coccoc\.com$/, "coccoc"],
    [/pinterest\.[a-z.]+$/, "pinterest"],
    [/x\.com$|twitter\.com$/, "twitter"],
  ];

  for (const [re, label] of map) {
    if (re.test(host)) return { referrer: new URL(raw).origin, source: label };
  }

  return { referrer: new URL(raw).origin, source: "other" };
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

    const { referrer, source } = classifySource(document.referrer);

    const payload = {
      path,
      referrer,
      source,
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
