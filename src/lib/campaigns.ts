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
import { supabase } from "@/integrations/supabase/client";

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
    const { data, error } = await (
      supabase as unknown as {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- site_campaigns chưa có trong generated types (migration có thể chưa apply)
        from: (t: string) => any;
      }
    )
      .from("site_campaigns")
      .select("*")
      .eq("active", true)
      .order("sort", { ascending: true });
    if (error || !data) return [];
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
