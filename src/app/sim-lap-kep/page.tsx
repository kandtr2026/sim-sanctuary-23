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
const TAG = "Lặp kép";

const TITLE = "Sim Lặp Kép Mobifone | Đuôi Kép Đôi 2288, 5500, 6688";
const DESCRIPTION =
  "Sim lặp kép Mobifone có đuôi hai cặp số liền nhau: 2288, 5500, 6688. Đọc một nhịp là khách nhớ. Giá niêm yết từng số, sang tên chính chủ, giao nhanh.";
const CANONICAL = `${BASE_URL}/sim-lap-kep`;

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
      description: "Sim lặp kép Mobifone — đuôi hai cặp số liền nhau 2288, 6688. Giá công khai, chính chủ.",
      url: CANONICAL,
      images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
    },
  };
}

const faqItems = [
  {
    q: "Sim lặp kép là gì?",
    a: "Lặp kép là đuôi số gồm hai cặp giống nhau đứng liền nhau — 0703.222.288 phần đuôi 2288, 0934.005.500 phần đuôi 5500, 0909.578.866 phần đuôi 8866. Kho cũng xếp vào nhóm này những dãy có ba cặp liền nhau ở sáu số cuối, kiểu 11.22.33.",
  },
  {
    q: "Sim lặp kép và sim kép bằng có giống nhau không?",
    a: "Không. Kép bằng là hai số cuối giống nhau (…88). Lặp kép cần hai cặp liền nhau (…2288), tức bốn chữ số cuối chia thành hai đôi. Dãy dài phần lặp nên nhịp đọc rõ hơn, và nguồn hàng cũng hẹp hơn kép bằng.",
  },
  {
    q: "Sim lặp kép giá bao nhiêu?",
    a: "Cặp số đứng sau quyết định phần lớn giá: đuôi 6688, 8899 cao nhất, đuôi 5500 hay 1100 mềm hơn. Đầu số 090, 093 cộng thêm một bậc. Bảng dưới đây lấy trực tiếp từ kho nên Quý khách thấy đúng giá đang bán, không phải giá tham khảo.",
  },
  {
    q: "Vì sao chủ shop hay chọn sim lặp kép làm hotline?",
    a: "Khách đọc theo cặp nên nhớ nhanh, nhân viên đọc qua điện thoại cũng ít sai. Dãy 22.88 chỉ mất hai nhịp thay vì bốn, và khi in lên bảng hiệu hay xe giao hàng thì mắt nhìn một lần là đủ.",
  },
  {
    q: "Đặt sim lặp kép rồi nhận hàng thế nào?",
    a: "Quý khách chọn số, đội ngũ giữ số và xác nhận qua điện thoại hoặc Zalo. 30 phút nhận SIM toàn quốc. Kiểm tra SIM trên tay rồi mới thanh toán, hỗ trợ sang tên chính chủ.",
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

export default async function SimLapKepPage() {
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
              Sim Lặp Kép Mobifone — <span className="text-gold">2288, 5500, 6688</span>
            </h1>
            <p className="mx-auto mb-5 max-w-xl text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              {stats.count > 0
                ? `Đuôi chia thành hai cặp, đọc hai nhịp là hết. Kho còn ${stats.count.toLocaleString("vi-VN")} số, giá từ ${formatTrieu(stats.min)}, giá hiện sẵn cạnh từng số.`
                : "Đuôi chia thành hai cặp, đọc hai nhịp là hết. Kho đang cập nhật — Quý khách nhắn Zalo để nhận số mới về."}
            </p>
            <div className="mx-auto flex max-w-md flex-col justify-center gap-2.5 sm:flex-row">
              <a
                href="#kho-sim"
                className="flex items-center justify-center gap-2 rounded-lg bg-gold px-7 py-2.5 font-bold text-header-bg shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-xl"
              >
                <Star className="h-4 w-4" /> Xem kho sim lặp kép
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
          {/* ── 1. Mở bài: nhịp đọc ────────────────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Đọc bốn chữ số cuối trong hai nhịp
            </h2>
            <div className="space-y-4 leading-relaxed text-muted-foreground">
              <p>
                Một số bình thường có đuôi 2837, khách phải nghe đủ bốn con số rời. Đuôi{" "}
                <strong className="text-foreground">22.88</strong> thì khác: hai nhịp là xong, và người nghe gần như
                không cần nhắc lại. Đó là lợi thế thật của <strong className="text-foreground">sim lặp kép</strong> —
                đuôi số chia thành hai cặp giống nhau đứng liền nhau.
              </p>
              <p>
                Ví dụ trong kho: <strong className="text-foreground">0703.222.288</strong> (đuôi 2288),{" "}
                <strong className="text-foreground">0934.005.500</strong> (đuôi 5500),{" "}
                <strong className="text-foreground">0909.578.866</strong> (đuôi 8866). Ngoài dạng bốn số, kho còn xếp vào
                nhóm này các dãy có ba cặp liền nhau ở sáu số cuối, kiểu 11.22.33 — nhịp đọc còn gọn hơn nữa.
              </p>
              <p>
                Cần phân biệt với hai nhóm gần kề: đuôi bốn số giống nhau là{" "}
                <a href="/mua-sim-tu-quy" className="font-medium text-primary underline-offset-2 hover:underline">
                  tứ quý
                </a>
                , còn đuôi một cặp lặp lại như 8585 nằm ở{" "}
                <a href="/sim-de-nho" className="font-medium text-primary underline-offset-2 hover:underline">
                  sim dễ nhớ
                </a>
                . Danh sách dưới đây chỉ gồm dãy đúng dạng hai cặp.
              </p>
            </div>
          </section>

          {/* ── 2. Cặp số nào đắt, cặp nào mềm ─────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Cặp đứng sau quyết định giá
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <caption className="sr-only">Ý nghĩa và mặt bằng giá theo cặp số đứng sau</caption>
                <thead>
                  <tr className="border-b border-border text-left">
                    <th scope="col" className="py-2 pr-4 font-semibold text-foreground">Đuôi</th>
                    <th scope="col" className="py-2 pr-4 font-semibold text-foreground">Cách đọc dân gian</th>
                    <th scope="col" className="py-2 font-semibold text-foreground">Mặt bằng giá</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  <tr className="border-b border-border">
                    <td className="py-2 pr-4 font-medium text-foreground">…6688 / …8899</td>
                    <td className="py-2 pr-4">Lộc phát, phát mãi</td>
                    <td className="py-2">Cao nhất nhóm</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2 pr-4 font-medium text-foreground">…3399 / …7799</td>
                    <td className="py-2 pr-4">Tài lộc lâu bền</td>
                    <td className="py-2">Bậc trên trung bình</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2 pr-4 font-medium text-foreground">…2288 / …1188</td>
                    <td className="py-2 pr-4">Vào lộc, thuận đường</td>
                    <td className="py-2">Trung bình</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium text-foreground">…5500 / …1100</td>
                    <td className="py-2 pr-4">Gọn, tròn, dễ đọc</td>
                    <td className="py-2">Mềm nhất nhóm</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Anh Chị cần một hotline dễ đọc mà không phải trả cho lớp ý nghĩa thì hai dòng cuối bảng là chỗ đáng xem
              trước.
            </p>
          </section>
          {/* ── 3. Khoảng giá thật ─────────────────────────────────────────── */}
          {stats.count > 0 && (
            <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
              <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
                <span className="h-8 w-1 rounded-full bg-primary" />
                Sim lặp kép giá bao nhiêu — đếm trên kho
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-secondary/30 p-4">
                  <p className="mb-2 text-sm font-semibold text-foreground">Mặt bằng giá</p>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    Thấp nhất <strong className="text-foreground">{formatTrieu(stats.min)}</strong>, mức giữa{" "}
                    <strong className="text-foreground">{formatTrieu(stats.median)}</strong>. Nửa số hàng nằm trong khoảng{" "}
                    {formatTrieu(stats.p25)} – {formatTrieu(stats.p75)}, dãy cao nhất {formatTrieu(stats.max)}.
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
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Tổng {stats.count.toLocaleString("vi-VN")} số lặp kép đang bán. Muốn khoanh theo ngân sách trước, Quý
                khách xem{" "}
                <a href="/sim-gia" className="font-medium text-primary underline-offset-2 hover:underline">
                  sim theo giá
                </a>
                .
              </p>
            </section>
          )}

          {/* ── 4. Bảng giá thật + ItemList/Product/Offer ──────────────────── */}
          <CategorySimPriceList
            title="Giá sim lặp kép đang bán"
            sims={snapshotSims}
            pageUrl={CANONICAL}
            note="Bảng lấy 8 số lặp kép có giá thấp nhất trong kho tại thời điểm cập nhật."
          />

          {/* ── 5. Lưới lọc theo tag ───────────────────────────────────────── */}
          <CategorySimGrid
            title="Sim Lặp Kép Mới Cập Nhật"
            searchPlaceholder="Nhập số cần tìm, hoặc *6688 / *2288 để thử một đuôi cụ thể"
            emptyText="Kho tạm hết số khớp yêu cầu này. Quý khách thử đuôi khác như *5500, hoặc gọi 0938.868.868 để đội ngũ tư vấn lọc theo ngân sách."
            matchTags={[TAG]}
          />

          <TrustCommitments />
          {/* ── 6. FAQ ─────────────────────────────────────────────────────── */}
          <FaqAccordion items={faqItems} />

          {/* ── 7. Liên kết chéo ───────────────────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Xem thêm dạng số khác
            </h2>
            <ul className="flex flex-wrap gap-3 text-sm">
              <li><a href="/sim-de-nho" className="font-medium text-primary underline-offset-2 hover:underline">Sim dễ nhớ</a></li>
              <li><a href="/sim-ganh-dao" className="font-medium text-primary underline-offset-2 hover:underline">Sim gánh đảo</a></li>
              <li><a href="/sim-tam-hoa" className="font-medium text-primary underline-offset-2 hover:underline">Sim tam hoa</a></li>
              <li><a href="/sim-taxi" className="font-medium text-primary underline-offset-2 hover:underline">Sim taxi</a></li>
              <li><a href="/sim-tien-len" className="font-medium text-primary underline-offset-2 hover:underline">Sim tiến lên</a></li>
              <li><a href="/sim-loc-phat" className="font-medium text-primary underline-offset-2 hover:underline">Sim lộc phát</a></li>
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
              { name: "Sim lặp kép", path: "/sim-lap-kep" },
            ]),
          ),
        }}
      />
    </>
  );
}
