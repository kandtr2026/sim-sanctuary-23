import SIMCardNew from "@/components/SIMCardNew";
import type { NormalizedSIM } from "@/lib/simUtils";

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
}: {
  year: string;
  sims: NormalizedSIM[];
  totalCount?: number;
  day?: string;
  month?: string;
}) => {
  const heading = day && month
    ? `Kho SIM Sinh ${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`
    : `Kho SIM Năm Sinh ${year}`;

  if (sims.length === 0) {
    return (
      <div id="kho-sim" className="rounded-xl border border-border bg-card p-6 text-center shadow-card md:p-8">
        <p className="text-muted-foreground">
          Hiện chưa có sim sinh {day && month ? `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}` : `năm ${year}`} trong kho. Nhắn Zalo để được tư vấn tìm số.
        </p>
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
        {sims.map((sim) => (
          <div key={sim.id} className="min-w-0">
            <SIMCardNew sim={sim} />
          </div>
        ))}
      </div>
    </section>
  );
};

export default BirthYearSimGrid;
