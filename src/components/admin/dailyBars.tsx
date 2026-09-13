"use client";

import { cn } from "@/lib/utils";
import type { DailyBar, DailyPeriod } from "@/lib/dailyBars";

/** Biểu đồ cột lượt/ngày (hoặc /tháng) + nhãn trục X thưa cho chế độ ngày. */
export function DailyBars({
  bars,
  period,
  colorClass = "bg-primary",
}: {
  bars: DailyBar[];
  period: DailyPeriod;
  colorClass?: string;
}) {
  return (
    <>
      <div className="flex h-40 items-end gap-1" role="img" aria-label={`Biểu đồ theo ${period === "day" ? "ngày" : "tháng"}`}>
        {bars.map((bar) => (
          <div key={bar.key} className="relative flex-1 self-end" style={{ height: `${bar.height}%` }}>
            {bar.count > 0 ? (
              <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold text-foreground">
                {bar.count.toLocaleString("vi-VN")}
              </span>
            ) : null}
            <div
              title={`${bar.label}: ${bar.count.toLocaleString("vi-VN")}`}
              className={cn("h-full w-full rounded-t-md", bar.count === 0 ? "bg-muted" : colorClass)}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1">
        {bars.map((bar, i) => (
          <span
            key={bar.key}
            className={cn(
              "flex-1 truncate text-center text-[9px] text-muted-foreground",
              period === "day" && i % 2 === 1 && "invisible",
            )}
          >
            {bar.label}
          </span>
        ))}
      </div>
    </>
  );
}

/** Nút chuyển chế độ ngày/tháng dùng chung. */
export function PeriodToggle({
  period,
  onChange,
  dayLabel = "14 ngày",
  monthLabel = "6 tháng",
}: {
  period: DailyPeriod;
  onChange: (p: DailyPeriod) => void;
  dayLabel?: string;
  monthLabel?: string;
}) {
  const options: { value: DailyPeriod; label: string }[] = [
    { value: "day", label: dayLabel },
    { value: "month", label: monthLabel },
  ];
  return (
    <div className="flex rounded-lg border border-border bg-muted p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          aria-pressed={period === o.value}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            period === o.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
