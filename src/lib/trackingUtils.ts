/**
 * Shared utilities for page-visit and conversion tracking.
 * Server-safe pure functions — no browser APIs, no React imports.
 */

/**
 * Normalise a page path for tracking. Checkout pages with a dynamic [simId] are
 * folded into one bucket "/mua-ngay" so the dashboard doesn't show 1000 distinct
 * /mua-ngay/SIMxxxx entries.
 */
export const getPagePath = (pathname: string, searchParams: string): string => {
  const checkoutMatch = pathname.match(/^\/mua-ngay\//);
  if (checkoutMatch) return "/mua-ngay";
  return searchParams ? `${pathname}?${searchParams}` : pathname;
};

/**
 * Classify a raw referrer URL into a coarse source bucket. Matches the
 * SOURCE_LABELS map in the admin PageVisitsSection.
 */
export const classifySource = (raw: string | null): { referrer: string | null; source: string } => {
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