"use client";

import { useEffect, useMemo, useState } from "react";
import { BookOpen, ExternalLink, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PostRow } from "@/components/admin/PostsTable";

type Period = "day" | "month";

interface ReadsData {
  total: number;
  daily: { day: string; count: number }[];
  byPost: { slug: string; count: number }[];
  truncated: boolean;
}

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "day", label: "14 ngày" },
  { value: "month", label: "6 tháng" },
];

/** "Hôm nay" theo giờ VN, biểu diễn bằng một Date mà các trường UTC = giờ VN. */
const nowVn = () => new Date(Date.now() + 7 * 3600 * 1000);

interface Bar {
  key: string;
  count: number;
  label: string;
  height: number;
}

/**
 * Thống kê LƯỢT ĐỌC bài viết theo thời gian + bài đọc nhiều nhất (góp ý #18, #19
 * — "theo dõi hiệu quả bài viết"). Nguồn: /api/admin/post-reads gom từ
 * page_visits path `/tin-tuc/*`. Cần token admin (bảng chỉ admin đọc).
 */
export function PostReadsSection({ posts, token }: { posts: PostRow[]; token?: string }) {
  const [data, setData] = useState<ReadsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>("day");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!token) return; // chờ có phiên admin
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/admin/post-reads", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: ReadsData) => {
        if (!cancelled) setData(d);
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

  const titleBySlug = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of posts) m.set(p.slug, p.title);
    return m;
  }, [posts]);

  const bars = useMemo<Bar[]>(() => {
    const daily = data?.daily ?? [];
    const byDay = new Map(daily.map((d) => [d.day, d.count]));
    const base = nowVn();

    if (period === "day") {
      const anchors: string[] = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(base);
        d.setUTCDate(d.getUTCDate() - i);
        anchors.push(d.toISOString().slice(0, 10));
      }
      const counts = anchors.map((a) => byDay.get(a) ?? 0);
      const max = Math.max(1, ...counts);
      return anchors.map((a, i) => ({
        key: a,
        count: counts[i],
        label: `${a.slice(8, 10)}/${a.slice(5, 7)}`,
        height: counts[i] === 0 ? 2 : Math.max(8, Math.round((counts[i] / max) * 85)),
      }));
    }

    const anchors: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth() - i, 1));
      anchors.push(d.toISOString().slice(0, 7));
    }
    const counts = anchors.map((m) =>
      daily.filter((d) => d.day.startsWith(m)).reduce((s, d) => s + d.count, 0),
    );
    const max = Math.max(1, ...counts);
    return anchors.map((m, i) => ({
      key: m,
      count: counts[i],
      label: `${m.slice(5, 7)}/${m.slice(2, 4)}`,
      height: counts[i] === 0 ? 2 : Math.max(8, Math.round((counts[i] / max) * 85)),
    }));
  }, [data, period]);

  const topPosts = (data?.byPost ?? []).slice(0, 10);
  const total = data?.total ?? 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <BookOpen className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Lượt đọc bài viết</h3>
            <p className="text-xs text-muted-foreground">
              {loading
                ? "Đang tải…"
                : `${total.toLocaleString("vi-VN")} lượt đọc /tin-tuc trong ${period === "day" ? "14 ngày" : "6 tháng"} · nguồn page_visits`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border bg-muted p-0.5">
            {PERIOD_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                onClick={() => setPeriod(o.value)}
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
          <p className="text-sm text-muted-foreground">Không tải được lượt đọc: {error}</p>
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
      ) : total === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Chưa có lượt đọc nào. Dữ liệu tự ghi khi khách (không đăng nhập) xem bài trên /tin-tuc.
        </p>
      ) : (
        <>
          <div className="flex h-40 items-end gap-1" role="img" aria-label={`Lượt đọc bài viết theo ${period === "day" ? "ngày" : "tháng"}`}>
            {bars.map((bar) => (
              <div key={bar.key} className="relative flex-1 self-end" style={{ height: `${bar.height}%` }}>
                {bar.count > 0 ? (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] font-semibold text-foreground">
                    {bar.count}
                  </span>
                ) : null}
                <div
                  title={`${bar.label}: ${bar.count} lượt đọc`}
                  className={cn("h-full w-full rounded-t-md", bar.count === 0 ? "bg-muted" : "bg-primary")}
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

          {topPosts.length > 0 ? (
            <div className="mt-6">
              <h4 className="mb-2 text-sm font-semibold text-foreground">Bài đọc nhiều nhất</h4>
              <div className="divide-y divide-border">
                {topPosts.map((p, i) => (
                  <a
                    key={p.slug}
                    href={`/tin-tuc/${p.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center gap-3 py-2 text-sm transition-colors hover:bg-muted/40"
                  >
                    <span className="w-5 shrink-0 text-right text-xs font-semibold text-muted-foreground">{i + 1}</span>
                    <span className="flex min-w-0 flex-1 items-center gap-1.5">
                      <span className="truncate text-foreground">{titleBySlug.get(p.slug) ?? p.slug}</span>
                      <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </span>
                    <span className="shrink-0 font-semibold text-primary">{p.count.toLocaleString("vi-VN")}</span>
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          {data?.truncated ? (
            <p className="mt-3 text-[11px] text-muted-foreground">* Dữ liệu bị cắt bớt (quá nhiều lượt đọc trong cửa sổ 180 ngày).</p>
          ) : null}
        </>
      )}
    </div>
  );
}
