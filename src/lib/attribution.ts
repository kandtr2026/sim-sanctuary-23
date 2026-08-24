/**
 * UTM / click-ID attribution capture.
 *
 * Google Ads & Meta land on the site with `?gclid=…` / `?fbclid=…` (and often
 * no referrer), which the referrer-based `classifySource` buckets as "direct".
 * This module snapshots the UTM params on the FIRST landing (first-touch) into
 * sessionStorage and lets the tracking hooks attach them to `conversion_clicks`
 * and `page_visits`, so the admin dashboard can show which campaign a lead came
 * from — even after internal navigation.
 *
 * Server-safe: every browser access is guarded with `typeof window`.
 */

const ATTR_KEY = "attr";
const ATTR_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
] as const;

export type Attribution = Record<string, string | null>;

/**
 * Persist the attribution params of the current URL into sessionStorage.
 * First-touch: only writes when nothing has been captured in this session yet,
 * so navigating internally later never overwrites the original campaign.
 */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const attr: Attribution = {};
  let found = false;
  for (const key of ATTR_PARAMS) {
    const value = params.get(key);
    if (value) {
      attr[key] = value;
      found = true;
    }
  }
  if (!found) return;

  try {
    if (!sessionStorage.getItem(ATTR_KEY)) {
      sessionStorage.setItem(ATTR_KEY, JSON.stringify(attr));
    }
  } catch {
    // sessionStorage can be blocked (private mode / security settings) —
    // attribution is a nice-to-have, never break the page.
  }
}

/**
 * Read back the captured attribution (empty object if none / on the server).
 * Safe to spread into a Supabase insert payload: extra keys map to columns,
 * and missing keys simply stay undefined.
 */
export function getAttribution(): Attribution {
  if (typeof window === "undefined") return {};

  try {
    const raw = sessionStorage.getItem(ATTR_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Attribution)
      : {};
  } catch {
    return {};
  }
}
