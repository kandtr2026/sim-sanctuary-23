import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Phone, Star, Sparkles } from "lucide-react";
import CategorySimGrid from "@/components/CategorySimGrid";
import TrustCommitments from "@/components/TrustCommitments";
import LeadMagnetCta from "@/components/LeadMagnetCta";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buildBreadcrumb } from "@/lib/seo";
import { getCategorySnapshot } from "@/lib/serverSimData";
import {
  DAU_SO_PREFIXES,
  LOAI,
  LOAI_KEYS,
  isDauSoPrefix,
  isLoaiKey,
} from "@/lib/simTaxonomy";

// ISR: prerender each combo page + revalidate every 300s (khớp /api/sims) so
// crawlers hit a cached page instead of forcing SSR (ƒ) on every request.
export const revalidate = 300;

const ZALO_URL = "https://zalo.me/0933356666";
const BASE_URL = "https://www.chonsomobifone.com";

type Props = {
  params: Promise<{ dauso: string; loai: string }>;
};

export function generateStaticParams() {
  return DAU_SO_PREFIXES.flatMap((dauso) =>
    LOAI_KEYS.map((loai) => ({ dauso, loai })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { dauso, loai } = await params;
  if (!isDauSoPrefix(dauso) || !isLoaiKey(loai)) return {};

  const label = LOAI[loai].label;
  const title = `Sim ${label} đầu số ${dauso} Mobifone | Giá tốt, chính chủ`;
  const description = `Kho sim ${label} đầu số ${dauso} Mobifone đẹp, giá tốt: ${LOAI[loai].y}. Giá niêm yết công khai, sang tên chính chủ, giao nội thành HCM 30 phút – 2 giờ.`;
  const canonical = `${BASE_URL}/sim-dau-so/${dauso}/${loai}`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title,
      description: `Kho sim ${label} đầu số ${dauso} Mobifone đẹp, giá tốt. Giá công khai, chính chủ.`,
      url: canonical,
      images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
    },
  };
}

export default async function SimDauSoLoaiPage({ params }: Props) {
  const { dauso, loai } = await params;
  if (!isDauSoPrefix(dauso) || !isLoaiKey(loai)) notFound();

  const loaiInfo = LOAI[loai];
  const label = loaiInfo.label;

  const snapshotSims = await getCategorySnapshot(
    { prefixes: [dauso], suffixes: [...loaiInfo.suffixes] },
    8,
  );

  const faqItems = [
    {
      q: `Sim ${label} đầu số ${dauso} giá bao nhiêu?`,
      a: `Sim ${label} đầu số ${dauso} Mobifone có giá từ vài trăm nghìn đến hàng chục triệu đồng, tùy độ đẹp của dãy số. Giá niêm yết công khai ngay trên kho, không phát sinh phí ẩn.`,
    },
    {
      q: `Mua sim ${label} đầu số ${dauso} có sang tên chính chủ được không?`,
      a: `Được. Toàn bộ sim ${label} đầu số ${dauso} tại CHONSOMOBIFONE.COM đều hỗ trợ sang tên chính chủ. Bạn nhận SIM trước, kiểm tra kỹ rồi mới trả tiền; hỗ trợ đăng ký qua cửa hàng MobiFone hoặc ứng dụng My Mobifone.`,
    },
    {
      q: `Giao sim ${label} đầu số ${dauso} mất bao lâu?`,
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

  const otherLoai = LOAI_KEYS.filter((k) => k !== loai);
  const otherPrefixes = DAU_SO_PREFIXES.filter((p) => p !== dauso).slice(0, 4);

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
              Sim {label} đầu số {dauso} Mobifone —{" "}
              <span className="text-gold">giá tốt, chính chủ</span>
            </h1>
            <p className="mx-auto mb-5 max-w-xl text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              {loaiInfo.y}. Giá niêm yết công khai, sang tên chính chủ, giao tận nơi nội thành HCM.
            </p>
            <div className="mx-auto flex max-w-md flex-col justify-center gap-2.5 sm:flex-row">
              <a
                href="#kho-sim"
                className="flex items-center justify-center gap-2 rounded-lg bg-gold px-7 py-2.5 font-bold text-header-bg shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-xl"
              >
                <Star className="h-4 w-4" /> Xem kho sim {label} {dauso}
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
          
          <CategorySimGrid
            title={`Kho Sim ${label} Đầu Số ${dauso} Cập Nhật`}
            searchPlaceholder={`Nhập số hoặc *39 / *79 để tìm ${label} đầu ${dauso}...`}
            emptyText={`Hiện chưa có sim ${label} đầu số ${dauso} phù hợp trong kho. Vui lòng thử lại sau.`}
            matchPrefixes={[dauso]}
            matchSuffixes={[...loaiInfo.suffixes]}
          />

          <TrustCommitments />
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

          {/* Cross-links */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Xem thêm
            </h2>
            <h3 className="mb-2 text-lg font-bold text-foreground">Sim {label} các đầu số khác</h3>
            <ul className="flex flex-wrap gap-3 text-sm">
              {otherPrefixes.map((p) => (
                <li key={p}>
                  <a href={`/sim-dau-so/${p}/${loai}`} className="font-medium text-primary underline-offset-2 hover:underline">
                    Sim {label} {p}
                  </a>
                </li>
              ))}
            </ul>
            <h3 className="mb-2 mt-6 text-lg font-bold text-foreground">Loại sim khác đầu số {dauso}</h3>
            <ul className="flex flex-wrap gap-3 text-sm">
              {otherLoai.map((k) => (
                <li key={k}>
                  <a href={`/sim-dau-so/${dauso}/${k}`} className="font-medium text-primary underline-offset-2 hover:underline">
                    Sim {LOAI[k].label} {dauso}
                  </a>
                </li>
              ))}
              <li>
                <a href={`/sim-dau-so/${dauso}`} className="font-medium text-primary underline-offset-2 hover:underline">
                  Sim đầu số {dauso}
                </a>
              </li>
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
                <a href="/sim-ong-dia" className="font-medium text-primary underline-offset-2 hover:underline">
                  Sim ông địa
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
              { name: `Sim ${label} ${dauso}`, path: `/sim-dau-so/${dauso}/${loai}` },
            ]),
          ),
        }}
      />
    </>
  );
}
