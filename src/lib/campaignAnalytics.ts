/**
 * Campaign / channel funnel analytics for the admin "Chiến dịch" console.
 *
 * Pure client-side aggregation over the two tracking tables that already exist
 * (`page_visits`, `conversion_clicks`) — no new DB objects required. A "lead" =
 * one contact-CTA click (zalo / call / messenger). Everything degrades to `[]`
 * on error / missing permission so the admin never crashes.
 *
 * Only admins can SELECT these tables (RLS), so these helpers are meant to be
 * called from the authenticated admin dashboard.
 */
import { supabase } from "@/integrations/supabase/client";

export interface FunnelRow {
  key: string; // utm_campaign slug, or channel/source key
  label: string; // display label
  visits: number;
  leads: number; // contact-CTA clicks
  leadRate: number; // leads / visits, in % (1 decimal)
  byType: { zalo: number; call: number; messenger: number };
}

interface VisitLite {
  utm_campaign: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  source: string | null;
}
interface ClickLite extends VisitLite {
  type: string;
}

const MAX_ROWS = 5000;
const NO_TAG = "(không gắn UTM)";
const DIRECT = "direct";

const sinceIso = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

async function fetchWindow(days: number): Promise<{ visits: VisitLite[]; clicks: ClickLite[] }> {
  const since = sinceIso(days);
  try {
    const [v, c] = await Promise.all([
      supabase
        .from("page_visits")
        .select("utm_campaign,utm_source,utm_medium,source")
        .gte("visited_at", since)
        .order("visited_at", { ascending: false })
        .limit(MAX_ROWS),
      supabase
        .from("conversion_clicks")
        .select("type,utm_campaign,utm_source,utm_medium,source")
        .gte("clicked_at", since)
        .order("clicked_at", { ascending: false })
        .limit(MAX_ROWS),
    ]);
    return { visits: (v.data ?? []) as VisitLite[], clicks: (c.data ?? []) as ClickLite[] };
  } catch {
    return { visits: [], clicks: [] };
  }
}

const blankRow = (key: string, label: string): FunnelRow => ({
  key,
  label,
  visits: 0,
  leads: 0,
  leadRate: 0,
  byType: { zalo: 0, call: 0, messenger: 0 },
});

function aggregate(
  visits: VisitLite[],
  clicks: ClickLite[],
  keyOf: (r: VisitLite) => string,
): FunnelRow[] {
  const map = new Map<string, FunnelRow>();
  const row = (k: string) => {
    let r = map.get(k);
    if (!r) {
      r = blankRow(k, k);
      map.set(k, r);
    }
    return r;
  };
  for (const v of visits) row(keyOf(v)).visits++;
  for (const c of clicks) {
    const r = row(keyOf(c));
    r.leads++;
    if (c.type === "zalo" || c.type === "call" || c.type === "messenger") r.byType[c.type]++;
  }
  const rows = [...map.values()];
  for (const r of rows) r.leadRate = r.visits > 0 ? Math.round((r.leads / r.visits) * 1000) / 10 : 0;
  rows.sort((a, b) => b.leads - a.leads || b.visits - a.visits);
  return rows;
}

const campaignKey = (r: VisitLite) => r.utm_campaign?.trim() || NO_TAG;
const channelKey = (r: VisitLite) =>
  (r.source?.trim() || r.utm_source?.trim() || r.utm_medium?.trim() || DIRECT).toLowerCase();

/** Funnel grouped by `utm_campaign` (visits → leads → lead-rate). */
export async function getCampaignFunnel(days = 30): Promise<FunnelRow[]> {
  const { visits, clicks } = await fetchWindow(days);
  return aggregate(visits, clicks, campaignKey);
}

/** Funnel grouped by traffic channel (`source`/utm_source). */
export async function getSourceFunnel(days = 30): Promise<FunnelRow[]> {
  const { visits, clicks } = await fetchWindow(days);
  return aggregate(visits, clicks, channelKey);
}
