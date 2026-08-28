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
  "Sim ông địa Mobifone đuôi 38, 78, 7838 cho người buôn bán: giá niêm yết công khai từng số, sang tên chính chủ, thanh toán sau khi nhận SIM, giao tận nơi.";
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
    a: "Sim ông địa là số có hai chữ số cuối 38 hoặc 78, gắn với tín ngưỡng Thần Tài – Ông Địa của người buôn bán. Đuôi 38 là ông địa, đuôi 78 là ông địa lớn, cặp 7838 hội tụ cả hai nên được hỏi nhiều nhất. Khác biệt nằm ở ý nghĩa tâm lý; còn giá cao hay thấp lại do đầu số và nhịp dãy số quyết định.",
  },
  {
    q: "Giá sim ông địa bao nhiêu?",
    a: "Từ vài trăm nghìn đến vài chục triệu đồng. Đầu số, độ dễ nhớ của dãy và vị trí đuôi số quyết định mức giá. Kho niêm yết giá công khai từng số, không phát sinh phí ẩn.",
  },
  {
    q: "Mua sim ông địa có sang tên chính chủ được không?",
    a: "Được. Sim ông địa tại CHONSOMOBIFONE.COM đều sang tên chính chủ cho Quý khách. Trình tự: Quý khách nhận SIM, kiểm tra kỹ, thanh toán sau; việc đăng ký chính chủ thực hiện tại cửa hàng MobiFone hoặc qua ứng dụng My Mobifone, có đội ngũ hướng dẫn từng bước.",
  },
  {
    q: "Giao sim ông địa mất bao lâu?",
    a: "Quý khách ở nội thành TP.HCM nhận số trong 30 phút – 2 giờ làm việc. Ngoài TP.HCM, SIM đi chuyển phát nhanh và tới trong 1–3 ngày làm việc. Quý khách trả tiền khi nhận hàng (COD) hoặc chuyển khoản trước.",
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
  { icon: Star, text: "Kho sim ông địa đuôi 38, 78, 7838" },
  { icon: Shield, text: "Giao dịch an toàn, bảo mật thông tin" },
  { icon: CheckCircle, text: "Hỗ trợ sang tên chính chủ" },
  { icon: DollarSign, text: "Giá niêm yết công khai từng số" },
  { icon: Truck, text: "Nhận SIM, kiểm tra rồi mới trả tiền" },
  { icon: Users, text: "Đội ngũ tư vấn trực 24/7" },
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
              Số dành cho người đứng bán: đuôi 38 (ông địa) và 78 (ông địa lớn). Quý khách xem giá ngay tại kho, nhận SIM rồi mới thanh toán.
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
                Khách hỏi sim ông địa gần như luôn là người đứng bán: chủ tiệm tạp hóa, quầy vật liệu, cửa hàng ăn, tiểu
                thương ngoài chợ. Bàn thờ Thần Tài – Ông Địa đặt ngay lối vào, và họ muốn con số dán trên bảng hiệu mang
                cùng một mong cầu: tài lộc, đất đai, buôn may bán đắt.
              </p>
              <p>
                Cụ thể, sim ông địa là số có hai chữ số cuối là 38 hoặc 78.{" "}
                <strong className="text-foreground">Đuôi 38</strong> gắn với ông địa,{" "}
                <strong className="text-foreground">đuôi 78</strong> gắn với ông địa lớn, còn{" "}
                <strong className="text-foreground">7838</strong> ghép cả hai nên được hỏi nhiều nhất. Giá thì đầu số
                quyết định phần lớn, sau đó mới tới việc dãy số có dễ đọc, dễ nhớ hay không.
              </p>
            </div>
          </section>

          
          <CategorySimGrid
            title="Sim Ông Địa Đuôi 38, 78 Mới Cập Nhật"
            searchPlaceholder="Nhập số cần tìm, hoặc *38 / *78 để xem đuôi ông địa"
            emptyText="Kho chưa có số khớp yêu cầu này. Quý khách thử *38, *78 hoặc 7838; cần gấp thì nhắn Zalo 0933356666, đội ngũ tư vấn sẽ lọc kho theo ngân sách của Quý khách."
            matchSuffixes={["38", "78"]}
          />

          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Giá sim ông địa bao nhiêu?
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Sim ông địa có giá từ vài trăm nghìn đến vài chục triệu đồng. Đuôi 7838, số đầu 090/093 và các dãy dễ nhớ
              thuộc nhóm cao hơn. Toàn kho đã gắn giá sẵn: Quý khách xem giá, đối chiếu vài số rồi mới đặt, không cần hỏi
              giá qua từng tin nhắn.
            </p>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Ai nên dùng sim ông địa
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Nhóm chọn đuôi 38/78 nhiều nhất là chủ cửa hàng, người kinh doanh nhỏ và tiểu thương. Ý nghĩa cầu tài lộc,
              đất đai là một phần; phần còn lại rất thực tế — số dễ nhớ, khách gọi lại không phải tra sổ. Nếu Quý khách
              đang dùng số cho việc bán hàng, đây là nhóm đuôi đáng xem trước.
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
