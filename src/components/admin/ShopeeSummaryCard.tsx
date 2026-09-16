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

interface SnapshotListing {
  item_id: number;
  name: string;
  variantCount: number;
  priceMin: number;
  priceMax: number;
  stock: number;
  status: string;
}

interface Summary {
  total: number;
  live: number;
  outOfStock: number;
  fetchedAt: string | null;
  isStale: boolean;
  listings?: SnapshotListing[];
  error?: string;
}

const TRANG_THAI: Record<string, { label: string; cls: string }> = {
  NORMAL: { label: "Đang bán", cls: "bg-emerald-500/15 text-emerald-400" },
  UNLIST: { label: "Ngừng", cls: "bg-muted text-muted-foreground" },
  UNLISTED: { label: "Ngừng", cls: "bg-muted text-muted-foreground" },
  REVIEWING: { label: "Đang duyệt", cls: "bg-gold/15 text-gold" },
  BANNED: { label: "Bị khoá", cls: "bg-primary/15 text-primary" },
  DELETED: { label: "Đã xoá", cls: "bg-primary/15 text-primary" },
};
const trangThai = (s: string) =>
  TRANG_THAI[String(s || "").toUpperCase()] ?? { label: s || "—", cls: "bg-muted text-muted-foreground" };

const vnd = (n: number) =>
  n >= 1_000_000
    ? `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}tr`
    : n >= 1_000
      ? `${Math.round(n / 1_000)}k`
      : n.toLocaleString("vi-VN");

const giaRo = (min: number, max: number) => (min <= 0 ? "—" : min === max ? vnd(min) : `${vnd(min)}–${vnd(max)}`);

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

          {data.listings && data.listings.length > 0 && (
            <div className="mt-4">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Danh sách listing</h3>
                <span className="text-xs text-muted-foreground">hết hàng xếp lên đầu</span>
              </div>
              <div className="overflow-hidden rounded-xl border border-border bg-card">
                <div className="max-h-[420px] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-muted/90 text-left text-muted-foreground backdrop-blur">
                      <tr>
                        <th scope="col" className="px-3 py-2.5 font-medium">Sản phẩm</th>
                        <th scope="col" className="px-3 py-2.5 text-right font-medium">Biến thể</th>
                        <th scope="col" className="px-3 py-2.5 text-right font-medium">Giá rổ</th>
                        <th scope="col" className="px-3 py-2.5 text-right font-medium">Kho</th>
                        <th scope="col" className="px-3 py-2.5 text-right font-medium">Trạng thái</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.listings.map((it) => {
                        const tt = trangThai(it.status);
                        return (
                          <tr key={it.item_id} className="transition-colors hover:bg-muted/30">
                            <td className="px-3 py-2.5 text-foreground">
                              <span className="line-clamp-2">{it.name}</span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-right text-foreground">
                              {it.variantCount > 0 ? it.variantCount.toLocaleString("vi-VN") : "—"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-right font-semibold text-gold">
                              {giaRo(it.priceMin, it.priceMax)}
                            </td>
                            <td
                              className={cn(
                                "whitespace-nowrap px-3 py-2.5 text-right font-semibold",
                                it.stock <= 0 ? "text-primary" : "text-foreground",
                              )}
                            >
                              {it.stock.toLocaleString("vi-VN")}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2.5 text-right">
                              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", tt.cls)}>{tt.label}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">
                “Giá rổ” = khoảng giá các biến thể · kho ô đỏ = hết hàng. Bấm “Quản lý Shopee” để mở/sao chép link từng listing.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
