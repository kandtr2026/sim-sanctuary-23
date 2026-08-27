import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays } from "lucide-react";
import LeadMagnetCta from "@/components/LeadMagnetCta";
import { buildArticle, buildBreadcrumb, BASE_URL } from "@/lib/seo";
import { getPostBySlug, getPublishedPosts } from "@/lib/blogPosts";
import { coverForCategory, TIN_TUC_ARTICLES } from "@/content/tinTucArticles";

/**
 * Public renderer for posts created through /admin/posts (and the daily blog
 * bot). Server-rendered so each post gets real per-page metadata and shows up in
 * the raw HTML for crawlers, matching the hand-coded tin-tuc/* pages next to it.
 *
 * Các trang bài viết cứng (src/app/tin-tuc/<slug>/page.tsx) LUÔN thắng route này
 * vì Next ưu tiên segment tĩnh; nên nếu một slug tồn tại ở cả hai nơi thì bản
 * trong repo là bản khách thấy.
 */
export const revalidate = 300;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return {};

  const title = post.meta_title || post.title;
  const description = post.meta_description || undefined;
  const path = `/tin-tuc/${post.slug}`;
  const cover = post.cover_image_url ?? coverForCategory(post.category).src;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `${BASE_URL}${path}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `${BASE_URL}${path}`,
      images: [{ url: cover.startsWith("http") ? cover : `${BASE_URL}${cover}` }],
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
    },
  };
}

const DATE_FORMAT = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const path = `/tin-tuc/${post.slug}`;
  const cover = post.cover_image_url
    ? { src: post.cover_image_url, alt: post.title }
    : coverForCategory(post.category);

  // Bài liên quan: ưu tiên bài DB cùng chuyên mục, rồi bài viết cứng cùng
  // chuyên mục, cuối cùng bù bằng bài viết cứng mới nhất. Bài của bot trước đây
  // chỉ có đúng 1 link nội bộ trong thân bài, nên khối này là cách rẻ nhất để cả
  // cụm bài liên kết được với nhau.
  const allDbPosts = await getPublishedPosts();
  const relatedDb = allDbPosts
    .filter((p) => p.slug !== post.slug && p.category === post.category)
    .slice(0, 2)
    .map((p) => ({ slug: p.slug, title: p.title, category: p.category ?? "Tin tức" }));
  const fileByCategory = TIN_TUC_ARTICLES.filter((a) => a.category === post.category);
  const relatedFile = [...fileByCategory, ...TIN_TUC_ARTICLES].map((a) => ({
    slug: a.slug,
    title: a.title,
    category: a.category as string,
  }));
  const related = [...relatedDb, ...relatedFile]
    .filter((item, index, list) => list.findIndex((x) => x.slug === item.slug) === index)
    .slice(0, 3);

  return (
    <>
      <main className="container mx-auto px-4 py-6 md:py-8">
        <article className="mx-auto max-w-4xl">
          <nav aria-label="Đường dẫn" className="mb-5 text-sm text-muted-foreground">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-gold">
                  Trang chủ
                </Link>
              </li>
              <span aria-hidden>/</span>
              <li>
                <Link href="/tin-tuc" className="hover:text-gold">
                  Tin tức
                </Link>
              </li>
              {post.category ? (
                <>
                  <span aria-hidden>/</span>
                  <li className="text-foreground/70" aria-current="page">
                    {post.category}
                  </li>
                </>
              ) : null}
            </ol>
          </nav>

          <h1 className="text-2xl font-bold text-primary md:text-3xl">{post.title}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground md:text-sm">
            {post.category ? (
              <span className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 font-medium text-gold">
                {post.category}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays aria-hidden className="h-3.5 w-3.5" />
              Cập nhật {DATE_FORMAT.format(new Date(post.updated_at))}
            </span>
          </div>

          <figure className="mt-6">
            {/* Ảnh bìa do nội dung quản lý (hoặc ảnh mặc định theo chuyên mục).
                Cố ý dùng <img> thay next/image để không tốn quota tối ưu ảnh. */}
            <img
              src={cover.src}
              alt={cover.alt}
              width={1200}
              height={675}
              className="w-full rounded-xl border border-border object-cover"
              fetchPriority="high"
              decoding="async"
            />
          </figure>

          {/* Dùng CHUNG hệ typography `.article-prose` (globals.css) với các bài
              viết cứng, nên bài của bot cũng có style cho <table>, <h3>,
              <blockquote> — trước đây chuỗi class inline ở đây chỉ phủ h2/p/ul. */}
          <div
            className="article-prose mt-8"
            // Content is authored exclusively through /admin by trusted site
            // admins (gated by profiles.is_admin — see supabase/migrations) or by
            // the blog bot using the same admin account, the same trust level as
            // the hand-coded tin-tuc/* pages it complements. Never wire this to
            // unmoderated user input.
            dangerouslySetInnerHTML={{ __html: post.content_html }}
          />

          <div className="mt-10">
            <LeadMagnetCta />
          </div>

          {related.length ? (
            <section className="mt-10">
              <h2 className="mb-4 text-xl font-semibold text-foreground md:text-2xl">
                Bài liên quan
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {related.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/tin-tuc/${item.slug}`}
                    className="rounded-lg border border-border bg-card p-4 transition-colors hover:border-gold"
                  >
                    <span className="text-xs text-gold">{item.category}</span>
                    <span className="mt-1 block text-sm font-medium leading-snug text-foreground">
                      {item.title}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}
        </article>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildArticle({
              headline: post.title,
              description: post.meta_description || "",
              path,
              datePublished: post.created_at,
              dateModified: post.updated_at,
              image: cover.src.startsWith("http") ? cover.src : `${BASE_URL}${cover.src}`,
            }),
          ),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumb([
              { name: "Trang chủ", path: "/" },
              { name: "Tin tức", path: "/tin-tuc" },
              { name: post.title, path },
            ]),
          ),
        }}
      />
    </>
  );
}
