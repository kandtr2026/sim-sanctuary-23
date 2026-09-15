import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Phone,
  MessageCircle,
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
  getServerSims,
} from "@/lib/serverSimData";
import { BASE_URL, buildBreadcrumb } from "@/lib/seo";
import { describeSimTags, primaryTagMeta } from "@/lib/simMeta";
import TrustCommitments from "@/components/TrustCommitments";
import SIMCardNew from "@/components/SIMCardNew";
import PhongThuyStory from "./PhongThuyStory";
import GoiYSimTot from "./GoiYSimTot";
import SoVuaXem from "@/components/SoVuaXem";
import { diemTongHop } from "@/lib/phongThuy";

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

  // A Khoa 14/09: gợi ý số hợp phong thủy HƠN nhưng CÙNG TẦM GIÁ (bằng giá hoặc
  // nhỉnh ≤50%, KHÔNG đẩy số đắt hẳn). Chấm bằng chính engine đang tư vấn
  // (chamBatCuc), giữ số điểm cao hơn số đang xem, ưu tiên điểm cao + giá gần nhất.
  // Cắt 400 số gần giá nhất trước khi chấm cho nhẹ build/ISR.
  const curScore = diemTongHop(sim.rawDigits).diem;
  const goiY: NormalizedSIM[] =
    sim.price > 0
      ? (await getServerSims())
          .filter(
            (s) => s.rawDigits !== sim.rawDigits && s.price >= sim.price && s.price <= sim.price * 1.5,
          )
          .sort((a, b) => a.price - b.price)
          .slice(0, 400)
          .map((s) => ({ s, sc: diemTongHop(s.rawDigits).diem }))
          .filter((x) => x.sc > curScore + 0.05)
          .sort((a, b) => b.sc - a.sc || a.s.price - b.s.price)
          .slice(0, 8)
          .map((x) => x.s)
      : [];

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

            {/* CTA: Zalo-first + gọi */}
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
            </div>
            <p className="mt-2 text-xs text-primary-foreground/70">
              Gọi hay nhắn Zalo đều gặp đúng người bán số. Phản hồi trong ít phút.
            </p>
          </div>
        </section>

        <div className="container mx-auto space-y-10 px-4 py-8 md:space-y-12 md:py-10">
          {/* ── Số vừa xem (giúp khách nhảy lại số đã xem, khỏi lạc) ─────────── */}
          <SoVuaXem current={{ d: sim.rawDigits, label: formatted, p: sim.price }} />

          {/* ── Chấm điểm phong thủy — câu chuyện của con số ─────────────────── */}
          <PhongThuyStory digits={sim.rawDigits} formatted={formatted} zaloHref={zaloHref} />

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
                  ? `Giá niêm yết công khai ${priceLabel}, không phát sinh chi phí khác.`
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

          {/* ── Gợi ý số hợp phong thủy hơn, cùng tầm giá ───────────────────── */}
          <GoiYSimTot sims={goiY} curScore={curScore} />

          {/* ── Số cùng nhóm (link nội bộ sang /sim/*) ──────────────────────── */}
          {related.length > 0 && (
            <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
              <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
                <span className="h-8 w-1 rounded-full bg-primary" />
                Số cùng nhóm {primary ? primary.label : `đầu ${sim.prefix3}`}
              </h2>
              <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-3 lg:grid-cols-4">
                {related.map((s) => (
                  <SIMCardNew key={s.id} sim={s} />
                ))}
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
              <li><Link href="/tra-cuu-sim" className="font-medium text-primary underline-offset-2 hover:underline">Tra cứu sim</Link></li>
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
