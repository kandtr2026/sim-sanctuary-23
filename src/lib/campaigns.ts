/**
 * On-site sales campaigns (banner / flash-sale / featured-deal) driven from the
 * admin. Reads the `site_campaigns` table.
 *
 * IMPORTANT: `site_campaigns` is NOT in the generated Supabase types (its
 * migration may not be applied yet), and the storefront must never break if the
 * table is missing. So the query is loosely typed and every path degrades to
 * `[]` / `null`. RLS already restricts anon reads to active, in-window rows;
 * the client-side time guard is a belt-and-braces fallback.
 */
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/config";

/**
 * Cửa sổ cache (giây) của danh sách chiến dịch trong Data Cache của Next.
 *
 * `PromoBanner` nằm ở root layout nên mọi lượt render server đều gọi vào đây.
 * Bản cũ đi qua supabase-js (không dính cache của Next) nên bắn một request
 * `GET /rest/v1/site_campaigns` cho MỖI lượt render — đo 13/10/2026: 2.402
 * request/24h, toàn bộ trả `[]`, chiếm ~14% dòng log API của project. Khớp
 * `revalidate = 300` của các trang để độ tươi không đổi so với ISR hiện tại.
 */
const CAMPAIGNS_REVALIDATE = 300;

const CAMPAIGNS_URL =
  `${SUPABASE_URL}/rest/v1/site_campaigns?select=*&active=eq.true&order=sort.asc`;

export type CampaignType = "flash_sale" | "promo_banner" | "featured_deal";

export interface SiteCampaign {
  id: number;
  name: string;
  slug: string;
  type: CampaignType | string;
  active: boolean;
  headline: string | null;
  subline: string | null;
  cta_label: string | null;
  cta_url: string | null;
  discount_note: string | null;
  target_tags: string[] | null;
  starts_at: string | null;
  ends_at: string | null;
  sort: number;
}

const inWindow = (c: SiteCampaign, nowIso: string) =>
  (!c.starts_at || c.starts_at <= nowIso) && (!c.ends_at || c.ends_at > nowIso);

/** Active, in-window campaigns ordered by `sort`. `[]` if table missing/error. */
export async function getActiveCampaigns(): Promise<SiteCampaign[]> {
  try {
    // Chỉ gửi `apikey` (không `Authorization`) để request được phép vào Data
    // Cache; RLS vẫn áp theo role anon như khi đi qua supabase-js.
    const res = await fetch(CAMPAIGNS_URL, {
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY },
      next: { revalidate: CAMPAIGNS_REVALIDATE },
    });
    if (!res.ok) return [];
    const data: unknown = await res.json();
    if (!Array.isArray(data)) return [];
    const nowIso = new Date().toISOString();
    return (data as SiteCampaign[]).filter((c) => inWindow(c, nowIso));
  } catch {
    return [];
  }
}

/** The soonest-ending active flash-sale, or `null`. */
export async function getActiveFlashSale(): Promise<SiteCampaign | null> {
  const flash = (await getActiveCampaigns()).filter((c) => c.type === "flash_sale" && c.ends_at);
  flash.sort((a, b) => (a.ends_at! < b.ends_at! ? -1 : 1));
  return flash[0] ?? null;
}
