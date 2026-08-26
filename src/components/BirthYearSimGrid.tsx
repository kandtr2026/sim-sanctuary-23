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
    return (
      <div id="kho-sim" className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
        <h2 className="mb-3 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
          <span className="h-8 w-1 rounded-full bg-primary" />
          {heading}
        </h2>
        <p className="mb-2 text-muted-foreground">
          Xin lỗi, hiện chưa có sim khớp ngày sinh{" "}
          {day && month ? `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}` : `năm ${year}`} trong kho.
        </p>
        {fallbackSims && fallbackSims.length > 0 && (
          <div className="mt-4">
            <p className="mb-3 font-semibold text-foreground">
              Gợi ý các số đẹp khác đang có:
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
    </section>
  );
};

export default BirthYearSimGrid;
