import type { Metadata } from "next";
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

// ISR: prerender + revalidate every 300s (khớp /api/sims) so crawlers hit a
// cached page instead of forcing SSR (ƒ) on every request.
export const revalidate = 300;

const ZALO_URL = "https://zalo.me/0933356666";

const TITLE = "Sim Thần Tài 39 79 | Kho Sim Thần Tài Mobifone Đẹp";
const DESCRIPTION =
  "Kho sim thần tài Mobifone đẹp: đuôi 39 thần tài nhỏ, 79 thần tài lớn, 7939 thần tài lớn nhỏ. Giá niêm yết công khai, sang tên chính chủ, giao tận nơi nội thành HCM.";
const CANONICAL = "https://www.chonsomobifone.com/sim-than-tai";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    title: TITLE,
    description: "Sim thần tài 39 (thần tài nhỏ) và 79 (thần tài lớn) Mobifone. Giá công khai, chính chủ.",
    url: CANONICAL,
    images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
  },
};

const faqItems = [
  {
    q: "Sim thần tài là gì? Đuôi 39 và 79 khác nhau ra sao?",
    a: "Sim thần tài là sim có đuôi 39 (thần tài nhỏ) hoặc 79 (thần tài lớn). Cặp 7939 là 'thần tài lớn, thần tài nhỏ' được ưa chuộng vì hội tụ cả hai. Người kinh doanh thường chọn đuôi thần tài với kỳ vọng cầu tài lộc, buôn may bán đắt.",
  },
  {
    q: "Giá sim thần tài bao nhiêu?",
    a: "Giá sim thần tài Mobifone dao động từ vài trăm nghìn đến hàng chục triệu đồng, tùy đầu số (090, 093, 07x...), độ dễ nhớ của dãy số và vị trí đuôi. Giá niêm yết công khai trên kho, không phát sinh phí ẩn.",
  },
  {
    q: "Mua sim thần tài có sang tên chính chủ được không?",
    a: "Được. Toàn bộ sim thần tài tại CHONSOMOBIFONE.COM đều hỗ trợ sang tên chính chủ. Bạn nhận SIM trước, kiểm tra kỹ rồi mới trả tiền; hỗ trợ đăng ký chính chủ qua cửa hàng MobiFone hoặc ứng dụng My Mobifone.",
  },
  {
    q: "Giao sim thần tài mất bao lâu?",
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

export default async function SimThanTaiPage() {
  const snapshotSims = await getCategorySnapshot({ suffixes: ["39", "79"] }, 8);
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
              Sim Thần Tài Mobifone — <span className="text-gold">đuôi 39, 79, 7939</span>
            </h1>
            <p className="mx-auto mb-5 max-w-xl text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              Sim thần tài nhỏ (39), thần tài lớn (79). Giá niêm yết công khai, sang tên chính chủ, giao tận nơi nội thành HCM.
            </p>
            <div className="mx-auto flex max-w-md flex-col justify-center gap-2.5 sm:flex-row">
              <a
                href="#kho-sim"
                className="flex items-center justify-center gap-2 rounded-lg bg-gold px-7 py-2.5 font-bold text-header-bg shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-xl"
              >
                <Star className="h-4 w-4" /> Xem kho sim thần tài
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
          {/* Intro */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Sim thần tài là gì? Đuôi 39 và 79 khác nhau ra sao
            </h2>
            <div className="space-y-4 leading-relaxed text-muted-foreground">
              <p>
                Sim thần tài là dòng sim số đẹp có hai số cuối là 39 (thần tài nhỏ) hoặc 79 (thần tài lớn). Với người
                buôn bán, cặp đuôi này gắn với hình ảnh thần tài cầm vàng — cầu sự thuận lợi, tài lộc trong kinh doanh.
              </p>
              <p>
                <strong className="text-foreground">Đuôi 39</strong> được gọi là thần tài nhỏ, <strong className="text-foreground">đuôi 79</strong> là thần
                tài lớn, và cặp <strong className="text-foreground">7939</strong> (thần tài lớn – thần tài nhỏ) thường được săn đón nhất
                vì hội tụ cả hai. Khác biệt chủ yếu nằm ở ý nghĩa tâm lý; giá thành phụ thuộc vào đầu số và độ đẹp của dãy số.
              </p>
            </div>
          </section>

          {/* Server-rendered snapshot: real SIM numbers + ItemList/Product schema */}
          <SimSnapshot title="Sim Thần Tài Nổi Bật Trong Kho" sims={snapshotSims} pageUrl={CANONICAL} />

          {/* Client island: SIM grid */}
          <CategorySimGrid
            title="Kho Sim Thần Tài Cập Nhật"
            searchPlaceholder="Nhập số hoặc *39 / *79 để tìm đuôi thần tài..."
            emptyText="Hiện chưa có sim thần tài đuôi phù hợp trong kho. Vui lòng thử lại sau."
            matchSuffixes={["39", "79"]}
          />

          <LeadMagnetCta />

          {/* Price */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Giá sim thần tài bao nhiêu?
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Sim thần tài có giá từ vài trăm nghìn đến vài chục triệu đồng. Đuôi 7939, sim đầu 090/093, số dễ nhớ
              thường đắt hơn. Mọi số đều niêm yết giá công khai ngay trên kho — bạn chọn số trước, so giá trước, rồi mới
              đặt.
            </p>
          </section>

          {/* Customer proof */}
          <CustomerProof />

          {/* Who should buy */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Ai nên dùng sim thần tài
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Dân kinh doanh, chủ cửa hàng, người buôn bán nhỏ là nhóm chọn sim thần tài nhiều nhất — bởi ý nghĩa
              cầu tài lộc của cặp đuôi 39/79. Số cũng dễ nhớ, tạo ấn tượng với khách khi liên hệ qua điện thoại.
            </p>
          </section>

          {/* Trust */}
          <TrustCommitments />

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
              <li>
                <a href="/sim-phong-thuy-hop-menh" className="font-medium text-primary underline-offset-2 hover:underline">
                  Sim phong thủy hợp mệnh
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
              { name: "Sim thần tài", path: "/sim-than-tai" },
            ]),
          ),
        }}
      />
    </>
  );
}
