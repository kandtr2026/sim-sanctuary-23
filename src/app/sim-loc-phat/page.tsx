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

const ZALO_URL = "https://zalo.me/0933356666";

const TITLE = "Sim Lộc Phát 68 86 | Kho Sim Lộc Phát Mobifone Đẹp";
const DESCRIPTION =
  "Kho sim lộc phát Mobifone đẹp: đuôi 68, 86, 6868, 6688. Giá niêm yết công khai, sang tên chính chủ, nhận SIM rồi mới trả tiền, giao nội thành HCM 30 phút – 2 giờ.";
const CANONICAL = "https://www.chonsomobifone.com/sim-loc-phat";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    title: TITLE,
    description: "Sim lộc phát đuôi 68 (lộc phát) và 86 (phát lộc) Mobifone. Giá công khai, chính chủ.",
    url: CANONICAL,
    images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
  },
};

const faqItems = [
  {
    q: "Sim lộc phát là gì? Đuôi 68 và 86 khác nhau ra sao?",
    a: "Sim lộc phát là sim có hai số cuối là 68 (đọc là 'lộc phát') hoặc 86 (đọc là 'phát lộc'). Các cặp 6868, 6688 lặp lại liên tiếp càng được ưa chuộng. Với người kinh doanh, đuôi này gắn với kỳ vọng tài lộc sinh sôi, làm ăn phát đạt.",
  },
  {
    q: "Giá sim lộc phát bao nhiêu?",
    a: "Giá sim lộc phát Mobifone dao động từ vài trăm nghìn đến hàng chục triệu đồng, tùy đầu số và độ đẹp của dãy. Giá niêm yết công khai trên kho, không phát sinh phí ẩn.",
  },
  {
    q: "Mua sim lộc phát có sang tên chính chủ được không?",
    a: "Được. Toàn bộ sim lộc phát tại CHONSOMOBIFONE.COM đều hỗ trợ sang tên chính chủ. Bạn nhận SIM trước, kiểm tra kỹ rồi mới trả tiền; hỗ trợ đăng ký qua cửa hàng MobiFone hoặc ứng dụng My Mobifone.",
  },
  {
    q: "Giao sim lộc phát mất bao lâu?",
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
  { icon: Star, text: "Kho sim lộc phát Mobifone đẹp" },
  { icon: Shield, text: "Giao dịch an toàn, bảo mật" },
  { icon: CheckCircle, text: "Sang tên chính chủ" },
  { icon: DollarSign, text: "Giá niêm yết công khai" },
  { icon: Truck, text: "Nhận SIM rồi mới trả tiền" },
  { icon: Users, text: "Tư vấn chọn số 24/7" },
];

export default function SimLocPhatPage() {
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
              Sim Lộc Phát Mobifone — <span className="text-gold">đuôi 68, 86, 6868</span>
            </h1>
            <p className="mx-auto mb-5 max-w-xl text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              Sim lộc phát (68) và phát lộc (86). Giá niêm yết công khai, sang tên chính chủ, giao tận nơi nội thành HCM.
            </p>
            <div className="mx-auto flex max-w-md flex-col justify-center gap-2.5 sm:flex-row">
              <a
                href="#kho-sim"
                className="flex items-center justify-center gap-2 rounded-lg bg-gold px-7 py-2.5 font-bold text-header-bg shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-xl"
              >
                <Star className="h-4 w-4" /> Xem kho sim lộc phát
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
              Sim lộc phát là gì? Đuôi 68 và 86 khác nhau ra sao
            </h2>
            <div className="space-y-4 leading-relaxed text-muted-foreground">
              <p>
                Sim lộc phát là dòng sim số đẹp có hai số cuối là 68 hoặc 86. Trong cách đọc nhanh, 68 gần với "lộc
                phát" và 86 gần với "phát lộc" — cả hai đều quy về ý cầu tài lộc, thuận buồm xuôi gió trong làm ăn.
              </p>
              <p>
                Các đuôi lặp như <strong className="text-foreground">6868</strong> (lộc phát lộc phát),{" "}
                <strong className="text-foreground">6688</strong>, <strong className="text-foreground">8686</strong>{" "}
                được săn đón hơn vì dễ nhớ và khuếch đại ý nghĩa. Giá thành phụ thuộc chủ yếu vào đầu số và độ đẹp
                của dãy số.
              </p>
            </div>
          </section>

          <CategorySimGrid
            title="Kho Sim Lộc Phát Cập Nhật"
            searchPlaceholder="Nhập số hoặc *68 / *86 để tìm đuôi lộc phát..."
            emptyText="Hiện chưa có sim lộc phát đuôi phù hợp trong kho. Vui lòng thử lại sau."
            matchSuffixes={["68", "86"]}
          />

          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Giá sim lộc phát bao nhiêu?
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Sim lộc phát có giá từ vài trăm nghìn đến vài chục triệu đồng. Đuôi 6868, 6688, sim đầu 090/093, số dễ
              nhớ thường đắt hơn. Mọi số đều niêm yết giá công khai ngay trên kho — bạn chọn số trước, so giá trước,
              rồi mới đặt.
            </p>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Ai nên dùng sim lộc phát
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Người kinh doanh, chủ cửa hàng, người mua xe, mua nhà thường chọn sim lộc phát với kỳ vọng cầu phát đạt.
              Số cũng dễ đọc, dễ nhớ, tạo ấn tượng khi liên hệ với đối tác và khách hàng.
            </p>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Mua sim lộc phát ở đâu uy tín — cam kết &amp; sang tên
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
              { name: "Sim lộc phát", path: "/sim-loc-phat" },
            ]),
          ),
        }}
      />
    </>
  );
}
