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
}

const ROUTES: StaticRoute[] = [
  { path: "/", changeFrequency: "daily", priority: 1.0 },
  { path: "/mua-sim-gia-re", changeFrequency: "daily", priority: 0.9 },
  { path: "/mua-sim-tu-quy", changeFrequency: "weekly", priority: 0.9 },
  { path: "/sim-phong-thuy", changeFrequency: "weekly", priority: 0.8 },
  { path: "/dinh-gia-sim", changeFrequency: "monthly", priority: 0.7 },
  { path: "/sim-tra-gop", changeFrequency: "monthly", priority: 0.7 },
  { path: "/thanh-toan", changeFrequency: "monthly", priority: 0.5 },
  { path: "/tin-tuc", changeFrequency: "weekly", priority: 0.6 },
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

export default function sitemap(): MetadataRoute.Sitemap {
  // Static content pages — the build time is a valid, honest `lastmod`.
  const lastModified = new Date();

  return ROUTES.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
