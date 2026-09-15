import { TrendingUp } from "lucide-react";
import SIMCardNew from "@/components/SIMCardNew";
import type { NormalizedSIM } from "@/lib/simUtils";

// "Gợi ý số hợp phong thủy hơn — cùng tầm giá" (A Khoa 14/09): khi khách xem một
// số, gợi ý các số BẰNG GIÁ hoặc nhỉnh hơn CHÚT nhưng điểm phong thủy CAO HƠN số
// đang xem. Không đẩy số đắt hẳn (phí tiền khách). Điểm + lọc giá tính ở page.
// A Khoa 15/09: hiển thị dạng THẺ xếp lưới như homepage (điểm PT + hành nằm sẵn
// trên chip của thẻ), không còn bảng dọc nhìn xấu.

export default function GoiYSimTot({
  sims,
  curScore,
}: {
  sims: NormalizedSIM[];
  curScore: number;
}) {
  if (!sims || sims.length === 0) return null;

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
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-3 lg:grid-cols-4">
        {sims.map((s) => (
          <SIMCardNew key={s.id} sim={s} />
        ))}
      </div>
    </section>
  );
}
