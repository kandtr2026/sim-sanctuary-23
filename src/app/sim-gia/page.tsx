import type { Metadata } from "next";
import { Phone, Star, Sparkles, Wallet } from "lucide-react";
import { buildBreadcrumb, BASE_URL } from "@/lib/seo";
import { formatTrieu, PRICE_BAND_SLUGS, resolvePriceBand, getBandInventory } from "@/lib/simDangSo";

export const revalidate = 300;

const ZALO_URL = "https://zalo.me/0933356666";

const TITLE = "Sim Số Đẹp Theo Giá | Chọn Đúng Ngân Sách";
const DESCRIPTION =
  "Chọn sim Mobifone theo đúng ngân sách: 1–3 triệu, 3–5 triệu, 5–10 triệu, 10–50 triệu. Mỗi dải một kho riêng, giá niêm yết công khai, sang tên chính chủ.";
const CANONICAL = `${BASE_URL}/sim-gia`;

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    title: TITLE,
    description: "Sim Mobifone chia theo bốn dải giá, mỗi dải một kho riêng. Giá niêm yết công khai.",
    url: CANONICAL,
    images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
  },
};

// Mô tả riêng cho từng dải — viết tay theo đặc điểm kho, KHÔNG sinh từ khuôn,
// để bốn thẻ trên hub không đọc như một câu nhân bốn lần.
const BAND_BLURB: Record<string, string> = {
  "1-3-trieu":
    "Dải đông hàng nhất kho. Đủ đuôi thần tài, lộc phát, gánh đảo cho Quý khách cần một số đẹp mà giữ ngân sách.",
  "3-5-trieu":
    "Bậc trung, nhiều tam hoa và lặp kép. Mức nhiều chủ shop chọn khi lấy số làm hotline nhận đơn.",
  "5-10-trieu":
    "Nhiều dãy đầu 090, 093 và đuôi tam hoa. Mức giá của số dùng lâu dài, in được lên danh thiếp.",
  "10-50-trieu":
    "Nhóm cao cấp: tứ quý, tam hoa kép, taxi và các đuôi tài lộc hiếm. Số ở đây giữ giá theo thời gian.",
};

export default async function SimGiaHubPage() {
  // Đếm tồn kho thật cho từng dải ngay lúc render — thẻ trên hub hiện số thật
  // thay vì con số viết cứng rồi mốc dần.
  const bands = await Promise.all(
    PRICE_BAND_SLUGS.map(async (slug) => {
      const band = resolvePriceBand(slug);
      if (!band) return null;
      const inv = await getBandInventory(band, 1);
      return { slug, band, count: inv.count, min: inv.min, median: inv.median };
    }),
  );
  const cards = bands.filter((b): b is NonNullable<typeof b> => b !== null);

  return (
    <>
      <main className="min-h-screen bg-background">
        <section
          style={{ minHeight: "clamp(280px, 34vw, 340px)" }}
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
              Sim Mobifone theo <span className="text-gold">khoảng giá</span>
            </h1>
            <p className="mx-auto mb-5 max-w-xl text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              Quý khách đặt ngân sách trước, kho lọc số sau. Bốn dải giá dưới đây, mỗi dải một danh sách riêng kèm giá
              niêm yết từng số.
            </p>
            <div className="mx-auto flex max-w-md flex-col justify-center gap-2.5 sm:flex-row">
              <a
                href="#danh-sach-dai-gia"
                className="flex items-center justify-center gap-2 rounded-lg bg-gold px-7 py-2.5 font-bold text-header-bg shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-xl"
              >
                <Star className="h-4 w-4" /> Xem bốn dải giá
              </a>
              <a
                href={ZALO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg border border-primary-foreground/25 bg-primary-foreground/10 px-7 py-2.5 font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-foreground/20"
              >
                <Phone className="h-4 w-4" /> Tư vấn theo ngân sách
              </a>
            </div>
          </div>
        </section>

        <div className="container mx-auto space-y-10 px-4 py-8 md:space-y-14 md:py-12">
          {/* ── 1. Mở bài ──────────────────────────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Đặt ngân sách trước, chọn số sau
            </h2>
            <div className="space-y-4 leading-relaxed text-muted-foreground">
              <p>
                Phần lớn khách hỏi số theo hai cách. Cách thứ nhất: nói dạng số muốn — tam hoa, thần tài, tứ quý. Cách
                thứ hai, và cũng là cách nhanh hơn: nói luôn khoảng tiền định chi. Kho lọc theo ngân sách rồi Quý khách
                chọn dãy đẹp nhất trong tầm đó.
              </p>
              <p>
                Bốn dải dưới đây bao phủ gần như toàn bộ hàng đang bán. Mỗi dải có một trang riêng, kèm bảng giá số thật
                và danh sách những dạng số đang có nhiều nhất trong dải.
              </p>
            </div>
          </section>

          {/* ── 2. Bốn dải giá ─────────────────────────────────────────────── */}
          <section id="danh-sach-dai-gia" className="scroll-mt-[var(--nav-height)]">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Bốn dải giá đang có hàng
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {cards.map((card) => (
                <a
                  key={card.slug}
                  href={`/sim-gia/${card.slug}`}
                  className="group flex flex-col rounded-xl border border-border bg-card p-5 shadow-card transition-colors hover:border-primary/40"
                >
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                      <Wallet className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <span className="text-lg font-bold text-foreground group-hover:text-primary">
                      Sim giá {card.band.label.replace(/ - /g, "–")}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{BAND_BLURB[card.slug]}</p>
                  {card.count > 0 && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Đang có <strong className="text-foreground">{card.count.toLocaleString("vi-VN")}</strong> số, mức
                      giữa {formatTrieu(card.median)}.
                    </p>
                  )}
                  <span className="mt-3 text-sm font-semibold text-primary underline-offset-2 group-hover:underline">
                    Xem kho {card.band.label.replace(/ - /g, "–")} →
                  </span>
                </a>
              ))}
            </div>
          </section>

          {/* ── 3. Dưới 1 triệu thì xem đâu ────────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Ngân sách dưới 1 triệu — xem kho khuyến mãi
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Dưới 1 triệu, kho số đẹp thường xuyên còn rất ít hàng nên chúng tôi không mở một danh sách riêng dễ trống.
              Chỗ đáng xem ở tầm này là{" "}
              <a href="/mua-sim-gia-re" className="font-medium text-primary underline-offset-2 hover:underline">
                kho SIM khuyến mãi đồng giá
              </a>{" "}
              — mọi số cùng một mức giá, một phần kèm sẵn gói cước, Quý khách chỉ việc chọn dãy ưng ý. Cần trả dần cho
              một số ở tầm cao hơn thì xem{" "}
              <a href="/sim-tra-gop" className="font-medium text-primary underline-offset-2 hover:underline">
                mua sim trả góp
              </a>
              .
            </p>
          </section>

          {/* ── 4. Liên kết chéo sang cụm dạng số ──────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Hoặc chọn theo dạng số
            </h2>
            <ul className="flex flex-wrap gap-3 text-sm">
              <li><a href="/sim-tam-hoa" className="font-medium text-primary underline-offset-2 hover:underline">Sim tam hoa</a></li>
              <li><a href="/sim-tam-hoa-kep" className="font-medium text-primary underline-offset-2 hover:underline">Sim tam hoa kép</a></li>
              <li><a href="/sim-ganh-dao" className="font-medium text-primary underline-offset-2 hover:underline">Sim gánh đảo</a></li>
              <li><a href="/sim-lap-kep" className="font-medium text-primary underline-offset-2 hover:underline">Sim lặp kép</a></li>
              <li><a href="/sim-de-nho" className="font-medium text-primary underline-offset-2 hover:underline">Sim dễ nhớ</a></li>
              <li><a href="/sim-taxi" className="font-medium text-primary underline-offset-2 hover:underline">Sim taxi</a></li>
              <li><a href="/sim-tien-len" className="font-medium text-primary underline-offset-2 hover:underline">Sim tiến lên</a></li>
              <li><a href="/mua-sim-tu-quy" className="font-medium text-primary underline-offset-2 hover:underline">Sim tứ quý</a></li>
              <li><a href="/sim-than-tai" className="font-medium text-primary underline-offset-2 hover:underline">Sim thần tài</a></li>
              <li><a href="/sim-dau-so" className="font-medium text-primary underline-offset-2 hover:underline">Sim theo đầu số</a></li>
            </ul>
          </section>
        </div>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumb([
              { name: "Trang chủ", path: "/" },
              { name: "Sim theo giá", path: "/sim-gia" },
            ]),
          ),
        }}
      />
    </>
  );
}
