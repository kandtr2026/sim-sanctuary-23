import type { Metadata } from "next";
import { Phone, Star, Sparkles } from "lucide-react";
import CategorySimGrid from "@/components/CategorySimGrid";
import CategoryHeroArt from "@/components/CategoryHeroArt";
import CategorySimPriceList from "@/components/CategorySimPriceList";
import TrustCommitments from "@/components/TrustCommitments";
import FaqAccordion from "@/components/FaqAccordion";
import { buildBreadcrumb, BASE_URL } from "@/lib/seo";
import { getCategorySnapshot } from "@/lib/serverSimData";
import { getTagInventory, formatTrieu, MIN_INDEXABLE_INVENTORY } from "@/lib/simDangSo";

export const revalidate = 300;

const ZALO_URL = "https://zalo.me/0933686666";

// Chuỗi tag đúng như trong ALL_SIM_TAGS (src/lib/simUtils.ts).
const TAG = "Tiến lên";

const TITLE = "Sim Tiến Lên Mobifone | Đuôi 1234, 3456, 6789 Giá Rõ";
const DESCRIPTION =
  "Sim tiến lên Mobifone có đuôi số đi lên đều: 789, 3456, 1357, 05.06.07. Đọc trôi, khách nhớ nhanh. Giá niêm yết công khai, 30 phút giao toàn quốc.";
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
      description: "Sim tiến lên Mobifone — đuôi số đi lên đều như 789, 3456, 1357, 05.06.07. Giá công khai.",
      url: CANONICAL,
      images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
    },
  };
}

const faqItems = [
  {
    q: "Sim tiến lên là gì?",
    a: "Sim tiến lên là số có phần đuôi đi lên đều theo một trong bốn dạng: ba số cuối tăng từng đơn vị như …012, …234, …789 (đuôi dài hơn như 1234, 3456, 23456 cũng tính); bốn số cuối tăng bước 2 như 0246, 1357, 2468, 3579; ba cặp cuối tiến đều như 05.06.07, 21.22.23 hoặc 07.17.27, 30.40.50; và hai đuôi riêng 8910, 9899. Ví dụ thật trong kho: 0765.363.456 với đuôi 3456. Dãy tăng phải nằm ở cuối số — 0981.567.894 có 567 ở giữa nên không tính.",
  },
  {
    q: "Đuôi tiến lên nào đắt nhất?",
    a: "Trong các đuôi bốn số tăng liền, 6789 đứng đầu vì kết ở số 9 và đọc lên nghe như một câu chúc đi lên tới đỉnh; kế đến là 5678 và 4567. Ba dãy mở đầu bằng số nhỏ — 0123, 1234, 2345 — có giá mềm hơn, phù hợp khi Quý khách cần một số đẹp mà giữ ngân sách. Các dạng còn lại như …789, 1357 hay 05.06.07 thì giá tùy từng số, Quý khách xem trực tiếp trong kho.",
  },
  {
    q: "Sim tiến lên giá bao nhiêu?",
    a: "Nhóm này gồm nhiều dạng đuôi nên giá trải theo từng dạng và từng đầu số. Bảng giá trên trang lấy trực tiếp từ kho tại thời điểm cập nhật, nên Quý khách thấy đúng giá đang bán cho từng số.",
  },
  {
    q: "Vì sao sim tiến lên được xem là số cầu tiến?",
    a: "Người Việt đọc dãy số tăng dần thành ý đi lên: công việc, sự nghiệp, thu nhập nhích lên từng bước. Đây là quan niệm dân gian, không phải điều gì bảo đảm. Lợi ích chắc chắn hơn nằm ở chỗ khác: dãy tăng đều thì người nghe nhớ được sau một lần.",
  },
  {
    q: "Kho có sẵn đuôi tiến lên trên đầu số 090, 093 không?",
    a: "Có, tùy thời điểm — đuôi tiến lên trên đầu số cổ thường hết trước. Danh sách trên trang cập nhật theo kho mỗi 5 phút. Quý khách muốn giữ chỗ cho một đuôi cụ thể thì nhắn Zalo 0933686666, đội ngũ tư vấn sẽ báo khi có số về.",
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
          <CategoryHeroArt numerals={["6789", "3456"]} />
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
                ? `Đuôi số đi lên từng bước, đọc một hơi là hết. Kho còn ${stats.count.toLocaleString("vi-VN")} số, giá từ ${formatTrieu(stats.min)}, đăng ký thông tin chính chủ.`
                : "Đuôi số đi lên từng bước, đọc một hơi là hết. Kho đang tạm hết — Quý khách nhắn Zalo để nhận tin khi có số về."}
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
          {/* Kho + ô tìm lên đầu để khách vừa vào tìm được ngay (góp ý #32) */}
          <CategorySimGrid
            title="Sim Tiến Lên Mới Cập Nhật"
            searchPlaceholder="Nhập số cần tìm, hoặc *6789 / *3456 để thử một đuôi"
            emptyText="Chưa có số tiến lên khớp với tìm kiếm. Quý khách nhắn Zalo 0933686666 kèm đuôi muốn tìm, đội ngũ tư vấn sẽ báo khi có số về."
            matchTags={[TAG]}
          />

          {/* ── 1. Mở bài: bốn dạng đuôi được tính là tiến lên ─────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Bốn dạng đuôi được tính là sim tiến lên
            </h2>
            <div className="space-y-4 leading-relaxed text-muted-foreground">
              <p>
                Một số thuộc nhóm <strong className="text-foreground">sim tiến lên</strong> khi phần đuôi đi lên đều
                theo một trong bốn dạng. Một: ba số cuối tăng từng đơn vị như …012, …234, …789 — đuôi dài hơn như
                1234, 3456, 23456 cũng thuộc dạng này. Hai: bốn số cuối tăng bước 2 như 0246, 1357, 2468, 3579. Ba:
                ba cặp cuối tiến đều, giữ hàng chục và tăng hàng đơn vị (05.06.07, 21.22.23), hoặc giữ hàng đơn vị và
                tăng hàng chục (07.17.27, 30.40.50). Bốn: hai đuôi riêng 8910 (8-9-10) và 9899 (98-99).
              </p>
              <p>
                Một số thật trong kho: <strong className="text-foreground">0765.363.456</strong>, đuôi 3456. Dãy tăng
                phải nằm ở cuối số mới được tính — 0981.567.894 có 567 ở giữa nên không thuộc nhóm này. Một số có thể
                cùng lúc thuộc nhóm khác, như đuôi 3579 vừa tiến lên vừa thần tài; danh sách trên trang liệt kê mọi
                số có đuôi tiến lên, kể cả những số như vậy.
              </p>
            </div>
          </section>

          {/* ── 2. Bảng đuôi bốn số tăng liền (dạng quen thuộc nhất) ───────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Đuôi bốn số tăng liền — chọn đuôi nào
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Bảy đuôi bốn số tăng liền và mặt bằng giá</caption>
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
                    <td className="py-2">Cao nhất bảng</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2 pr-4 font-medium text-foreground">…5678 / …4567</td>
                    <td className="py-2 pr-4">Tiến đều, kết ở 8 hoặc 7</td>
                    <td className="py-2">Bậc trên trung bình</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2 pr-4 font-medium text-foreground">…3456 / …2345</td>
                    <td className="py-2 pr-4">Thuận đường, dễ đọc</td>
                    <td className="py-2">Trung bình — nhiều hàng nhất bảng</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium text-foreground">…1234 / …0123</td>
                    <td className="py-2 pr-4">Khởi đầu, bắt nhịp từ đầu</td>
                    <td className="py-2">Mềm nhất bảng</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Bảng gom bảy đuôi bốn số tăng liền — dạng quen thuộc nhất của sim tiến lên; các dạng khác như …789, 1357
              hay 05.06.07 nằm chung trong danh sách kho phía trên. Quý khách mở cửa hàng mới hay cần thêm số cho công việc thì hai
              dòng cuối là chỗ đáng xem trước: cùng lợi thế dễ nhớ, giá nhẹ hơn nhóm kết ở số 9 đáng kể.
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
