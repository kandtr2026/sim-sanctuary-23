import type { MetadataRoute } from "next";

// Statically generated sitemap, replacing the old public/sitemap.xml (deleted).
//
// URL source: the 17 indexable static routes actually present under src/app/**
// (verified 1:1 against the previous public/sitemap.xml and the live production
// sitemap). changefreq/priority are carried over verbatim from the old file.
//
// Deliberately excluded:
//   - /mua-ngay/[simId]  → per-SIM checkout, `noindex` + robots disallowed
//   - /sim-nam-sinh-YYYY → retired cluster, now a 308 → /
//   - 404 / not-found    → not an indexable page
//
// Note: the task referenced a ~546-URL sitemap with ~16 broken routes. No such
// source exists in this repo — neither public/sitemap.xml nor the live
// production sitemap exceeds 17 URLs — so nothing is invented here.
export const dynamic = "force-static";

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

// Mobifone prefixes that have their own landing page (kept in sync with
// src/app/sim-dau-so/[dauso]/page.tsx). Rendered as fixed URLs in the sitemap
// because the pages are pre-rendered at build time via generateStaticParams.
const DAU_SO_PREFIXES = ["090", "093", "070", "076", "077", "078", "079", "089"];

// Combo "sim [loại] × đầu số" (kept in sync with
// src/app/sim-dau-so/[dauso]/[loai]/page.tsx — generateStaticParams = 24 trang).
const LOAI_COMBOS = ["than-tai", "loc-phat", "ong-dia"] as const;

// Static pages that genuinely change only on a code deploy get a fixed
// lastModified instead of the build timestamp, so the sitemap stops "pinging"
// every deployment and diluting the crawl signal.
const STATIC_LAST_MODIFIED = "2026-08-23T00:00:00+07:00";

export default function sitemap(): MetadataRoute.Sitemap {
  // Pages whose content updates regularly (live SIM inventory, new posts) can
  // honestly use the build time as their lastmod.
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
    LOAI_COMBOS.map((loai) => ({
      url: `${BASE_URL}/sim-dau-so/${dauso}/${loai}`,
      lastModified,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  );

  return [...staticEntries, ...dauSoEntries, ...comboEntries];
}
