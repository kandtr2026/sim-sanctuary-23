import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Phone, Star, Sparkles } from "lucide-react";
import CategorySimPriceList from "@/components/CategorySimPriceList";
import TrustCommitments from "@/components/TrustCommitments";
import LeadMagnetCta from "@/components/LeadMagnetCta";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buildBreadcrumb, BASE_URL } from "@/lib/seo";
import {
  formatTrieu,
  getBandInventory,
  resolvePriceBand,
  PRICE_BAND_SLUGS,
  MIN_INDEXABLE_INVENTORY,
} from "@/lib/simDangSo";
import { BAND_COPY, TAG_HREF } from "./copy";

// ISR như các trang danh mục khác. `dynamicParams = false`: chỉ bốn slug trong
// PRICE_BAND_SLUGS được phục vụ, slug lạ → 404 ngay ở tầng router thay vì render
// một trang rỗng rồi mới notFound().
export const revalidate = 300;
export const dynamicParams = false;

const ZALO_URL = "https://zalo.me/0933356666";

type Props = { params: Promise<{ dai: string }> };

export function generateStaticParams() {
  return PRICE_BAND_SLUGS.map((dai) => ({ dai }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { dai } = await params;
  const band = resolvePriceBand(dai);
  const copy = BAND_COPY[dai];
  if (!band || !copy) return {};

  const canonical = `${BASE_URL}/sim-gia/${dai}`;
  const { count } = await getBandInventory(band, 1);
  const thin = count < MIN_INDEXABLE_INVENTORY;

  return {
    title: { absolute: copy.title },
    description: copy.description,
    alternates: { canonical },
    ...(thin ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: "website",
      title: copy.title,
      description: copy.ogDescription,
      url: canonical,
      images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
    },
  };
}

export default async function SimGiaDaiPage({ params }: Props) {
  const { dai } = await params;
  const band = resolvePriceBand(dai);
  const copy = BAND_COPY[dai];
  if (!band || !copy) notFound();

  const inv = await getBandInventory(band, 8);
  const canonical = `${BASE_URL}/sim-gia/${dai}`;
  const bandLabel = band.label.replace(/ - /g, "–");

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: copy.faq.map((item) => ({
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
              Sim Mobifone giá <span className="text-gold">{bandLabel}</span>
            </h1>
            <p className="mx-auto mb-5 max-w-xl text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              {inv.count > 0
                ? `${copy.heroLead} Kho đang còn ${inv.count.toLocaleString("vi-VN")} số trong dải này, mức giữa ${formatTrieu(inv.median)}.`
                : `${copy.heroLead} Dải này tạm hết hàng — Quý khách nhắn Zalo để nhận danh sách số mới về.`}
            </p>
            <div className="mx-auto flex max-w-md flex-col justify-center gap-2.5 sm:flex-row">
              <a
                href="/sim-gia"
                className="flex items-center justify-center gap-2 rounded-lg border border-primary-foreground/25 bg-primary-foreground/10 px-7 py-2.5 font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-foreground/20"
              >
                ← Đổi dải giá
              </a>
              <a
                href="#bang-gia"
                className="flex items-center justify-center gap-2 rounded-lg bg-gold px-7 py-2.5 font-bold text-header-bg shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-xl"
              >
                <Star className="h-4 w-4" /> Xem số đang bán
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
          {/* ── 1. Mở bài riêng của từng dải ───────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              {copy.intro.heading}
            </h2>
            <div className="space-y-4 leading-relaxed text-muted-foreground">
              {copy.intro.paragraphs.map((text, i) => (
                <p key={i}>{text}</p>
              ))}
            </div>
          </section>

          {/* ── 2. Dạng số đang có nhiều nhất trong dải (dữ liệu thật) ─────── */}
          {inv.topTags.length > 0 && (
            <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
              <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
                <span className="h-8 w-1 rounded-full bg-primary" />
                Dạng số đang có nhiều nhất trong dải {bandLabel}
              </h2>
              <p className="mb-4 leading-relaxed text-muted-foreground">
                Bảng đếm trực tiếp trên kho lúc trang cập nhật, nên Quý khách thấy đúng thứ đang còn hàng thay vì một
                danh sách chung.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <caption className="sr-only">Dạng số và số lượng đang có trong dải {bandLabel}</caption>
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th scope="col" className="py-2 pr-4 font-semibold text-foreground">Dạng số</th>
                      <th scope="col" className="py-2 font-semibold text-foreground">Đang có trong dải</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    {inv.topTags.map((t) => (
                      <tr key={t.tag} className="border-b border-border last:border-0">
                        <td className="py-2 pr-4 font-medium text-foreground">
                          {TAG_HREF[t.tag] ? (
                            <a
                              href={TAG_HREF[t.tag]}
                              className="text-primary underline-offset-2 hover:underline"
                            >
                              Sim {t.tag.toLowerCase()}
                            </a>
                          ) : (
                            `Sim ${t.tag.toLowerCase()}`
                          )}
                        </td>
                        <td className="py-2">{t.count.toLocaleString("vi-VN")} số</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {inv.topPrefixes.length > 0 && (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  Đầu số dày hàng nhất trong dải:{" "}
                  {inv.topPrefixes
                    .slice(0, 4)
                    .map((p) => `${p.prefix} (${p.count.toLocaleString("vi-VN")} số)`)
                    .join(", ")}
                  .
                </p>
              )}
            </section>
          )}
          {/* ── 3. Bảng giá số rẻ nhất trong dải + Product/Offer ───────────── */}
          <div id="bang-gia" className="scroll-mt-[var(--nav-height)]">
            <CategorySimPriceList
              title={`Số đang bán trong tầm ${bandLabel}`}
              sims={inv.cheapest}
              pageUrl={canonical}
              intro={`Số thật còn trong kho ở dải ${bandLabel}, giá đã niêm yết — Quý khách xem rồi lọc tiếp bên dưới.`}
              note={`Bảng lấy 8 số có giá thấp nhất trong dải ${bandLabel} tại thời điểm cập nhật.`}
            />
          </div>

          {/* ── 4. Bảng số đẹp nhất trong dải (không trùng bảng trên) ──────── */}
          <CategorySimPriceList
            title={`Dãy đẹp nhất trong tầm ${bandLabel}`}
            sims={inv.finest}
            pageUrl={canonical}
            intro="Cùng dải giá nhưng xếp theo cấu trúc dãy số — tứ quý, tam hoa, đuôi tài lộc lên trước."
            note={copy.finestNote}
          />

          {/* ── 5. Hướng dẫn riêng của dải ─────────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              {copy.guide.heading}
            </h2>
            {copy.guide.lead ? (
              <p className="mb-4 leading-relaxed text-muted-foreground">{copy.guide.lead}</p>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              {copy.guide.items.map((item) => (
                <div key={item.title} className="rounded-xl border border-border bg-secondary/30 p-4">
                  <h3 className="mb-1.5 font-semibold text-foreground">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── 6. Xem thêm kho đầy đủ ─────────────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 text-center shadow-card md:p-8">
            <p className="mb-4 leading-relaxed text-muted-foreground">
              Cần xem toàn bộ số trong tầm {bandLabel} kèm bộ lọc theo đuôi, đầu số và dạng số? Kho chính có sẵn chip
              &ldquo;{band.label}&rdquo; ở thanh lọc bên trái. Hoặc nhắn Zalo kèm ngân sách, đội ngũ tư vấn khoanh vùng
              giúp trong vài phút.
            </p>
            <div className="flex flex-col justify-center gap-2.5 sm:flex-row">
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                <Star className="h-4 w-4" /> Mở kho sim đầy đủ
              </a>
              <a
                href={ZALO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-2.5 font-semibold text-primary transition hover:bg-secondary/40"
              >
                <Phone className="h-4 w-4" /> Nhắn Zalo tư vấn
              </a>
            </div>
          </section>

          <LeadMagnetCta />
          <TrustCommitments />
          {/* ── 7. FAQ riêng của dải ───────────────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Câu hỏi thường gặp về sim giá {bandLabel}
            </h2>
            <Accordion type="single" collapsible className="space-y-2">
              {copy.faq.map((faq, index) => (
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

          {/* ── 8. Dải giá khác + kho đồng giá ─────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Xem dải giá khác
            </h2>
            <ul className="flex flex-wrap gap-3 text-sm">
              {PRICE_BAND_SLUGS.filter((slug) => slug !== dai).map((slug) => {
                const other = resolvePriceBand(slug);
                if (!other) return null;
                return (
                  <li key={slug}>
                    <a
                      href={`/sim-gia/${slug}`}
                      className="font-medium text-primary underline-offset-2 hover:underline"
                    >
                      Sim giá {other.label.replace(/ - /g, "–")}
                    </a>
                  </li>
                );
              })}
              <li>
                <a href="/mua-sim-gia-re" className="font-medium text-primary underline-offset-2 hover:underline">
                  Kho SIM khuyến mãi đồng giá (dải rẻ nhất)
                </a>
              </li>
              <li>
                <a href="/sim-tra-gop" className="font-medium text-primary underline-offset-2 hover:underline">
                  Mua sim trả góp
                </a>
              </li>
              <li>
                <a href="/sim-gia" className="font-medium text-primary underline-offset-2 hover:underline">
                  Tất cả dải giá
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
              { name: "Sim theo giá", path: "/sim-gia" },
              { name: `Sim giá ${bandLabel}`, path: `/sim-gia/${dai}` },
            ]),
          ),
        }}
      />
    </>
  );
}
