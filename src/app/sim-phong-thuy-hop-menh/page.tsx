import type { Metadata } from "next";
import { Phone, Star, Sparkles } from "lucide-react";
import PhongThuyMenhTool from "./PhongThuyMenhTool";
import CategorySimPriceList from "@/components/CategorySimPriceList";
import FaqAccordion, { type FaqItem } from "@/components/FaqAccordion";
import { buildBreadcrumb } from "@/lib/seo";
import { getCategorySnapshot } from "@/lib/serverSimData";
import { PT_COPY, PT_LINKS } from "./copy";
import { renderLinkedText, toPlainText } from "./linkedText";

// ISR: prerender + revalidate every 300s (khớp /api/sims) so crawlers hit a
// cached page instead of forcing SSR (ƒ) on every request.
export const revalidate = 300;

const ZALO_URL = "https://zalo.me/0933686666";

// 25/11/2026 (A Khoa duyệt): trang này thành "Sim Phong Thủy MobiFone" nhắm
// "sim phong thủy" (22.200 lượt/tháng, chưa trang nào nhắm vào — /sim-phong-thuy
// là công cụ bói, không phải kho để mua). Chữ lấy nguyên văn từ Terra (copy.ts).
// URL + canonical GIỮ NGUYÊN.
const TITLE = PT_COPY.title;
const DESCRIPTION = PT_COPY.description;
const CANONICAL = "https://www.chonsomobifone.com/sim-phong-thuy-hop-menh";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: CANONICAL,
    images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
  },
};

// 5 câu mới (Terra) trước, sau đó 2 câu cũ không trùng ý. Bỏ "Sim phong thủy
// hợp mệnh là gì?" và "Cách xác định mệnh theo năm sinh?" (trùng câu 1–2 mới).
// HTML và FAQPage JSON-LD dùng chung mảng này.
const faqItems: FaqItem[] = [
  ...PT_COPY.faqs,
  {
    q: "Có thể mua sim phong thủy trả góp không?",
    a: "Có. Quý khách xem thêm thông tin về hình thức mua sim trả góp tại /sim-tra-gop.",
  },
  {
    q: "Giao sim phong thủy mất bao lâu?",
    a: "30 phút giao toàn quốc. Quý khách nhận SIM, kiểm tra rồi mới thanh toán (COD).",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.q,
    // Cùng chữ với HTML: đường dẫn thô đã đổi thành nhãn của link.
    acceptedAnswer: { "@type": "Answer", text: toPlainText(item.a, PT_LINKS) },
  })),
};

const [S0, S1, S2] = PT_COPY.sections;

const MENH_LINKS = [
  { href: "/sim-theo-menh/kim", label: "Sim hợp mệnh Kim" },
  { href: "/sim-theo-menh/moc", label: "Sim hợp mệnh Mộc" },
  { href: "/sim-theo-menh/thuy", label: "Sim hợp mệnh Thủy" },
  { href: "/sim-theo-menh/hoa", label: "Sim hợp mệnh Hỏa" },
  { href: "/sim-theo-menh/tho", label: "Sim hợp mệnh Thổ" },
];

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
              {PT_COPY.h1}
            </h1>
            <p className="mx-auto mb-5 max-w-xl text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              {PT_COPY.intro}
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
          {/* section[0]: sim phong thủy là gì */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              {S0.h2}
            </h2>
            <p className="leading-relaxed text-muted-foreground">{renderLinkedText(S0.body, PT_LINKS)}</p>
          </section>

          {/* section[1]: chọn theo mệnh + bảng mệnh (bảng giữ nguyên) */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              {S1.h2}
            </h2>
            <p className="mb-5 leading-relaxed text-muted-foreground">{renderLinkedText(S1.body, PT_LINKS)}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Mệnh</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Hành sinh mệnh</th>
                    <th className="px-4 py-3 text-left font-semibold text-foreground">Số cùng hành</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50 hover:bg-secondary/30"><td className="px-4 py-3 font-bold text-foreground">Kim</td><td className="px-4 py-3 text-muted-foreground">Thổ sinh Kim — số 2, 5, 8</td><td className="px-4 py-3 text-primary font-semibold">6, 7</td></tr>
                  <tr className="border-b border-border/50 hover:bg-secondary/30"><td className="px-4 py-3 font-bold text-foreground">Mộc</td><td className="px-4 py-3 text-muted-foreground">Thủy sinh Mộc — số 0, 1</td><td className="px-4 py-3 text-primary font-semibold">3, 4</td></tr>
                  <tr className="border-b border-border/50 hover:bg-secondary/30"><td className="px-4 py-3 font-bold text-foreground">Thủy</td><td className="px-4 py-3 text-muted-foreground">Kim sinh Thủy — số 6, 7</td><td className="px-4 py-3 text-primary font-semibold">0, 1</td></tr>
                  <tr className="border-b border-border/50 hover:bg-secondary/30"><td className="px-4 py-3 font-bold text-foreground">Hỏa</td><td className="px-4 py-3 text-muted-foreground">Mộc sinh Hỏa — số 3, 4</td><td className="px-4 py-3 text-primary font-semibold">9</td></tr>
                  <tr className="border-b border-border/50 hover:bg-secondary/30"><td className="px-4 py-3 font-bold text-foreground">Thổ</td><td className="px-4 py-3 text-muted-foreground">Hỏa sinh Thổ — số 9</td><td className="px-4 py-3 text-primary font-semibold">2, 5, 8</td></tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Chữ số quy về ngũ hành theo Hà Đồ: 0, 1 Thủy · 2, 5, 8 Thổ · 3, 4 Mộc · 6, 7 Kim · 9 Hỏa. Số thuộc hành
              sinh ra mệnh được ưu tiên nhất, kế đến là số cùng hành với mệnh. Đây là quan niệm dân gian nên chỉ mang
              tính tham khảo. Muốn xem chi tiết hơn theo tuổi, Quý khách
              dùng công cụ{" "}
              <a href="/sim-phong-thuy" className="font-medium text-primary underline-offset-2 hover:underline">
                xem sim phong thủy
              </a>.
            </p>
          </section>

          {/* Bảng giá thật + ItemList/Product/Offer trong HTML thô — công cụ chọn
              mệnh bên dưới là client island, bot không đọc được dữ liệu của nó. */}
          <CategorySimPriceList
            title="Giá sim đang bán trong kho"
            sims={snapshotSims}
            pageUrl={CANONICAL}
            note="Bảng lấy 8 số có giá thấp nhất trong kho tại thời điểm cập nhật. Quý khách lọc theo mệnh bằng công cụ ngay bên dưới."
          />

          {/* Client island: mệnh picker + grid */}
          <PhongThuyMenhTool />

          {/* section[2]: mua thế nào — thay khối cũ "Mua sim phong thủy hợp mệnh ở đâu uy tín?" */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              {S2.h2}
            </h2>
            <p className="leading-relaxed text-muted-foreground">{renderLinkedText(S2.body, PT_LINKS)}</p>
          </section>

          {/* FAQ */}
          <FaqAccordion items={faqItems} renderAnswer={(a) => renderLinkedText(a, PT_LINKS)} />

          {/* Cross-links */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Xem thêm các dòng sim khác
            </h2>
            <ul className="flex flex-wrap gap-3 text-sm">
              {MENH_LINKS.map((m) => (
                <li key={m.href}>
                  <a href={m.href} className="font-medium text-primary underline-offset-2 hover:underline">
                    {m.label}
                  </a>
                </li>
              ))}
              <li>
                <a href="/sim-phong-thuy" className="font-medium text-primary underline-offset-2 hover:underline">
                  Bói sim phong thủy miễn phí
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