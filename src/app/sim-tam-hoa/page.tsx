import type { Metadata } from "next";
import { Phone, Star, Sparkles } from "lucide-react";
import CategorySimGrid from "@/components/CategorySimGrid";
import CategorySimPriceList from "@/components/CategorySimPriceList";
import TrustCommitments from "@/components/TrustCommitments";
import FaqAccordion from "@/components/FaqAccordion";
import { buildBreadcrumb, BASE_URL } from "@/lib/seo";
import { getCategorySnapshot } from "@/lib/serverSimData";
import { getTagInventory, formatTrieu, MIN_INDEXABLE_INVENTORY } from "@/lib/simDangSo";

// ISR như các trang danh mục khác (khớp revalidate của /api/sims).
export const revalidate = 300;

const ZALO_URL = "https://zalo.me/0933356666";

// Tên tag lấy ĐÚNG chuỗi trong ALL_SIM_TAGS (src/lib/simUtils.ts) — sai một dấu
// là snapshot rỗng và cả bảng giá + Product/Offer biến mất mà build vẫn xanh.
const TAG = "Tam hoa";

const TITLE = "Sim Tam Hoa Mobifone | Ba Số Cuối Giống Nhau, Giá Rõ";
const DESCRIPTION =
  "Kho sim tam hoa Mobifone với ba số cuối giống nhau: 222, 555, 888. Quý khách xem giá niêm yết ngay cạnh từng số, sang tên chính chủ, giao tận nơi HCM.";
const CANONICAL = `${BASE_URL}/sim-tam-hoa`;

export async function generateMetadata(): Promise<Metadata> {
  // Kho tụt dưới ngưỡng → noindex, follow: giữ link equity, không đẩy trang
  // mỏng vào chỉ mục (cùng luật với /sim-nam-sinh/[year]).
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
      description: "Sim tam hoa Mobifone — ba số cuối giống nhau. Giá công khai, sang tên chính chủ.",
      url: CANONICAL,
      images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
    },
  };
}

const faqItems = [
  {
    q: "Sim tam hoa là gì?",
    a: "Tam hoa là ba chữ số giống nhau đứng liền nhau ở cuối dãy — 0906.839.222, 0938.366.000. Cách gọi đến từ chỗ ba con số cùng mặt xếp thành một cụm, đọc lên nghe như một nhịp duy nhất. Trên kho này, một số vào nhóm tam hoa khi ba chữ số cuối giống nhau và cả dãy chỉ có đúng một cụm ba số như vậy; có hai cụm thì thuộc nhóm tam hoa kép, còn bốn số cuối giống nhau đã là tứ quý.",
  },
  {
    q: "Sim tam hoa giá bao nhiêu?",
    a: "Giá đi theo ba thứ: con số được lặp (888, 999 đắt hơn 222, 000), đầu số (090, 093 cao hơn 07x) và phần thân số phía trước. Cùng một cụm 888, số có thân dễ đọc luôn cao hơn số thân rối. Từng số trong kho đều hiện giá niêm yết, Quý khách so trực tiếp trên bảng phía dưới.",
  },
  {
    q: "Tam hoa nào được hỏi nhiều nhất?",
    a: "Cụm 888 và 999 được hỏi nhiều nhất — dân gian đọc 8 là phát, 9 là trường cửu. Kế đến là 666 (lộc) và 777. Cụm 000 lại được nhóm khách khác chọn: dãy tròn, gọn, rất dễ đọc qua điện thoại nên phù hợp làm số liên hệ cho cửa hàng.",
  },
  {
    q: "Sim tam hoa và sim tứ quý khác nhau ở đâu?",
    a: "Tam hoa là ba số cuối giống nhau, tứ quý là bốn. Hơn một chữ số nhưng độ khan chênh nhiều, nên tứ quý thường đắt hơn tam hoa cùng đầu số vài lần. Anh Chị cần một dãy dễ nhớ ở tầm giá vừa phải thì tam hoa là bậc hợp lý nhất trong nhóm số lặp.",
  },
  {
    q: "Mua sim tam hoa có sang tên chính chủ được không?",
    a: "Được. Toàn bộ sim tại CHONSOMOBIFONE.COM đều sang tên chính chủ. Quý khách nhận SIM, kiểm tra kỹ rồi mới thanh toán; thủ tục chính chủ làm tại cửa hàng MobiFone hoặc trên ứng dụng My Mobifone.",
  },
  {
    q: "Giao sim tam hoa mất bao lâu?",
    a: "Nội thành TP.HCM: 30 phút – 2 giờ làm việc kể từ lúc Quý khách chốt số. Tỉnh thành khác: 1–3 ngày làm việc qua chuyển phát nhanh, thanh toán COD lúc nhận hoặc chuyển khoản trước.",
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

export default async function SimTamHoaPage() {
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
              Sim Tam Hoa Mobifone — <span className="text-gold">222, 555, 888, 999</span>
            </h1>
            <p className="mx-auto mb-5 max-w-xl text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              {stats.count > 0
                ? `Kho đang còn ${stats.count.toLocaleString("vi-VN")} số tam hoa, giá từ ${formatTrieu(stats.min)}. Giá hiện sẵn cạnh từng số, sang tên chính chủ.`
                : "Kho tam hoa đang cập nhật. Quý khách nhắn Zalo để đội ngũ tư vấn báo số vừa về."}
            </p>
            <div className="mx-auto flex max-w-md flex-col justify-center gap-2.5 sm:flex-row">
              <a
                href="#kho-sim"
                className="flex items-center justify-center gap-2 rounded-lg bg-gold px-7 py-2.5 font-bold text-header-bg shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-xl"
              >
                <Star className="h-4 w-4" /> Xem kho sim tam hoa
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
          {/* ── 1. Mở bài: đọc một số tam hoa ─────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Sim tam hoa là gì? Đọc thử một số sẽ rõ
            </h2>
            <div className="space-y-4 leading-relaxed text-muted-foreground">
              <p>
                Thử đọc to số <strong className="text-foreground">0906.839.222</strong>. Phần đuôi chỉ mất một nhịp:
                &ldquo;hai hai hai&rdquo;. Ba chữ số giống nhau nằm liền nhau ở cuối dãy — đó là{" "}
                <strong className="text-foreground">tam hoa</strong>. Tên gọi mộc mạc như vậy: ba con số cùng mặt xếp
                thành một cụm.
              </p>
              <p>
                Trên kho này, luật nhận số tam hoa rất chặt: ba chữ số cuối phải giống nhau, và cả dãy chỉ có đúng một
                cụm ba số như thế. Dãy nào có hai cụm (0901.111.222) được xếp sang{" "}
                <a href="/sim-tam-hoa-kep" className="font-medium text-primary underline-offset-2 hover:underline">
                  tam hoa kép
                </a>
                ; dãy có bốn số cuối giống nhau đã bước sang{" "}
                <a href="/mua-sim-tu-quy" className="font-medium text-primary underline-offset-2 hover:underline">
                  tứ quý
                </a>
                . Nhờ vậy con số Quý khách thấy dưới đây đúng là số tam hoa, không lẫn nhóm khác.
              </p>
            </div>
          </section>

          {/* ── 2. Khoảng giá thật, đọc từ kho lúc render ──────────────────── */}
          {stats.count > 0 && (
            <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
              <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
                <span className="h-8 w-1 rounded-full bg-primary" />
                Sim tam hoa giá bao nhiêu — số liệu từ kho
              </h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                Kho đang có <strong className="text-foreground">{stats.count.toLocaleString("vi-VN")}</strong> số tam
                hoa. Số rẻ nhất <strong className="text-foreground">{formatTrieu(stats.min)}</strong>, phần đông nằm
                trong khoảng <strong className="text-foreground">{formatTrieu(stats.p25)}</strong> đến{" "}
                <strong className="text-foreground">{formatTrieu(stats.p75)}</strong>, mức giữa là{" "}
                {formatTrieu(stats.median)}. Dãy đẹp nhất lên tới {formatTrieu(stats.max)}.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <caption className="sr-only">Số lượng sim tam hoa theo từng khoảng giá</caption>
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
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Bảng đếm trực tiếp trên kho lúc trang được cập nhật, nên con số nhích lên xuống theo lượng hàng bán ra.
                Quý khách muốn khoanh vùng theo ngân sách trước thì xem{" "}
                <a href="/sim-gia" className="font-medium text-primary underline-offset-2 hover:underline">
                  sim theo giá
                </a>
                .
              </p>
            </section>
          )}
          {/* ── 3. Chọn cụm số nào ─────────────────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Cụm ba số nào đáng chọn — và ai thường chọn
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <h3 className="mb-1.5 font-semibold text-foreground">888 và 999 — nhóm được hỏi nhiều nhất</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Dân gian đọc 8 là phát, 9 là trường cửu, nên hai cụm này luôn đi nhanh và giá cao hơn phần còn lại.
                  Chủ doanh nghiệp, người làm bất động sản hay chọn để in lên danh thiếp.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <h3 className="mb-1.5 font-semibold text-foreground">666 và 777 — cân giữa ý nghĩa và giá</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  666 gắn với lộc, 777 gắn với may mắn. Hai cụm này giữ được lớp ý nghĩa mà giá dễ chịu hơn 888, phù hợp
                  Anh Chị mở cửa hàng, làm dịch vụ.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <h3 className="mb-1.5 font-semibold text-foreground">000 và 111 — gọn, rất dễ đọc qua điện thoại</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Đuôi tròn, đọc một lần là khách ghi được. Nhóm này thường rẻ nhất trong tam hoa, hợp làm số nhận đơn
                  hàng hay số tổng đài nhỏ.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <h3 className="mb-1.5 font-semibold text-foreground">Đầu số quyết định phần lớn giá</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {stats.topPrefixes.length > 0
                    ? `Kho tam hoa hiện tập trung ở đầu ${stats.topPrefixes
                        .slice(0, 3)
                        .map((p) => p.prefix)
                        .join(", ")}. Cùng một cụm ba số, đầu 090 và 093 luôn cao hơn 07x.`
                    : "Cùng một cụm ba số, đầu 090 và 093 luôn cao hơn 07x — đầu số cổ giữ giá tốt hơn."}
                </p>
              </div>
            </div>
          </section>

          {/* ── 4. Bảng giá thật + ItemList/Product/Offer ──────────────────── */}
          <CategorySimPriceList
            title="Giá sim tam hoa đang bán"
            sims={snapshotSims}
            pageUrl={CANONICAL}
            note="Bảng lấy 8 số tam hoa có giá thấp nhất trong kho tại thời điểm cập nhật."
          />

          {/* ── 5. Lưới lọc theo tag ───────────────────────────────────────── */}
          <CategorySimGrid
            title="Sim Tam Hoa Mới Cập Nhật"
            searchPlaceholder="Nhập số cần tìm, hoặc *888 / *999 để xem đuôi tam hoa"
            emptyText="Kho tạm hết số khớp yêu cầu này. Quý khách thử tìm *888 hoặc *222, hoặc gọi 0938.868.868 để đội ngũ tư vấn lọc số theo đúng ngân sách."
            matchTags={[TAG]}
          />

          <TrustCommitments />
          {/* ── 6. FAQ ─────────────────────────────────────────────────────── */}
          <FaqAccordion items={faqItems} />

          {/* ── 7. Liên kết chéo trong cụm dạng số ─────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Các dạng số gần với tam hoa
            </h2>
            <ul className="flex flex-wrap gap-3 text-sm">
              <li><a href="/sim-tam-hoa-kep" className="font-medium text-primary underline-offset-2 hover:underline">Sim tam hoa kép</a></li>
              <li><a href="/mua-sim-tu-quy" className="font-medium text-primary underline-offset-2 hover:underline">Sim tứ quý</a></li>
              <li><a href="/sim-ngu-quy" className="font-medium text-primary underline-offset-2 hover:underline">Sim ngũ quý</a></li>
              <li><a href="/sim-lap-kep" className="font-medium text-primary underline-offset-2 hover:underline">Sim lặp kép</a></li>
              <li><a href="/sim-ganh-dao" className="font-medium text-primary underline-offset-2 hover:underline">Sim gánh đảo</a></li>
              <li><a href="/sim-taxi" className="font-medium text-primary underline-offset-2 hover:underline">Sim taxi</a></li>
              <li><a href="/sim-than-tai" className="font-medium text-primary underline-offset-2 hover:underline">Sim thần tài</a></li>
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
              { name: "Sim tam hoa", path: "/sim-tam-hoa" },
            ]),
          ),
        }}
      />
    </>
  );
}
