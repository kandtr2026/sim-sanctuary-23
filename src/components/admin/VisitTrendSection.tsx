"use client";

import { useEffect, useMemo, useState } from "react";
import { LineChart, RefreshCw } from "lucide-react";
import { DailyBars, PeriodToggle } from "@/components/admin/dailyBars";
import { buildDailyBars, type DailyPeriod, type DailyPoint } from "@/lib/dailyBars";

/**
 * "Tổng quan" lượt truy cập TOÀN SITE theo ngày (góp ý #20) — đặt trên cùng tab
 * Traffic. Nguồn: /api/admin/visit-stats (RPC gom sẵn theo ngày). Cần token
 * admin (page_visits chỉ admin đọc).
 */
export function VisitTrendSection({ token }: { token?: string }) {
  const [daily, setDaily] = useState<DailyPoint[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<DailyPeriod>("day");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/admin/visit-stats", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: { daily: DailyPoint[] }) => {
        if (!cancelled) setDaily(d.daily ?? []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Không tải được dữ liệu");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, reloadKey]);

  const bars = useMemo(() => buildDailyBars(daily ?? [], period), [daily, period]);
  const shown = bars.reduce((s, b) => s + b.count, 0);

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <LineChart className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Lượt truy cập mỗi ngày</h3>
            <p className="text-xs text-muted-foreground">
              {loading
                ? "Đang tải…"
                : `${shown.toLocaleString("vi-VN")} lượt trong ${period === "day" ? "14 ngày" : "6 tháng"} · toàn site`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PeriodToggle period={period} onChange={setPeriod} />
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            aria-label="Tải lại"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-background text-muted-foreground transition-colors hover:text-foreground"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {error ? (
        <div className="flex flex-col items-center gap-2 py-10 text-center">
          <p className="text-sm text-muted-foreground">Không tải được lượt truy cập: {error}</p>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="text-sm font-medium text-primary hover:underline">
            Thử lại
          </button>
        </div>
      ) : loading ? (
        <div className="flex h-40 items-end gap-1">
          {Array.from({ length: 14 }).map((_, i) => (
            <div key={i} className="flex-1 animate-pulse rounded-t-md bg-muted" style={{ height: `${20 + ((i * 7) % 55)}%` }} />
          ))}
        </div>
      ) : shown === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Chưa có lượt truy cập trong khoảng này.</p>
      ) : (
        <DailyBars bars={bars} period={period} />
      )}
    </div>
  );
}
