import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Phone,
  MessageCircle,
  ShoppingCart,
  Star,
  CheckCircle,
  ChevronRight,
} from "lucide-react";
import type { NormalizedSIM } from "@/lib/simUtils";
import { formatPrice } from "@/lib/simUtils";
import { formatSimQuyAware } from "@/lib/simDisplay";
import {
  findSimByDigits,
  getIndexableSimDigits,
  isIndexableSim,
  getCategorySnapshot,
} from "@/lib/serverSimData";
import { BASE_URL, buildBreadcrumb } from "@/lib/seo";
import { describeSimTags, primaryTagMeta } from "./_lib/simMeta";
import TrustCommitments from "@/components/TrustCommitments";

// ISR: mỗi trang số làm tươi mỗi 5 phút. Số đã bán → lần regenerate kế tiếp
// `findSimByDigits` trả null → notFound(), trang chuyển 404. dynamicParams=true
// (mặc định) nên số ngoài tập prerender vẫn render on-demand cho khách bấm từ
// thẻ/Zalo — chỉ số "giá trị cao" mới được index (xem robots trong metadata).
export const revalidate = 300;
export const dynamicParams = true;

const CALL_NUMBER = "0933686666";
const CALL_DISPLAY = "0933.686.666";

type Props = { params: Promise<{ digits: string }> };

/** Prerender sẵn top số đẹp nhất; phần còn lại dựng on-demand qua ISR. */
export async function generateStaticParams(): Promise<{ digits: string }[]> {
  const digits = await getIndexableSimDigits(300);
  return digits.map((d) => ({ digits: d }));
}

const carrierLabel = (sim: NormalizedSIM): string =>
  sim.network && sim.network !== "Khác" ? sim.network : "";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { digits } = await params;
  const sim = await findSimByDigits(digits);
  if (!sim) {
    return {
      title: { absolute: "Không tìm thấy số | CHONSOMOBIFONE.COM" },
      robots: { index: false, follow: true },
    };
  }

  const formatted = formatSimQuyAware(sim.rawDigits);
  const carrier = carrierLabel(sim);
  const orderable = sim.price > 0;
  const priceLabel = formatPrice(sim.price);
  const primary = primaryTagMeta(sim);
  const canonical = `/sim/${sim.rawDigits}`;

  const title = orderable
    ? `Sim ${formatted} giá ${priceLabel}`
    : `Sim ${formatted}${carrier ? ` ${carrier}` : ""}`;

  const description =
    `Sim ${formatted}${carrier ? ` (${carrier})` : ""}` +
    `${primary ? ` — ${primary.label}` : ""}. ` +
    `${orderable ? `Giá niêm yết ${priceLabel}. ` : ""}` +
    `Sang tên chính chủ, giao 30 phút toàn quốc. Nhắn Zalo hoặc gọi ${CALL_DISPLAY} để chốt số.`;

  return {
    title: { absolute: `${title} | CHONSOMOBIFONE.COM` },
    description,
    alternates: { canonical },
    // Chỉ số giá trị cao mới cho index; số thường vẫn có trang nhưng noindex để
    // không phình chỉ mục. follow=true để crawler vẫn đi tiếp các link nội bộ.
    robots: { index: isIndexableSim(sim), follow: true },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${BASE_URL}${canonical}`,
      images: [{ url: `${BASE_URL}/share-banner.png?v=999`, width: 1200, height: 630 }],
    },
  };
}

export default async function SimDetailPage({ params }: Props) {
  const { digits } = await params;
  const sim = await findSimByDigits(digits);
  if (!sim) notFound();

  const formatted = formatSimQuyAware(sim.rawDigits);
  const carrier = carrierLabel(sim);
  const orderable = sim.price > 0;
  const priceLabel = formatPrice(sim.price);
  const tagMetas = describeSimTags(sim);
  const primary = primaryTagMeta(sim);
  const canonical = `/sim/${sim.rawDigits}`;

  // Số cùng nhóm: cùng dạng chính (thần tài, tứ quý…) hoặc cùng đầu số; loại
  // chính nó. Nối link nội bộ sang các trang /sim/* khác để crawler đi sâu.
  const relatedRaw = await getCategorySnapshot(
    primary ? { tags: [primary.label] } : { prefixes: [sim.prefix3] },
    12,
  );
  const related = relatedRaw.filter((s) => s.rawDigits !== sim.rawDigits).slice(0, 8);

  const zaloText = encodeURIComponent(
    `Xin chào, tôi muốn mua SIM ${formatted}${orderable ? ` giá ${priceLabel}` : ""}. Số còn không ạ?`,
  );
  const zaloHref = `https://zalo.me/${CALL_NUMBER}?text=${zaloText}`;

  // ── JSON-LD: Product (+ Offer nếu có giá) ──────────────────────────────────
  const productJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `SIM ${formatted}`,
    brand: { "@type": "Brand", name: "MobiFone" },
    category: primary?.label ?? "SIM số đẹp",
    description:
      `SIM số đẹp ${formatted}${carrier ? ` — ${carrier}` : ""}` +
      `${tagMetas.length ? ` (${tagMetas.map((t) => t.label).join(", ")})` : ""}.` +
      `${orderable ? ` Giá niêm yết ${priceLabel}.` : ""}`,
    url: `${BASE_URL}${canonical}`,
    ...(orderable
      ? {
          offers: {
            "@type": "Offer",
            priceCurrency: "VND",
            price: sim.price,
            availability: "https://schema.org/InStock",
            url: `${BASE_URL}${canonical}`,
          },
        }
      : {}),
  };

  const breadcrumbJsonLd = buildBreadcrumb([
    { name: "Trang chủ", path: "/" },
    ...(primary?.path ? [{ name: `Sim ${primary.label}`, path: primary.path }] : []),
    { name: `SIM ${formatted}`, path: canonical },
  ]);

  return (
    <>
      <main className="min-h-screen bg-background">
        {/* ── Hero: số + giá + CTA ─────────────────────────────────────────── */}
        <section className="relative bg-gradient-to-b from-primary via-primary-dark to-primary text-primary-foreground">
          <div className="container mx-auto px-4 py-8 md:py-10">
            {/* Breadcrumb hiển thị */}
            <nav aria-label="Breadcrumb" className="mb-5">
              <ol className="flex flex-wrap items-center gap-1 text-xs text-primary-foreground/70">
                <li>
                  <Link href="/" className="hover:text-gold">Trang chủ</Link>
                </li>
                {primary?.path && (
                  <>
                    <ChevronRight aria-hidden className="h-3 w-3" />
                    <li>
                      <Link href={primary.path} className="hover:text-gold">Sim {primary.label}</Link>
                    </li>
                  </>
                )}
                <ChevronRight aria-hidden className="h-3 w-3" />
                <li className="text-primary-foreground/90">SIM {formatted}</li>
              </ol>
            </nav>

            <div className="flex flex-wrap items-center gap-2">
              {carrier && (
                <span className="inline-flex items-center rounded bg-primary-foreground/15 px-2 py-0.5 text-xs font-semibold">
                  {carrier}
                </span>
              )}
              {sim.isVIP && (
                <span className="inline-flex items-center gap-1 rounded bg-gold/20 px-2 py-0.5 text-xs font-semibold text-gold">
                  <Star className="h-3 w-3" /> Số VIP
                </span>
              )}
              {tagMetas.map((t) => (
                <span
                  key={t.label}
                  className="inline-flex items-center rounded bg-primary-foreground/10 px-2 py-0.5 text-xs font-medium text-primary-foreground/90"
                >
                  {t.label}
                </span>
              ))}
            </div>

            <h1 className="mt-3 font-mono text-3xl font-extrabold tracking-wider text-gold sm:text-4xl md:text-5xl">
              {formatted}
            </h1>

            <div className="mt-2 text-sm text-primary-foreground/85">
              Giá bán:{" "}
              <span className="text-xl font-bold text-primary-foreground">{priceLabel}</span>
              {orderable ? " · nhận SIM kiểm tra rồi thanh toán" : " · liên hệ để nhận giá chính xác"}
            </div>

            {/* CTA: Zalo-first, kèm gọi + đặt mua */}
            <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap">
              <a
                href={zaloHref}
                target="_blank"
                rel="noopener noreferrer"
                data-sim-number={sim.rawDigits}
                aria-label={`Chat Zalo tư vấn SIM ${formatted}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-6 py-3 font-bold text-header-bg shadow-lg transition hover:-translate-y-0.5 hover:bg-gold-light"
              >
                <MessageCircle className="h-5 w-5" /> Nhắn Zalo giữ số này
              </a>
              <a
                href={`tel:${CALL_NUMBER}`}
                aria-label={`Gọi tư vấn hotline ${CALL_DISPLAY}`}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary-foreground/25 bg-primary-foreground/10 px-6 py-3 font-semibold text-primary-foreground transition hover:bg-primary-foreground/20"
              >
                <Phone className="h-5 w-5" /> Gọi {CALL_DISPLAY}
              </a>
              <Link
                href={`/mua-ngay/${encodeURIComponent(sim.id)}`}
                rel="nofollow"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary-foreground/25 bg-primary-foreground/5 px-6 py-3 font-semibold text-primary-foreground transition hover:bg-primary-foreground/15"
              >
                <ShoppingCart className="h-5 w-5" /> Đặt mua online
              </Link>
            </div>
            <p className="mt-2 text-xs text-primary-foreground/70">
              Gọi hay nhắn Zalo đều gặp đúng người bán số. Phản hồi trong ít phút.
            </p>
          </div>
        </section>

        <div className="container mx-auto space-y-10 px-4 py-8 md:space-y-12 md:py-10">
          {/* ── Ý nghĩa số ──────────────────────────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Ý nghĩa &amp; thông tin số {formatted}
            </h2>

            <div className="space-y-4 leading-relaxed text-muted-foreground">
              <p>
                {carrier ? (
                  <>
                    Số <strong className="text-foreground">{formatted}</strong> là SIM{" "}
                    <strong className="text-foreground">{carrier}</strong>
                  </>
                ) : (
                  <>
                    Số <strong className="text-foreground">{formatted}</strong>
                  </>
                )}
                {tagMetas.length > 0 ? (
                  <>
                    {" "}thuộc dòng{" "}
                    <strong className="text-foreground">
                      {tagMetas.map((t) => t.label).join(", ")}
                    </strong>
                    . Tổng các chữ số bằng {sim.sumDigits}.
                  </>
                ) : (
                  <> . Tổng các chữ số bằng {sim.sumDigits}.</>
                )}{" "}
                {orderable
                  ? `Giá niêm yết công khai ${priceLabel}, không phát sinh phí ẩn.`
                  : "Số này được báo giá trực tiếp — Quý khách nhắn Zalo hoặc gọi để nhận giá."}
              </p>

              {tagMetas.length > 0 && (
                <ul className="space-y-2">
                  {tagMetas.map((t) => (
                    <li key={t.label} className="flex items-start gap-2">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span>
                        <strong className="text-foreground">{t.label}:</strong> {t.blurb}
                        {t.path && (
                          <>
                            {" "}
                            <Link
                              href={t.path}
                              className="font-medium text-primary underline-offset-2 hover:underline"
                            >
                              Xem thêm sim {t.label.toLowerCase()}
                            </Link>
                          </>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* ── Cam kết ─────────────────────────────────────────────────────── */}
          <TrustCommitments />

          {/* ── Số cùng nhóm (link nội bộ sang /sim/*) ──────────────────────── */}
          {related.length > 0 && (
            <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
              <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
                <span className="h-8 w-1 rounded-full bg-primary" />
                Số cùng nhóm {primary ? primary.label : `đầu ${sim.prefix3}`}
              </h2>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-secondary/50">
                      <th scope="col" className="border-b border-border px-3 py-2.5 text-left font-semibold text-foreground">
                        Số SIM
                      </th>
                      <th scope="col" className="border-b border-border px-3 py-2.5 text-right font-semibold text-foreground">
                        Giá bán
                      </th>
                      <th scope="col" className="border-b border-border px-3 py-2.5 text-right">
                        <span className="sr-only">Xem</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {related.map((s, i) => (
                      <tr key={s.id} className={i % 2 === 1 ? "bg-secondary/20" : undefined}>
                        <td className="whitespace-nowrap border-b border-border/60 px-3 py-2.5 font-semibold tracking-wide text-foreground">
                          <Link
                            href={`/sim/${s.rawDigits}`}
                            className="underline-offset-2 hover:text-primary hover:underline"
                          >
                            {formatSimQuyAware(s.rawDigits)}
                          </Link>
                        </td>
                        <td className="whitespace-nowrap border-b border-border/60 px-3 py-2.5 text-right font-semibold text-primary">
                          {formatPrice(s.price)}
                        </td>
                        <td className="whitespace-nowrap border-b border-border/60 px-3 py-2.5 text-right">
                          <Link
                            href={`/sim/${s.rawDigits}`}
                            className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
                          >
                            Xem số
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {primary?.path && (
                <p className="mt-3 text-sm">
                  <Link href={primary.path} className="font-medium text-primary underline-offset-2 hover:underline">
                    Xem toàn bộ kho sim {primary.label.toLowerCase()} →
                  </Link>
                </p>
              )}
            </section>
          )}

          {/* ── Cross-links ─────────────────────────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-lg font-bold text-primary md:text-xl">
              <span className="h-7 w-1 rounded-full bg-primary" />
              Khám phá thêm
            </h2>
            <ul className="flex flex-wrap gap-3 text-sm">
              <li><Link href="/mua-sim-tu-quy" className="font-medium text-primary underline-offset-2 hover:underline">Sim tứ quý</Link></li>
              <li><Link href="/sim-than-tai" className="font-medium text-primary underline-offset-2 hover:underline">Sim thần tài</Link></li>
              <li><Link href="/sim-loc-phat" className="font-medium text-primary underline-offset-2 hover:underline">Sim lộc phát</Link></li>
              <li><Link href="/sim-nam-sinh" className="font-medium text-primary underline-offset-2 hover:underline">Sim năm sinh</Link></li>
              <li><Link href={`/sim-dau-so/${sim.prefix3}`} className="font-medium text-primary underline-offset-2 hover:underline">Sim đầu {sim.prefix3}</Link></li>
              <li><Link href="/mua-sim-gia-re" className="font-medium text-primary underline-offset-2 hover:underline">Sim giá rẻ</Link></li>
            </ul>
          </section>
        </div>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c") }}
      />
    </>
  );
}
