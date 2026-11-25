import type { Metadata } from "next";
import SimBrowser from "@/components/SimBrowser";
import FAQSection from "@/components/FAQSection";
import { buildSimItemListJsonLd } from "@/components/SimSnapshot";
import { faqData } from "@/data/faqData";
import { getServerSims } from "@/lib/serverSimData";
import { filterSims } from "@/lib/simFilter";
import { countTags, countMenh, getUniquePrefixes, PRICE_RANGES } from "@/lib/simUtils";
import { DAU_SO_PREFIXES } from "@/lib/simTaxonomy";
import { conLink229K } from "@/lib/kho229k";

// Cụm "sim giá rẻ" thuộc /mua-sim-gia-re (chủ dự án chốt 29/08). Title trang chủ
// trước đây cũng chứa "giá rẻ" nên hai trang tranh nhau cùng một cụm; nay trang
// chủ nhắm cụm thương hiệu + quy mô kho + cam kết, để cụm giá rẻ cho trang kia.
// 21/11/2026: GSC 28 ngày — trang chủ (đã index) đang hứng "mobifone gần đây"
// 27 imp pos 6 và "đại lý mobifone quận 7" 10 imp pos 1.5 nhưng 0 click, vì
// title/meta không nhắc cửa hàng. Trang /diem-giao-dich-mobifone-quan-7 chưa
// được Google index nên thêm tín hiệu cửa hàng Quận 7 vào snippet trang chủ.
const TITLE = "SIM Mobifone số đẹp – 30 phút giao toàn quốc | Cửa hàng Quận 7";
const DESCRIPTION =
  "Kho SIM Mobifone hơn 49.000 số: tứ quý, tam hoa, thần tài, phong thủy, năm sinh, giá niêm yết công khai. Cửa hàng MobiFone Quận 7: 43A Đường số 9, P. Tân Hưng, mở 8:00–21:00.";
const CANONICAL = "https://www.chonsomobifone.com/";
// Chip nổi dưới H1. Repo không có hằng số địa chỉ dùng chung ở dạng "P. Tân Hưng"
// (các nơi khác viết "Phường Tân Hưng" và là const cục bộ) nên giữ nguyên chữ đã duyệt.
const Q7_CHIP_TEXT = "📍 Cửa hàng MobiFone Quận 7 gần đây — 43A Đường số 9, P. Tân Hưng";

// ISR: regenerate the static shell (incl. the server-rendered SIM grid +
// ItemList schema) every 5 minutes to match the live catalogue cache window.
export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    // Next (App Router) thay NGUYÊN object openGraph của route con, không merge
    // field từ layout gốc — nên locale phải khai lại ở đây để trang chủ (surface
    // chia sẻ chính) vẫn có og:locale=vi_VN.
    locale: "vi_VN",
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
  { href: "/sim-ngu-quy", label: "Sim ngũ quý" },  { href: "/sim-phong-thuy", label: "Sim phong thủy" },
  { href: "/sim-phong-thuy-hop-menh", label: "Sim phong thủy hợp mệnh" },
  { href: "/mua-sim-gia-re", label: "Sim giá rẻ" },
  { href: "/sim-tra-gop", label: "Sim trả góp" },
].filter(conLink229K);

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
  // Trỏ thẳng hub, không qua /sim-hop-menh (trang đó `permanentRedirect` 308 sang
  // đây) — khách bấm từ trang chủ khỏi tốn thêm một vòng round-trip.
  { href: "/sim-phong-thuy-hop-menh", label: "Sim hợp mệnh" },
  { href: "/sim-nam-sinh", label: "Sim có năm sinh" },
  { href: "/sim-gia", label: "Sim theo tầm giá" },
  { href: "/sim-tam-hoa", label: "Sim tam hoa" },
  { href: "/sim-tu-quy-giua", label: "Sim tứ quý giữa" },
  { href: "/sim-ganh-dao", label: "Sim gánh đảo" },
  { href: "/sim-lap-kep", label: "Sim lặp kép" },
  { href: "/sim-de-nho", label: "Sim dễ nhớ" },
  { href: "/sim-taxi", label: "Sim taxi" },
  { href: "/sim-tien-len", label: "Sim tiến lên" },
  // GSC 28 ngày đang có impression thật cho cụm local "mobifone quận 7",
  // "mobifone gần đây", "đại lý mobifone gần đây" nhưng 0 click. Đưa landing
  // local vào trang chủ bằng anchor exact/near-exact để tăng tín hiệu nội bộ.
  { href: "/diem-giao-dich-mobifone-quan-7", label: "Đại lý MobiFone Quận 7 gần đây" },
  { href: "/esim-mobifone", label: "eSIM MobiFone" },
  { href: "/doi-esim-mobifone", label: "Đổi eSIM MobiFone" },
  { href: "/doi-esim-mobifone-quan-7", label: "Đổi eSIM MobiFone Quận 7" },
  { href: "/lam-lai-sim-mobifone-quan-7", label: "Làm lại SIM MobiFone Quận 7" },
  // Query "0708 là mạng gì" đã lên vị trí TB #2 nhưng CTR 0%; link từ trang chủ
  // giúp bài giải đáp đầu số không chỉ sống nhờ sitemap và tăng đường sang kho 0708.
  { href: "/tin-tuc/0708-la-mang-gi", label: "0708 là mạng gì?" },
  { href: "/tin-tuc/0707-la-mang-gi", label: "0707 là mạng gì?" },
  { href: "/tin-tuc/0706-la-mang-gi", label: "0706 là mạng gì?" },
  { href: "/tin-tuc/089-la-mang-gi", label: "089 là mạng gì?" },
];

export default async function HomePage() {
  // SSG-first: lấy 40 SIM đầu + facets lúc build để SimBrowser nhận initialData —
  // lần đầu vào web hiện SIM ngay (không còn skeleton "Đang tải..."), react-query
  // refetch nền cho dữ liệu luôn tươi. getServerSims đã cache module scope + trả
  // [] khi lỗi (build không vỡ, client tự retry).
  const sims = await getServerSims();
  // `mix` = trộn phổ giá (xem `sortSIMs`). Trước đây chỗ này để trống criteria nên
  // rơi vào nhánh mặc định "giá tăng dần": 40 thẻ đầu — thứ khách nhìn thấy trước
  // tiên khi mở web — đều là số 800k–990k điểm đẹp 0–25, giấu mất 2.250 số VIP
  // trong kho. Phải khớp với sort mặc định của SimBrowser, nếu không trang vừa
  // hiện xong sẽ tự nhảy sang một thứ tự khác ngay khi react-query trả về.
  const catalogue = filterSims(sims, { sortBy: "mix" });
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
      menhCounts: countMenh(sims),
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
        {/* 24/11/2026: GSC có "mobifone gần đây" (24 imp, pos 8, 0 click) đáp về trang
            chủ trong khi /diem-giao-dich-mobifone-quan-7 vẫn "URL is unknown to
            Google" — link nổi ngay dưới H1 để khách lẫn crawler thấy đường sang trang
            cửa hàng. Mobile giữ đúng 1 dòng để không đẩy lưới SIM xuống: cỡ chữ co
            theo bề ngang (đo Playwright 360–600px: chia 36 thì chuỗi vừa khít chỗ
            trống 100vw − 56px) nên đọc đủ địa chỉ; truncate chỉ là lưới an toàn. */}
        <a
          href="/diem-giao-dich-mobifone-quan-7"
          className="mb-3 flex max-w-full items-center rounded-full border border-gold/40 bg-gold/10 px-2 py-1 text-[length:clamp(9px,calc((100vw_-_56px)/36),11px)] font-medium leading-5 tracking-[-0.01em] text-gold transition-colors hover:border-gold hover:bg-gold/20 sm:inline-flex sm:px-3 sm:text-xs sm:tracking-normal md:text-sm"
        >
          <span className="truncate">{Q7_CHIP_TEXT}</span>
        </a>
        {/* Ẩn trên mobile: đoạn này cùng khối "Mẹo gõ nhanh" chiếm ~70% màn đầu
            390×844, đẩy thẻ SIM đầu tiên xuống mép dưới (54% khách Google thoát). */}
        <p className="mb-3 hidden text-sm text-muted-foreground md:block md:text-base">
          Quý khách chọn số theo tuổi, theo mệnh hoặc theo đuôi số ưa thích: tứ quý, tam hoa, phong thủy, thần tài, lộc phát. Đăng ký thông tin chính chủ, 30 phút nhận SIM.
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
