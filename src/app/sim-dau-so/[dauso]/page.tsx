import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Phone, Star, Sparkles } from "lucide-react";
import CategorySimGrid from "@/components/CategorySimGrid";
import SimSnapshot from "@/components/SimSnapshot";
import TrustCommitments from "@/components/TrustCommitments";
import CustomerProof from "@/components/CustomerProof";
import LeadMagnetCta from "@/components/LeadMagnetCta";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buildBreadcrumb } from "@/lib/seo";
import { getCategorySnapshot } from "@/lib/serverSimData";

const ZALO_URL = "https://zalo.me/0933356666";
const BASE_URL = "https://www.chonsomobifone.com";

// Mobifone prefixes with a dedicated category page. Each entry drives the
// generateStaticParams pre-render, generateMetadata, H1 and sitemap. Unknown
// prefixes (e.g. a Viettel 098) 404 rather than soft-render an empty page.
const PREFIXES = ["090", "093", "070", "076", "077", "078", "079", "089"] as const;

const isValidPrefix = (dauso: string): dauso is (typeof PREFIXES)[number] =>
  (PREFIXES as readonly string[]).includes(dauso);

type Props = {
  params: Promise<{ dauso: string }>;
};

export function generateStaticParams() {
  return PREFIXES.map((dauso) => ({ dauso }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { dauso } = await params;
  if (!isValidPrefix(dauso)) return {};

  const title = `Sim ${dauso} Mobifone | Kho Sim Đầu Số ${dauso} Đẹp, Giá Tốt`;
  const description = `Kho sim đầu số ${dauso} Mobifone đẹp, giá tốt: tứ quý, thần tài, lộc phát, phong thủy. Giá niêm yết công khai, sang tên chính chủ, giao nội thành HCM 30 phút – 2 giờ.`;
  const canonical = `${BASE_URL}/sim-dau-so/${dauso}`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title,
      description: `Kho sim đầu số ${dauso} Mobifone đẹp, giá tốt. Giá công khai, chính chủ.`,
      url: canonical,
      images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
    },
  };
}

export default async function SimDauSoPage({ params }: Props) {
  const { dauso } = await params;
  if (!isValidPrefix(dauso)) notFound();

  const snapshotSims = await getCategorySnapshot({ prefixes: [dauso] }, 8);

  const faqItems = [
    {
      q: `Sim đầu số ${dauso} giá bao nhiêu?`,
      a: `Sim đầu số ${dauso} Mobifone có giá từ vài trăm nghìn đến hàng chục triệu đồng, tùy độ đẹp của dãy số (tứ quý, thần tài, lộc phát, phong thủy). Giá niêm yết công khai ngay trên kho, không phát sinh phí ẩn.`,
    },
    {
      q: `Mua sim đầu số ${dauso} có sang tên chính chủ được không?`,
      a: `Được. Toàn bộ sim đầu số ${dauso} tại CHONSOMOBIFONE.COM đều hỗ trợ sang tên chính chủ. Bạn nhận SIM trước, kiểm tra kỹ rồi mới trả tiền; hỗ trợ đăng ký qua cửa hàng MobiFone hoặc ứng dụng My Mobifone.`,
    },
    {
      q: `Giao sim đầu số ${dauso} mất bao lâu?`,
      a: "Nội thành TP.HCM: 30 phút – 2 giờ làm việc. Các tỉnh thành khác: 1–3 ngày làm việc qua chuyển phát nhanh. Thanh toán COD khi nhận hàng hoặc chuyển khoản trước.",
    },
  ];

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      <main className="min-h-screen bg-background">
        <section
          style={{ minHeight: "clamp(300px, 38vw, 380px)" }}
          className="relative flex items-center bg-gradient-to-b from-primary via-primary-dark to-primary text-primary-foreground"
        >
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.07]"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 50%, hsl(var(--gold)) 0%, transparent 50%), radial-gradient(circle at 75% 50%, hsl(var(--gold)) 0%, transparent 50%)`,
            }}
          />
          <div className="container relative mx-auto px-4 py-6 text-center">
            <div className="mb-2 flex justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 bg-gold/15">
                <Sparkles className="h-5 w-5 text-gold" />
              </div>
            </div>
            <h1 className="mx-auto mb-3 max-w-3xl text-2xl font-extrabold leading-tight sm:text-3xl md:text-4xl">
              Sim {dauso} Mobifone — <span className="text-gold">kho số đẹp giá tốt</span>
            </h1>
            <p className="mx-auto mb-5 max-w-xl text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              Sim đầu số {dauso} Mobifone: tứ quý, thần tài, lộc phát, phong thủy. Giá công khai, sang tên chính chủ,
              giao tận nơi nội thành HCM.
            </p>
            <div className="mx-auto flex max-w-md flex-col justify-center gap-2.5 sm:flex-row">
              <a
                href="#kho-sim"
                className="flex items-center justify-center gap-2 rounded-lg bg-gold px-7 py-2.5 font-bold text-header-bg shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-xl"
              >
                <Star className="h-4 w-4" /> Xem kho sim {dauso}
              </a>
              <a
                href={ZALO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg border border-primary-foreground/25 bg-primary-foreground/10 px-7 py-2.5 font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-foreground/20"
              >
                <Phone className="h-4 w-4" /> Tư vấn chọn sim
              </a>
            </div>
          </div>
        </section>

        <div className="container mx-auto space-y-10 px-4 py-8 md:space-y-14 md:py-12">
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Sim đầu số {dauso} Mobifone có gì đặc biệt?
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Đầu số {dauso} thuộc Mobifone, một trong những nhà mạng có mạng lưới phủ sóng rộng tại Việt Nam. Kho
              đầu số {dauso} bao gồm sim tứ quý, thần tài, lộc phát, phong thủy và sim số thường — tùy ngân sách bạn
              chọn.
            </p>
          </section>

          <SimSnapshot title={`Sim ${dauso} Nổi Bật Trong Kho`} sims={snapshotSims} />

          <CategorySimGrid
            title={`Kho Sim ${dauso} Cập Nhật`}
            searchPlaceholder={`Nhập số cần tìm trong kho ${dauso}...`}
            emptyText={`Hiện chưa có sim đầu số ${dauso} phù hợp trong kho. Vui lòng thử lại sau.`}
            matchPrefixes={[dauso]}
          />

          <TrustCommitments />
          <CustomerProof />
          <LeadMagnetCta />

          {/* FAQ */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Câu hỏi thường gặp
            </h2>
            <Accordion type="single" collapsible className="space-y-2">
              {faqItems.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  className="rounded-lg border border-border px-4 data-[state=open]:bg-secondary/30"
                >
                  <AccordionTrigger className="py-4 text-left font-medium text-foreground hover:text-primary hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* Cross-links to other prefixes + categories */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Các đầu số Mobifone khác
            </h2>
            <ul className="flex flex-wrap gap-3 text-sm">
              {PREFIXES.map((p) => (
                <li key={p}>
                  <a
                    href={`/sim-dau-so/${p}`}
                    className={`font-medium underline-offset-2 hover:underline ${
                      p === dauso ? "text-muted-foreground" : "text-primary"
                    }`}
                  >
                    Sim {p}
                  </a>
                </li>
              ))}
            </ul>
            <h3 className="mb-2 mt-6 text-lg font-bold text-foreground">Dòng sim nổi bật</h3>
            <ul className="flex flex-wrap gap-3 text-sm">
              <li>
                <a href="/sim-than-tai" className="font-medium text-primary underline-offset-2 hover:underline">
                  Sim thần tài
                </a>
              </li>
              <li>
                <a href="/sim-loc-phat" className="font-medium text-primary underline-offset-2 hover:underline">
                  Sim lộc phát
                </a>
              </li>
              <li>
                <a href="/mua-sim-tu-quy" className="font-medium text-primary underline-offset-2 hover:underline">
                  Sim tứ quý
                </a>
              </li>
            </ul>
          </section>
        </div>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumb([
              { name: "Trang chủ", path: "/" },
              { name: "Sim theo đầu số", path: "/sim-dau-so/090" },
              { name: `Sim ${dauso}`, path: `/sim-dau-so/${dauso}` },
            ]),
          ),
        }}
      />
    </>
  );
}
