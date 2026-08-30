import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/blogPosts";
import { getInStockBirthYears } from "@/lib/serverSimData";
import { TIN_TUC_ARTICLES } from "@/content/tinTucArticles";
import { getDauSoSitemapEntries } from "@/app/sim-dau-so/inventory";
import { ALL_YEARS } from "@/app/sim-hop-tuoi/_lib/yearContent";
import { HANH_META } from "@/app/sim-hop-menh/_lib/hanhMeta";
import { PRICE_BAND_SLUGS } from "@/lib/simDangSo";

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
  // Hub "sim năm sinh". Trước đây chỉ 38 trang con /sim-nam-sinh/<năm> có trong
  // sitemap còn trang hub thì không, dù nó có trong Navigation — tức một trang
  // money page vô hình với sitemap.
  { path: "/sim-nam-sinh", changeFrequency: "weekly", priority: 0.8, dynamic: true },
  { path: "/sim-than-tai", changeFrequency: "weekly", priority: 0.8, dynamic: true },
  { path: "/sim-loc-phat", changeFrequency: "weekly", priority: 0.8, dynamic: true },
  { path: "/sim-ngu-quy", changeFrequency: "weekly", priority: 0.8, dynamic: true },
  { path: "/sim-ong-dia", changeFrequency: "weekly", priority: 0.8, dynamic: true },
  { path: "/sim-phong-thuy-hop-menh", changeFrequency: "weekly", priority: 0.8 },
  { path: "/sim-tra-gop", changeFrequency: "monthly", priority: 0.7 },
  // Hub của 3 cụm trang programmatic mới (29/08/2026).
  { path: "/sim-hop-tuoi", changeFrequency: "weekly", priority: 0.8, dynamic: true },
  { path: "/sim-hop-menh", changeFrequency: "weekly", priority: 0.8, dynamic: true },
  { path: "/sim-gia", changeFrequency: "weekly", priority: 0.8, dynamic: true },
  // Trang theo DẠNG SỐ — tag đã gắn sẵn cho cả kho, mỗi trang là một cụm từ khoá
  // riêng mà trước đây site không có trang nào phủ (đối thủ có ~60 trang dạng này).
  { path: "/sim-tam-hoa", changeFrequency: "weekly", priority: 0.8, dynamic: true },
  { path: "/sim-tam-hoa-kep", changeFrequency: "weekly", priority: 0.7, dynamic: true },
  { path: "/sim-ganh-dao", changeFrequency: "weekly", priority: 0.7, dynamic: true },
  { path: "/sim-lap-kep", changeFrequency: "weekly", priority: 0.7, dynamic: true },
  { path: "/sim-de-nho", changeFrequency: "weekly", priority: 0.7, dynamic: true },
  { path: "/sim-taxi", changeFrequency: "weekly", priority: 0.7, dynamic: true },
  { path: "/sim-tien-len", changeFrequency: "weekly", priority: 0.7, dynamic: true },
  { path: "/thanh-toan", changeFrequency: "monthly", priority: 0.5 },
  { path: "/tin-tuc", changeFrequency: "weekly", priority: 0.6, dynamic: true },
  // Bài /tin-tuc/* viết cứng trong repo được sinh từ sổ đăng ký
  // `src/content/tinTucArticles.ts` (xem `fileArticleEntries` bên dưới), không
  // liệt kê tay ở đây nữa — trước đây thêm bài mới rất dễ quên cập nhật sitemap.
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

  // Đầu số 4 chữ số + combo: dùng helper của chính route, nó ĐÃ loại các URL đang
  // `noindex` vì mỏng hàng. Bản đầu tôi tự gộp `comboLegacy ∪ comboInStock` → khai
  // luôn 6 combo mỏng (076/ong-dia, 078/ong-dia, 079/{than-tai,loc-phat,ong-dia},
  // 089/ong-dia) vào sitemap, tức mời Google vào đúng 6 trang mình vừa chặn index.
  const dauSoAllEntries = (await getDauSoSitemapEntries()).map(({ path, priority }) => ({
    url: `${BASE_URL}${path}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority,
  }));

  const hopTuoiEntries = ALL_YEARS.map((nam) => ({
    url: `${BASE_URL}/sim-hop-tuoi/${nam}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const hopMenhEntries = Object.values(HANH_META).map((h) => ({
    url: `${BASE_URL}/sim-hop-menh/${h.slug}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const giaEntries = PRICE_BAND_SLUGS.map((slug) => ({
    url: `${BASE_URL}/sim-gia/${slug}`,
    lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Bài viết cứng trong repo — lastModified lấy đúng ngày cập nhật đã khai
  // trong sổ đăng ký, nên sitemap không "ping" lại toàn bộ bài mỗi lần deploy.
  const fileArticleEntries = TIN_TUC_ARTICLES.map((article) => ({
    url: `${BASE_URL}/tin-tuc/${article.slug}`,
    lastModified: article.dateModified,
    changeFrequency: "monthly" as const,
    priority: article.legacy ? 0.5 : 0.6,
  }));

  // Dynamic DB-backed blog posts, de-duped against the static file-based
  // /tin-tuc/* articles already listed in ROUTES.
  const existingTinTuc = new Set<string>([
    ...ROUTES.filter((r) => r.path.startsWith("/tin-tuc/")).map((r) => r.path),
    ...TIN_TUC_ARTICLES.map((a) => `/tin-tuc/${a.slug}`),
  ]);
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
    ...dauSoAllEntries,
    ...fileArticleEntries,
    ...blogEntries,
    ...namSinhEntries,
    ...hopTuoiEntries,
    ...hopMenhEntries,
    ...giaEntries,
  ];
}
