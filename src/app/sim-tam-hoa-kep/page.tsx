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
const TAG = "Tam hoa kép";

const TITLE = "Sim Tam Hoa Kép Mobifone | Hai Cụm Ba Số Trong Dãy";
const DESCRIPTION =
  "Sim tam hoa kép Mobifone: hai cụm ba số giống nhau trong cùng dãy, kiểu 111.222 hay 999.777. Giá công khai từng số, hàng có sẵn, sang tên chính chủ.";
const CANONICAL = `${BASE_URL}/sim-tam-hoa-kep`;

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
      description: "Sim tam hoa kép Mobifone — hai cụm ba số giống nhau trong một dãy. Giá công khai.",
      url: CANONICAL,
      images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
    },
  };
}

const faqItems = [
  {
    q: "Sim tam hoa kép là gì?",
    a: "Tam hoa kép là dãy số chứa hai cụm ba số giống nhau, mỗi cụm một con số khác nhau — 0901.111.222, 0799.977.799. Hai cụm có thể nằm sát nhau hoặc cách nhau vài chữ số. Điểm nhận biết: trong cùng một số điện thoại có hai lần ba chữ số cùng mặt đứng liền.",
  },
  {
    q: "Tam hoa kép khác tam hoa thường ở đâu?",
    a: "Tam hoa thường có một cụm ba số ở đuôi. Tam hoa kép có hai cụm, nên dãy số vừa dài phần dễ nhớ vừa hiếm hơn. Nguồn hàng ít hơn tam hoa đơn nhiều lần, và đó là lý do chính khiến giá của nhóm này cao hơn ở cùng đầu số.",
  },
  {
    q: "Sim tam hoa kép giá bao nhiêu?",
    a: "Giá phụ thuộc vào hai con số được lặp và thứ tự của chúng. Cặp 8 và 9 (888.999) đứng đầu bảng, cặp 6 với 8 kế đến, còn cặp có số 4 hoặc 0 mềm giá hơn. Đầu số 090, 093 cộng thêm một bậc nữa. Từng số đều hiện giá niêm yết trong kho.",
  },
  {
    q: "Ai thường chọn sim tam hoa kép?",
    a: "Người cần một dãy số vừa dễ đọc vừa nói được vị thế: chủ doanh nghiệp, người bán hàng giá trị cao, chủ showroom. Số dạng này đọc lên có nhịp, khách nghe một lần là ghi lại được, nên rất hợp làm số hotline in trên bảng hiệu.",
  },
  {
    q: "Mua sim tam hoa kép có sang tên chính chủ được không?",
    a: "Được, và với số ở tầm giá này thì đây là bước Quý khách nên làm ngay. Toàn bộ sim tại CHONSOMOBIFONE.COM đều sang tên chính chủ; Quý khách nhận SIM, kiểm tra rồi mới thanh toán. Thủ tục làm tại cửa hàng MobiFone hoặc trên ứng dụng My Mobifone.",
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

export default async function SimTamHoaKepPage() {
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
              Sim Tam Hoa Kép Mobifone — <span className="text-gold">111.222, 888.999</span>
            </h1>
            <p className="mx-auto mb-5 max-w-xl text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              {stats.count > 0
                ? `Nhóm số khan: cả kho còn ${stats.count.toLocaleString("vi-VN")} dãy có hai cụm ba số, giá từ ${formatTrieu(stats.min)}. Sang tên chính chủ, nhận SIM kiểm tra rồi thanh toán.`
                : "Nhóm số khan, kho đang trống tạm thời. Quý khách để lại yêu cầu qua Zalo để nhận tin khi có dãy mới."}
            </p>
            <div className="mx-auto flex max-w-md flex-col justify-center gap-2.5 sm:flex-row">
              <a
                href="#kho-sim"
                className="flex items-center justify-center gap-2 rounded-lg bg-gold px-7 py-2.5 font-bold text-header-bg shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-xl"
              >
                <Star className="h-4 w-4" /> Xem kho tam hoa kép
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
          {/* ── 1. Mở bài: đặt cạnh tam hoa đơn để thấy khác biệt ──────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Một cụm hay hai cụm — chỗ khác nhau nằm ở đó
            </h2>
            <div className="space-y-4 leading-relaxed text-muted-foreground">
              <p>
                Đặt hai số cạnh nhau: <strong className="text-foreground">0906.839.222</strong> và{" "}
                <strong className="text-foreground">0901.111.222</strong>. Số đầu có một cụm ba con số giống nhau, gọi là
                tam hoa. Số sau có hai cụm — 111 rồi 222 — và đó là{" "}
                <strong className="text-foreground">tam hoa kép</strong>.
              </p>
              <p>
                Hai cụm không bắt buộc phải sát nhau. Dãy <strong className="text-foreground">0799.977.799</strong> cũng
                thuộc nhóm này: cụm 999 nằm giữa, cụm 777 theo sau. Luật nhận số của kho chỉ đòi một điều — trong cùng
                một số thuê bao có hai lần ba chữ số cùng mặt đứng liền nhau, mỗi lần một con số khác nhau.
              </p>
              <p>
                Nguồn hàng vì thế hẹp hơn nhiều so với{" "}
                <a href="/sim-tam-hoa" className="font-medium text-primary underline-offset-2 hover:underline">
                  tam hoa đơn
                </a>
                . Kho tam hoa kép chỉ bằng khoảng một phần ba tam hoa đơn, và dãy có cặp 8–9 thường có chủ rất sớm.
              </p>
            </div>
          </section>

          {/* ── 2. Bảng so ba nhóm số lặp ──────────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Tam hoa, tam hoa kép, tứ quý — chọn nhóm nào
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">So sánh ba nhóm sim số lặp</caption>
                <thead>
                  <tr className="border-b border-border text-left">
                    <th scope="col" className="py-2 pr-4 font-semibold text-foreground">Nhóm số</th>
                    <th scope="col" className="py-2 pr-4 font-semibold text-foreground">Cấu trúc</th>
                    <th scope="col" className="py-2 font-semibold text-foreground">Phù hợp khi</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border">
                    <td className="py-2 pr-4 font-medium text-foreground">Tam hoa</td>
                    <td className="py-2 pr-4">Ba số cuối giống nhau (…222)</td>
                    <td className="py-2">Cần số dễ nhớ, ngân sách vừa phải</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2 pr-4 font-medium text-foreground">Tam hoa kép</td>
                    <td className="py-2 pr-4">Hai cụm ba số (…111.222)</td>
                    <td className="py-2">Muốn dãy có nhịp, khan hàng, giữ giá</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium text-foreground">Tứ quý</td>
                    <td className="py-2 pr-4">Bốn số cuối giống nhau (…8888)</td>
                    <td className="py-2">Chọn số như một khoản tài sản</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Cùng một đầu số, tam hoa kép nằm giữa hai nhóm kia về giá. Anh Chị cần dãy nói được vị thế mà chưa muốn
              lên tầm tứ quý thì đây là bậc hợp lý nhất.
            </p>
          </section>
          {/* ── 3. Khoảng giá thật ─────────────────────────────────────────── */}
          {stats.count > 0 && (
            <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
              <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
                <span className="h-8 w-1 rounded-full bg-primary" />
                Giá sim tam hoa kép trong kho hiện tại
              </h2>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-secondary/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Rẻ nhất</p>
                  <p className="text-lg font-bold text-gold">{formatTrieu(stats.min)}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Thường là dãy có cặp số 0, 1 hoặc 4, đầu 07x.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-secondary/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Mức phổ biến</p>
                  <p className="text-lg font-bold text-gold">
                    {formatTrieu(stats.p25)} – {formatTrieu(stats.p75)}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Nửa số hàng trong kho nằm ở khoảng này, mức giữa {formatTrieu(stats.median)}.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-secondary/30 p-4">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Cao nhất</p>
                  <p className="text-lg font-bold text-gold">{formatTrieu(stats.max)}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Dãy cặp 8–9 trên đầu số cổ, nhóm khách sưu tầm hỏi nhiều.
                  </p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Kho còn {stats.count.toLocaleString("vi-VN")} số ở nhóm này
                {stats.bands.length > 0
                  ? `, đông nhất là dải ${stats.bands.reduce((a, b) => (b.count > a.count ? b : a)).label.toLowerCase()}`
                  : ""}
                . Con số đếm trực tiếp trên kho lúc trang cập nhật.
              </p>
            </section>
          )}

          {/* ── 4. Bảng giá thật + ItemList/Product/Offer ──────────────────── */}
          <CategorySimPriceList
            title="Giá sim tam hoa kép đang bán"
            sims={snapshotSims}
            pageUrl={CANONICAL}
            note="Bảng lấy 8 số tam hoa kép có giá thấp nhất trong kho tại thời điểm cập nhật."
          />

          {/* ── 5. Lưới lọc theo tag ───────────────────────────────────────── */}
          <CategorySimGrid
            title="Sim Tam Hoa Kép Mới Cập Nhật"
            searchPlaceholder="Nhập số cần tìm, hoặc *888999 để thử một cặp cụ thể"
            emptyText="Nhóm này về lẻ và đi rất nhanh nên kho có lúc trống. Quý khách nhắn Zalo 0933356666, đội ngũ tư vấn sẽ báo ngay khi có dãy phù hợp."
            matchTags={[TAG]}
          />

          <TrustCommitments />
          {/* ── 6. FAQ ─────────────────────────────────────────────────────── */}
          <FaqAccordion items={faqItems} />

          {/* ── 7. Liên kết chéo ───────────────────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Nhóm số cùng hạng để Quý khách so thêm
            </h2>
            <ul className="flex flex-wrap gap-3 text-sm">
              <li><a href="/sim-tam-hoa" className="font-medium text-primary underline-offset-2 hover:underline">Sim tam hoa</a></li>
              <li><a href="/mua-sim-tu-quy" className="font-medium text-primary underline-offset-2 hover:underline">Sim tứ quý</a></li>
              <li><a href="/sim-ngu-quy" className="font-medium text-primary underline-offset-2 hover:underline">Sim ngũ quý</a></li>
              <li><a href="/sim-taxi" className="font-medium text-primary underline-offset-2 hover:underline">Sim taxi</a></li>
              <li><a href="/sim-lap-kep" className="font-medium text-primary underline-offset-2 hover:underline">Sim lặp kép</a></li>
              <li><a href="/sim-gia/10-50-trieu" className="font-medium text-primary underline-offset-2 hover:underline">Sim giá 10–50 triệu</a></li>
              <li><a href="/sim-tra-gop" className="font-medium text-primary underline-offset-2 hover:underline">Mua sim trả góp</a></li>
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
              { name: "Sim tam hoa kép", path: "/sim-tam-hoa-kep" },
            ]),
          ),
        }}
      />
    </>
  );
}
