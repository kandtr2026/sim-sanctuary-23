import type { Metadata } from "next";
import { Phone, Star, Sparkles } from "lucide-react";
import PhongThuyMenhTool from "./PhongThuyMenhTool";
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

const TITLE = "SIM Phong Thủy Hợp Mệnh | Chọn Số Hợp Mệnh Kim, Mộc, Thủy, Hỏa, Thổ";
const DESCRIPTION =
  "Kho sim phong thủy hợp mệnh Mobifone: chọn số theo mệnh Kim, Mộc, Thủy, Hỏa, Thổ. Giá niêm yết công khai, sang tên chính chủ, nhận SIM rồi mới trả tiền.";
const CANONICAL = "https://www.chonsomobifone.com/sim-phong-thuy-hop-menh";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    title: TITLE,
    description: "Chọn sim phong thủy hợp mệnh Kim, Mộc, Thủy, Hỏa, Thổ Mobifone. Giá công khai, chính chủ.",
    url: CANONICAL,
    images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
  },
};

const faqItems = [
  {
    q: "Sim phong thủy hợp mệnh là gì?",
    a: "Sim phong thủy hợp mệnh là sim số đẹp được chọn dựa trên ngũ hành của người dùng — mỗi mệnh Kim, Mộc, Thủy, Hỏa, Thổ hợp với một số may mắn nhất định. Theo quan niệm dân gian, số điện thoại hợp mệnh được tin là mang lại may mắn và thuận lợi trong cuộc sống.",
  },
  {
    q: "Cách xác định mệnh theo năm sinh?",
    a: "Mệnh được xác định theo thiên can – địa chi của năm sinh âm lịch, nên chỉ cần năm sinh là tra được. Nếu chưa chắc chắn, Quý khách dùng công cụ xem sim phong thủy tại /sim-phong-thuy hoặc liên hệ đội ngũ tư vấn để được hỗ trợ.",
  },
  {
    q: "Có thể mua sim phong thủy trả góp không?",
    a: "Có. Quý khách xem thêm thông tin về hình thức mua sim trả góp tại /sim-tra-gop.",
  },
  {
    q: "Giao sim phong thủy mất bao lâu?",
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

export default async function SimPhongThuyHopMenhPage() {
  // General featured snapshot (no mệnh filter — mệnh is chosen client-side in
  // PhongThuyMenhTool). These are real numbers in the kho, rendered server-side
  // so crawlers see actual SIMs + Product/Offer schema.
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
              SIM Phong Thủy Hợp Mệnh — <span className="text-gold">chọn số theo mệnh Kim, Mộc, Thủy, Hỏa, Thổ</span>
            </h1>
            <p className="mx-auto mb-5 max-w-xl text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              Quý khách chọn mệnh, chúng tôi lọc sẵn những số có đuôi tương sinh. Giá niêm yết công khai,
              sang tên chính chủ, giao tận nơi nội thành HCM.
            </p>
            <div className="mx-auto flex max-w-md flex-col justify-center gap-2.5 sm:flex-row">
              <a
                href="#kho-sim"
                className="flex items-center justify-center gap-2 rounded-lg bg-gold px-7 py-2.5 font-bold text-header-bg shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-xl"
              >
                <Star className="h-4 w-4" /> Xem kho sim hợp mệnh
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
          {/* Mệnh guide */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Các mệnh và số may mắn tương ứng
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Mệnh</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Hành</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Số may mắn</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50 hover:bg-secondary/30"><td className="px-4 py-3 font-bold text-foreground">Kim</td><td className="px-4 py-3 text-muted-foreground">Thổ sinh Kim</td><td className="px-4 py-3 text-primary font-semibold">6, 7</td></tr>
                  <tr className="border-b border-border/50 hover:bg-secondary/30"><td className="px-4 py-3 font-bold text-foreground">Mộc</td><td className="px-4 py-3 text-muted-foreground">Thủy sinh Mộc</td><td className="px-4 py-3 text-primary font-semibold">3, 4</td></tr>
                  <tr className="border-b border-border/50 hover:bg-secondary/30"><td className="px-4 py-3 font-bold text-foreground">Thủy</td><td className="px-4 py-3 text-muted-foreground">Kim sinh Thủy</td><td className="px-4 py-3 text-primary font-semibold">1, 6</td></tr>
                  <tr className="border-b border-border/50 hover:bg-secondary/30"><td className="px-4 py-3 font-bold text-foreground">Hỏa</td><td className="px-4 py-3 text-muted-foreground">Mộc sinh Hỏa</td><td className="px-4 py-3 text-primary font-semibold">9</td></tr>
                  <tr className="border-b border-border/50 hover:bg-secondary/30"><td className="px-4 py-3 font-bold text-foreground">Thổ</td><td className="px-4 py-3 text-muted-foreground">Hỏa sinh Thổ</td><td className="px-4 py-3 text-primary font-semibold">2, 5, 8</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Số may mắn ở bảng trên dựa trên quan hệ tương sinh của ngũ hành: hành tương sinh với bản mệnh được ưu
              tiên. Đây là quan niệm dân gian nên chỉ mang tính tham khảo. Muốn xem chi tiết hơn theo tuổi, Quý khách
              dùng công cụ{" "}
              <a href="/sim-phong-thuy" className="font-medium text-primary underline-offset-2 hover:underline">
                xem sim phong thủy
              </a>.
            </p>
          </section>

          
          {/* Client island: mệnh picker + grid */}
          <PhongThuyMenhTool />

          {/* Trust */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Mua sim phong thủy hợp mệnh ở đâu uy tín?
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Mua số hợp mệnh nên bắt đầu từ sự minh bạch. Mỗi số trong kho CHONSOMOBIFONE.COM đều niêm yết giá công
              khai, kèm bộ lọc theo mệnh để Quý khách tự đối chiếu trước khi cần tới tư vấn. Chúng tôi hỗ trợ sang tên
              chính chủ và giao SIM tận nơi; Quý khách kiểm tra đúng số đã chọn rồi mới thanh toán.
            </p>
          </section>

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
              Xem thêm các dòng sim khác
            </h2>
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
              { name: "SIM phong thủy hợp mệnh", path: "/sim-phong-thuy-hop-menh" },
            ]),
          ),
        }}
      />
    </>
  );
}