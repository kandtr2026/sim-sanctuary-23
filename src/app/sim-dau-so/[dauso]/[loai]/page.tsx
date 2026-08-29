import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Phone, Star, Sparkles } from "lucide-react";
import CategorySimGrid from "@/components/CategorySimGrid";
import CategorySimPriceList from "@/components/CategorySimPriceList";
import TrustCommitments from "@/components/TrustCommitments";
import LeadMagnetCta from "@/components/LeadMagnetCta";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buildBreadcrumb } from "@/lib/seo";
import { getCategorySnapshot } from "@/lib/serverSimData";
import {
  DAU_SO_PREFIXES,
  LOAI,
  LOAI_KEYS,
  LOAI_KEYS_LEGACY,
  dauSoParent,
  isDauSoPrefix,
  isLoaiKey,
} from "@/lib/simTaxonomy";
import { getComboGate, getInStockDauSoCombos } from "../../inventory";
import {
  buildComboDescription,
  buildComboTitle,
  groupThousands,
  networkAnswer,
  priceRangeText,
  variantIndex,
} from "../../meta";

// ISR: prerender each combo page + revalidate every 300s (khớp /api/sims) so
// crawlers hit a cached page instead of forcing SSR (ƒ) on every request.
//
// dynamicParams = true: combo dưới ngưỡng tồn kho không prerender nhưng vẫn
// render on-demand + `noindex, follow`; combo 0 số thì 404 (xem getComboGate).
export const revalidate = 300;
export const dynamicParams = true;

const ZALO_URL = "https://zalo.me/0933356666";
const BASE_URL = "https://www.chonsomobifone.com";

type Props = {
  params: Promise<{ dauso: string; loai: string }>;
};

/** Deterministic như trang đầu số, cộng thêm vị trí loại đuôi. */
const variantFor = (dauso: string, loai: keyof typeof LOAI): number =>
  variantIndex(
    DAU_SO_PREFIXES.indexOf(dauso.slice(0, 3)),
    dauso.length === 4 ? Number(dauso[3]) : -1,
    LOAI_KEYS.indexOf(loai),
  );

// ── Mở bài luân phiên cho các trang combo ────────────────────────────────────
// Mọi trang combo dùng chung một khuôn, nên mỗi trang nhận một cách mở bài khác
// nhau theo `variantFor` (deterministic, không random → không hydration
// mismatch) và nhắc TỒN KHO THẬT của chính combo đó. Ý nghĩa đuôi
// (LOAI[loai].y) giữ nguyên.
const INTRO_VARIANTS: ((dauso: string, label: string, y: string, fact: string) => string)[] = [
  (d, label, y, fact) =>
    `Quý khách cần một số vừa đúng đầu ${d}, vừa đúng đuôi ${label}? Kho dưới đây đã lọc sẵn: ${y}. ${fact} Sang tên chính chủ, giao tận nơi nội thành HCM.`,
  (d, label, y, fact) =>
    `Toàn bộ số đầu ${d} có đuôi ${label} đang có hàng được xếp cạnh nhau kèm giá, để Quý khách so trong một lần: ${y}. ${fact}`,
  (d, label, y, fact) =>
    `Hai tiêu chí gộp một chỗ: đầu ${d} quen tay và đuôi ${label} — ${y}. ${fact} Mỗi số đều hiện giá công khai, sang tên chính chủ.`,
  (d, label, y, fact) =>
    `Đội ngũ tư vấn đã tách riêng nhóm số đầu ${d} đuôi ${label} để Quý khách khỏi lọc thủ công: ${y}. ${fact} Giao tận nơi nội thành HCM.`,
];

const introFor = (dauso: string, loai: keyof typeof LOAI, fact: string): string =>
  INTRO_VARIANTS[variantFor(dauso, loai)](dauso, LOAI[loai].label, LOAI[loai].y, fact);

export async function generateStaticParams() {
  // 24 URL cũ (8 đầu số 3 chữ số × 3 loại đuôi đầu) LUÔN prerender: chúng đang
  // được index, không được rơi xuống render on-demand. Ngoài ra chỉ prerender
  // combo đạt ngưỡng tồn kho — dùng chung helper với sitemap.
  const legacy = DAU_SO_PREFIXES.flatMap((dauso) =>
    LOAI_KEYS_LEGACY.map((loai) => ({ dauso, loai: loai as string })),
  );
  const inStock = (await getInStockDauSoCombos()).map(({ dauso, loai }) => ({
    dauso,
    loai: loai as string,
  }));

  const seen = new Set<string>();
  return [...legacy, ...inStock].filter(({ dauso, loai }) => {
    const key = `${dauso}/${loai}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { dauso, loai } = await params;
  if (!isDauSoPrefix(dauso) || !isLoaiKey(loai)) return {};

  const label = LOAI[loai].label;
  const { stat, thin } = await getComboGate(dauso, loai);
  const title = buildComboTitle(dauso, label);
  const description = buildComboDescription({
    prefix: dauso,
    loaiLabel: label,
    count: stat.count,
    minPrice: stat.minPrice,
    maxPrice: stat.maxPrice,
    variant: variantFor(dauso, loai),
  });
  const canonical = `${BASE_URL}/sim-dau-so/${dauso}/${loai}`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    // Combo mỏng (vd 079/ong-dia 16 số) → noindex, follow. Trước đây route này
    // không có ngưỡng nào nên 6 trang mỏng đã vào chỉ mục.
    ...(thin ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: "website",
      title,
      description: `Kho sim ${label} đầu số ${dauso} MobiFone, đuôi ${LOAI[loai].suffixes.slice(0, 2).join(" và ")}. Giá công khai, sang tên chính chủ.`,
      url: canonical,
      images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
    },
  };
}

export default async function SimDauSoLoaiPage({ params }: Props) {
  const { dauso, loai } = await params;
  if (!isDauSoPrefix(dauso) || !isLoaiKey(loai)) notFound();

  const loaiInfo = LOAI[loai];
  const label = loaiInfo.label;

  const { stat, empty } = await getComboGate(dauso, loai);
  // Combo mới mà kho không còn số nào (vd 079 × tứ quý) → 404 thay vì một trang
  // trắng. 24 URL cũ và trường hợp kho lỗi không rơi vào đây.
  if (empty) notFound();

  const [snapshotSims, combos] = await Promise.all([
    getCategorySnapshot({ prefixes: [dauso], suffixes: [...loaiInfo.suffixes] }, 8),
    getInStockDauSoCombos(),
  ]);

  const parent = dauSoParent(dauso);
  const inventoryFact =
    stat.count > 0
      ? `Kho đang có ${groupThousands(stat.count)} số ${label} đầu ${dauso}, giá ${priceRangeText(stat.minPrice, stat.maxPrice)}.`
      : `Kho ${label} đầu ${dauso} đang được cập nhật thêm số mới.`;

  const faqItems = [
    {
      q: `Sim ${label} đầu số ${dauso} giá bao nhiêu?`,
      a:
        stat.count > 0
          ? `Kho hiện có ${groupThousands(stat.count)} số ${label} đầu ${dauso}, giá ${priceRangeText(stat.minPrice, stat.maxPrice)} tùy độ đẹp của dãy số phía trước đuôi. Từng số đều hiện giá ngay trong kho để Quý khách so trước, không phát sinh phí ẩn.`
          : `Sim ${label} đầu số ${dauso} MobiFone trải từ vài trăm nghìn đến hàng chục triệu đồng, tùy độ đẹp của dãy số phía trước đuôi. Từng số đều hiện giá ngay trong kho để Quý khách so trước, không phát sinh phí ẩn.`,
    },
    {
      q: `Mua sim ${label} đầu số ${dauso} có sang tên chính chủ được không?`,
      a: `Được. Toàn bộ sim ${label} đầu số ${dauso} tại CHONSOMOBIFONE.COM đều hỗ trợ sang tên chính chủ. Quý khách nhận SIM, kiểm tra kỹ rồi mới trả tiền; chúng tôi hỗ trợ đăng ký qua cửa hàng MobiFone hoặc ứng dụng My Mobifone.`,
    },
    {
      q: `Giao sim ${label} đầu số ${dauso} mất bao lâu?`,
      a: "Nội thành TP.HCM: 30 phút – 2 giờ làm việc. Các tỉnh thành khác: 1–3 ngày làm việc qua chuyển phát nhanh. Quý khách thanh toán COD khi nhận hàng, hoặc chuyển khoản trước.",
    },
    {
      // Khách hỏi mạng trước cả khi hỏi giá; trang combo cũng nên trả lời được.
      q: `${dauso} là mạng gì?`,
      a: networkAnswer(dauso),
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

  const otherLoai = combos
    .filter((c) => c.dauso === dauso && c.loai !== loai)
    .map((c) => c.loai);
  // Chỉ trỏ sang combo CÙNG loại ở đầu số khác khi combo đó đạt ngưỡng — không
  // bao giờ liên kết vào một trang đang bị noindex.
  const otherPrefixes = combos
    .filter((c) => c.loai === loai && c.dauso !== dauso)
    .map((c) => c.dauso)
    .slice(0, 6);

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
              Sim {label} đầu số {dauso} Mobifone —{" "}
              <span className="text-gold">giá tốt, chính chủ</span>
            </h1>
            <p className="mx-auto mb-5 max-w-xl text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              {introFor(dauso, loai, inventoryFact)}
            </p>
            <div className="mx-auto flex max-w-md flex-col justify-center gap-2.5 sm:flex-row">
              <a
                href="#kho-sim"
                className="flex items-center justify-center gap-2 rounded-lg bg-gold px-7 py-2.5 font-bold text-header-bg shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-xl"
              >
                <Star className="h-4 w-4" /> Xem kho sim {label} {dauso}
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
          {/* Bảng giá thật + ItemList/Product/Offer trong HTML thô */}
          <CategorySimPriceList
            title={`Giá sim ${label} đầu số ${dauso} đang bán`}
            sims={snapshotSims}
            pageUrl={`${BASE_URL}/sim-dau-so/${dauso}/${loai}`}
            note={`Bảng lấy 8 số ${label} đầu ${dauso} có giá thấp nhất trong kho tại thời điểm cập nhật.`}
          />

          <CategorySimGrid
            title={`Kho Sim ${label} Đầu Số ${dauso} Cập Nhật`}
            searchPlaceholder={`Nhập số, hoặc ${loaiInfo.searchHint} để tìm theo đuôi...`}
            emptyText={`Kho hiện chưa có số ${label} đầu ${dauso} khớp yêu cầu. Quý khách thử đuôi khác, hoặc liên hệ 0938.868.868 để được tư vấn.`}
            matchPrefixes={[dauso]}
            matchSuffixes={[...loaiInfo.suffixes]}
          />

          <TrustCommitments />
          <LeadMagnetCta />

          {/* FAQ */}
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

          {/* Cross-links */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Xem thêm
            </h2>
            <h3 className="mb-2 text-lg font-bold text-foreground">Sim {label} các đầu số khác</h3>
            {otherPrefixes.length > 0 ? (
              <ul className="flex flex-wrap gap-3 text-sm">
                {otherPrefixes.map((p) => (
                  <li key={p}>
                    <a href={`/sim-dau-so/${p}/${loai}`} className="font-medium text-primary underline-offset-2 hover:underline">
                      Sim {label} {p}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                Hiện chỉ đầu {dauso} còn nhiều số {label} trong kho. Quý khách xem{" "}
                <a href="/sim-dau-so" className="font-medium text-primary underline-offset-2 hover:underline">
                  toàn bộ đầu số MobiFone
                </a>{" "}
                để chọn hướng khác.
              </p>
            )}
            <h3 className="mb-2 mt-6 text-lg font-bold text-foreground">Loại sim khác đầu số {dauso}</h3>
            <ul className="flex flex-wrap gap-3 text-sm">
              {otherLoai.map((k) => (
                <li key={k}>
                  <a href={`/sim-dau-so/${dauso}/${k}`} className="font-medium text-primary underline-offset-2 hover:underline">
                    Sim {LOAI[k].label} {dauso}
                  </a>
                </li>
              ))}
              <li>
                <a href={`/sim-dau-so/${dauso}`} className="font-medium text-primary underline-offset-2 hover:underline">
                  Sim đầu số {dauso}
                </a>
              </li>
              {parent ? (
                <li>
                  <a href={`/sim-dau-so/${parent}`} className="font-medium text-primary underline-offset-2 hover:underline">
                    Sim đầu số {parent}
                  </a>
                </li>
              ) : null}
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
                <a href="/sim-ong-dia" className="font-medium text-primary underline-offset-2 hover:underline">
                  Sim ông địa
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
              // Combo của đầu số 4 chữ số có thêm bậc dải 3 số (0909 → dưới 090).
              ...(parent ? [{ name: `Sim ${parent}`, path: `/sim-dau-so/${parent}` }] : []),
              { name: `Sim ${dauso}`, path: `/sim-dau-so/${dauso}` },
              { name: `Sim ${label} ${dauso}`, path: `/sim-dau-so/${dauso}/${loai}` },
            ]),
          ),
        }}
      />
    </>
  );
}
