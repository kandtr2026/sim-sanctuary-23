"use client";

/**
 * Tóm tắt Shopee trên dashboard (góp ý #30 — "cả hai": giữ trang /admin/shopee
 * riêng + liếc nhanh ở dashboard). Đọc /api/admin/shopee/summary (từ snapshot
 * cache, chỉ vài con số), hiện số listing / đang bán / hết hàng + link qua trang
 * quản lý đầy đủ.
 */

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, PackageX, RefreshCw, ShoppingCart, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { StatCard } from "@/components/admin/StatCard";
import { cn } from "@/lib/utils";

interface Summary {
  total: number;
  live: number;
  outOfStock: number;
  fetchedAt: string | null;
  isStale: boolean;
  error?: string;
}

export function ShopeeSummaryCard() {
  const [data, setData] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: session } = await supabase.auth.getSession();
      const token = session?.session?.access_token;
      if (!token) {
        setError("Chưa đăng nhập.");
        return;
      }
      const res = await fetch("/api/admin/shopee/summary", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const json = (await res.json().catch(() => ({}))) as Summary;
      if (!res.ok || json.error) {
        setError(json.error || `Lỗi ${res.status}`);
        return;
      }
      setData(json);
    } catch {
      setError("Không kết nối được máy chủ.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <section className="rounded-2xl border border-border bg-muted/20 p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <ShoppingCart className="h-4 w-4 text-primary" />
          Shopee (tóm tắt)
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Làm mới
          </button>
          <a
            href="/admin/shopee"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Quản lý Shopee
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-[104px] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-xl border border-border bg-card px-5 py-6 text-center text-sm text-muted-foreground">
          {error}{" "}
          <button type="button" onClick={() => void load()} className="font-medium text-primary hover:underline">
            Thử lại
          </button>
        </div>
      ) : !data || data.total === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 px-5 py-8 text-center text-sm text-muted-foreground">
          Chưa có dữ liệu listing.{" "}
          <a href="/admin/shopee" className="font-medium text-primary hover:underline">
            Mở trang Shopee để lấy danh sách →
          </a>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <StatCard label="Tổng listing" value={data.total.toLocaleString("vi-VN")} icon={Store} />
            <StatCard
              label="Đang bán"
              value={data.live.toLocaleString("vi-VN")}
              icon={CheckCircle2}
              iconClass="bg-emerald-500/15 text-emerald-400"
              valueClass="text-emerald-400"
            />
            <StatCard
              label="Hết hàng"
              value={data.outOfStock.toLocaleString("vi-VN")}
              icon={PackageX}
              iconClass="bg-primary/15 text-primary"
              valueClass="text-primary"
            />
          </div>
          {data.fetchedAt && (
            <p className="mt-3 text-xs text-muted-foreground">
              Cập nhật lúc <b className="text-foreground">{new Date(data.fetchedAt).toLocaleString("vi-VN")}</b>
              {data.isStale && <span className="text-gold"> (đã cũ &gt;6h — vào trang Shopee bấm “Lấy danh sách mới nhất”)</span>}
            </p>
          )}
        </>
      )}
    </section>
  );
}
