"use client";

import { useEffect, useMemo, useState } from "react";
import { MousePointerClick, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type ConversionClickRow = Tables<"conversion_clicks">;

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  zalo: { label: "Zalo", color: "bg-sky-500/15 text-sky-400" },
  call: { label: "Gọi điện", color: "bg-emerald-500/15 text-emerald-400" },
  messenger: { label: "Messenger", color: "bg-blue-500/15 text-blue-400" },
};

const POSITION_LABELS: Record<string, string> = {
  header: "Header",
  card: "Card SIM",
  floating: "Nút nổi",
  "sticky-bar": "Thanh dưới",
  dialog: "Popup",
  other: "Khác",
};

const DEVICE_LABELS: Record<string, string> = {
  mobile: "Mobile",
  desktop: "Desktop",
  tablet: "Tablet",
};

const Skeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <div className="h-3 w-2/5 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/5 animate-pulse rounded bg-muted" />
        <div className="ml-auto h-3 w-16 animate-pulse rounded bg-muted" />
      </div>
    ))}
  </div>
);

export function ConversionsSection() {
  const [clicks, setClicks] = useState<ConversionClickRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("conversion_clicks")
        .select("*")
        .order("clicked_at", { ascending: false })
        .limit(50);

      if (err) {
        setError(err.message);
      } else {
        setClicks(data ?? []);
      }
    } catch {
      setError("Không thể tải dữ liệu");
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of clicks) {
      counts[c.type] = (counts[c.type] ?? 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [clicks]);

  const total = clicks.length;

  // T10 — bảng đo ma sát theo vị trí CTA và thiết bị (giúp quyết định đặt
  // nút Zalo đâu, có cần mobile bar không).
  const byPosition = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of clicks) {
      const p = c.position || "other";
      counts[p] = (counts[p] ?? 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [clicks]);

  const byDevice = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of clicks) {
      const d = c.device || "unknown";
      counts[d] = (counts[d] ?? 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [clicks]);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <MousePointerClick className="h-4 w-4 text-primary" />
          Chuyển đổi (click liên hệ)
        </h2>
        <button
          onClick={() => void load()}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Làm mới
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <Skeleton />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-6 py-10 text-center shadow-card">
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={() => void load()}
            className="text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            Thử lại
          </button>
        </div>
      ) : clicks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-12 text-center shadow-card">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <MousePointerClick className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">Chưa có lượt click liên hệ nào</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Dữ liệu sẽ xuất hiện sau khi khách bấm Zalo / Gọi / Messenger trên trang.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Tổng quan theo loại */}
          <div className="mb-4 rounded-xl border border-border bg-card p-4 shadow-card">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Tổng quan</h3>
            <div className="flex flex-wrap gap-2">
              {typeCounts.map(([type, count]) => {
                const meta = TYPE_LABELS[type] ?? { label: type, color: "bg-muted text-muted-foreground" };
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <span
                    key={type}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs"
                  >
                    <span className={`rounded px-1.5 py-0.5 font-semibold ${meta.color}`}>{meta.label}</span>
                    <span className="font-bold text-foreground">{count}</span>
                    <span className="text-muted-foreground">({pct}%)</span>
                  </span>
                );
              })}
            </div>

            {/* T10 — đo ma sát: click theo vị trí CTA + thiết bị. Cột này trống
                cho dữ liệu cũ (ghi từ 2026-09-02). */}
            {byPosition.some(([, c]) => c > 0) && (
              <>
                <h4 className="mt-4 mb-2 text-xs font-semibold text-muted-foreground">Theo vị trí nút</h4>
                <div className="flex flex-wrap gap-2">
                  {byPosition.map(([pos, count]) => {
                    const label = POSITION_LABELS[pos] ?? pos;
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <span
                        key={pos}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs"
                      >
                        <span className="rounded bg-muted px-1.5 py-0.5 font-semibold text-muted-foreground">{label}</span>
                        <span className="font-bold text-foreground">{count}</span>
                        <span className="text-muted-foreground">({pct}%)</span>
                      </span>
                    );
                  })}
                </div>
              </>
            )}
            {byDevice.some(([, c]) => c > 0) && (
              <>
                <h4 className="mt-4 mb-2 text-xs font-semibold text-muted-foreground">Theo thiết bị</h4>
                <div className="flex flex-wrap gap-2">
                  {byDevice.map(([dev, count]) => {
                    const label = DEVICE_LABELS[dev] ?? dev;
                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                    return (
                      <span
                        key={dev}
                        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs"
                      >
                        <span className="rounded bg-muted px-1.5 py-0.5 font-semibold text-muted-foreground">{label}</span>
                        <span className="font-bold text-foreground">{count}</span>
                        <span className="text-muted-foreground">({pct}%)</span>
                      </span>
                    );
                  })}
                </div>
              </>
            )}
          </div>

          {/* Bảng click gần nhất */}
          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Loại</th>
                  <th className="px-4 py-2.5 font-medium">Trang click</th>
                  <th className="hidden px-4 py-2.5 font-medium lg:table-cell">Vị trí</th>
                  <th className="hidden px-4 py-2.5 font-medium md:table-cell">Số SIM</th>
                  <th className="px-4 py-2.5 font-medium">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {clicks.map((click) => {
                  const meta = TYPE_LABELS[click.type] ?? { label: click.type, color: "bg-muted text-muted-foreground" };
                  return (
                    <tr key={click.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-4 py-2.5">
                        <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${meta.color}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="max-w-[200px] truncate px-4 py-2.5 font-mono text-xs text-foreground">
                        {click.path}
                      </td>
                      <td className="hidden px-4 py-2.5 text-xs text-muted-foreground lg:table-cell">
                        {POSITION_LABELS[click.position || ""] ?? click.position ?? "—"}
                        {click.variant ? ` (${click.variant})` : ""}
                      </td>
                      <td className="hidden px-4 py-2.5 font-mono text-xs text-muted-foreground md:table-cell">
                        {click.sim_number || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">
                        {new Date(click.clicked_at).toLocaleString("vi-VN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
              {clicks.length} click gần nhất — tự động ghi khi khách bấm nút liên hệ.
            </div>
          </div>
        </>
      )}
    </section>
  );
}