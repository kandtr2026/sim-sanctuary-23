import Link from "next/link";
import type { ReactNode } from "react";
import { CalendarDays, Clock, ChevronRight } from "lucide-react";
import LeadMagnetCta from "@/components/LeadMagnetCta";
import { BASE_URL, buildArticle, buildBreadcrumb } from "@/lib/seo";
import {
  getRelatedArticles,
  type TinTucArticle,
} from "@/content/tinTucArticles";

export interface FaqItem {
  q: string;
  a: string;
}

interface ArticleShellProps {
  article: TinTucArticle;
  /** Đoạn mở đầu (lead) — in to hơn thân bài. */
  lead?: ReactNode;
  /** Thân bài: dùng các khối trong `ArticleBits.tsx`. */
  children: ReactNode;
  /**
   * Câu hỏi thường gặp. Render bằng <details> chứ không phải accordion JS để
   * câu trả lời LUÔN có mặt trong HTML thô (Google đọc được kể cả khi chưa mở),
   * và cùng lúc phát FAQPage schema từ đúng dữ liệu này.
   */
  faq?: FaqItem[];
  /** Slug các bài muốn ưu tiên ở khối "Bài liên quan". */
  related?: string[];
}

const DATE_FORMAT = new Intl.DateTimeFormat("vi-VN", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Asia/Ho_Chi_Minh",
});

/**
 * Khung chung cho mọi bài /tin-tuc viết trong repo: breadcrumb, H1, ảnh bìa,
 * thân bài, FAQ, CTA, bài liên quan và toàn bộ JSON-LD (Article +
 * BreadcrumbList + FAQPage). Mục đích là mỗi bài mới chỉ còn phải viết NỘI DUNG
 * — phần SEO kỹ thuật không thể quên hay làm lệch giữa các bài.
 */
export default function ArticleShell({
  article,
  lead,
  children,
  faq,
  related,
}: ArticleShellProps) {
  const path = `/tin-tuc/${article.slug}`;
  const relatedArticles = getRelatedArticles(article.slug, related);

  const faqJsonLd = faq?.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      }
    : null;

  return (
    <>
      <main className="container mx-auto px-4 py-6 md:py-8">
        <article className="mx-auto max-w-4xl">
          {/* Breadcrumb hiển thị — vừa giúp khách định vị, vừa là 2 link nội bộ
              thật trong HTML (JSON-LD BreadcrumbList bên dưới chỉ là mô tả). */}
          <nav aria-label="Đường dẫn" className="mb-5 text-sm text-muted-foreground">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/" className="hover:text-gold">
                  Trang chủ
                </Link>
              </li>
              <ChevronRight aria-hidden className="h-3.5 w-3.5 opacity-60" />
              <li>
                <Link href="/tin-tuc" className="hover:text-gold">
                  Tin tức
                </Link>
              </li>
              <ChevronRight aria-hidden className="h-3.5 w-3.5 opacity-60" />
              <li className="text-foreground/70" aria-current="page">
                {article.category}
              </li>
            </ol>
          </nav>

          <h1 className="text-2xl font-bold text-primary md:text-3xl">
            {article.h1 ?? article.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground md:text-sm">
            <span className="rounded-full border border-gold/40 bg-gold/10 px-2.5 py-0.5 font-medium text-gold">
              {article.category}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays aria-hidden className="h-3.5 w-3.5" />
              Cập nhật {DATE_FORMAT.format(new Date(article.dateModified))}
            </span>
            {article.readingMinutes ? (
              <span className="inline-flex items-center gap-1.5">
                <Clock aria-hidden className="h-3.5 w-3.5" />
                {article.readingMinutes} phút đọc
              </span>
            ) : null}
          </div>

          {article.cover ? (
            <figure className="mt-6">
              {/* Ảnh đã nén sẵn WebP trong /public nên dùng <img> thường: không
                  đi qua bộ tối ưu ảnh của Vercel (không tốn quota), vẫn có
                  width/height để khỏi nhảy layout. */}
              {/* Cố ý dùng <img> chứ không phải next/image: ảnh đã nén sẵn nên
                  không cần bộ tối ưu ảnh (và không tốn quota của nó). */}
              <img
                src={article.cover.src}
                alt={article.cover.alt}
                width={article.cover.width}
                height={article.cover.height}
                className="w-full rounded-xl border border-border object-cover"
                // Ảnh bìa là LCP của trang bài → nạp sớm, không lazy.
                fetchPriority="high"
                decoding="async"
              />
            </figure>
          ) : null}

          {lead ? (
            <div className="mt-6 text-base leading-relaxed text-body md:text-lg">
              {lead}
            </div>
          ) : null}

          {/* `.article-prose` (globals.css) lo toàn bộ typography thân bài nên
              nội dung viết bằng thẻ ngữ nghĩa thường: <h2>, <p>, <ul>, <a>. */}
          <div className="article-prose mt-8">{children}</div>

          {faq?.length ? (
            <section className="mt-10">
              <h2 className="mb-4 text-xl font-semibold text-foreground md:text-2xl">
                Câu hỏi thường gặp
              </h2>
              <div className="space-y-2.5">
                {faq.map((item) => (
                  <details
                    key={item.q}
                    className="group rounded-lg border border-border bg-card px-4 py-3"
                  >
                    <summary className="cursor-pointer list-none font-medium text-foreground marker:content-none group-open:text-gold">
                      {item.q}
                    </summary>
                    <p className="mt-2.5 leading-relaxed text-body">{item.a}</p>
                  </details>
                ))}
              </div>
            </section>
          ) : null}

          <div className="mt-10">
            <LeadMagnetCta />
          </div>

          {relatedArticles.length ? (
            <section className="mt-10">
              <h2 className="mb-4 text-xl font-semibold text-foreground md:text-2xl">
                Bài liên quan
              </h2>
              <div className="grid gap-3 sm:grid-cols-3">
                {relatedArticles.map((item) => (
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
              headline: article.h1 ?? article.title,
              description: article.description,
              path,
              datePublished: article.datePublished,
              dateModified: article.dateModified,
              image: `${BASE_URL}${article.cover?.src ?? "/brand-logo.png"}`,
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
              { name: article.title, path },
            ]),
          ),
        }}
      />
      {faqJsonLd ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      ) : null}
    </>
  );
}
