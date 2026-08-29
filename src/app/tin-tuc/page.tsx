import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { BASE_URL, buildBreadcrumb } from "@/lib/seo";
import { getPublishedPosts } from "@/lib/blogPosts";
import {
  TIN_TUC_ARTICLES,
  coverForCategory,
  type ArticleCover,
} from "@/content/tinTucArticles";

// Bài đăng qua /admin/posts hoặc bot nằm trong Supabase, nên trang này KHÔNG
// được đóng băng lúc build: revalidate 60s để bài mới xuất hiện mà không cần
// deploy lại.
export const revalidate = 60;

const TITLE = "Tin Tức SIM Số Đẹp – Kiến Thức Phong Thuỷ MobiFone";
const DESCRIPTION =
  "Kiến thức chọn SIM số đẹp: bảng tra ngũ hành, Bát Cực Linh Số, 80 quẻ Kinh Dịch, ý nghĩa đuôi số, giá SIM theo dòng và hướng dẫn thủ tục MobiFone.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${BASE_URL}/tin-tuc` },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: `${BASE_URL}/tin-tuc`,
    images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
  },
};

interface ListedArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  cover: ArticleCover;
  date: string;
}

const DATE_FORMAT = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});

export default async function TinTucPage() {
  // Bài viết cứng trong repo (sổ đăng ký) + bài trong Supabase. Slug trùng thì
  // bản trong repo thắng, vì route tĩnh /tin-tuc/<slug> luôn được Next ưu tiên
  // hơn [slug] — nếu không lọc, danh sách sẽ hiện hai thẻ cho cùng một URL.
  const fileArticles: ListedArticle[] = TIN_TUC_ARTICLES.map((a) => ({
    slug: a.slug,
    title: a.title,
    excerpt: a.excerpt ?? a.description,
    category: a.category,
    cover: a.cover ?? coverForCategory(a.category),
    date: a.dateModified,
  }));

  const fileSlugs = new Set(fileArticles.map((a) => a.slug));
  const dbPosts = await getPublishedPosts();
  const dbArticles: ListedArticle[] = dbPosts
    .filter((p) => p.slug && !fileSlugs.has(p.slug))
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      excerpt: p.meta_description ?? "",
      category: p.category ?? "Ý nghĩa sim",
      cover: p.cover_image_url
        ? { src: p.cover_image_url, alt: p.title, width: 1200, height: 675 }
        : coverForCategory(p.category),
      date: p.created_at,
    }));

  const articles = [...fileArticles, ...dbArticles].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Tin tức & kiến thức SIM số đẹp",
    itemListElement: articles.map((article, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `${BASE_URL}/tin-tuc/${article.slug}`,
      name: article.title,
    })),
  };

  return (
    <>
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-primary md:text-3xl">
          Tin tức &amp; kiến thức SIM số đẹp
        </h1>
        <p className="mt-3 max-w-3xl leading-relaxed text-body">
          Toàn bộ kiến thức cần khi chọn một dãy số: bảng tra ngũ hành và Bát Cực Linh Số, cách tính
          quẻ Kinh Dịch, ý nghĩa từng đuôi số, khoảng giá theo từng dòng SIM, cùng các hướng dẫn thủ
          tục MobiFone thường gặp. Bài nào có bảng tra thì bảng được dựng từ chính dữ liệu mà công cụ
          trên site đang dùng, nên nội dung bài viết và kết quả Quý khách thấy khi tra cứu luôn khớp nhau.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <article
              key={article.slug}
              className="group overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-gold"
            >
              <Link href={`/tin-tuc/${article.slug}`} className="block">
                {/* Ảnh đã nén WebP sẵn trong /public (hoặc URL do admin nhập) —
                    cố ý dùng <img> thay next/image để không tốn quota tối ưu ảnh. */}
                <img
                  src={article.cover.src}
                  alt={article.cover.alt}
                  width={article.cover.width}
                  height={article.cover.height}
                  loading="lazy"
                  decoding="async"
                  className="aspect-[16/9] w-full object-cover"
                />
                <div className="p-4">
                  <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className="rounded-full border border-gold/40 bg-gold/10 px-2 py-0.5 font-medium text-gold">
                      {article.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <CalendarDays aria-hidden className="h-3.5 w-3.5" />
                      {DATE_FORMAT.format(new Date(article.date))}
                    </span>
                  </div>
                  <h2 className="text-base font-semibold leading-snug text-foreground group-hover:text-gold md:text-lg">
                    {article.title}
                  </h2>
                  {article.excerpt ? (
                    <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                      {article.excerpt}
                    </p>
                  ) : null}
                </div>
              </Link>
            </article>
          ))}
        </div>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumb([
              { name: "Trang chủ", path: "/" },
              { name: "Tin tức", path: "/tin-tuc" },
            ]),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
    </>
  );
}
