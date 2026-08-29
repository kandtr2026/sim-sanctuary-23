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
const TAG = "Gánh đảo";

const TITLE = "Sim Gánh Đảo Là Gì? Kho Sim Gánh Đảo Mobifone";
const DESCRIPTION =
  "Sim gánh đảo có bốn số cuối đối xứng kiểu 3993, 4004 — cặp giữa được hai số giống nhau gánh hai bên. Kho Mobifone giá công khai, giao nội thành HCM.";
const CANONICAL = `${BASE_URL}/sim-ganh-dao`;

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
      description: "Sim gánh đảo Mobifone — bốn số cuối đối xứng 3993, 4004. Giá công khai, chính chủ.",
      url: CANONICAL,
      images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
    },
  };
}

const faqItems = [
  {
    q: "Sim gánh đảo là gì?",
    a: "Gánh đảo là bốn số cuối xếp đối xứng theo dạng A-B-B-A: 0903.03.3993, 0767.004.004 phần đuôi 4004, 0938.929.229 phần đuôi 9229. Cặp số giống nhau nằm giữa, hai bên là hai con số giống nhau khác — dân trong nghề đọc là hai đầu gánh cặp giữa, đọc ngược hay đọc xuôi đều ra một dãy.",
  },
  {
    q: "Gánh đảo khác sim gánh thường thế nào?",
    a: "Sim gánh thường chỉ cần ba số cuối dạng A-B-A, ví dụ 393. Gánh đảo dài hơn một chữ số và cân hai bên: A-B-B-A. Kho này chỉ xếp vào nhóm gánh đảo những dãy đúng bốn số cuối đối xứng, nên số Quý khách thấy dưới đây đều đọc xuôi ngược như nhau.",
  },
  {
    q: "Sim gánh đảo giá bao nhiêu?",
    a: "Đây là một trong những dạng số cân đối có giá mềm nhất. Nhiều dãy nằm ở tầm vài triệu, cao hơn thì thuộc nhóm cặp 6, 8, 9 trên đầu số cổ. Bảng giá phía dưới lấy trực tiếp từ kho nên Quý khách thấy đúng mặt bằng giá đang bán.",
  },
  {
    q: "Sim gánh đảo hợp với ai?",
    a: "Người hay đọc số qua điện thoại: chủ quán, tài xế, người giao hàng, nhân viên bán hàng. Dãy đối xứng có nhịp riêng nên khách nghe một lần thường đọc lại đúng, giảm hẳn cảnh phải nhắc lại số nhiều lần trong ngày.",
  },
  {
    q: "Mua sim gánh đảo có sang tên chính chủ được không?",
    a: "Được. Sim tại CHONSOMOBIFONE.COM đều sang tên chính chủ, Quý khách nhận SIM và kiểm tra trước khi thanh toán. Nội thành TP.HCM giao trong 30 phút – 2 giờ làm việc, tỉnh thành khác 1–3 ngày qua chuyển phát nhanh.",
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

export default async function SimGanhDaoPage() {
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
              Sim Gánh Đảo Mobifone — <span className="text-gold">3993, 4004, 9229</span>
            </h1>
            <p className="mx-auto mb-5 max-w-xl text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              {stats.count > 0
                ? `Bốn số cuối đọc xuôi ngược như nhau. Kho còn ${stats.count.toLocaleString("vi-VN")} số, giá từ ${formatTrieu(stats.min)} — dạng số cân đối dễ tiếp cận nhất.`
                : "Bốn số cuối đọc xuôi ngược như nhau. Kho đang cập nhật, Quý khách nhắn Zalo để nhận danh sách số mới."}
            </p>
            <div className="mx-auto flex max-w-md flex-col justify-center gap-2.5 sm:flex-row">
              <a
                href="#kho-sim"
                className="flex items-center justify-center gap-2 rounded-lg bg-gold px-7 py-2.5 font-bold text-header-bg shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-xl"
              >
                <Star className="h-4 w-4" /> Xem kho sim gánh đảo
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
          {/* ── 1. Mở bài: trả lời thẳng câu khách gõ ──────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Sim gánh đảo là gì?
            </h2>
            <div className="space-y-4 leading-relaxed text-muted-foreground">
              <p>
                Gánh đảo là <strong className="text-foreground">bốn số cuối xếp đối xứng</strong>: con số ngoài cùng bên
                trái trùng với con số ngoài cùng bên phải, hai số ở giữa giống nhau. Viết theo chữ cái là A-B-B-A.
              </p>
              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <p className="mb-2 text-sm font-semibold text-foreground">Tách một số ra để thấy rõ</p>
                <p className="font-mono text-lg tracking-widest text-gold">0903.03.3993</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Bốn số cuối là <strong className="text-foreground">3–9–9–3</strong>. Cặp 99 nằm giữa, hai số 3 gánh
                  hai bên. Đọc từ phải sang trái vẫn ra 3993 — chỗ &ldquo;đảo&rdquo; trong tên gọi nằm ở đó.
                </p>
              </div>
              <p>
                Cùng luật này còn có 0767.004.004 (đuôi 4004) và 0938.929.229 (đuôi 9229). Dãy nào chỉ đối xứng ba số như
                393 thì thuộc sim gánh thường, không nằm trong danh sách này.
              </p>
            </div>
          </section>

          {/* ── 2. Vì sao dạng số này bán chạy ─────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Ai nên chọn sim gánh đảo
            </h2>
            <ol className="space-y-3 leading-relaxed text-muted-foreground">
              <li className="rounded-lg border border-border bg-secondary/20 p-4">
                <span className="font-semibold text-foreground">1. Người đọc số cả ngày.</span> Chủ quán, tài xế, nhân
                viên bán hàng đọc số hàng chục lần mỗi ngày. Dãy đối xứng có nhịp, khách nghe một lần thường ghi đúng
                ngay lần đầu.
              </li>
              <li className="rounded-lg border border-border bg-secondary/20 p-4">
                <span className="font-semibold text-foreground">2. Người muốn số cân đối mà giữ ngân sách.</span> So với
                tam hoa hay tứ quý, gánh đảo mềm giá hơn rõ rệt trong khi vẫn thuộc nhóm số có cấu trúc.
              </li>
              <li className="rounded-lg border border-border bg-secondary/20 p-4">
                <span className="font-semibold text-foreground">3. Người chọn theo phong thủy.</span> Cặp giữa quyết
                định phần lớn ý nghĩa: 99 chỉ sự lâu bền, 88 chỉ phát đạt, 66 chỉ lộc. Quý khách chọn cặp giữa trước rồi
                mới tính tới hai số gánh hai bên.
              </li>
            </ol>
            {stats.topPrefixes.length > 0 && (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Kho gánh đảo hiện dày nhất ở các đầu số{" "}
                {stats.topPrefixes.slice(0, 3).map((p) => `${p.prefix} (${p.count.toLocaleString("vi-VN")} số)`).join(", ")}.
              </p>
            )}
          </section>
          {/* ── 3. Khoảng giá thật ─────────────────────────────────────────── */}
          {stats.count > 0 && (
            <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
              <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
                <span className="h-8 w-1 rounded-full bg-primary" />
                Sim gánh đảo giá bao nhiêu
              </h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                Kho còn <strong className="text-foreground">{stats.count.toLocaleString("vi-VN")}</strong> số gánh đảo.
                Thấp nhất <strong className="text-foreground">{formatTrieu(stats.min)}</strong>, mức giữa{" "}
                <strong className="text-foreground">{formatTrieu(stats.median)}</strong>, và ba phần tư số hàng nằm dưới{" "}
                {formatTrieu(stats.p75)}. Dãy cao nhất hiện tại {formatTrieu(stats.max)} — thuộc nhóm cặp giữa 8, 9 trên
                đầu số cổ.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <caption className="sr-only">Số lượng sim gánh đảo theo từng khoảng giá</caption>
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
            title="Giá sim gánh đảo đang bán"
            sims={snapshotSims}
            pageUrl={CANONICAL}
            note="Bảng lấy 8 số gánh đảo có giá thấp nhất trong kho tại thời điểm cập nhật."
          />

          {/* ── 5. Lưới lọc theo tag ───────────────────────────────────────── */}
          <CategorySimGrid
            title="Sim Gánh Đảo Mới Cập Nhật"
            searchPlaceholder="Nhập số cần tìm, hoặc *9229 / *3993 để thử một đuôi cụ thể"
            emptyText="Kho tạm hết số khớp yêu cầu này. Quý khách thử một đuôi khác như *6006 hoặc gọi 0938.868.868 để đội ngũ tư vấn lọc theo ngân sách."
            matchTags={[TAG]}
          />

          <TrustCommitments />
          {/* ── 6. FAQ ─────────────────────────────────────────────────────── */}
          <FaqAccordion items={faqItems} />

          {/* ── 7. Liên kết chéo ───────────────────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Dạng số khác cũng dễ đọc, dễ nhớ
            </h2>
            <ul className="flex flex-wrap gap-3 text-sm">
              <li><a href="/sim-lap-kep" className="font-medium text-primary underline-offset-2 hover:underline">Sim lặp kép</a></li>
              <li><a href="/sim-de-nho" className="font-medium text-primary underline-offset-2 hover:underline">Sim dễ nhớ</a></li>
              <li><a href="/sim-taxi" className="font-medium text-primary underline-offset-2 hover:underline">Sim taxi</a></li>
              <li><a href="/sim-tien-len" className="font-medium text-primary underline-offset-2 hover:underline">Sim tiến lên</a></li>
              <li><a href="/sim-tam-hoa" className="font-medium text-primary underline-offset-2 hover:underline">Sim tam hoa</a></li>
              <li><a href="/sim-loc-phat" className="font-medium text-primary underline-offset-2 hover:underline">Sim lộc phát</a></li>
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
              { name: "Sim gánh đảo", path: "/sim-ganh-dao" },
            ]),
          ),
        }}
      />
    </>
  );
}
