import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { buildArticle, buildBreadcrumb, BASE_URL } from "@/lib/seo";
import { getPostBySlug } from "@/lib/blogPosts";

/**
 * Public renderer for posts created through /admin/posts. Server-rendered so
 * each post gets real per-page metadata and shows up in the raw HTML for
 * crawlers, matching the hand-coded tin-tuc/* pages next to it.
 */
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

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `${BASE_URL}${path}` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `${BASE_URL}${path}`,
      images: post.cover_image_url ? [{ url: post.cover_image_url }] : undefined,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  const path = `/tin-tuc/${post.slug}`;

  return (
    <>
      <main className="container mx-auto px-4 py-8">
        <article className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-6">{post.title}</h1>
          {post.cover_image_url && (
            // eslint-disable-next-line @next/next/no-img-element -- content-managed URL, not a static asset
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="mb-8 w-full rounded-lg object-cover"
              loading="lazy"
            />
          )}
          <div
            className="max-w-none text-foreground [&_h2]:text-xl [&_h2]:md:text-2xl [&_h2]:font-semibold [&_h2]:mb-4 [&_h2]:mt-8 [&_p]:mb-4 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-2 [&_ul]:mb-4"
            // Content is authored exclusively through /admin by trusted site
            // admins (gated by profiles.is_admin — see supabase/migrations),
            // the same trust level as the hand-coded tin-tuc/* pages it
            // complements. Never wire this to unmoderated user input.
            dangerouslySetInnerHTML={{ __html: post.content_html }}
          />
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
              image: post.cover_image_url || `${BASE_URL}/brand-logo.png`,
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
