import type { Metadata } from "next";
import { Phone, Star, Sparkles } from "lucide-react";
import CategorySimGrid from "@/components/CategorySimGrid";
import CategorySimPriceList from "@/components/CategorySimPriceList";
import TrustCommitments from "@/components/TrustCommitments";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buildBreadcrumb, BASE_URL } from "@/lib/seo";
import { getCategorySnapshot } from "@/lib/serverSimData";
import { getTagInventory, formatTrieu, MIN_INDEXABLE_INVENTORY } from "@/lib/simDangSo";

export const revalidate = 300;

const ZALO_URL = "https://zalo.me/0933356666";

// Chuỗi tag đúng như trong ALL_SIM_TAGS (src/lib/simUtils.ts).
const TAG = "Dễ nhớ";

const TITLE = "Sim Dễ Nhớ Mobifone | Đuôi Lặp 8585, 6969, 8686";
const DESCRIPTION =
  "Sim dễ nhớ Mobifone có bốn số cuối là một cặp lặp lại: 8585, 6969, 8686. Hotline gọn cho chủ shop và người bán hàng. Giá rõ từng số, giao toàn quốc.";
const CANONICAL = `${BASE_URL}/sim-de-nho`;

export async function generateMetadata(): Promise<Metadata> {
  const { count } = await getTagInventory(TAG);
  const thin = count < MIN_INDEXABLE_INVENTORY;

  return {
    title: { absolute: TITLE },
    description: DESCRIPTION,
    alternates: { canonical: CANONICAL },
    ...(thin ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: "website",
      title: TITLE,
      description: "Sim dễ nhớ Mobifone — bốn số cuối là một cặp lặp lại 8585, 6969. Giá công khai.",
      url: CANONICAL,
      images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
    },
  };
}

const faqItems = [
  {
    q: "Sim dễ nhớ trên trang này được chọn theo luật nào?",
    a: "Bốn chữ số cuối phải là một cặp lặp lại đúng hai lần: 0902.888.585 (đuôi 8585), 0902.908.686 (đuôi 8686), 0909.936.969 (đuôi 6969). Cách chọn này giữ danh sách sạch, tránh cảnh gắn nhãn dễ nhớ cho những dãy chỉ nghe êm tai mà không có cấu trúc.",
  },
  {
    q: "Vì sao dãy lặp cặp lại dễ nhớ hơn?",
    a: "Người nghe không ghi bốn con số rời mà ghi một cặp rồi nhân đôi. Đuôi 8585 chỉ chiếm một ô nhớ thay vì bốn. Với người phải đọc số cho khách mỗi ngày, khác biệt này thấy ngay trong số lần phải nhắc lại.",
  },
  {
    q: "Sim dễ nhớ giá bao nhiêu?",
    a: "Cặp được lặp quyết định giá: 68, 86, 79, 39 cao nhất vì trùng nhóm tài lộc; các cặp trung tính như 52, 41 mềm hơn nhiều. Đầu số 090, 093 cộng thêm một bậc so với 07x. Từng số đều hiện giá niêm yết trong kho.",
  },
  {
    q: "Chọn sim dễ nhớ hay sim phong thủy?",
    a: "Nếu số dùng để nhận đơn, nhận cuộc gọi từ khách lạ, dãy dễ đọc mang lại lợi ích rõ hơn. Nếu Quý khách coi số như một phần hình ảnh cá nhân thì nên xét thêm ngũ hành. Nhiều số trong danh sách này đạt cả hai vì cặp lặp đã là 68 hay 79.",
  },
  {
    q: "Đặt sim dễ nhớ có mất phí giữ số không?",
    a: "Không. Quý khách chốt số, đội ngũ giữ số và hẹn giao. Nội thành TP.HCM nhận trong 30 phút – 2 giờ làm việc, tỉnh thành khác 1–3 ngày qua chuyển phát nhanh, kiểm tra SIM rồi mới thanh toán.",
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

export default async function SimDeNhoPage() {
  const [snapshotSims, stats] = await Promise.all([
    getCategorySnapshot({ tags: [TAG] }, 8),
    getTagInventory(TAG),
  ]);

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
              Sim Dễ Nhớ Mobifone — <span className="text-gold">8585, 6969, 8686</span>
            </h1>
            <p className="mx-auto mb-5 max-w-xl text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              {stats.count > 0
                ? `Một cặp số lặp lại ở đuôi, khách nghe một lần là ghi đúng. Kho còn ${stats.count.toLocaleString("vi-VN")} số, giá từ ${formatTrieu(stats.min)}.`
                : "Một cặp số lặp lại ở đuôi, khách nghe một lần là ghi đúng. Kho đang cập nhật, Quý khách nhắn Zalo để nhận số mới."}
            </p>
            <div className="mx-auto flex max-w-md flex-col justify-center gap-2.5 sm:flex-row">
              <a
                href="#kho-sim"
                className="flex items-center justify-center gap-2 rounded-lg bg-gold px-7 py-2.5 font-bold text-header-bg shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-xl"
              >
                <Star className="h-4 w-4" /> Xem kho sim dễ nhớ
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
          {/* ── 1. Mở bài: cái giá của một dãy số khó đọc ──────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Một dãy số khó đọc lấy đi của Quý khách bao nhiêu
            </h2>
            <div className="space-y-4 leading-relaxed text-muted-foreground">
              <p>
                Chủ một quầy hàng đọc số điện thoại cho khách vài chục lần mỗi ngày. Dãy nào rối thì mỗi lần mất thêm một
                câu &ldquo;dạ Anh Chị đọc lại giúp em&rdquo;, thêm một tin nhắn xác nhận, và đôi khi mất luôn một đơn vì
                khách lưu sai số.
              </p>
              <p>
                Cách chữa gọn nhất là chọn dãy có cấu trúc. Danh sách này gom những số có{" "}
                <strong className="text-foreground">bốn chữ số cuối là một cặp lặp lại</strong> — 8585, 6969, 8686. Người
                nghe chỉ cần ghi một cặp rồi nhân đôi, nên tỷ lệ đọc đúng ngay lần đầu cao hơn hẳn.
              </p>
              <p>
                Kho cố ý dùng luật chặt như vậy. Nhãn &ldquo;dễ nhớ&rdquo; nếu gắn theo cảm tính thì mỗi người hiểu một
                kiểu; gắn theo cấu trúc thì Quý khách kiểm được bằng mắt, và mọi số trong danh sách đều đạt cùng một
                chuẩn.
              </p>
            </div>
          </section>

          {/* ── 2. Chọn cặp nào ───────────────────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Cặp số nào nên chọn cho việc của Quý khách
            </h2>
            <div className="space-y-3">
              <div className="rounded-lg border border-border bg-secondary/25 p-4">
                <h3 className="mb-1 font-semibold text-foreground">Bán hàng, kinh doanh: 6868, 8686, 7979, 3939</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Cặp lặp trùng luôn nhóm tài lộc, nên một dãy làm được hai việc: dễ đọc và mang lớp ý nghĩa mà khách
                  Việt quen. Đây cũng là nhóm đi nhanh nhất trong kho.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/25 p-4">
                <h3 className="mb-1 font-semibold text-foreground">Số dùng cá nhân: 8585, 9292, 5151</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Nhịp đọc vẫn gọn, giá mềm hơn nhóm trên vì không nằm trong các cặp được săn. Phù hợp khi Quý khách cần
                  thêm một số cho công việc riêng.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-secondary/25 p-4">
                <h3 className="mb-1 font-semibold text-foreground">Số in lên bao bì, xe giao hàng: 6060, 7070, 1212</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Chữ số ít nét, khoảng cách rõ, nhìn từ xa vẫn đọc được. Nhóm này thường có giá thấp nhất trong danh
                  sách nên đặt nhiều số một lúc cũng nhẹ ngân sách.
                </p>
              </div>
            </div>
          </section>
          {/* ── 3. Khoảng giá thật ─────────────────────────────────────────── */}
          {stats.count > 0 && (
            <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
              <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
                <span className="h-8 w-1 rounded-full bg-primary" />
                Giá sim dễ nhớ trong kho hiện tại
              </h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                {stats.count.toLocaleString("vi-VN")} số đang bán, thấp nhất{" "}
                <strong className="text-foreground">{formatTrieu(stats.min)}</strong>, mức giữa{" "}
                <strong className="text-foreground">{formatTrieu(stats.median)}</strong>. Khoảng{" "}
                {formatTrieu(stats.p25)} – {formatTrieu(stats.p75)} là nơi có nhiều lựa chọn nhất; dãy đắt nhất hiện{" "}
                {formatTrieu(stats.max)}.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <caption className="sr-only">Số lượng sim dễ nhớ theo từng khoảng giá</caption>
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th scope="col" className="py-2 pr-4 font-semibold text-foreground">Khoảng giá</th>
                      <th scope="col" className="py-2 font-semibold text-foreground">Số lượng đang có</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    {stats.bands.map((band) => (
                      <tr key={band.label} className="border-b border-border last:border-0">
                        <td className="py-2 pr-4 font-medium text-foreground">{band.label}</td>
                        <td className="py-2">{band.count.toLocaleString("vi-VN")} số</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* ── 4. Bảng giá thật + ItemList/Product/Offer ──────────────────── */}
          <CategorySimPriceList
            title="Giá sim dễ nhớ đang bán"
            sims={snapshotSims}
            pageUrl={CANONICAL}
            note="Bảng lấy 8 số dễ nhớ có giá thấp nhất trong kho tại thời điểm cập nhật."
          />

          {/* ── 5. Lưới lọc theo tag ───────────────────────────────────────── */}
          <CategorySimGrid
            title="Sim Dễ Nhớ Mới Cập Nhật"
            searchPlaceholder="Nhập số cần tìm, hoặc *6868 / *8585 để thử một đuôi cụ thể"
            emptyText="Kho tạm hết số khớp yêu cầu này. Quý khách thử đuôi khác như *9292, hoặc gọi 0938.868.868 để đội ngũ tư vấn lọc theo ngân sách."
            matchTags={[TAG]}
          />

          <TrustCommitments />
          {/* ── 6. FAQ ─────────────────────────────────────────────────────── */}
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

          {/* ── 7. Liên kết chéo ───────────────────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Dạng số khác cũng gọn nhịp đọc
            </h2>
            <ul className="flex flex-wrap gap-3 text-sm">
              <li><a href="/sim-lap-kep" className="font-medium text-primary underline-offset-2 hover:underline">Sim lặp kép</a></li>
              <li><a href="/sim-taxi" className="font-medium text-primary underline-offset-2 hover:underline">Sim taxi</a></li>
              <li><a href="/sim-ganh-dao" className="font-medium text-primary underline-offset-2 hover:underline">Sim gánh đảo</a></li>
              <li><a href="/sim-tien-len" className="font-medium text-primary underline-offset-2 hover:underline">Sim tiến lên</a></li>
              <li><a href="/sim-than-tai" className="font-medium text-primary underline-offset-2 hover:underline">Sim thần tài</a></li>
              <li><a href="/mua-sim-gia-re" className="font-medium text-primary underline-offset-2 hover:underline">Sim giá rẻ đồng giá</a></li>
              <li><a href="/sim-gia/1-3-trieu" className="font-medium text-primary underline-offset-2 hover:underline">Sim giá 1–3 triệu</a></li>
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
              { name: "Sim dễ nhớ", path: "/sim-de-nho" },
            ]),
          ),
        }}
      />
    </>
  );
}
