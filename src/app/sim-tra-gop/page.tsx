import type { Metadata } from "next";
import { Phone, Star, Shield, CheckCircle, Truck, DollarSign, Users, Sparkles } from "lucide-react";
import CategorySimGrid from "@/components/CategorySimGrid";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buildBreadcrumb } from "@/lib/seo";
import { getCategorySnapshot } from "@/lib/serverSimData";

// ISR: prerender + revalidate every 300s (khớp /api/sims) so crawlers hit a
// cached page instead of forcing SSR (ƒ) on every request.
export const revalidate = 300;

const ZALO_URL = "https://zalo.me/0933356666";

const TITLE = "Mua Sim Trả Góp | Chọn SIM Số Đẹp Trả Góp Lãi Suất Tốt";
const DESCRIPTION =
  "Mua sim số đẹp trả góp tại CHONSOMOBIFONE.COM: tứ quý, thần tài, lộc phát. Trả trước 10–30%, kỳ hạn 6–12 tháng, sang tên chính chủ khi tất toán.";
const CANONICAL = "https://www.chonsomobifone.com/sim-tra-gop";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    title: TITLE,
    description: "Chọn sim số đẹp trả góp: tứ quý, thần tài, lộc phát. Trả trước 10–30%, sang tên chính chủ khi tất toán.",
    url: CANONICAL,
    images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
  },
};

const faqItems = [
  {
    q: "Mua sim trả góp là gì?",
    a: "Mua sim trả góp giúp Quý khách sở hữu số đẹp mà không phải trả toàn bộ một lần: thanh toán trước một phần giá trị sim (thường 10–30%), phần còn lại chia nhỏ trả dần theo tháng. Khi thanh toán đủ, sim được sang tên chính chủ cho Quý khách.",
  },
  {
    q: "Điều kiện để mua sim trả góp?",
    a: "Điều kiện cơ bản: có CMND/CCCD còn hiệu lực, thu nhập ổn định và không có lịch sử nợ xấu. Với sim giá trị lớn, đội ngũ tư vấn sẽ trao đổi cụ thể về hồ sơ và kỳ hạn phù hợp với dòng tiền của Quý khách.",
  },
  {
    q: "Khi nào sim được sang tên chính chủ?",
    a: "Sim được sang tên chính chủ ngay sau khi Quý khách thanh toán đủ toàn bộ giá trị sim theo thỏa thuận. Trong thời gian trả góp, mọi cam kết về việc sang tên đều được ghi rõ trong hợp đồng.",
  },
  {
    q: "Mua sim trả góp có phải trả lãi không?",
    a: "Tùy chương trình. Có những gói lãi suất 0% trong thời gian đầu, sau đó tính lãi theo thỏa thuận trong hợp đồng. Toàn bộ chi phí, kỳ hạn và số tiền phải trả mỗi tháng được nêu rõ trước khi Quý khách ký, không phát sinh phí ẩn.",
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

const conditions = [
  { icon: Users, text: "CMND/CCCD còn hiệu lực" },
  { icon: Shield, text: "Thu nhập ổn định, không nợ xấu" },
  { icon: DollarSign, text: "Trả trước 10–30% giá trị sim" },
  { icon: CheckCircle, text: "Kỳ hạn 6–12 tháng linh hoạt" },
  { icon: Truck, text: "Giao sim tận nơi, nhận SIM mới trả tiền đợt đầu" },
  { icon: Star, text: "Sang tên chính chủ khi tất toán" },
];

export default async function SimTraGopPage() {
  const snapshotSims = await getCategorySnapshot({}, 8);
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
              Mua Sim Trả Góp — <span className="text-gold">chọn số, trả dần hàng tháng</span>
            </h1>
            <p className="mx-auto mb-5 max-w-xl text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              Giúp Quý khách chủ động dòng tiền khi mua số đẹp: trả trước 10–30%, phần còn lại trả dần theo tháng, sang tên chính chủ khi tất toán.
            </p>
            <div className="mx-auto flex max-w-md flex-col justify-center gap-2.5 sm:flex-row">
              <a
                href="#kho-sim"
                className="flex items-center justify-center gap-2 rounded-lg bg-gold px-7 py-2.5 font-bold text-header-bg shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-xl"
              >
                <Star className="h-4 w-4" /> Chọn số trả góp
              </a>
              <a
                href={ZALO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg border border-primary-foreground/25 bg-primary-foreground/10 px-7 py-2.5 font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-foreground/20"
              >
                <Phone className="h-4 w-4" /> Tư vấn trả góp
              </a>
            </div>
          </div>
        </section>

        <div className="container mx-auto space-y-10 px-4 py-8 md:space-y-14 md:py-12">
          {/* Điều kiện */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Điều kiện mua sim trả góp
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {conditions.map((c, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg bg-secondary/40 p-4">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <c.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{c.text}</span>
                </div>
              ))}
            </div>
          </section>

          
          {/* Client island: SIM grid */}
          <CategorySimGrid
            title="Kho Sim Có Thể Trả Góp"
            searchPlaceholder="Nhập số hoặc *đuôi để tìm sim trả góp..."
            emptyText="Kho hiện chưa có số phù hợp. Quý khách vui lòng thử lại với dãy số khác."
            matchAll
          />

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
              { name: "Sim trả góp", path: "/sim-tra-gop" },
            ]),
          ),
        }}
      />
    </>
  );
}
