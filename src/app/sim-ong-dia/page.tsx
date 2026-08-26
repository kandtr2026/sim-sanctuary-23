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

const TITLE = "Sim Ông Địa 38 78 | Kho Sim Ông Địa Mobifone Đẹp";
const DESCRIPTION =
  "Kho sim ông địa Mobifone đẹp: đuôi 38, 78, 7838 ông địa lớn nhỏ. Giá niêm yết công khai, sang tên chính chủ, nhận SIM rồi mới trả tiền, giao nội thành HCM 30 phút – 2 giờ.";
const CANONICAL = "https://www.chonsomobifone.com/sim-ong-dia";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    title: TITLE,
    description: "Sim ông địa đuôi 38, 78, 7838 Mobifone. Giá công khai, chính chủ.",
    url: CANONICAL,
    images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
  },
};

const faqItems = [
  {
    q: "Sim ông địa là gì? Đuôi 38 và 78 khác nhau ra sao?",
    a: "Sim ông địa là sim có hai số cuối là 38 hoặc 78 — gắn với tín ngưỡng Thần Tài – Ông Địa cầu tài lộc. Cặp 7838 (ông địa lớn, ông địa nhỏ) được ưa chuộng vì hội tụ cả hai. Khác biệt chủ yếu nằm ở ý nghĩa tâm lý; giá thành phụ thuộc vào đầu số và độ đẹp của dãy số.",
  },
  {
    q: "Giá sim ông địa bao nhiêu?",
    a: "Giá sim ông địa Mobifone dao động từ vài trăm nghìn đến vài chục triệu đồng, tùy đầu số, độ dễ nhớ và vị trí đuôi. Giá niêm yết công khai trên kho, không phát sinh phí ẩn.",
  },
  {
    q: "Mua sim ông địa có sang tên chính chủ được không?",
    a: "Được. Toàn bộ sim ông địa tại CHONSOMOBIFONE.COM đều hỗ trợ sang tên chính chủ. Bạn nhận SIM trước, kiểm tra kỹ rồi mới trả tiền; hỗ trợ đăng ký qua cửa hàng MobiFone hoặc ứng dụng My Mobifone.",
  },
  {
    q: "Giao sim ông địa mất bao lâu?",
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

const benefits = [
  { icon: Star, text: "Kho sim ông địa Mobifone đẹp" },
  { icon: Shield, text: "Giao dịch an toàn, bảo mật" },
  { icon: CheckCircle, text: "Sang tên chính chủ" },
  { icon: DollarSign, text: "Giá niêm yết công khai" },
  { icon: Truck, text: "Nhận SIM rồi mới trả tiền" },
  { icon: Users, text: "Tư vấn chọn số 24/7" },
];

export default async function SimOngDiaPage() {
  const snapshotSims = await getCategorySnapshot({ suffixes: ["38", "78"] }, 8);
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
              Sim Ông Địa Mobifone — <span className="text-gold">đuôi 38, 78, 7838</span>
            </h1>
            <p className="mx-auto mb-5 max-w-xl text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              Sim ông địa (38) và ông địa lớn (78). Giá niêm yết công khai, sang tên chính chủ, giao tận nơi nội thành HCM.
            </p>
            <div className="mx-auto flex max-w-md flex-col justify-center gap-2.5 sm:flex-row">
              <a
                href="#kho-sim"
                className="flex items-center justify-center gap-2 rounded-lg bg-gold px-7 py-2.5 font-bold text-header-bg shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-xl"
              >
                <Star className="h-4 w-4" /> Xem kho sim ông địa
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
              Sim ông địa là gì? Đuôi 38 và 78 khác nhau ra sao
            </h2>
            <div className="space-y-4 leading-relaxed text-muted-foreground">
              <p>
                Sim ông địa là dòng sim số đẹp có hai số cuối là 38 hoặc 78 — gắn với tín ngưỡng Thần Tài – Ông Địa
                trong dân gian, thường được người buôn bán, kinh doanh lựa chọn với kỳ vọng cầu tài lộc, đất đai,
                buôn may bán đắt.
              </p>
              <p>
                <strong className="text-foreground">Đuôi 38</strong> gắn với ông địa, <strong className="text-foreground">đuôi 78</strong> gắn với
                ông địa lớn, và cặp <strong className="text-foreground">7838</strong> (ông địa lớn – ông địa nhỏ) được ưa chuộng vì hội tụ cả
                hai. Giá thành phụ thuộc chủ yếu vào đầu số và độ đẹp của dãy số.
              </p>
            </div>
          </section>

          
          <CategorySimGrid
            title="Kho Sim Ông Địa Cập Nhật"
            searchPlaceholder="Nhập số hoặc *38 / *78 để tìm đuôi ông địa..."
            emptyText="Hiện chưa có sim ông địa đuôi phù hợp trong kho. Vui lòng thử lại sau."
            matchSuffixes={["38", "78"]}
          />

          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Giá sim ông địa bao nhiêu?
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Sim ông địa có giá từ vài trăm nghìn đến vài chục triệu đồng. Đuôi 7838, sim đầu 090/093, số dễ nhớ
              thường đắt hơn. Mọi số đều niêm yết giá công khai ngay trên kho — bạn chọn số trước, so giá trước, rồi
              mới đặt.
            </p>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Ai nên dùng sim ông địa
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Người kinh doanh, chủ cửa hàng, người buôn bán nhỏ là nhóm chọn sim ông địa nhiều nhất — bởi ý nghĩa
              cầu tài lộc, đất đai của cặp đuôi 38/78. Số cũng dễ nhớ, tạo ấn tượng khi khách liên hệ qua điện thoại.
            </p>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Mua sim ông địa ở đâu uy tín — cam kết &amp; sang tên
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-3 rounded-lg bg-secondary/40 p-4">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <b.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{b.text}</span>
                </div>
              ))}
            </div>
          </section>

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
              { name: "Sim ông địa", path: "/sim-ong-dia" },
            ]),
          ),
        }}
      />
    </>
  );
}
