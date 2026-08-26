import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/blogPosts";
import { getInStockBirthYears } from "@/lib/serverSimData";
import { DAU_SO_PREFIXES, LOAI_KEYS } from "@/lib/simTaxonomy";

// Sitemap now reads live data (published blog posts + in-stock birth-year
// clusters) in addition to the fixed static/taxonomy routes. It therefore runs
// as an ISR route (regenerated hourly) instead of `force-static`, so new blog
// posts and inventory changes reach the sitemap WITHOUT a redeploy. Every data
// read degrades to [] on failure (see getPublishedPosts / getInStockBirthYears),
// so a transient Supabase/edge outage can never fail the build — it just omits
// the dynamic tail until the next regeneration.
export const revalidate = 3600;

const BASE_URL = "https://www.chonsomobifone.com";

interface StaticRoute {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
  /** Build-time lastModified; otherwise a fixed date. */
  dynamic?: boolean;
}

const ROUTES: StaticRoute[] = [
  { path: "/", changeFrequency: "daily", priority: 1.0, dynamic: true },
  { path: "/mua-sim-gia-re", changeFrequency: "daily", priority: 0.9, dynamic: true },
  { path: "/mua-sim-tu-quy", changeFrequency: "weekly", priority: 0.9, dynamic: true },
  // Hub "sim theo đầu số" (Front dựng trang này).
  { path: "/sim-dau-so", changeFrequency: "weekly", priority: 0.7, dynamic: true },
  { path: "/sim-phong-thuy", changeFrequency: "weekly", priority: 0.8 },
  { path: "/sim-than-tai", changeFrequency: "weekly", priority: 0.8, dynamic: true },
  { path: "/sim-loc-phat", changeFrequency: "weekly", priority: 0.8, dynamic: true },
  { path: "/sim-ngu-quy", changeFrequency: "weekly", priority: 0.8, dynamic: true },
  { path: "/sim-ong-dia", changeFrequency: "weekly", priority: 0.8, dynamic: true },
  { path: "/sim-phong-thuy-hop-menh", changeFrequency: "weekly", priority: 0.8 },
  { path: "/dinh-gia-sim", changeFrequency: "monthly", priority: 0.7 },
  { path: "/sim-tra-gop", changeFrequency: "monthly", priority: 0.7 },
  { path: "/thanh-toan", changeFrequency: "monthly", priority: 0.5 },
  { path: "/tin-tuc", changeFrequency: "weekly", priority: 0.6, dynamic: true },
  // Static (file-based) articles under src/app/tin-tuc/*. DB-backed posts are
  // appended dynamically below via getPublishedPosts() and de-duped against these.
  { path: "/tin-tuc/y-nghia-sim-so-dep", changeFrequency: "monthly", priority: 0.5 },
  { path: "/tin-tuc/so-tong-dai-cac-nha-mang", changeFrequency: "monthly", priority: 0.5 },
  { path: "/tin-tuc/y-nghia-cac-con-so-1-9", changeFrequency: "monthly", priority: 0.5 },
  { path: "/tin-tuc/cach-xem-sim-phong-thuy-hop-tuoi", changeFrequency: "monthly", priority: 0.5 },
  { path: "/tin-tuc/cach-tranh-mat-tien-oan-khi-mua-sim-so-dep", changeFrequency: "monthly", priority: 0.5 },
  { path: "/tin-tuc/cac-dau-so-mang-mobifone-moi-nhat", changeFrequency: "monthly", priority: 0.5 },
  { path: "/chinh-sach-bao-mat", changeFrequency: "yearly", priority: 0.3 },
  { path: "/dieu-khoan-su-dung", changeFrequency: "yearly", priority: 0.3 },
  { path: "/chinh-sach-giao-hang", changeFrequency: "yearly", priority: 0.3 },
];

// Static pages that genuinely change only on a code deploy get a fixed
// lastModified instead of the build timestamp, so the sitemap stops "pinging"
// every deployment and diluting the crawl signal.
const STATIC_LAST_MODIFIED = "2026-08-23T00:00:00+07:00";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Pages whose content updates regularly (live SIM inventory, new posts) can
  // honestly use the regeneration time as their lastmod.
  const lastModified = new Date();

  const staticEntries = ROUTES.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified: "dynamic" in route && route.dynamic ? lastModified : STATIC_LAST_MODIFIED,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));

  const dauSoEntries = DAU_SO_PREFIXES.map((dauso) => ({
    url: `${BASE_URL}/sim-dau-so/${dauso}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const comboEntries = DAU_SO_PREFIXES.flatMap((dauso) =>
    LOAI_KEYS.map((loai) => ({
      url: `${BASE_URL}/sim-dau-so/${dauso}/${loai}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  );

  // Dynamic DB-backed blog posts, de-duped against the static file-based
  // /tin-tuc/* articles already listed in ROUTES.
  const existingTinTuc = new Set(
    ROUTES.filter((r) => r.path.startsWith("/tin-tuc/")).map((r) => r.path),
  );
  const posts = await getPublishedPosts();
  const blogEntries = posts
    .filter((p) => p.slug && !existingTinTuc.has(`/tin-tuc/${p.slug}`))
    .map((p) => ({
      url: `${BASE_URL}/tin-tuc/${p.slug}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.5,
    }));

  // Sim năm sinh — chỉ những năm có tồn kho thật ≥ ngưỡng (dùng CHUNG helper với
  // route sim-nam-sinh/[year] generateStaticParams, nên sitemap và trang khớp nhau).
  const years = await getInStockBirthYears();
  const namSinhEntries = years.map((year) => ({
    url: `${BASE_URL}/sim-nam-sinh/${year}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.6,
  }));

  return [
    ...staticEntries,
    ...dauSoEntries,
    ...comboEntries,
    ...blogEntries,
    ...namSinhEntries,
  ];
}
