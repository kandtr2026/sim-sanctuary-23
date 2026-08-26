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

const TITLE = "Sim Ngũ Quý 88888 99999 | Kho Sim Ngũ Quý Mobifone";
const DESCRIPTION =
  "Kho sim ngũ quý Mobifone đẹp: 88888, 99999, lục quý. Giá niêm yết công khai, sang tên chính chủ, nhận SIM rồi mới trả tiền, giao nội thành HCM 30 phút – 2 giờ.";
const CANONICAL = "https://www.chonsomobifone.com/sim-ngu-quy";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    title: TITLE,
    description: "Sim ngũ quý 88888, 99999 và lục quý Mobifone. Giá công khai, chính chủ.",
    url: CANONICAL,
    images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
  },
};

const faqItems = [
  {
    q: "Sim ngũ quý là gì?",
    a: "Sim ngũ quý là sim có 5 chữ số giống nhau liền nhau trong dãy số, ví dụ 88888, 99999. Đây là dòng sim hiếm, giá trị cao hơn tứ quý vì độ khó sở hữu và tính thẩm mỹ. Sim lục quý (6 số giống nhau) càng hiếm hơn nữa.",
  },
  {
    q: "Giá sim ngũ quý bao nhiêu?",
    a: "Sim ngũ quý Mobifone có giá từ vài chục triệu đến hàng trăm triệu đồng, tùy số (ngũ quý 8, 9 đắt nhất), đầu số và vị trí cụm số. Giá niêm yết công khai trên kho, không phát sinh phí ẩn.",
  },
  {
    q: "Sim ngũ quý có sang tên chính chủ được không?",
    a: "Được. Toàn bộ sim ngũ quý tại CHONSOMOBIFONE.COM đều hỗ trợ sang tên chính chủ. Bạn nhận SIM trước, kiểm tra kỹ rồi mới trả tiền; hỗ trợ đăng ký qua cửa hàng MobiFone hoặc ứng dụng My Mobifone.",
  },
  {
    q: "Giao sim ngũ quý mất bao lâu?",
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
  { icon: Star, text: "Kho sim ngũ quý Mobifone hiếm" },
  { icon: Shield, text: "Giao dịch an toàn, bảo mật" },
  { icon: CheckCircle, text: "Sang tên chính chủ" },
  { icon: DollarSign, text: "Giá niêm yết công khai" },
  { icon: Truck, text: "Nhận SIM rồi mới trả tiền" },
  { icon: Users, text: "Tư vấn chọn số 24/7" },
];

export default async function SimNguQuyPage() {
  const snapshotSims = await getCategorySnapshot({ tags: ["Ngũ quý", "Lục quý"] }, 8);
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
              Sim Ngũ Quý Mobifone — <span className="text-gold">88888, 99999, lục quý</span>
            </h1>
            <p className="mx-auto mb-5 max-w-xl text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              Sim ngũ quý 8, ngũ quý 9 và lục quý — dòng sim hiếm, giá trị cao. Giá công khai, sang tên chính chủ.
            </p>
            <div className="mx-auto flex max-w-md flex-col justify-center gap-2.5 sm:flex-row">
              <a
                href="#kho-sim"
                className="flex items-center justify-center gap-2 rounded-lg bg-gold px-7 py-2.5 font-bold text-header-bg shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-xl"
              >
                <Star className="h-4 w-4" /> Xem kho sim ngũ quý
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
              Sim ngũ quý là gì? Vì sao giá trị cao
            </h2>
            <div className="space-y-4 leading-relaxed text-muted-foreground">
              <p>
                Sim ngũ quý là sim có 5 chữ số giống nhau đứng liền nhau — 88888, 99999, 66666... Đây là dòng sim số
                đẹp hiếm, sở hữu nhiều hơn tứ quý đúng một con số nhưng độ khan hiếm và giá trị lại tăng rất nhanh.
              </p>
              <p>
                Trong phong thủy dân gian, <strong className="text-foreground">ngũ quý 8</strong> (88888) gắn với "phát
                đạt" và <strong className="text-foreground">ngũ quý 9</strong> (99999) gắn với "trường cửu, vĩnh cửu".
                Sim lục quý (6 số giống nhau) thậm chí còn hiếm hơn, thường chỉ xuất hiện ở phân khúc cao cấp.
              </p>
            </div>
          </section>

          
          <CategorySimGrid
            title="Kho Sim Ngũ Quý Cập Nhật"
            searchPlaceholder="Nhập số hoặc *88888 / *99999 để tìm đuôi ngũ quý..."
            emptyText="Hiện chưa có sim ngũ quý phù hợp trong kho. Vui lòng thử lại sau."
            matchTags={["Ngũ quý", "Lục quý"]}
            quyFilter="Ngũ quý"
          />

          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Giá sim ngũ quý bao nhiêu?
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Sim ngũ quý Mobifone có giá từ vài chục triệu đến hàng trăm triệu đồng. Ngũ quý 8, ngũ quý 9 và đầu số
              cổ 090/093 đắt nhất. Mọi số đều niêm yết giá công khai ngay trên kho — bạn chọn số trước, so giá trước,
              rồi mới đặt.
            </p>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Ai nên dùng sim ngũ quý
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Người muốn khẳng định vị thế, giám đốc, chủ doanh nghiệp thường chọn sim ngũ quý như một tài sản vừa dùng
              vừa giữ giá trị. Dòng sim này hiếm và khan trên thị trường, nên số đẹp thường được giữ sớm.
            </p>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Mua sim ngũ quý ở đâu uy tín — cam kết &amp; sang tên
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
                <a href="/mua-sim-tu-quy" className="font-medium text-primary underline-offset-2 hover:underline">
                  Sim tứ quý
                </a>
              </li>
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
              { name: "Sim ngũ quý", path: "/sim-ngu-quy" },
            ]),
          ),
        }}
      />
    </>
  );
}
