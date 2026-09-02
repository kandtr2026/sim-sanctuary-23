import type { Metadata } from "next";
import SimBrowser from "@/components/SimBrowser";
import FAQSection from "@/components/FAQSection";
import { buildSimItemListJsonLd } from "@/components/SimSnapshot";
import { faqData } from "@/data/faqData";
import { getServerSims } from "@/lib/serverSimData";
import { filterSims } from "@/lib/simFilter";
import { countTags, getUniquePrefixes, PRICE_RANGES } from "@/lib/simUtils";
import { DAU_SO_PREFIXES } from "@/lib/simTaxonomy";

// Cụm "sim giá rẻ" thuộc /mua-sim-gia-re (chủ dự án chốt 29/08). Title trang chủ
// trước đây cũng chứa "giá rẻ" nên hai trang tranh nhau cùng một cụm; nay trang
// chủ nhắm cụm thương hiệu + quy mô kho + cam kết, để cụm giá rẻ cho trang kia.
const TITLE = "SIM Mobifone số đẹp – 30 phút giao toàn quốc";
const DESCRIPTION =
  "Kho SIM Mobifone hơn 49.000 số: tứ quý, tam hoa, thần tài, lộc phát, phong thủy, năm sinh. Giá niêm yết công khai, sang tên chính chủ, 30 phút giao toàn quốc.";
const CANONICAL = "https://www.chonsomobifone.com/";

// ISR: regenerate the static shell (incl. the server-rendered SIM grid +
// ItemList schema) every 5 minutes to match the live catalogue cache window.
export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    title: TITLE,
    description:
      "Kho SIM Mobifone hơn 49.000 số: tứ quý, tam hoa, tài lộc, năm sinh. Giá niêm yết công khai, 30 phút giao toàn quốc.",
    url: CANONICAL,
    images: [{ url: "https://www.chonsomobifone.com/share-banner.png?v=999", width: 1200, height: 630 }],
  },
};

// Derived from the same array FAQSection renders. Google's FAQPage policy
// requires every Q&A in the markup to be visible on the page, so this must
// never be hand-maintained as a second copy. Server-rendered so it lands in the
// raw HTML for crawlers.
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqData.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

// Money/category pages that must stay reachable ≤2 clicks from the homepage, as
// real <a> links in the raw HTML (not JS buttons). Every route is verified to
// exist under src/app; "Sim tứ quý"/"Sim giá rẻ" live at /mua-sim-* .
const CATEGORY_LINKS: { href: string; label: string }[] = [
  { href: "/sim-than-tai", label: "Sim thần tài" },
  { href: "/sim-loc-phat", label: "Sim lộc phát" },
  { href: "/mua-sim-tu-quy", label: "Sim tứ quý" },
  { href: "/sim-ngu-quy", label: "Sim ngũ quý" },
  { href: "/sim-ong-dia", label: "Sim ông địa" },
  { href: "/sim-phong-thuy", label: "Sim phong thủy" },
  { href: "/sim-phong-thuy-hop-menh", label: "Sim phong thủy hợp mệnh" },
  { href: "/mua-sim-gia-re", label: "Sim giá rẻ" },
  { href: "/sim-tra-gop", label: "Sim trả góp" },
];

/**
 * Đường crawl tới các cụm trang programmatic dựng ngày 29/08/2026. Không có khối
 * này thì chúng chỉ vào được qua sitemap: Google biết URL tồn tại nhưng không có
 * tín hiệu nội bộ nào nói rằng chúng đáng xếp hạng.
 *
 * Chỉ trỏ vào HUB, không liệt kê hàng chục trang con ở trang chủ — hub đã liệt kê
 * trang con của nó, nên mọi trang vẫn nằm trong 2 cú click mà trang chủ không phình.
 */
const DISCOVERY_LINKS: { href: string; label: string }[] = [
  { href: "/sim-hop-tuoi", label: "Sim hợp tuổi theo năm sinh" },
  { href: "/sim-hop-menh", label: "Sim hợp mệnh" },
  { href: "/sim-nam-sinh", label: "Sim có năm sinh" },
  { href: "/sim-gia", label: "Sim theo tầm giá" },
  { href: "/sim-tam-hoa", label: "Sim tam hoa" },
  { href: "/sim-tam-hoa-kep", label: "Sim tam hoa kép" },
  { href: "/sim-ganh-dao", label: "Sim gánh đảo" },
  { href: "/sim-lap-kep", label: "Sim lặp kép" },
  { href: "/sim-de-nho", label: "Sim dễ nhớ" },
  { href: "/sim-taxi", label: "Sim taxi" },
  { href: "/sim-tien-len", label: "Sim tiến lên" },
];

export default async function HomePage() {
  // SSG-first: lấy 40 SIM đầu + facets lúc build để SimBrowser nhận initialData —
  // lần đầu vào web hiện SIM ngay (không còn skeleton "Đang tải..."), react-query
  // refetch nền cho dữ liệu luôn tươi. getServerSims đã cache module scope + trả
  // [] khi lỗi (build không vỡ, client tự retry).
  const sims = await getServerSims();
  const catalogue = filterSims(sims, {});
  const initialData = catalogue.slice(0, 40);
  const initialTotal = catalogue.length;
  const initialFacets = (() => {
    const networkCounts: Record<string, number> = {};
    const priceCounts: number[] = PRICE_RANGES.map(() => 0);
    sims.forEach((s) => {
      networkCounts[s.network] = (networkCounts[s.network] ?? 0) + 1;
      const idx = PRICE_RANGES.findIndex((r) => s.price >= r.min && s.price <= r.max);
      if (idx !== -1) priceCounts[idx]++;
    });
    return {
      tagCounts: countTags(sims),
      prefixes: getUniquePrefixes(sims),
      networkCounts,
      priceCounts,
    };
  })();

  // ItemList schema for the featured SIMs. These are the first cards the grid
  // paints (initialData), so the schema matches what a visitor actually sees.
  // pageUrl → homepage: /mua-ngay/[id] is noindex + disallowed (see SimSnapshot).
  const featuredSims = catalogue.slice(0, 10);
  const itemListJsonLd =
    featuredSims.length > 0
      ? buildSimItemListJsonLd("SIM Mobifone số đẹp nổi bật", featuredSims, CANONICAL)
      : null;

  return (
    <>
      <main className="container mx-auto px-4 pt-4 pb-6">
        {/* Visible h1: it carries the same SEO weight it did as sr-only, but now also
            tells a first-time visitor what the page is. It replaces the deleted hero
            banner as the first painted element, so it is the new LCP candidate. */}
        <h1 className="mb-2 text-lg font-bold leading-tight text-foreground md:text-2xl">
          SIM Mobifone số đẹp — <span className="text-gold">30 phút giao toàn quốc</span>
        </h1>
        <p className="mb-3 text-sm text-muted-foreground md:text-base">
          Quý khách chọn số theo tuổi, theo mệnh hoặc theo đuôi số ưa thích: tứ quý, tam hoa, phong thủy, thần tài, lộc phát. Sang tên chính chủ, 30 phút nhận SIM.
        </p>

        {/* Client island: search + filters + SIM grid (SSG initialData + server fetch
            qua /api/sims) + process steps + intro stats. */}
        <SimBrowser
          initialData={initialData}
          initialTotal={initialTotal}
          initialFacets={initialFacets}
        />

        {/* Internal linking — real <a> links in the raw HTML so every money page
            is reachable ≤2 clicks from the homepage and crawlable without JS. */}
        <section aria-labelledby="kham-pha-kho-sim" className="mb-8">
          <h2
            id="kham-pha-kho-sim"
            className="mb-3 text-base font-bold text-foreground md:text-lg"
          >
            Khám phá kho SIM
          </h2>

          <div className="rounded-xl border border-border bg-card p-4 shadow-card md:p-6">
            <div className="mb-2 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-primary md:text-base">
                SIM theo đầu số Mobifone
              </h3>
              <a
                href="/sim-dau-so"
                className="whitespace-nowrap text-xs font-medium text-primary underline-offset-2 hover:underline md:text-sm"
              >
                Xem tất cả đầu số
              </a>
            </div>
            <ul className="flex flex-wrap gap-2">
              {DAU_SO_PREFIXES.map((prefix) => (
                <li key={prefix}>
                  <a
                    href={`/sim-dau-so/${prefix}`}
                    className="inline-block rounded-lg border border-border bg-secondary/40 px-3 py-1.5 text-sm font-semibold text-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    Sim {prefix}
                  </a>
                </li>
              ))}
            </ul>

            <h3 className="mb-2 mt-5 text-sm font-semibold text-primary md:text-base">
              Dòng SIM phổ biến
            </h3>
            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {CATEGORY_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>

            {/* Đường crawl cho các cụm trang mới (29/08/2026). Không có khối này thì
                96 trang mới chỉ vào được qua sitemap — mồ côi liên kết nội bộ, tức
                Google thấy chúng nhưng không thấy chúng quan trọng. Đặt ở trang chủ
                để mọi cụm nằm trong 2 cú click. */}
            <h3 className="mb-2 mt-5 text-sm font-semibold text-primary md:text-base">
              Chọn theo dạng số, tầm giá hoặc tuổi
            </h3>
            <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
              {DISCOVERY_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* FAQ Section. id is "faq", not "phong-thuy": this block is the FAQ, and the
            phong thuy content lives on its own page at /sim-phong-thuy. */}
        <section id="faq" className="mb-8">
          <FAQSection />
        </section>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {itemListJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(itemListJsonLd).replace(/</g, "\\u003c"),
          }}
        />
      )}
    </>
  );
}
