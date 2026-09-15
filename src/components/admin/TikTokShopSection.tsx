"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ShoppingBag, RefreshCw, TrendingUp, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/admin/StatCard";
import { cn } from "@/lib/utils";

type RangeDays = 7 | 30 | 90;
const RANGES: RangeDays[] = [7, 30, 90];

interface SummaryResponse {
  total_orders: number;
  total_revenue: number;
  currency: string;
  avg_order_value: number;
  orders_count_raw: number;
  daily: { date: string; revenue: number; orders: number }[];
  error?: string;
  code?: string | number;
  hint?: string | null;
}

const formatVnd = (n: number) =>
  n >= 1_000_000_000
    ? `${(n / 1_000_000_000).toFixed(2).replace(/\.00$/, "")} tỷ`
    : n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")} tr`
      : n.toLocaleString("vi-VN");

const Skeleton = () => (
  <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
    {Array.from({ length: 3 }).map((_, i) => (
      <div key={i} className="h-[110px] animate-pulse rounded-xl bg-muted" />
    ))}
  </div>
);

export function TikTokShopSection() {
  const [days, setDays] = useState<RangeDays>(30);
  const [data, setData] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ message: string; hint?: string } | null>(null);

  const load = useCallback(async (d: RangeDays) => {
    setLoading(true);
    setError(null);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) {
        setError({ message: "Chưa đăng nhập. Hãy đăng nhập lại để xem dữ liệu TikTok Shop." });
        return;
      }
      const res = await fetch(`/api/admin/tiktok-shop/summary?days=${d}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = (await res.json().catch(() => ({}))) as SummaryResponse;
      if (!res.ok || json.error) {
        setError({ message: json.error || `Lỗi ${res.status}`, hint: json.hint ?? undefined });
        return;
      }
      setData(json);
    } catch {
      setError({ message: "Không thể kết nối tới máy chủ TikTok Shop." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(days);
  }, [days, load]);

  // Cột biểu đồ doanh thu theo ngày (thay bảng — góp ý #29: "nhìn cho gọn").
  const dailyBars = useMemo(() => {
    const daily = data?.daily ?? [];
    const maxRev = daily.reduce((m, d) => Math.max(m, d.revenue), 0);
    return daily.map((d) => {
      const [, mo, day] = d.date.split("-");
      return {
        date: d.date,
        label: mo && day ? `${Number(day)}/${Number(mo)}` : d.date,
        revenue: d.revenue,
        orders: d.orders,
        // Cao tối thiểu 5% để cột có đơn vẫn thấy; cap 92% chừa chỗ nhãn đỉnh.
        height: d.revenue <= 0 ? 2 : Math.max(Math.min((d.revenue / maxRev) * 100, 92), 5),
      };
    });
  }, [data]);
  // Nhiều ngày (30/90) thì thưa nhãn trục x cho khỏi chồng chữ.
  const labelStep = Math.max(1, Math.ceil(dailyBars.length / 15));
  const peakRevenue = dailyBars.reduce((m, b) => Math.max(m, b.revenue), 0);

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <ShoppingBag className="h-4 w-4 text-primary" />
          Doanh thu TikTok Shop
        </h2>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-border p-0.5" role="group" aria-label="Khoảng thời gian">
            {RANGES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                aria-pressed={days === d}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  days === d ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {d} ngày
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void load(days)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Làm mới
          </button>
        </div>
      </div>

      {loading ? (
        <Skeleton />
      ) : error ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-10 text-center shadow-card">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </span>
          <p className="text-sm font-medium text-foreground">{error.message}</p>
          {error.hint ? <p className="max-w-lg text-xs text-muted-foreground">{error.hint}</p> : null}
          <button
            type="button"
            onClick={() => void load(days)}
            className="text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            Thử lại
          </button>
        </div>
      ) : !data || data.total_orders === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-12 text-center shadow-card">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <ShoppingBag className="h-6 w-6" />
          </span>
          <div className="max-w-md">
            <p className="text-sm font-medium text-foreground">Chưa có đơn hàng TikTok Shop trong khoảng này</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {data?.orders_count_raw
                ? `(Có ${data.orders_count_raw} đơn nhưng đều ở trạng thái huỷ/chưa thanh toán.)`
                : "Kéo dài khoảng thời gian hoặc chờ có đơn hàng mới."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard
              label={`Doanh thu (${days} ngày)`}
              value={`${formatVnd(data.total_revenue)}`}
              sub={data.currency}
              icon={Wallet}
              iconClass="bg-gold/15 text-gold"
              valueClass="text-gold"
            />
            <StatCard
              label="Số đơn (đã thanh toán)"
              value={data.total_orders.toLocaleString("vi-VN")}
              sub={data.orders_count_raw ? `Tổng ${data.orders_count_raw} đơn` : undefined}
              icon={ShoppingBag}
              iconClass="bg-primary/15 text-primary"
              valueClass="text-primary"
            />
            <StatCard
              label="Giá trị đơn TB"
              value={formatVnd(data.avg_order_value)}
              sub={data.currency}
              icon={TrendingUp}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Doanh thu theo ngày</h3>
              <span className="text-xs text-muted-foreground">
                {dailyBars.length} ngày có đơn · đỉnh {formatVnd(peakRevenue)}
              </span>
            </div>
            <div className="rounded-xl border border-border bg-card p-4 shadow-card">
              <div
                className="relative flex h-48 items-end gap-[3px]"
                role="img"
                aria-label={`Biểu đồ doanh thu TikTok Shop theo ngày, tổng ${formatVnd(data.total_revenue)}`}
              >
                {dailyBars.map((b, i) => {
                  const isLatest = i === dailyBars.length - 1;
                  return (
                    <div key={b.date} className="relative flex-1 self-end" style={{ height: `${b.height}%` }}>
                      <div
                        title={`${b.label}: ${b.orders.toLocaleString("vi-VN")} đơn · ${formatVnd(b.revenue)}`}
                        aria-label={`${b.label}: ${b.orders} đơn, ${formatVnd(b.revenue)}`}
                        className={cn(
                          "h-full w-full rounded-t-md transition-colors",
                          b.revenue <= 0
                            ? "bg-muted"
                            : isLatest
                              ? "bg-primary hover:opacity-90"
                              : "bg-[hsl(var(--gold-soft))] hover:bg-[hsl(var(--gold))]",
                        )}
                      />
                    </div>
                  );
                })}
              </div>
              <div className="mt-1.5 flex gap-[3px]">
                {dailyBars.map((b, i) => (
                  <span
                    key={b.date}
                    className={cn(
                      "flex-1 truncate text-center text-[9px] text-muted-foreground",
                      i % labelStep !== 0 && "invisible",
                    )}
                  >
                    {b.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
