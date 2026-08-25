import type { Metadata } from "next";
import SimBrowser from "@/components/SimBrowser";
import FAQSection from "@/components/FAQSection";
import { faqData } from "@/data/faqData";
import { getServerSims } from "@/lib/serverSimData";
import { filterSims } from "@/lib/simFilter";
import { countTags, getUniquePrefixes } from "@/lib/simUtils";

const TITLE = "Kho SIM số đẹp Mobifone giá rẻ, chính chủ – CHONSOMOBIFONE.COM";
const DESCRIPTION =
  "Kho SIM số đẹp Mobifone: SIM tứ quý, phong thủy, tài lộc, năm sinh, giá rẻ. Tìm số ưng ý, giao SIM toàn quốc, sang tên chính chủ.";
const CANONICAL = "https://www.chonsomobifone.com/";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    title: TITLE,
    description:
      "Kho SIM số đẹp Mobifone: tứ quý, phong thủy, tài lộc, năm sinh. Giao SIM toàn quốc.",
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

export default async function HomePage() {
  // SSG-first: lấy 40 SIM đầu + facets lúc build để SimBrowser nhận initialData —
  // lần đầu vào web hiện SIM ngay (không còn skeleton "Đang tải..."), react-query
  // refetch nền cho dữ liệu luôn tươi. getServerSims đã cache module scope + trả
  // [] khi lỗi (build không vỡ, client tự retry).
  const sims = await getServerSims();
  const catalogue = filterSims(sims, {});
  const initialData = catalogue.slice(0, 40);
  const initialTotal = catalogue.length;
  const initialFacets = {
    tagCounts: countTags(sims),
    prefixes: getUniquePrefixes(sims),
  };

  return (
    <>
      <main className="container mx-auto px-4 pt-4 pb-6">
        {/* Visible h1: it carries the same SEO weight it did as sr-only, but now also
            tells a first-time visitor what the page is. It replaces the deleted hero
            banner as the first painted element, so it is the new LCP candidate. */}
        <h1 className="mb-2 text-lg font-bold leading-tight text-foreground md:text-2xl">
          SIM Mobifone số đẹp — <span className="text-gold">nhận SIM rồi mới trả tiền</span>
        </h1>
        <p className="mb-3 text-sm text-muted-foreground md:text-base">
          Tứ quý · phong thủy · thần tài lộc phát. Giá niêm yết công khai, sang tên chính chủ, giao tận tay nội thành HCM.
        </p>

        {/* Client island: search + filters + SIM grid (SSG initialData + server fetch
            qua /api/sims) + process steps + intro stats. */}
        <SimBrowser
          initialData={initialData}
          initialTotal={initialTotal}
          initialFacets={initialFacets}
        />

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
    </>
  );
}
