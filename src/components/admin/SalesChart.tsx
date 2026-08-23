import { useEffect, useMemo, useState } from "react";
import { BarChart3, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

// The SIM_SOLD tab of the same inventory spreadsheet the storefront reads
// (see supabase/functions/fetch-sim-data). Fetched directly because Google
// Sheets serves this endpoint with permissive CORS, so the dashboard can
// render "SIM đã bán" without touching the shared `useSimData` pipeline.
const SOLD_CSV_URL =
  "https://docs.google.com/spreadsheets/d/1QRO-BroqUQWccWjOkRT7iICdTbQu3Y_NC1NWCeG0M0Y/gviz/tq?tqx=out:csv&sheet=SIM_SOLD";

type Period = "day" | "month";
type Metric = "count" | "value";

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "day", label: "Theo ngày" },
  { value: "month", label: "Theo tháng" },
];

const METRIC_OPTIONS: { value: Metric; label: string }[] = [
  { value: "count", label: "Số lượng" },
  { value: "value", label: "Giá trị" },
];

const formatCompactVnd = (n: number) => {
  const compact = (v: number) => (v % 1 === 0 ? v.toFixed(0) : v.toFixed(1).replace(".", ","));
  if (n >= 1_000_000_000) return `${compact(n / 1_000_000_000)} tỷ`;
  if (n >= 1_000_000) return `${compact(n / 1_000_000)} tr`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return n.toLocaleString("vi-VN");
};

const parseCsvRows = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(current);
      current = "";
    } else if (char === "\n" || char === "\r") {
      row.push(current);
      if (row.length > 0) rows.push(row);
      row = [];
      current = "";
    } else {
      current += char;
    }
  }
  row.push(current);
  if (row.length > 0) rows.push(row);
  return rows;
};

// Sheet exports NgayBan in US format "M/D/YYYY". Be forgiving: detect
// day-first vs month-first by the part that exceeds 12, and 2-digit years.
const parseNgayBan = (value: string | undefined): Date | null => {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (!match) {
    const fallback = new Date(trimmed);
    return Number.isNaN(fallback.getTime()) ? null : fallback;
  }
  let a = Number(match[1]);
  let b = Number(match[2]);
  let year = Number(match[3]);
  if (year < 100) year += 2000;
  if (a > 12) {
    const tmp = a;
    a = b;
    b = tmp;
  }
  const date = new Date(year, a - 1, b);
  return Number.isNaN(date.getTime()) ? null : date;
};

const parseGiaThu = (value: string | undefined): number => {
  if (!value) return 0;
  const n = Number(String(value).replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

const getAnchor = (date: Date, period: Period): Date => {
  if (period === "day") return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  return new Date(date.getFullYear(), date.getMonth(), 1);
};

interface SaleRecord {
  date: Date;
  value: number;
}

interface ChartBar {
  key: number;
  count: number;
  value: number;
  height: number;
  display: string;
  label: string;
  fullLabel: string;
}

const PERIOD_NOUN: Record<Period, string> = { day: "ngày", month: "tháng" };

interface ToggleOption<T extends string> {
  value: T;
  label: string;
}

function ToggleGroup<T extends string>({
  options,
  current,
  onChange,
}: {
  options: ToggleOption<T>[];
  current: T;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex rounded-lg border border-border bg-muted p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={current === option.value}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            current === option.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function SalesChart() {
  const [period, setPeriod] = useState<Period>("day");
  const [metric, setMetric] = useState<Metric>("count");
  const [reloadKey, setReloadKey] = useState(0);
  const [sales, setSales] = useState<SaleRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;
    setError(null);
    setSales(null);
    (async () => {
      try {
        const res = await fetch(SOLD_CSV_URL, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        const rows = parseCsvRows(text);
        if (rows.length < 2) throw new Error("Sheet trống");

        const headers = rows[0].map((h) => h.toUpperCase().replace(/\s+/g, ""));
        const ngayBanIdx = headers.findIndex((h) => h === "NGAYBAN" || h === "NGÀYBÁN");
        const soldIdIdx = headers.findIndex((h) => h === "SOLDID");
        const giaThuIdx = headers.findIndex((h) => h === "GIATHU" || h === "GIÁTHU");
        const dateIdx = ngayBanIdx !== -1 ? ngayBanIdx : 3;
        const idIdx = soldIdIdx !== -1 ? soldIdIdx : 0;
        const valueIdx = giaThuIdx !== -1 ? giaThuIdx : 2;

        const records: SaleRecord[] = [];
        const seen = new Set<string>();
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;
          const soldId = (row[idIdx] ?? "").trim();
          if (soldId) {
            if (seen.has(soldId)) continue;
            seen.add(soldId);
          }
          const date = parseNgayBan(row[dateIdx]);
          if (!date) continue;
          records.push({ date, value: parseGiaThu(row[valueIdx]) });
        }
        if (cancelled) return;
        setSales(records);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof Error && e.name === "AbortError") return;
        setError(e instanceof Error ? e.message : "Không tải được dữ liệu");
      }
    })();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [reloadKey]);

  const reload = () => setReloadKey((key) => key + 1);

  const bars = useMemo((): ChartBar[] => {
    if (!sales || sales.length === 0) return [];
    let maxDate = sales[0].date;
    for (const rec of sales) if (rec.date.getTime() > maxDate.getTime()) maxDate = rec.date;

    const anchors: Date[] = [];
    if (period === "day") {
      for (let i = 13; i >= 0; i--) {
        const t = new Date(maxDate);
        t.setDate(t.getDate() - i);
        anchors.push(t);
      }
    } else {
      const last = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
      for (let i = 11; i >= 0; i--) {
        anchors.push(new Date(last.getFullYear(), last.getMonth() - i, 1));
      }
    }

    const counts = new Map<number, number>();
    const values = new Map<number, number>();
    for (const rec of sales) {
      const key = getAnchor(rec.date, period).getTime();
      counts.set(key, (counts.get(key) ?? 0) + 1);
      values.set(key, (values.get(key) ?? 0) + rec.value);
    }

    const maxValue = metric === "value"
      ? anchors.reduce((m, a) => Math.max(m, values.get(a.getTime()) ?? 0), 0)
      : anchors.reduce((m, a) => Math.max(m, counts.get(a.getTime()) ?? 0), 0);

    return anchors.map((a) => {
      const count = counts.get(a.getTime()) ?? 0;
      const value = values.get(a.getTime()) ?? 0;
      const isMonth = period === "month";
      const rawPct = maxValue > 0 ? ((metric === "value" ? value : count) / maxValue) * 100 : 0;
      // Cap at 85% so the value label on top of the tallest bar stays inside.
      const height = count === 0 ? 2 : Math.max(Math.min(rawPct, 85), 4);
      return {
        key: a.getTime(),
        count,
        value,
        height,
        display: metric === "value" ? formatCompactVnd(value) : count.toLocaleString("vi-VN"),
        label: isMonth ? `${a.getMonth() + 1}/${String(a.getFullYear()).slice(2)}` : `${a.getDate()}/${a.getMonth() + 1}`,
        fullLabel: isMonth
          ? `Tháng ${a.getMonth() + 1}/${a.getFullYear()}`
          : `Ngày ${a.getDate()}/${a.getMonth() + 1}`,
      };
    });
  }, [sales, period, metric]);

  const totalCount = bars.reduce((sum, b) => sum + b.count, 0);
  const totalValue = bars.reduce((sum, b) => sum + b.value, 0);
  const maxCount = bars.reduce((m, b) => Math.max(m, b.count), 0);
  const maxValue = bars.reduce((m, b) => Math.max(m, b.value), 0);
  const periodNoun = PERIOD_NOUN[period];
  const summaryLine =
    metric === "value"
      ? `Tổng ${formatCompactVnd(totalValue)} · cao nhất ${formatCompactVnd(maxValue)}/${periodNoun}`
      : `Tổng ${totalCount.toLocaleString("vi-VN")} SIM · cao nhất ${maxCount.toLocaleString("vi-VN")}/${periodNoun}`;

  return (
    <section className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <BarChart3 className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">SIM đã bán</h3>
            <p className="text-xs text-muted-foreground">{sales ? summaryLine : "Đang tải…"}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ToggleGroup options={METRIC_OPTIONS} current={metric} onChange={setMetric} />
          <ToggleGroup options={PERIOD_OPTIONS} current={period} onChange={setPeriod} />
          <button
            type="button"
            onClick={reload}
            aria-label="Tải lại dữ liệu bán"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <p className="text-sm text-muted-foreground">Không tải được dữ liệu SIM đã bán: {error}</p>
          <button type="button" onClick={reload} className="text-sm font-medium text-primary hover:underline">
            Thử lại
          </button>
        </div>
      ) : !sales ? (
        <div className="flex h-44 items-end gap-1">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex-1 animate-pulse rounded-t-md bg-muted" style={{ height: `${20 + ((i * 7) % 55)}%` }} />
          ))}
        </div>
      ) : bars.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Chưa có dữ liệu bán.</p>
      ) : (
        <>
          <div
            className="relative flex h-44 items-end gap-1"
            role="img"
            aria-label={`Biểu đồ số SIM đã bán theo ${periodNoun} (${metric === "value" ? "giá trị" : "số lượng"}), tổng ${
              metric === "value" ? formatCompactVnd(totalValue) : `${totalCount} SIM`
            }`}
          >
            {bars.map((bar, index) => {
              const isLatest = index === bars.length - 1;
              return (
                <div key={bar.key} className="relative flex-1 self-end" style={{ height: `${bar.height}%` }}>
                  {bar.count > 0 ? (
                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold text-foreground">
                      {bar.display}
                    </span>
                  ) : null}
                  <div
                    title={`${bar.fullLabel}: ${bar.count.toLocaleString("vi-VN")} SIM · ${formatCompactVnd(bar.value)}`}
                    className={cn(
                      "h-full w-full rounded-t-md transition-colors",
                      bar.count === 0
                        ? "bg-muted"
                        : isLatest
                          ? "bg-primary"
                          : "bg-[hsl(var(--gold-soft))] hover:bg-[hsl(var(--gold))]",
                    )}
                  />
                </div>
              );
            })}
          </div>
          <div className="mt-1.5 flex gap-1">
            {bars.map((bar, index) => (
              <span
                key={bar.key}
                className={cn(
                  "flex-1 truncate text-center text-[9px] text-muted-foreground",
                  period === "day" && index % 2 === 1 && "invisible",
                )}
              >
                {bar.label}
              </span>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
