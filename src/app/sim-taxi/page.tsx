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
const TAG = "Taxi";

const TITLE = "Sim Taxi Là Gì? Kho Sim Taxi Mobifone 417417, 070070";
const DESCRIPTION =
  "Sim taxi là số có sáu chữ số cuối lặp thành cụm: 417.417 hay 07.07.07. Nghe một lần đọc lại được ngay. Kho Mobifone giá công khai, sang tên chính chủ.";
const CANONICAL = `${BASE_URL}/sim-taxi`;

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
      description: "Sim taxi Mobifone — sáu số cuối lặp thành cụm 417.417, 07.07.07. Giá công khai.",
      url: CANONICAL,
      images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
    },
  };
}

const faqItems = [
  {
    q: "Sim taxi là gì?",
    a: "Sim taxi là số có sáu chữ số cuối lặp lại thành cụm. Hai dạng được tính: cụm ba số lặp một lần — 0938.417.417, 0764.979.979 — và cặp hai số lặp ba lần, kiểu 07.07.07. Tên gọi đến từ giới taxi và xe tải: số in lên thân xe phải đọc được khi xe đang chạy, nên nhà xe săn đúng dạng số này.",
  },
  {
    q: "Sim taxi và sim lặp kép khác nhau ở đâu?",
    a: "Lặp kép chỉ lặp hai cặp ở bốn số cuối (…2288). Sim taxi lặp cả một cụm ba số hoặc lặp cặp tới ba lần, tức phần có cấu trúc dài tới sáu chữ số. Nhìn trên danh thiếp, dãy taxi tách thành hai khối giống nhau nên mắt nhận ra ngay.",
  },
  {
    q: "Sim taxi giá bao nhiêu?",
    a: "Giá đi theo cụm được lặp. Cụm chứa 6, 8, 9 hoặc trùng nhóm tài lộc (68.68.68, 79.79.79) nằm ở đỉnh bảng; cụm số trung tính như 417.417 mềm hơn nhiều. Đây là nhóm có biên độ giá rộng nhất trong các dạng số, nên Quý khách nên xem bảng giá thật trước khi định ngân sách.",
  },
  {
    q: "Ai nên chọn sim taxi?",
    a: "Nhà xe, đơn vị vận chuyển, cửa hàng có xe giao hàng, và bất kỳ ai in số lên biển hiệu lớn. Dãy tách khối nên đọc từ xa vẫn đúng. Nhóm khách thứ hai là người làm dịch vụ 24/7 — số dễ đọc qua điện thoại giúp khách gọi lại đúng ngay lần đầu.",
  },
  {
    q: "Kho sim taxi có nhiều số không?",
    a: "Nhóm này khan hơn hẳn tam hoa hay gánh đảo vì cần tới sáu chữ số xếp đúng dạng. Danh sách trên trang cập nhật theo kho mỗi 5 phút; nếu chưa thấy cụm Quý khách muốn, đội ngũ tư vấn sẽ báo khi có dãy mới qua Zalo 0933356666.",
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

export default async function SimTaxiPage() {
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
              Sim Taxi Mobifone — <span className="text-gold">417.417, 070.070, 68.68.68</span>
            </h1>
            <p className="mx-auto mb-5 max-w-xl text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              {stats.count > 0
                ? `Sáu số cuối tách thành hai khối giống nhau, đọc từ xa vẫn đúng. Kho còn ${stats.count.toLocaleString("vi-VN")} số, giá từ ${formatTrieu(stats.min)}.`
                : "Sáu số cuối tách thành hai khối giống nhau. Nhóm khan hàng — Quý khách nhắn Zalo để nhận tin khi có dãy mới."}
            </p>
            <div className="mx-auto flex max-w-md flex-col justify-center gap-2.5 sm:flex-row">
              <a
                href="#kho-sim"
                className="flex items-center justify-center gap-2 rounded-lg bg-gold px-7 py-2.5 font-bold text-header-bg shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-xl"
              >
                <Star className="h-4 w-4" /> Xem kho sim taxi
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
          {/* ── 1. Mở bài: cái tên đến từ đâu ─────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Vì sao gọi là sim taxi?
            </h2>
            <div className="space-y-4 leading-relaxed text-muted-foreground">
              <p>
                Cái tên ra đời từ nghề xe. Số dán trên thân taxi hay xe tải phải đọc được lúc xe đang chạy, nên nhà xe chỉ
                chọn dãy lặp khối: <strong className="text-foreground">0938.417.417</strong> — nhìn một lần là thấy 417
                hai lần, không cần dò từng chữ số. Giới bán số gọi luôn dạng này là{" "}
                <strong className="text-foreground">sim taxi</strong>.
              </p>
              <p>
                Trên kho này, một số được xếp vào nhóm taxi khi sáu chữ số cuối lặp thành cụm. Cách đọc rất nhanh: che
                ba số cuối lại, nếu ba số còn lại giống hệt phần bị che thì đó là số taxi.
              </p>
            </div>
          </section>

          {/* ── 2. Hai dạng taxi ──────────────────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Hai dạng số taxi Quý khách sẽ thấy trong kho
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Dạng 1 — cụm ba số lặp</p>
                <p className="font-mono text-lg tracking-widest text-gold">0764.979.979</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Cụm <strong className="text-foreground">979</strong> xuất hiện hai lần liền nhau. Dạng phổ biến nhất,
                  và cũng là dạng nhà xe hay chọn vì hai khối tách rõ khi in.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">Dạng 2 — cặp hai số lặp ba lần</p>
                <p className="font-mono text-lg tracking-widest text-gold">0938.68.68.68</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Cặp <strong className="text-foreground">68</strong> nhắc lại ba lần. Nhóm này hiếm và đắt hơn dạng 1,
                  đặc biệt khi cặp lặp là 68, 79 hay 86.
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Dãy lặp cụm nhưng cả cụm cùng một con số (…888.888) không nằm ở đây — số đó thuộc nhóm{" "}
              <a href="/sim-ngu-quy" className="font-medium text-primary underline-offset-2 hover:underline">
                ngũ quý, lục quý
              </a>
              , một bậc giá khác hẳn.
            </p>
          </section>
          {/* ── 3. Khoảng giá thật ─────────────────────────────────────────── */}
          {stats.count > 0 && (
            <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
              <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
                <span className="h-8 w-1 rounded-full bg-primary" />
                Sim taxi giá bao nhiêu — biên độ rất rộng
              </h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                Kho còn <strong className="text-foreground">{stats.count.toLocaleString("vi-VN")}</strong> số taxi. Dãy
                mềm nhất <strong className="text-foreground">{formatTrieu(stats.min)}</strong>, mức giữa{" "}
                <strong className="text-foreground">{formatTrieu(stats.median)}</strong>, còn dãy đắt nhất lên tới{" "}
                {formatTrieu(stats.max)} — khoảng cách này đến từ cụm được lặp, không phải từ đầu số. Anh Chị nên chốt
                cụm số muốn trước, rồi mới xét ngân sách.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <caption className="sr-only">Số lượng sim taxi theo từng khoảng giá</caption>
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
            title="Giá sim taxi đang bán"
            sims={snapshotSims}
            pageUrl={CANONICAL}
            note="Bảng lấy 8 số taxi có giá thấp nhất trong kho tại thời điểm cập nhật."
          />

          {/* ── 5. Lưới lọc theo tag ───────────────────────────────────────── */}
          <CategorySimGrid
            title="Sim Taxi Mới Cập Nhật"
            searchPlaceholder="Nhập số cần tìm, hoặc *686868 / *979979 để thử một cụm"
            emptyText="Nhóm taxi khan hàng nên kho có lúc trống. Quý khách nhắn Zalo 0933356666 kèm cụm số muốn tìm, đội ngũ tư vấn sẽ báo ngay khi có."
            matchTags={[TAG]}
          />

          <TrustCommitments />
          {/* ── 6. FAQ ─────────────────────────────────────────────────────── */}
          <FaqAccordion items={faqItems} />

          {/* ── 7. Liên kết chéo ───────────────────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Dạng số khác cùng kiểu lặp khối
            </h2>
            <ul className="flex flex-wrap gap-3 text-sm">
              <li><a href="/sim-lap-kep" className="font-medium text-primary underline-offset-2 hover:underline">Sim lặp kép</a></li>
              <li><a href="/sim-de-nho" className="font-medium text-primary underline-offset-2 hover:underline">Sim dễ nhớ</a></li>
              <li><a href="/sim-tam-hoa-kep" className="font-medium text-primary underline-offset-2 hover:underline">Sim tam hoa kép</a></li>
              <li><a href="/sim-ngu-quy" className="font-medium text-primary underline-offset-2 hover:underline">Sim ngũ quý</a></li>
              <li><a href="/sim-loc-phat" className="font-medium text-primary underline-offset-2 hover:underline">Sim lộc phát</a></li>
              <li><a href="/sim-gia/5-10-trieu" className="font-medium text-primary underline-offset-2 hover:underline">Sim giá 5–10 triệu</a></li>
              <li><a href="/sim-dau-so" className="font-medium text-primary underline-offset-2 hover:underline">Sim theo đầu số</a></li>
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
              { name: "Sim taxi", path: "/sim-taxi" },
            ]),
          ),
        }}
      />
    </>
  );
}
