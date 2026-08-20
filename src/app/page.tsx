import type { Metadata } from "next";
import SimBrowser from "@/components/SimBrowser";
import FAQSection from "@/components/FAQSection";
import { faqData } from "@/data/faqData";

const TITLE = "Kho SIM số đẹp Mobifone giá rẻ – CHONSOMOBIFONE.COM";
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

export default function HomePage() {
  return (
    <>
      <main className="container mx-auto px-4 pt-4 pb-6">
        {/* Visible h1: it carries the same SEO weight it did as sr-only, but now also
            tells a first-time visitor what the page is. It replaces the deleted hero
            banner as the first painted element, so it is the new LCP candidate. */}
        <h1 className="mb-3 text-lg font-bold leading-tight text-foreground md:text-2xl">
          Kho SIM Mobifone số đẹp — <span className="text-gold">giá tốt, giao nhanh</span>
        </h1>

        {/* Client island: search + filters + SIM grid (data fetched client-side via
            useSimData) + process steps + intro stats. */}
        <SimBrowser />

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
