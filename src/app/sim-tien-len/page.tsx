import type { Metadata } from "next";
import { Phone, Star, Sparkles } from "lucide-react";
import CategorySimGrid from "@/components/CategorySimGrid";
import CategorySimPriceList from "@/components/CategorySimPriceList";
import TrustCommitments from "@/components/TrustCommitments";
import FaqAccordion from "@/components/FaqAccordion";
import { buildBreadcrumb, BASE_URL } from "@/lib/seo";
import { getCategorySnapshot } from "@/lib/serverSimData";
import { getTagInventory, formatTrieu, MIN_INDEXABLE_INVENTORY } from "@/lib/simDangSo";

export const revalidate = 300;

const ZALO_URL = "https://zalo.me/0933356666";

// Chuỗi tag đúng như trong ALL_SIM_TAGS (src/lib/simUtils.ts).
const TAG = "Tiến lên";

const TITLE = "Sim Tiến Lên Mobifone | Đuôi 1234, 3456, 6789 Giá Rõ";
const DESCRIPTION =
  "Sim tiến lên Mobifone có bốn số cuối tăng liền: 1234, 3456, 6789. Dãy số đi lên, đọc trôi, khách nhớ nhanh. Giá niêm yết công khai, 30 phút giao toàn quốc.";
const CANONICAL = `${BASE_URL}/sim-tien-len`;

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
      description: "Sim tiến lên Mobifone — bốn số cuối tăng liền 1234, 3456, 6789. Giá công khai.",
      url: CANONICAL,
      images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
    },
  };
}

const faqItems = [
  {
    q: "Sim tiến lên là gì?",
    a: "Sim tiến lên có bốn chữ số cuối tăng liên tiếp từng đơn vị: 0123, 1234, 2345, 3456, 4567, 5678, 6789. Ví dụ thật trong kho: 0765.363.456 với đuôi 3456. Cả bảy dãy trên đều được tính, ngoài ra không có dạng nào khác — số tăng nhưng cách quãng như 1357 không thuộc nhóm này.",
  },
  {
    q: "Đuôi tiến lên nào đắt nhất?",
    a: "Đuôi 6789 đứng đầu vì kết ở số 9 và đọc lên nghe như một câu chúc đi lên tới đỉnh; kế đến là 5678 và 4567. Ba dãy mở đầu bằng số nhỏ — 0123, 1234, 2345 — có giá mềm hơn, phù hợp khi Quý khách cần một số đẹp mà giữ ngân sách.",
  },
  {
    q: "Sim tiến lên giá bao nhiêu?",
    a: "Mặt bằng giá của nhóm này gọn hơn nhiều dạng số khác vì cấu trúc chỉ có bảy khả năng. Bảng phía dưới lấy trực tiếp từ kho tại thời điểm cập nhật, nên Quý khách thấy đúng giá đang bán cho từng dãy.",
  },
  {
    q: "Vì sao sim tiến lên được xem là số cầu tiến?",
    a: "Người Việt đọc dãy số tăng dần thành ý đi lên: công việc, sự nghiệp, thu nhập nhích lên từng bước. Đây là quan niệm dân gian, không phải điều gì bảo đảm. Lợi ích chắc chắn hơn nằm ở chỗ khác: dãy tăng liên tiếp thì người nghe nhớ được sau một lần.",
  },
  {
    q: "Kho có sẵn đuôi tiến lên trên đầu số 090, 093 không?",
    a: "Có, nhưng nhóm này ít hàng nên đầu số cổ thường hết trước. Danh sách trên trang cập nhật theo kho mỗi 5 phút. Quý khách muốn giữ chỗ cho một đuôi cụ thể thì nhắn Zalo 0933356666, đội ngũ tư vấn sẽ báo khi có số về.",
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

export default async function SimTienLenPage() {
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
              Sim Tiến Lên Mobifone — <span className="text-gold">1234, 3456, 6789</span>
            </h1>
            <p className="mx-auto mb-5 max-w-xl text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              {stats.count > 0
                ? `Bốn số cuối tăng từng bước, đọc một hơi là hết. Kho còn ${stats.count.toLocaleString("vi-VN")} số, giá từ ${formatTrieu(stats.min)}, sang tên chính chủ.`
                : "Bốn số cuối tăng từng bước, đọc một hơi là hết. Nhóm ít hàng — Quý khách nhắn Zalo để nhận tin khi có số về."}
            </p>
            <div className="mx-auto flex max-w-md flex-col justify-center gap-2.5 sm:flex-row">
              <a
                href="#kho-sim"
                className="flex items-center justify-center gap-2 rounded-lg bg-gold px-7 py-2.5 font-bold text-header-bg shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-xl"
              >
                <Star className="h-4 w-4" /> Xem kho sim tiến lên
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
          {/* ── 1. Mở bài: cả nhóm chỉ có bảy dãy ─────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Cả nhóm sim tiến lên chỉ có bảy dãy đuôi
            </h2>
            <div className="space-y-4 leading-relaxed text-muted-foreground">
              <p>
                Đếm thử: 0123, 1234, 2345, 3456, 4567, 5678, 6789. Hết. Muốn bốn chữ số cuối tăng liên tiếp từng đơn vị
                thì chỉ có bảy cách xếp, không có cách thứ tám. Đó là điều khiến{" "}
                <strong className="text-foreground">sim tiến lên</strong> khan hơn hầu hết dạng số khác — nguồn hàng bị
                khóa bởi chính cấu trúc.
              </p>
              <p>
                Một số thật trong kho: <strong className="text-foreground">0765.363.456</strong>, đuôi 3456. Dãy tăng
                cách quãng như 1357 hay tăng ba chữ số như 456 không được tính vào danh sách này, nên mọi số Quý khách
                thấy dưới đây đều đúng một trong bảy dãy trên.
              </p>
            </div>
          </section>

          {/* ── 2. Bảng bảy đuôi ──────────────────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Bảy đuôi tiến lên — chọn đuôi nào
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Bảy dãy đuôi tiến lên và mặt bằng giá</caption>
                <thead>
                  <tr className="border-b border-border text-left">
                    <th scope="col" className="py-2 pr-4 font-semibold text-foreground">Đuôi</th>
                    <th scope="col" className="py-2 pr-4 font-semibold text-foreground">Cách người Việt đọc</th>
                    <th scope="col" className="py-2 font-semibold text-foreground">Mặt bằng giá</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border">
                    <td className="py-2 pr-4 font-medium text-foreground">…6789</td>
                    <td className="py-2 pr-4">Đi lên tới đỉnh, kết ở số 9</td>
                    <td className="py-2">Cao nhất nhóm</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2 pr-4 font-medium text-foreground">…5678 / …4567</td>
                    <td className="py-2 pr-4">Tiến đều, kết ở 8 hoặc 7</td>
                    <td className="py-2">Bậc trên trung bình</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2 pr-4 font-medium text-foreground">…3456 / …2345</td>
                    <td className="py-2 pr-4">Thuận đường, dễ đọc</td>
                    <td className="py-2">Trung bình — nhiều hàng nhất</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium text-foreground">…1234 / …0123</td>
                    <td className="py-2 pr-4">Khởi đầu, bắt nhịp từ đầu</td>
                    <td className="py-2">Mềm nhất nhóm</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Anh Chị mở cửa hàng mới hay cần thêm số cho công việc thì hai dòng cuối là chỗ đáng xem trước: cùng lợi
              thế dễ nhớ, giá nhẹ hơn nhóm kết ở số 9 đáng kể.
            </p>
          </section>
          {/* ── 3. Khoảng giá thật ─────────────────────────────────────────── */}
          {stats.count > 0 && (
            <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
              <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
                <span className="h-8 w-1 rounded-full bg-primary" />
                Giá sim tiến lên đang bán
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-secondary/30 p-4">
                  <p className="mb-2 text-sm font-semibold text-foreground">Mặt bằng giá</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {stats.count.toLocaleString("vi-VN")} số đang bán. Thấp nhất{" "}
                    <strong className="text-foreground">{formatTrieu(stats.min)}</strong>, mức giữa{" "}
                    <strong className="text-foreground">{formatTrieu(stats.median)}</strong>, nửa số hàng nằm trong khoảng{" "}
                    {formatTrieu(stats.p25)} – {formatTrieu(stats.p75)}, cao nhất {formatTrieu(stats.max)}.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-secondary/30 p-4">
                  <p className="mb-2 text-sm font-semibold text-foreground">Tồn kho theo dải</p>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {stats.bands.map((band) => (
                      <li key={band.label} className="flex justify-between gap-3">
                        <span>{band.label}</span>
                        <span className="font-semibold text-foreground">
                          {band.count.toLocaleString("vi-VN")} số
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* ── 4. Bảng giá thật + ItemList/Product/Offer ──────────────────── */}
          <CategorySimPriceList
            title="Giá sim tiến lên đang bán"
            sims={snapshotSims}
            pageUrl={CANONICAL}
            note="Bảng lấy 8 số tiến lên có giá thấp nhất trong kho tại thời điểm cập nhật."
          />

          {/* ── 5. Lưới lọc theo tag ───────────────────────────────────────── */}
          <CategorySimGrid
            title="Sim Tiến Lên Mới Cập Nhật"
            searchPlaceholder="Nhập số cần tìm, hoặc *6789 / *3456 để thử một đuôi"
            emptyText="Nhóm này chỉ có bảy dãy đuôi nên kho hết nhanh. Quý khách nhắn Zalo 0933356666 kèm đuôi muốn tìm, đội ngũ tư vấn sẽ báo khi có số về."
            matchTags={[TAG]}
          />

          <TrustCommitments />

          {/* ── 6. FAQ ─────────────────────────────────────────────────────── */}
          <FaqAccordion items={faqItems} />

          {/* ── 7. Liên kết chéo ───────────────────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Nhóm số khác Quý khách nên xem cùng
            </h2>
            <ul className="flex flex-wrap gap-3 text-sm">
              <li><a href="/sim-de-nho" className="font-medium text-primary underline-offset-2 hover:underline">Sim dễ nhớ</a></li>
              <li><a href="/sim-ganh-dao" className="font-medium text-primary underline-offset-2 hover:underline">Sim gánh đảo</a></li>
              <li><a href="/sim-tam-hoa" className="font-medium text-primary underline-offset-2 hover:underline">Sim tam hoa</a></li>
              <li><a href="/sim-taxi" className="font-medium text-primary underline-offset-2 hover:underline">Sim taxi</a></li>
              <li><a href="/sim-than-tai" className="font-medium text-primary underline-offset-2 hover:underline">Sim thần tài</a></li>
              <li><a href="/sim-nam-sinh" className="font-medium text-primary underline-offset-2 hover:underline">Sim năm sinh</a></li>
              <li><a href="/sim-gia/3-5-trieu" className="font-medium text-primary underline-offset-2 hover:underline">Sim giá 3–5 triệu</a></li>
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
              { name: "Sim tiến lên", path: "/sim-tien-len" },
            ]),
          ),
        }}
      />
    </>
  );
}
