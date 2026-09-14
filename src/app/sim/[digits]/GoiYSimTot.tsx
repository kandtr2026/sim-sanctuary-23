import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { formatPrice } from "@/lib/simUtils";

// "Gợi ý số hợp phong thủy hơn — cùng tầm giá" (A Khoa 14/09): khi khách xem một
// số, gợi ý các số BẰNG GIÁ hoặc nhỉnh hơn CHÚT nhưng điểm phong thủy CAO HƠN số
// đang xem. Không đẩy số đắt hẳn (phí tiền khách). Điểm + lọc giá tính ở page.

type Item = { digits: string; price: number; score: number; formatted: string };

const scoreTone = (s: number) =>
  s >= 8
    ? "bg-emerald-500/15 text-emerald-600"
    : s >= 6.5
      ? "bg-emerald-500/10 text-emerald-600"
      : s >= 5
        ? "bg-gold/15 text-gold-dark"
        : "bg-amber-500/10 text-amber-600";

export default function GoiYSimTot({
  items,
  curScore,
  curPrice,
}: {
  items: Item[];
  curScore: number;
  curPrice: number;
}) {
  if (!items || items.length === 0) return null;

  return (
    <section className="rounded-xl border border-gold/30 bg-gold/[0.04] p-6 shadow-card md:p-8">
      <h2 className="mb-1 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
        <span className="h-8 w-1 rounded-full bg-gold" />
        <TrendingUp aria-hidden className="h-5 w-5 text-gold" />
        Gợi ý số hợp phong thủy hơn — cùng tầm giá
      </h2>
      <p className="mb-4 pl-4 text-sm text-muted-foreground">
        Số bạn đang xem đạt <strong className="text-foreground">{curScore.toFixed(1)}/10</strong>. Dưới đây là những số{" "}
        <strong className="text-foreground">bằng giá hoặc nhỉnh hơn một chút</strong> nhưng{" "}
        <strong className="text-foreground">điểm phong thủy cao hơn</strong> — đáng để cân nhắc.
      </p>
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-secondary/50">
              <th scope="col" className="border-b border-border px-3 py-2.5 text-left font-semibold text-foreground">
                Số SIM
              </th>
              <th scope="col" className="border-b border-border px-3 py-2.5 text-center font-semibold text-foreground">
                Điểm PT
              </th>
              <th scope="col" className="border-b border-border px-3 py-2.5 text-right font-semibold text-foreground">
                Giá bán
              </th>
              <th scope="col" className="border-b border-border px-3 py-2.5 text-right">
                <span className="sr-only">Xem số</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => {
              const delta = it.price - curPrice;
              return (
                <tr key={it.digits} className={i % 2 === 1 ? "bg-secondary/20" : undefined}>
                  <td className="whitespace-nowrap border-b border-border/60 px-3 py-2.5 font-semibold tracking-wide text-foreground">
                    <Link
                      href={`/sim/${it.digits}`}
                      className="underline-offset-2 hover:text-primary hover:underline"
                    >
                      {it.formatted}
                    </Link>
                  </td>
                  <td className="border-b border-border/60 px-3 py-2.5 text-center">
                    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-bold ${scoreTone(it.score)}`}>
                      {it.score.toFixed(1)}
                    </span>
                  </td>
                  <td className="whitespace-nowrap border-b border-border/60 px-3 py-2.5 text-right font-semibold text-primary">
                    {formatPrice(it.price)}
                    <span className="ml-1 text-[11px] font-normal text-muted-foreground">
                      {delta <= 0 ? "bằng giá" : `+${formatPrice(delta)}`}
                    </span>
                  </td>
                  <td className="whitespace-nowrap border-b border-border/60 px-3 py-2.5 text-right">
                    <Link
                      href={`/sim/${it.digits}`}
                      className="text-xs font-semibold text-primary underline-offset-2 hover:underline"
                    >
                      Xem số
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
