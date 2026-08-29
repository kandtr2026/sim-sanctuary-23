import { useEffect, useMemo, useState } from "react";
import { BarChart3, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchSheetCsv, normalizeHeader, parseCSVLine, stripQuotes } from "@/lib/cheapSimSheet";
import { MAIN_SHEET_ID } from "@/lib/recentOrdersSheet";

/**
 * Tab SIM_SOLD của chính spreadsheet mà storefront đọc (xem
 * `supabase/functions/fetch-sim-data`).
 *
 * Bản cũ `fetch` thẳng gviz với `sheet=SIM_SOLD` không kèm query: 24 cột ×
 * 2.274 dòng = 383.825 byte, trong đó có `GhiChu`, `Kênh bán`, `STB chuan`…
 * những cột biểu đồ không dùng. Ở `/admin` thì `GiaThu` là dữ liệu hợp lệ (đó
 * chính là metric "Giá trị"), nhưng không có lý do gì tải cả tab: projection
 * dưới đây xin đúng 5 cột và đi qua `sheet-proxy` như mọi chỗ khác của site —
 * 87.547 byte, giảm 77%.
 *
 * Chữ cái cột trong gviz là theo VỊ TRÍ, cùng hợp đồng đã ghi ở
 * `recentOrdersSheet.ts`: A SoldID · B SoThueBao · C GiaThu · D NgayBan.
 *
 * `year(D), month(D), day(D)` thay vì `D`: gviz xuất ô ngày theo định dạng hiển
 * thị của sheet (hiện `m/d/yyyy`) và bỏ qua mệnh đề `format` khi ra CSV, nên
 * ngày 1/2 với 2/1 không thể phân biệt lại được nếu ai đó đổi định dạng cột.
 * `month()` của gviz đếm từ 0.
 */
const SOLD_QUERY = "select A, C, year(D), month(D), day(D) where D is not null";

const SOLD_CSV_URL =
  `https://docs.google.com/spreadsheets/d/${MAIN_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=SIM_SOLD&tq=${encodeURIComponent(SOLD_QUERY)}`;

/** Header kỳ vọng của projection trên, đã chuẩn hoá. Cột lệch là hỏng to tiếng. */
const SOLD_HEADER_GUARD = ["soldid", "giathu", "year(ngayban)", "month(ngayban)", "day(ngayban)"];

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

const parseGiaThu = (value: string | undefined): number => {
  if (!value) return 0;
  const n = Number(String(value).replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

/** gviz trả year/month/day là số nguyên; `month()` của gviz đếm từ 0. */
const toSaleDate = (yearRaw?: string, monthRaw?: string, dayRaw?: string): Date | null => {
  const year = Number(yearRaw);
  const month0 = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return null;
  if (!Number.isInteger(month0) || month0 < 0 || month0 > 11) return null;
  if (!Number.isInteger(day) || day < 1 || day > 31) return null;
  return new Date(year, month0, day);
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

/**
 * Dòng bán đã lọc, hoặc ném lỗi khi header không khớp guard.
 *
 * Ném thay vì parse im lặng: chữ cái cột là theo vị trí, một lần chèn cột ở
 * giữa là `select A, C, …` lấy sang cột khác. Ném thì biểu đồ hiện thông báo
 * lỗi kèm nút "Thử lại"; parse im lặng thì biểu đồ vẫn vẽ bằng cột sai.
 */
const parseSoldCsv = (csv: string): SaleRecord[] => {
  const lines = csv.trim().split("\n").filter((line) => line.trim());
  if (lines.length < 2) throw new Error("Sheet trống");

  const headers = parseCSVLine(lines[0]).map(normalizeHeader);
  if (SOLD_HEADER_GUARD.some((expected, i) => headers[i] !== expected)) {
    throw new Error(
      `cột SIM_SOLD đã đổi thứ tự — nhận ${JSON.stringify(headers.slice(0, SOLD_HEADER_GUARD.length))}`,
    );
  }

  const records: SaleRecord[] = [];
  // 10/2.264 SoldID xuất hiện hai lần (bán lại sau khi khách trả), giữ dòng đầu.
  const seen = new Set<string>();
  for (let i = 1; i < lines.length; i++) {
    const [soldId, giaThu, yearRaw, monthRaw, dayRaw] = parseCSVLine(lines[i]).map(stripQuotes);
    if (soldId) {
      if (seen.has(soldId)) continue;
      seen.add(soldId);
    }
    const date = toSaleDate(yearRaw, monthRaw, dayRaw);
    if (!date) continue;
    records.push({ date, value: parseGiaThu(giaThu) });
  }
  return records;
};

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
        const csv = await fetchSheetCsv(SOLD_CSV_URL, controller.signal);
        const records = parseSoldCsv(csv);
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
