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
  orders: number; // A6 — đơn từ webhook /api/orders, ghép theo campaign_code
  revenue: number; // VND — tổng doanh thu các đơn
  orderRate: number; // orders / leads, in % (1 decimal)
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
interface OrderLite {
  campaign_code: string | null;
  price: number | null;
}

const MAX_ROWS = 5000;
const NO_TAG = "(không gắn UTM)";
const NO_ORDER_TAG = "(không gắn mã)";
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

/**
 * A6 — đơn nhận qua webhook /api/orders (bảng `orders`, admin-only RLS).
 * Lọc theo `created_at` trong cửa sổ; rỗng nếu bảng chưa tạo / thiếu quyền.
 *
 * `orders` chưa có trong generated Supabase types (migration có thể chưa được
 * áp), nên đi qua client kiểu lỏng như cách `site_campaigns` ở /admin/chien-dich.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- orders chưa nằm trong types (xem ở trên)
const ordersTable = () => (supabase as unknown as { from: (t: string) => any }).from("orders");

async function fetchOrders(days: number): Promise<OrderLite[]> {
  const since = sinceIso(days);
  try {
    const res = await ordersTable()
      .select("campaign_code,price")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(5000);
    return (res.data ?? []) as OrderLite[];
  } catch {
    return [];
  }
}

const blankRow = (key: string, label: string): FunnelRow => ({
  key,
  label,
  visits: 0,
  leads: 0,
  leadRate: 0,
  byType: { zalo: 0, call: 0, messenger: 0 },
  orders: 0,
  revenue: 0,
  orderRate: 0,
});

function aggregate(
  visits: VisitLite[],
  clicks: ClickLite[],
  keyOf: (r: VisitLite) => string,
  orders: OrderLite[] = [],
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

  // Ghép đơn theo campaign_code: khớp với key funnel nếu có, còn không thì dựng
  // dòng riêng để doanh thu không mất dù chiến dịch chưa có lead nào.
  // Key funnel là utm_campaign gốc (có thể viết hoa) — đối chiếu bỏ qua hoa/thường.
  const keyByLower = new Map<string, string>();
  for (const k of map.keys()) keyByLower.set(k.trim().toLowerCase(), k);

  for (const o of orders) {
    const code = o.campaign_code?.trim().toLowerCase();
    const matched = code && keyByLower.has(code) ? keyByLower.get(code)! : NO_ORDER_TAG;
    const r = row(matched);
    r.orders++;
    r.revenue += Number.isFinite(o.price) ? Number(o.price) : 0;
  }

  const rows = [...map.values()];
  for (const r of rows) {
    r.leadRate = r.visits > 0 ? Math.round((r.leads / r.visits) * 1000) / 10 : 0;
    r.orderRate = r.leads > 0 ? Math.round((r.orders / r.leads) * 1000) / 10 : 0;
  }
  rows.sort((a, b) => b.leads - a.leads || b.visits - a.visits);
  return rows;
}

const campaignKey = (r: VisitLite) => r.utm_campaign?.trim() || NO_TAG;
const channelKey = (r: VisitLite) =>
  (r.source?.trim() || r.utm_source?.trim() || r.utm_medium?.trim() || DIRECT).toLowerCase();

/** Funnel grouped by `utm_campaign` (visits → leads → lead-rate → orders). */
export async function getCampaignFunnel(days = 30): Promise<FunnelRow[]> {
  const [window, orders] = await Promise.all([fetchWindow(days), fetchOrders(days)]);
  return aggregate(window.visits, window.clicks, campaignKey, orders);
}

/** Funnel grouped by traffic channel (`source`/utm_source). */
export async function getSourceFunnel(days = 30): Promise<FunnelRow[]> {
  const { visits, clicks } = await fetchWindow(days);
  return aggregate(visits, clicks, channelKey);
}
