"use client";

/**
 * Doanh thu Shopee đã bán theo listing (góp ý #34). Gọi /api/admin/shopee/sales
 * (lấy thẳng Shopee Order API, không cache) nên NẠP THEO YÊU CẦU: bấm nút mới tải,
 * tránh gọi nặng mỗi lần mở dashboard. Song song với "Doanh thu TikTok Shop".
 */

import { useCallback, useState } from "react";
import { AlertTriangle, RefreshCw, ShoppingCart, TrendingUp, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/admin/StatCard";
import { cn } from "@/lib/utils";

type RangeDays = 7 | 30 | 90;
const RANGES: RangeDays[] = [7, 30, 90];

interface SalesItem {
  item_id: number;
  item_name: string;
  orders: number;
  quantity: number;
  revenue: number;
}
interface SalesResponse {
  rangeDays: number;
  totalOrders: number;
  totalRevenue: number;
  currency: string;
  byItem: SalesItem[];
  capped: boolean;
  error?: string;
}

const formatVnd = (n: number) =>
  n >= 1_000_000_000
    ? `${(n / 1_000_000_000).toFixed(2).replace(/\.00$/, "")} tỷ`
    : n >= 1_000_000
      ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")} tr`
      : n.toLocaleString("vi-VN");

export function ShopeeSalesSection() {
  const [days, setDays] = useState<RangeDays>(30);
  const [data, setData] = useState<SalesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  const load = useCallback(async (d: RangeDays) => {
    setLoading(true);
    setError(null);
    setHasFetched(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) {
        setError("Chưa đăng nhập.");
        return;
      }
      const res = await fetch(`/api/admin/shopee/sales?days=${d}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const json = (await res.json().catch(() => ({}))) as SalesResponse;
      if (!res.ok || json.error) {
        setError(json.error || `Lỗi ${res.status}`);
        return;
      }
      setData(json);
    } catch {
      setError("Không kết nối được máy chủ Shopee.");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <ShoppingCart className="h-4 w-4 text-primary" />
          Doanh thu Shopee đã bán
        </h2>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-border p-0.5" role="group" aria-label="Khoảng thời gian">
            {RANGES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => {
                  setDays(d);
                  if (hasFetched) void load(d);
                }}
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
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            {hasFetched ? "Làm mới" : "Tải"}
          </button>
        </div>
      </div>

      {!hasFetched ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card/50 px-6 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShoppingCart className="h-6 w-6" />
          </span>
          <div className="max-w-md">
            <p className="text-sm font-medium text-foreground">Xem doanh thu từng mã đã bán trên Shopee</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Lấy trực tiếp từ Shopee (có thể mất vài giây). Chọn khoảng thời gian rồi bấm <b>Tải</b>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void load(days)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4" />
            Tải doanh thu {days} ngày
          </button>
        </div>
      ) : loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[104px] animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-xl bg-muted" />
          <p className="text-center text-xs text-muted-foreground">Đang lấy đơn từ Shopee…</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-10 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <AlertTriangle className="h-6 w-6" />
          </span>
          <p className="text-sm font-medium text-foreground">{error}</p>
          <button type="button" onClick={() => void load(days)} className="text-sm font-medium text-primary hover:underline">
            Thử lại
          </button>
        </div>
      ) : !data || data.byItem.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
          <p className="text-sm font-medium text-foreground">Chưa có đơn đã bán trong {days} ngày qua</p>
          <p className="mt-1 text-xs text-muted-foreground">Thử kéo dài khoảng thời gian.</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard
              label={`Doanh thu (${days} ngày)`}
              value={formatVnd(data.totalRevenue)}
              sub={data.currency}
              icon={Wallet}
              iconClass="bg-gold/15 text-gold"
              valueClass="text-gold"
            />
            <StatCard
              label="Số đơn đã bán"
              value={data.totalOrders.toLocaleString("vi-VN")}
              icon={ShoppingCart}
              iconClass="bg-primary/15 text-primary"
              valueClass="text-primary"
            />
            <StatCard label="Số mã bán được" value={data.byItem.length.toLocaleString("vi-VN")} icon={TrendingUp} />
          </div>

          {data.capped && (
            <p className="rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-xs text-gold">
              Nhiều đơn quá — mới tính {(3000).toLocaleString("vi-VN")} đơn gần nhất. Thu hẹp khoảng thời gian để chính xác hơn.
            </p>
          )}

          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Từng mã đã bán (xếp theo doanh thu)</h3>
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
              <div className="max-h-[420px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted/90 text-left text-muted-foreground backdrop-blur">
                    <tr>
                      <th scope="col" className="px-4 py-2.5 font-medium">Sản phẩm</th>
                      <th scope="col" className="px-4 py-2.5 text-right font-medium">Đơn</th>
                      <th scope="col" className="px-4 py-2.5 text-right font-medium">SL</th>
                      <th scope="col" className="px-4 py-2.5 text-right font-medium">Doanh thu</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {data.byItem.map((p) => (
                      <tr key={p.item_id} className="transition-colors hover:bg-muted/30">
                        <td className="px-4 py-2.5 text-foreground">
                          <span className="line-clamp-2">{p.item_name}</span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right font-semibold text-primary">
                          {p.orders.toLocaleString("vi-VN")}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right text-foreground">
                          {p.quantity.toLocaleString("vi-VN")}
                        </td>
                        <td className="whitespace-nowrap px-4 py-2.5 text-right font-semibold text-gold">
                          {formatVnd(p.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Doanh thu = tổng (giá bán × số lượng) theo giá đơn hàng (GMV), loại đơn huỷ/chưa thanh toán. “Đơn” = số đơn có mã đó.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
