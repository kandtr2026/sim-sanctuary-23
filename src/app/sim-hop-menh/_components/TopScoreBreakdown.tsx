import { formatPrice } from "@/lib/simUtils";
import { formatSimQuyAware } from "@/lib/simDisplay";
import type { RankedSim } from "../_lib/menhSimRanking";

/**
 * Chi tiết chấm điểm cho vài số dẫn đầu — phần "phong thủy" mà bảng giá
 * (CategorySimPriceList) không chở được: điểm 5 trụ cột, tổng nút, quẻ dịch.
 *
 * QUAN TRỌNG — không phát JSON-LD ở đây. Số hiển thị trong khối này là TẬP CON
 * của số đã in trong CategorySimPriceList, nên Product/Offer do khối đó phát
 * vẫn khớp đúng những gì khách thấy. Thêm schema lần nữa sẽ nhân đôi item.
 *
 * Điểm in ra lấy nguyên từ `scoreSim` (src/lib/simHopTuoi.ts) — cùng engine với
 * công cụ /sim-phong-thuy, không tự tính lại, nên hai nơi không thể lệch số.
 */
export default function TopScoreBreakdown({
  items,
  heading,
  note,
}: {
  items: RankedSim[];
  heading: string;
  note: string;
}) {
  if (items.length === 0) return null;

  return (
    <section
      aria-label={heading}
      className="rounded-xl border border-border bg-card p-4 shadow-card md:p-6"
    >
      <h2 className="mb-1 text-base font-bold text-primary md:text-lg">{heading}</h2>
      <p className="mb-4 text-xs text-muted-foreground">{note}</p>

      <ul className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {items.map(({ sim, score }) => (
          <li
            key={sim.id}
            className="rounded-lg border border-border bg-secondary/20 p-3.5"
          >
            <p className="mb-1 text-lg font-bold tracking-wide text-foreground">
              {formatSimQuyAware(sim.rawDigits || sim.formattedNumber)}
            </p>
            <p className="mb-3 text-sm font-semibold text-primary">{formatPrice(sim.price)}</p>

            <dl className="space-y-1.5 text-xs">
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-muted-foreground">Điểm hợp mệnh</dt>
                <dd className="font-semibold text-foreground">{score.score}/10</dd>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-muted-foreground">Ngũ hành</dt>
                <dd className="font-medium text-foreground">{score.nguHanhScore}/10</dd>
              </div>
              <div className="flex items-baseline justify-between gap-2">
                <dt className="text-muted-foreground">Tổng nút</dt>
                <dd className="font-medium text-foreground">{score.nut} nút</dd>
              </div>
              {score.hexagram ? (
                <div>
                  <dt className="text-muted-foreground">
                    Quẻ dịch <span className="font-medium text-foreground">({score.hexagramLevel})</span>
                  </dt>
                  <dd className="mt-0.5 font-medium leading-snug text-foreground">
                    “{score.hexagram}”
                  </dd>
                </div>
              ) : null}
            </dl>
          </li>
        ))}
      </ul>
    </section>
  );
}
