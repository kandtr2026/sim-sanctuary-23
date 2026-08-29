import Link from "next/link";
import SIMCardNew from "@/components/SIMCardNew";
import type { NormalizedSIM } from "@/lib/simUtils";

/**
 * Format số theo ngày sinh khớp: 0903714793 (khớp d1m1yy "4793" = 4.7.93)
 * → "090371.4.7.93". Trả về null khi không khớp pattern nào.
 */
const buildBirthDateDisplay = (
  digits: string,
  year: string,
  day: string,
  month: string,
): string | null => {
  const yy = year.slice(-2);
  // day/month có thể là "8"/"08" → d1/m1 là số KHÔNG pad (bỏ 0 đầu), d2/m2 pad 2.
  const d1 = String(Number(day));
  const d2 = day.padStart(2, "0");
  const m1 = String(Number(month));
  const m2 = month.padStart(2, "0");

  // Zone 1: d-m-y đầy đủ, ưu tiên 2-2 → 2-1 → 1-1
  const candidates: { suffix: string; display: string }[] = [
    { suffix: d2 + m2 + yy, display: `${d2}.${m2}.${yy}` },
    { suffix: d2 + m1 + yy, display: `${d2}.${m1}.${yy}` },
    { suffix: d1 + m1 + yy, display: `${d1}.${m1}.${yy}` },
    { suffix: d2 + m2 + year, display: `${d2}.${m2}.${year}` },
    { suffix: d2 + m1 + year, display: `${d2}.${m1}.${year}` },
    { suffix: d1 + m1 + year, display: `${d1}.${m1}.${year}` },
  ];
  for (const c of candidates) {
    if (digits.endsWith(c.suffix)) {
      return `${digits.slice(0, digits.length - c.suffix.length)}.${c.display}`;
    }
  }

  // Zone 2: m-y
  for (const mm of [m1, m2]) {
    if (digits.endsWith(mm + year)) {
      return `${digits.slice(0, digits.length - (mm + year).length)}.${mm}.${year}`;
    }
  }

  return null;
};

/**
 * Server-rendered grid of SIMs for a birth year. Uses the server snapshot
 * (real SIMs matching the year in the last 6 digits) so the page shows actual
 * stock without shipping the full catalogue to the client.
 */
const BirthYearSimGrid = ({
  year,
  sims,
  totalCount,
  day,
  month,
  fallbackSims,
}: {
  year: string;
  sims: NormalizedSIM[];
  totalCount?: number;
  day?: string;
  month?: string;
  fallbackSims?: NormalizedSIM[];
}) => {
  const heading = day && month
    ? `Kho SIM Sinh ${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`
    : `Kho SIM Năm Sinh ${year}`;

  if (sims.length === 0) {
    const nhanNgay =
      day && month ? `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}` : `năm ${year}`;
    return (
      <div id="kho-sim" className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
        <h2 className="mb-3 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
          <span className="h-8 w-1 rounded-full bg-primary" />
          {heading}
        </h2>
        <p className="mb-4 leading-relaxed text-muted-foreground">
          Kho hiện chưa có số nào chứa đúng {nhanNgay}. Kho đổi hàng liên tục nên Quý khách có thể
          xem lại sau.
        </p>

        {/* Ngõ ra thay vì ngõ cụt: trang này chỉ tìm số CHỨA đúng ngày sinh, còn công cụ phong thủy
            chấm điểm cả kho theo mệnh và quẻ dịch nên luôn có số phù hợp. Khách đang muốn "số của
            riêng tôi" thì đây đúng là bước tiếp theo, không phải một lời mời chung. */}
        <div className="rounded-lg border border-gold/30 bg-gold/5 p-4 md:p-5">
          <p className="mb-1.5 font-semibold text-foreground">
            Cần số ngay? Chọn theo phong thủy thay vì theo con số ngày sinh
          </p>
          <p className="mb-4 text-sm leading-relaxed text-muted-foreground">
            Công cụ Sim hợp tuổi chấm điểm toàn bộ kho theo mệnh, ngũ hành và quẻ dịch của Quý khách,
            nên luôn có số phù hợp dù dãy số không chứa {nhanNgay}.
          </p>
          <Link
            href={`/sim-phong-thuy?nam=${year}${day && month ? `&ngay=${day}&thang=${month}` : ""}`}
            className="inline-flex items-center justify-center rounded-lg bg-gold px-6 py-2.5 font-bold text-header-bg shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light"
          >
            Xem sim hợp tuổi {year}
          </Link>
        </div>

        {fallbackSims && fallbackSims.length > 0 && (
          <div className="mt-6">
            <p className="mb-3 font-semibold text-foreground">
              Hoặc tham khảo các số đẹp khác đang có trong kho:
            </p>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 md:gap-3">
              {fallbackSims.map((sim) => (
                <div key={sim.id} className="min-w-0">
                  <SIMCardNew sim={sim} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <section id="kho-sim" className="rounded-xl border border-border bg-card p-4 shadow-card md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
          <span className="h-8 w-1 rounded-full bg-primary" />
          {heading}
          {totalCount !== undefined && totalCount > 0 && (
            <span className="text-sm font-semibold text-muted-foreground">({totalCount.toLocaleString("vi-VN")} số)</span>
          )}
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 md:gap-3">
{sims.map((sim) => {
  const birthDisp = day && month ? buildBirthDateDisplay(sim.rawDigits, year, day, month) : undefined;
  return (
    <div key={sim.id} className="min-w-0">
      <SIMCardNew sim={sim} birthDateDisplay={birthDisp} />
    </div>
  );
})}
      </div>

      {/* Ngõ đi tiếp cho khách không thấy đúng ngày sinh của mình trong lưới. Trang
          này chỉ tìm số CHỨA đúng ngày sinh, nên số lượng phụ thuộc kho; công cụ
          phong thủy chấm điểm cả kho theo mệnh nên luôn có số phù hợp. */}
      <p className="mt-4 border-t border-border pt-3 text-sm text-muted-foreground">
        Chưa thấy số đúng ngày sinh của Quý khách?{" "}
        <Link
          href={`/sim-phong-thuy?nam=${year}${day && month ? `&ngay=${day}&thang=${month}` : ""}`}
          className="font-semibold text-primary underline-offset-2 hover:underline"
        >
          Chọn theo phong thủy — chấm điểm toàn bộ kho theo mệnh của Quý khách
        </Link>
      </p>
    </section>
  );
};

export default BirthYearSimGrid;
