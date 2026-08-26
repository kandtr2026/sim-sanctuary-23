import Link from "next/link";
import { Phone } from "lucide-react";
import type { NormalizedSIM } from "@/lib/simUtils";
import { formatPrice } from "@/lib/simUtils";

const ZALO_URL = "https://zalo.me/0933356666";

const detectCarrier = (number: string): string => {
  const digits = (number || "").replace(/\D/g, "");
  const prefix = digits.substring(0, 3);
  if (["090", "093", "089", "070", "076", "077", "078", "079"].includes(prefix)) return "Mobifone";
  if (["088", "091", "094", "081", "082", "083", "084", "085"].includes(prefix)) return "Vinaphone";
  if (["099", "059"].includes(prefix)) return "Gmobile";
  return "Khác";
};

/**
 * ItemList + Product JSON-LD for a set of real SIMs. Exported so pages that
 * already hold server SIM data (e.g. the homepage) can emit the same schema
 * without rendering the visual table below.
 *
 * `pageUrl` (optional): canonical URL of the page these SIMs are shown on. When
 * set, each Product/Offer `url` points there. When omitted, the `url` fields
 * are dropped entirely — they are never pointed at `/mua-ngay/[id]`, which is
 * noindex + robots-disallowed and would trigger structured-data warnings.
 */
export const buildSimItemListJsonLd = (
  title: string,
  sims: NormalizedSIM[],
  pageUrl?: string,
) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: title,
  itemListElement: sims.map((sim, index) => {
    const offers: Record<string, unknown> = {
      "@type": "Offer",
      priceCurrency: "VND",
      price: sim.price,
      availability: "https://schema.org/InStock",
      ...(pageUrl ? { url: pageUrl } : {}),
    };
    return {
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: `SIM ${sim.formattedNumber}`,
        description: `SIM số đẹp ${sim.formattedNumber} — ${detectCarrier(sim.formattedNumber)}. Giá niêm yết ${formatPrice(sim.price)}.`,
        ...(pageUrl ? { url: pageUrl } : {}),
        offers,
      },
    };
  }),
});

/**
 * Server-rendered snapshot of real SIM numbers for a category page (C6).
 *
 * The numbers in the JSON-LD ItemList are exactly the ones rendered in this
 * section — the client island below renders its own live data, so this
 * snapshot and its schema can never drift from each other. Only SIMs actually
 * present in the build-time catalogue are marked, never invented ones.
 *
 * `pageUrl` is forwarded to the Product/Offer `url` fields (see
 * buildSimItemListJsonLd); optional and safe to omit.
 */
const SimSnapshot = ({
  title,
  sims,
  pageUrl,
}: {
  title: string;
  sims: NormalizedSIM[];
  pageUrl?: string;
}) => {
  if (!sims || sims.length === 0) return null;

  const itemListJsonLd = buildSimItemListJsonLd(title, sims, pageUrl);

  return (
    <>
      <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
        <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
          <span className="h-8 w-1 rounded-full bg-primary" />
          {title}
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left font-semibold text-foreground">Số SIM</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground hidden sm:table-cell">Nhà mạng</th>
                <th className="px-4 py-3 text-right font-semibold text-foreground">Giá</th>
                <th className="px-4 py-3 text-center font-semibold text-foreground">Hành động</th>
              </tr>
            </thead>
            <tbody>
              {sims.map((sim) => (
                <tr key={sim.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3 font-bold text-foreground tracking-wide whitespace-nowrap">
                    {sim.formattedNumber}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                    {detectCarrier(sim.formattedNumber)}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-primary whitespace-nowrap">
                    {formatPrice(sim.price)}
                  </td>
                  <td className="px-4 py-3 text-center whitespace-nowrap">
                    <Link
                      href={`/mua-ngay/${encodeURIComponent(sim.id)}`}
                      className="inline-flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary/90"
                    >
                      <Phone className="h-3 w-3" /> Đặt ngay
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Số thật đang hiển thị trong kho, cập nhật theo dữ liệu bán. Muốn lọc nhanh theo giá hoặc đuôi số? Dùng kho SIM
          bên dưới.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Cần hỗ trợ chọn số?{" "}
          <a href={ZALO_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-primary underline-offset-2 hover:underline">
            Nhắn Zalo tư vấn
          </a>{" "}
          (0933.356.666).
        </p>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(itemListJsonLd).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
};

export default SimSnapshot;
