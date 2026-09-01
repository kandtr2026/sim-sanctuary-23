import Link from "next/link";
import { Phone, MessageCircle } from "lucide-react";
import type { NormalizedSIM } from "@/lib/simUtils";
import { formatPrice } from "@/lib/simUtils";
import { formatSimQuyAware } from "@/lib/simDisplay";
import { buildSimItemListJsonLd } from "@/components/SimSnapshot";

const ZALO_BASE = "https://zalo.me/0933356666";

/**
 * Server-rendered dải "Nổi bật" — SỐ + GIÁ + 2 nút hành động (Đặt mua + Chat Zalo)
 * kèm ItemList/Product/Offer JSON-LD cho SEO. Dùng cho trang đích Ads (CRO):
 * khách intent cao thấy số và giá ngay, không phải đọc bài giảng.
 *
 * `sims` cần được truyền qua `getCategorySnapshotMix` (phổ giá đa dạng).
 * KHÔNG dùng `getCategorySnapshot` (toàn số rẻ) — mix để khách thấy mặt bằng giá thật.
 */
export default function CategoryFeaturedSims({
  title,
  sims,
  pageUrl,
}: {
  title: string;
  sims: NormalizedSIM[];
  pageUrl?: string;
}) {
  const rows = (sims ?? []).filter((s) => s.price > 0);
  if (rows.length === 0) return null;

  const itemListJsonLd = buildSimItemListJsonLd(title, rows, pageUrl);

  return (
    <>
      <section
        aria-label={title}
        className="rounded-xl border border-border bg-card p-4 shadow-card md:p-5"
      >
        <h2 className="mb-1 text-base font-bold text-primary md:text-lg">{title}</h2>
        <p className="mb-3 text-xs text-muted-foreground">
          Các số đang còn trong kho, giá niêm yết — Quý khách chọn số ưng ý rồi đặt mua hoặc chat Zalo.
        </p>

        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-secondary/50">
                <th scope="col" className="border-b border-border px-2 py-2.5 text-left font-semibold text-foreground sm:px-3">
                  Số SIM
                </th>
                <th scope="col" className="border-b border-border px-2 py-2.5 text-right font-semibold text-foreground sm:px-3">
                  Giá bán
                </th>
                <th scope="col" className="border-b border-border px-2 py-2.5 text-right sm:px-3" colSpan={2}>
                  <span className="sr-only">Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((sim, index) => (
                <tr key={sim.id} className={index % 2 === 1 ? "bg-secondary/20" : undefined}>
                  <td className="whitespace-nowrap border-b border-border/60 px-2 py-2.5 font-semibold tracking-wide text-foreground sm:px-3">
                    {formatSimQuyAware(sim.rawDigits || sim.formattedNumber)}
                  </td>
                  <td className="whitespace-nowrap border-b border-border/60 px-2 py-2.5 text-right font-semibold text-primary sm:px-3">
                    {formatPrice(sim.price)}
                  </td>
                  <td className="whitespace-nowrap border-b border-border/60 px-2 py-2.5 text-right sm:px-3">
                    <Link
                      href={`/mua-ngay/${encodeURIComponent(sim.id)}`}
                      rel="nofollow"
                      className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
                    >
                      <Phone className="h-3 w-3" />
                      <span className="hidden sm:inline">Đặt mua</span>
                      <span className="sm:hidden">Đặt</span>
                    </Link>
                  </td>
                  <td className="whitespace-nowrap border-b border-border/60 px-2 py-2.5 text-right sm:px-3">
                    <a
                      href={ZALO_BASE}
                      target="_blank"
                      rel="noopener noreferrer"
                      data-sim-number={sim.displayNumber || sim.rawDigits}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground transition hover:bg-secondary/50"
                    >
                      <MessageCircle className="h-3 w-3 text-sky-500" />
                      <span className="hidden sm:inline">Zalo</span>
                      <span className="sm:hidden">Zalo</span>
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListJsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}