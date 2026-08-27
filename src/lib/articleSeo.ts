import type { Metadata } from "next";
import { BASE_URL } from "@/lib/seo";
import { getArticle, type TinTucArticle } from "@/content/tinTucArticles";

/**
 * Metadata cho một trang bài /tin-tuc viết cứng trong repo.
 *
 * Mỗi page.tsx chỉ cần `export const metadata = articleMetadata("slug")`, nhờ
 * vậy title/description/canonical/OG luôn khớp với sổ đăng ký bài
 * (`src/content/tinTucArticles.ts`) và với thẻ Article JSON-LD do
 * `ArticleShell` phát ra — không còn chuyện sửa tiêu đề ở một chỗ mà quên chỗ
 * còn lại.
 */
export function articleMetadata(slugOrArticle: string | TinTucArticle): Metadata {
  const article =
    typeof slugOrArticle === "string" ? getArticle(slugOrArticle) : slugOrArticle;
  const url = `${BASE_URL}/tin-tuc/${article.slug}`;
  const ogImage = article.cover
    ? { url: `${BASE_URL}${article.cover.src}`, width: article.cover.width, height: article.cover.height }
    : { url: `${BASE_URL}/share-banner.png?v=999`, width: 1200, height: 630 };

  return {
    title: { absolute: article.title },
    description: article.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.description,
      url,
      images: [ogImage],
      publishedTime: article.datePublished,
      modifiedTime: article.dateModified,
    },
  };
}
