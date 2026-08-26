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
}: {
  year: string;
  sims: NormalizedSIM[];
  totalCount?: number;
}) => {
  if (sims.length === 0) {
    return (
      <div id="kho-sim" className="rounded-xl border border-border bg-card p-6 text-center shadow-card md:p-8">
        <p className="text-muted-foreground">
          Hiện chưa có sim năm sinh {year} trong kho. Nhắn Zalo để được tư vấn tìm số.
        </p>
      </div>
    );
  }

  return (
    <section id="kho-sim" className="rounded-xl border border-border bg-card p-4 shadow-card md:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
          <span className="h-8 w-1 rounded-full bg-primary" />
          Kho SIM Năm Sinh {year}
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
