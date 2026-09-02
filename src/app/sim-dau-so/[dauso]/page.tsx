import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Phone, Star, Sparkles } from "lucide-react";
import CategorySimGrid from "@/components/CategorySimGrid";
import CategorySimPriceList from "@/components/CategorySimPriceList";
import TrustCommitments from "@/components/TrustCommitments";
import CustomerProof from "@/components/CustomerProof";
import LeadMagnetCta from "@/components/LeadMagnetCta";
import FaqAccordion from "@/components/FaqAccordion";
import { buildBreadcrumb } from "@/lib/seo";
import { getCategorySnapshot } from "@/lib/serverSimData";
import {
  DAU_SO_PREFIXES,
  LOAI,
  dauSoParent,
  isDauSoPrefix,
} from "@/lib/simTaxonomy";
import {
  getDauSoInventory,
  getInStockDauSo4Prefixes,
  getInStockDauSoCombos,
  getPrefixGate,
} from "../inventory";
import {
  buildDauSoDescription,
  buildDauSoTitle,
  groupThousands,
  moneyShort,
  networkAnswer,
  networkHeading,
  priceRangeText,
  variantIndex,
} from "../meta";

// ISR: prerender each đầu số page + revalidate every 300s (khớp /api/sims) so
// crawlers hit a cached page instead of forcing SSR (ƒ) on every request.
//
// dynamicParams = true: đầu số 4 chữ số CHƯA đạt ngưỡng tồn kho (0904 có 1 số,
// 0936 có 5…) không được prerender, nhưng vẫn render on-demand + `noindex,
// follow` thay vì 404 — link cũ/liên kết ngoài không vỡ. Đầu số 4 chữ số không
// còn số nào trong kho thì mới 404 (xem getPrefixGate).
export const revalidate = 300;
export const dynamicParams = true;

const ZALO_URL = "https://zalo.me/0933356666";
const BASE_URL = "https://www.chonsomobifone.com";

type Props = {
  params: Promise<{ dauso: string }>;
};

/**
 * Chỉ số biến thể câu chữ của trang này. Deterministic theo vị trí dải 3 số +
 * chữ số thứ 4 → 0901/0902/0903 nhận ba khuôn câu khác nhau, và SSR/ISR luôn
 * dựng ra cùng một chuỗi (không hydration mismatch).
 */
const variantFor = (dauso: string): number =>
  variantIndex(
    DAU_SO_PREFIXES.indexOf(dauso.slice(0, 3)),
    dauso.length === 4 ? Number(dauso[3]) : -1,
  );

// ── Mở bài luân phiên theo đầu số ────────────────────────────────────────────
// 34 trang đầu số dùng chung một khuôn. Để chữ không đọc như bản sao, mỗi trang
// nhận một cách mở bài khác nhau theo `variantFor`, và câu mở bài nhắc TỒN KHO
// THẬT của chính đầu số đó (con số này khác nhau ở mọi trang).
const INTRO_VARIANTS: ((d: string, fact: string) => string)[] = [
  (d, fact) =>
    `Chọn số theo đầu số là cách nhanh nhất để khoanh vùng cả kho. ${fact} Đủ tứ quý, tam hoa, thần tài, lộc phát, phong thủy và số thường — Quý khách chỉ cần chốt ngân sách rồi lọc dần.`,
  (d, fact) =>
    `Quý khách sẽ thấy ở đây toàn bộ số thuộc đầu ${d} đang có hàng, xếp cạnh nhau kèm giá. ${fact} MobiFone phủ sóng rộng khắp Việt Nam, nên số đầu ${d} dùng đâu cũng thuận.`,
  (d, fact) =>
    `Một đầu số quen tai giúp Quý khách đọc số cho đối tác nhẹ nhàng hơn. Đầu ${d} thuộc MobiFone. ${fact} Kho gồm tứ quý, tam hoa, thần tài, lộc phát, phong thủy và cả số thường.`,
  (d, fact) =>
    `Đầu ${d} là lựa chọn của nhiều khách hàng muốn giữ nhận diện MobiFone. ${fact} Từ số thường đến tứ quý, tam hoa, thần tài, lộc phát; mỗi số đều hiện giá để Quý khách tự đối chiếu.`,
];

const introFor = (dauso: string, fact: string): string =>
  INTRO_VARIANTS[variantFor(dauso)](dauso, fact);

export async function generateStaticParams() {
  // 8 đầu số 3 chữ số: LUÔN prerender (URL đang được index). Đầu số 4 chữ số:
  // chỉ những dải đạt ngưỡng tồn kho thật — dùng chung helper với sitemap.
  const four = await getInStockDauSo4Prefixes();
  return [...DAU_SO_PREFIXES, ...four].map((dauso) => ({ dauso }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { dauso } = await params;
  if (!isDauSoPrefix(dauso)) return {};

  const { stat, thin } = await getPrefixGate(dauso);
  const title = buildDauSoTitle(dauso);
  const description = buildDauSoDescription({
    prefix: dauso,
    count: stat.count,
    minPrice: stat.minPrice,
    maxPrice: stat.maxPrice,
    variant: variantFor(dauso),
  });
  const canonical = `${BASE_URL}/sim-dau-so/${dauso}`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    // Dưới ngưỡng tồn kho → noindex, follow: giữ link equity mà không đẩy trang
    // mỏng vào chỉ mục (cùng cách xử lý với /sim-nam-sinh/[year]).
    ...(thin ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: "website",
      title,
      description: `Kho sim đầu số ${dauso} MobiFone: tứ quý, tam hoa, thần tài, lộc phát, phong thủy. Giá công khai, chính chủ.`,
      url: canonical,
      images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
    },
  };
}

export default async function SimDauSoPage({ params }: Props) {
  const { dauso } = await params;
  if (!isDauSoPrefix(dauso)) notFound();

  const { stat, empty } = await getPrefixGate(dauso);
  // Đầu số 4 chữ số hết hàng hẳn: trang sẽ trắng (không bảng giá, lưới rỗng) →
  // 404 đúng hơn là để một trang trống trong index. 8 đầu số 3 chữ số và trường
  // hợp kho lỗi không bao giờ rơi vào đây (xem getPrefixGate).
  if (empty) notFound();

  const [snapshotSims, promotedFour, combos] = await Promise.all([
    getCategorySnapshot({ prefixes: [dauso] }, 8),
    getInStockDauSo4Prefixes(),
    getInStockDauSoCombos(),
  ]);

  const parent = dauSoParent(dauso);
  const inventory = await getDauSoInventory();
  // Trang 3 chữ số: liệt kê các dải 4 chữ số BÊN TRONG nó. Trang 4 chữ số: các
  // dải cùng họ. Cả hai chỉ lấy trong tập đã đạt ngưỡng — không bao giờ trỏ link
  // vào trang đang bị noindex.
  const relatedFour = promotedFour.filter(
    (p) => p !== dauso && p.startsWith(parent ?? dauso),
  );
  const comboLinks = combos.filter((c) => c.dauso === dauso);

  const inventoryFact =
    stat.count > 0
      ? `Kho đang có ${groupThousands(stat.count)} số đầu ${dauso}, giá ${priceRangeText(stat.minPrice, stat.maxPrice)}.`
      : `Kho đầu ${dauso} đang được cập nhật thêm số mới.`;
  const priceFrom = stat.minPrice > 0 ? moneyShort(stat.minPrice, "up") : null;

  const faqItems = [
    {
      // Cụm "0909 là mạng gì" có lượng tìm thật mà trang danh mục của đối thủ
      // không trả lời. Đặt đầu FAQ + phát vào FAQPage schema.
      q: networkHeading(dauso),
      a: networkAnswer(dauso),
    },
    {
      q: `Sim đầu số ${dauso} giá bao nhiêu?`,
      a:
        stat.count > 0
          ? `Kho đầu số ${dauso} hiện có ${groupThousands(stat.count)} số, giá ${priceRangeText(stat.minPrice, stat.maxPrice)} tùy độ đẹp của dãy số (tứ quý, tam hoa, thần tài, lộc phát, phong thủy). Từng số đều hiện giá ngay trong kho, không phát sinh phí ẩn.`
          : `Sim đầu số ${dauso} MobiFone trải từ vài trăm nghìn đến hàng chục triệu đồng, tùy độ đẹp của dãy số. Từng số đều hiện giá ngay trong kho, không phát sinh phí ẩn.`,
    },
    {
      q: `Mua sim đầu số ${dauso} có sang tên chính chủ được không?`,
      a: `Được. Toàn bộ sim đầu số ${dauso} tại CHONSOMOBIFONE.COM đều hỗ trợ sang tên chính chủ. Quý khách nhận SIM, kiểm tra kỹ rồi mới trả tiền; chúng tôi hỗ trợ đăng ký qua cửa hàng MobiFone hoặc ứng dụng My Mobifone.`,
    },
    {
      q: `Giao sim đầu số ${dauso} mất bao lâu?`,
      a: "30 phút giao toàn quốc. Quý khách thanh toán COD khi nhận hàng, hoặc chuyển khoản trước.",
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
              Sim {dauso} Mobifone — <span className="text-gold">kho số đẹp giá tốt</span>
            </h1>
            <p className="mx-auto mb-5 max-w-xl text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              {inventoryFact} Quý khách nhận SIM, kiểm tra rồi mới thanh toán.
            </p>
            <div className="mx-auto flex max-w-md flex-col justify-center gap-2.5 sm:flex-row">
              <a
                href="#kho-sim"
                className="flex items-center justify-center gap-2 rounded-lg bg-gold px-7 py-2.5 font-bold text-header-bg shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-xl"
              >
                <Star className="h-4 w-4" /> Xem kho sim {dauso}
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
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Sim đầu số {dauso} Mobifone có gì đặc biệt?
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              {introFor(dauso, inventoryFact)}
            </p>
          </section>

          {/* "0909 là mạng gì" — câu hỏi khách gõ trước cả khi hỏi giá. */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              {networkHeading(dauso)}
            </h2>
            <p className="leading-relaxed text-muted-foreground">{networkAnswer(dauso)}</p>
            <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
              <li>
                <strong className="font-semibold text-foreground">Nhà mạng:</strong> MobiFone
                {parent ? ` (dải ${parent})` : ""}
              </li>
              {stat.count > 0 ? (
                <li>
                  <strong className="font-semibold text-foreground">Số đang bán:</strong>{" "}
                  {groupThousands(stat.count)} số
                  {priceFrom ? `, giá từ ${priceFrom}` : ""}
                </li>
              ) : null}
              <li>
                <strong className="font-semibold text-foreground">Thủ tục:</strong> sang tên chính
                chủ, nhận SIM kiểm tra rồi mới trả tiền
              </li>
            </ul>
          </section>

          {/* Bảng giá thật + ItemList/Product/Offer trong HTML thô */}
          <CategorySimPriceList
            title={`Giá sim đầu số ${dauso} đang bán`}
            sims={snapshotSims}
            pageUrl={`${BASE_URL}/sim-dau-so/${dauso}`}
            note={`Bảng lấy 8 số đầu ${dauso} có giá thấp nhất trong kho tại thời điểm cập nhật.`}
          />

          <CategorySimGrid
            title={`Kho Sim ${dauso} Cập Nhật`}
            searchPlaceholder={`Nhập số cần tìm trong kho ${dauso}...`}
            emptyText={`Kho hiện chưa có số đầu ${dauso} khớp yêu cầu. Quý khách thử từ khóa khác, hoặc liên hệ 0938.868.868 để được tư vấn.`}
            matchPrefixes={[dauso]}
          />

          <TrustCommitments />
          <CustomerProof />
          <LeadMagnetCta />

          {/* FAQ */}
          <FaqAccordion items={faqItems} />

          {/* Cross-links to other prefixes + categories */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Xem thêm trong kho
            </h2>

            {comboLinks.length > 0 ? (
              <>
                <h3 className="mb-2 text-lg font-bold text-foreground">
                  Lọc theo đuôi trong kho {dauso}
                </h3>
                <ul className="mb-6 flex flex-wrap gap-3 text-sm">
                  {comboLinks.map(({ loai }) => (
                    <li key={loai}>
                      <a
                        href={`/sim-dau-so/${dauso}/${loai}`}
                        className="font-medium text-primary underline-offset-2 hover:underline"
                      >
                        Sim {LOAI[loai].label} {dauso}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {relatedFour.length > 0 ? (
              <>
                <h3 className="mb-2 text-lg font-bold text-foreground">
                  {parent
                    ? `Đầu số 4 số khác trong dải ${parent}`
                    : `Đầu số 4 số thuộc dải ${dauso}`}
                </h3>
                <ul className="mb-6 flex flex-wrap gap-3 text-sm">
                  {relatedFour.map((p) => {
                    const n = inventory.prefixes.get(p)?.count ?? 0;
                    return (
                      <li key={p}>
                        <a
                          href={`/sim-dau-so/${p}`}
                          className="font-medium text-primary underline-offset-2 hover:underline"
                        >
                          Sim {p}
                          {n > 0 ? (
                            <span className="font-normal text-muted-foreground">
                              {" "}
                              ({groupThousands(n)} số)
                            </span>
                          ) : null}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : null}

            {parent ? (
              <p className="mb-6 text-sm text-muted-foreground">
                Muốn xem rộng hơn cả dải:{" "}
                <a
                  href={`/sim-dau-so/${parent}`}
                  className="font-medium text-primary underline-offset-2 hover:underline"
                >
                  toàn bộ sim đầu số {parent}
                </a>
                .
              </p>
            ) : null}

            <h3 className="mb-2 text-lg font-bold text-foreground">Các đầu số Mobifone khác</h3>
            <ul className="flex flex-wrap gap-3 text-sm">
              {DAU_SO_PREFIXES.map((p) => (
                <li key={p}>
                  <a
                    href={`/sim-dau-so/${p}`}
                    className={`font-medium underline-offset-2 hover:underline ${
                      p === dauso ? "text-muted-foreground" : "text-primary"
                    }`}
                  >
                    Sim {p}
                  </a>
                </li>
              ))}
            </ul>
            <h3 className="mb-2 mt-6 text-lg font-bold text-foreground">Dòng sim nổi bật</h3>
            <ul className="flex flex-wrap gap-3 text-sm">
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
              { name: "Sim theo đầu số", path: "/sim-dau-so" },
              // Đầu số 4 chữ số có thêm một bậc: 0909 nằm dưới 090.
              ...(parent ? [{ name: `Sim ${parent}`, path: `/sim-dau-so/${parent}` }] : []),
              { name: `Sim ${dauso}`, path: `/sim-dau-so/${dauso}` },
            ]),
          ),
        }}
      />
    </>
  );
}
