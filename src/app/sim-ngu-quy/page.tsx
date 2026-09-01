import type { Metadata } from "next";
import { Phone, Star, Shield, CheckCircle, Truck, DollarSign, Users, Sparkles } from "lucide-react";
import CategorySimGrid from "@/components/CategorySimGrid";
import CategoryFeaturedSims from "@/components/CategoryFeaturedSims";
import FaqAccordion from "@/components/FaqAccordion";
import { buildBreadcrumb } from "@/lib/seo";
import { getCategorySnapshotMix } from "@/lib/serverSimData";

// ISR: prerender + revalidate every 300s (khớp /api/sims) so crawlers hit a
// cached page instead of forcing SSR (ƒ) on every request.
export const revalidate = 300;

const ZALO_URL = "https://zalo.me/0933356666";

const TITLE = "Sim Ngũ Quý 88888 99999 | Kho Sim Ngũ Quý Mobifone";
const DESCRIPTION =
  "Sim ngũ quý Mobifone 88888, 99999 và lục quý — nhóm số khan hiếm. Giá niêm yết công khai, sang tên chính chủ, Quý khách nhận SIM kiểm tra rồi mới thanh toán.";
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
    a: "Ngũ quý là năm chữ số giống nhau đứng liền nhau trong dãy số, ví dụ 88888 hay 99999. Hơn tứ quý đúng một con số, nhưng khan hơn nhiều nên giá cũng ở bậc khác. Lục quý — sáu chữ số giống nhau — thuộc nhóm hiếm nhất.",
  },
  {
    q: "Giá sim ngũ quý bao nhiêu?",
    a: "Từ vài chục triệu đến hàng trăm triệu đồng. Mức giá đến từ con số được lặp (ngũ quý 8 và ngũ quý 9 đắt nhất), đầu số và vị trí cụm năm số trong dãy. Mỗi số hiện giá niêm yết ngay trên kho, Quý khách xem trước rồi mới đặt.",
  },
  {
    q: "Sim ngũ quý có sang tên chính chủ được không?",
    a: "Được — và với số giá trị cao thì đây là bước không thể bỏ qua. Ngũ quý, lục quý tại CHONSOMOBIFONE.COM đều sang tên chính chủ. Quý khách kiểm tra SIM trên tay trước, thanh toán sau; thủ tục chính chủ làm tại cửa hàng MobiFone hoặc trên ứng dụng My Mobifone.",
  },
  {
    q: "Giao sim ngũ quý mất bao lâu?",
    a: "Trong nội thành TP.HCM, đội ngũ giao trong 30 phút – 2 giờ làm việc. Tỉnh thành khác nhận qua chuyển phát nhanh sau 1–3 ngày làm việc. Quý khách chọn thanh toán COD lúc nhận hoặc chuyển khoản trước.",
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
  { icon: Star, text: "Kho ngũ quý, lục quý Mobifone" },
  { icon: Shield, text: "Giao dịch an toàn, bảo mật thông tin" },
  { icon: CheckCircle, text: "Sang tên chính chủ cho Quý khách" },
  { icon: DollarSign, text: "Giá niêm yết công khai từng số" },
  { icon: Truck, text: "Thanh toán sau khi nhận và kiểm tra SIM" },
  { icon: Users, text: "Đội ngũ tư vấn trực 24/7" },
];

export default async function SimNguQuyPage() {
  const featuredSims = await getCategorySnapshotMix({ tags: ["Ngũ quý", "Lục quý"] }, 10);
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
              Ngũ quý 8, ngũ quý 9 và lục quý — nhóm số khan, dãy đẹp thường có chủ sớm. Giá niêm yết công khai, sang tên chính chủ.
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

          {/* ===== DẢI "NỔI BẬT" — SỐ + GIÁ + Zalo NGAY SAU HERO ===== */}
          <CategoryFeaturedSims
            title="Sim Ngũ Quý Nổi Bật Trong Kho"
            sims={featuredSims}
            pageUrl={CANONICAL}
          />

          {/* ===== Ô TÌM + LƯỚI "KHO NGŨ QUÝ CẬP NHẬT" ===== */}
          <CategorySimGrid
            title="Sim Ngũ Quý, Lục Quý Mới Cập Nhật"
            searchPlaceholder="Nhập số cần tìm, hoặc *88888 / *99999 để xem đuôi ngũ quý"
            emptyText="Kho đang trống ở nhóm này — ngũ quý về lẻ và đi rất nhanh. Quý khách để lại yêu cầu qua Zalo 0933356666, đội ngũ tư vấn sẽ báo khi có dãy phù hợp."
            matchTags={["Ngũ quý", "Lục quý"]}
            quyFilter="Ngũ quý"
          />

          {/* ===== GIÁO DỤC (dời xuống sau sản phẩm, giữ nguyên nội dung SEO) ===== */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Sim ngũ quý là gì? Vì sao giá trị cao
            </h2>
            <div className="space-y-4 leading-relaxed text-muted-foreground">
              <p>
                Nhóm năm chữ số giống nhau liền nhau chỉ chiếm một phần rất nhỏ trong toàn kho, và những dãy đẹp thường
                có chủ sớm. Vì khan như vậy, nhiều khách hàng xem ngũ quý như một khoản tài sản: vừa dùng hằng ngày, vừa
                giữ được giá trị.
              </p>
              <p>
                Về cấu trúc, ngũ quý là năm chữ số giống nhau đứng liền nhau — 88888, 99999, 66666. So với tứ quý chỉ hơn
                đúng một con số, nhưng độ khan và giá thì nhảy sang bậc khác. Dân gian đọc{" "}
                <strong className="text-foreground">ngũ quý 8</strong> là phát đạt,{" "}
                <strong className="text-foreground">ngũ quý 9</strong> là trường cửu; còn lục quý — sáu chữ số giống nhau —
                hiếm hơn nữa và chủ yếu xuất hiện ở phân khúc cao.
              </p>
            </div>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Giá sim ngũ quý bao nhiêu?
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Sim ngũ quý Mobifone có giá từ vài chục triệu đến hàng trăm triệu đồng. Ngũ quý 8, ngũ quý 9 cùng đầu số cổ
              090/093 nằm ở nhóm đắt nhất. Từng số đều gắn giá niêm yết ngay trên kho, nên Quý khách nắm được mặt bằng giá
              và chủ động chọn dãy vừa tầm, không phải hỏi giá qua trung gian.
            </p>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Ai nên dùng sim ngũ quý
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Chủ doanh nghiệp, giám đốc, người thường xuyên trao danh thiếp chọn ngũ quý cho một việc rất rõ: đọc số một
              lần, đối tác nhớ luôn, và dãy số nói được vị thế mà không cần thêm lời nào. Nguồn số dạng này khan, nên khi
              thấy dãy vừa ý, Quý khách nên giữ sớm.
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

          <FaqAccordion items={faqItems} />

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
