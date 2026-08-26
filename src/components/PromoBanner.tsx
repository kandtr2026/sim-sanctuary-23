import { getActiveCampaigns, type SiteCampaign } from "@/lib/campaigns";
import PromoBannerClient from "./PromoBannerClient";

/**
 * Storefront promo / flash-sale banner (server half). Reads active campaigns on
 * the server with the same anon Supabase client that powers getPublishedPosts,
 * then hands the chosen campaign to the client half (live countdown + dismiss +
 * /admin hiding).
 *
 * getActiveCampaigns() degrades to `[]` when the `site_campaigns` table is
 * missing or errors, so this renders `null` and never breaks the page or build.
 *
 * Rendered from the root layout, so WHICH campaign shows is refreshed on each
 * page's ISR window (most storefront routes use revalidate=300) — acceptable
 * staleness. The countdown itself is realtime, driven client-side from ends_at.
 */

// Site-wide Zalo CTA, used when a campaign does not set its own cta_url.
const DEFAULT_ZALO_CTA = "https://zalo.me/0933356666";

/** flash_sale (soonest-ending) wins; otherwise the first active one by `sort`. */
function pickCampaign(campaigns: SiteCampaign[]): SiteCampaign | null {
  if (campaigns.length === 0) return null;

  const flashSoonest = campaigns
    .filter((c) => c.type === "flash_sale" && c.ends_at)
    .sort((a, b) => (a.ends_at! < b.ends_at! ? -1 : 1))[0];
  if (flashSoonest) return flashSoonest;

  const anyFlash = campaigns.find((c) => c.type === "flash_sale");
  if (anyFlash) return anyFlash;

  // getActiveCampaigns() already orders by `sort` ascending.
  return campaigns[0];
}

export default async function PromoBanner() {
  const campaign = pickCampaign(await getActiveCampaigns());
  if (!campaign) return null;

  return (
    <PromoBannerClient campaign={campaign} fallbackCtaUrl={DEFAULT_ZALO_CTA} />
  );
}
