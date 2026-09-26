"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronRight, Globe, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type PageVisitRow = Tables<"page_visits">;

const SOURCE_LABELS: Record<string, { label: string; color: string }> = {
  facebook: { label: "Facebook", color: "bg-blue-500/15 text-blue-400" },
  tiktok: { label: "TikTok", color: "bg-neutral-300/15 text-neutral-200" },
  google: { label: "Google", color: "bg-red-500/15 text-red-400" },
  zalo: { label: "Zalo", color: "bg-sky-500/15 text-sky-400" },
  instagram: { label: "Instagram", color: "bg-pink-500/15 text-pink-400" },
  youtube: { label: "YouTube", color: "bg-red-600/15 text-red-500" },
  telegram: { label: "Telegram", color: "bg-sky-600/15 text-sky-500" },
  linkedin: { label: "LinkedIn", color: "bg-blue-700/15 text-blue-500" },
  bing: { label: "Bing", color: "bg-teal-500/15 text-teal-400" },
  coccoc: { label: "Cốc Cốc", color: "bg-orange-500/15 text-orange-400" },
  pinterest: { label: "Pinterest", color: "bg-red-400/15 text-red-400" },
  twitter: { label: "Twitter/X", color: "bg-neutral-400/15 text-neutral-300" },
  direct: { label: "Trực tiếp / không rõ", color: "bg-emerald-500/15 text-emerald-400" },
  internal: { label: "Nội bộ", color: "bg-primary/15 text-primary" },
  other: { label: "Khác", color: "bg-muted text-muted-foreground" },
};

const Skeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <div className="h-3 w-2/5 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/5 animate-pulse rounded bg-muted" />
        <div className="ml-auto h-3 w-16 animate-pulse rounded bg-muted" />
      </div>
    ))}
  </div>
);

/**
 * `khachThat` (mặc định true) = đọc view `page_visits_khach` (đã bỏ nội bộ + bot,
 * lọc ở DB bằng is_internal_visit); false = bảng gốc `page_visits`. Công tắc nằm
 * ở VisitTrendSection, trang tab Traffic truyền xuống.
 */
export function PageVisitsSection({
  khachThat = true,
  reloadSignal = 0,
}: {
  khachThat?: boolean;
  /** Đổi giá trị để buộc tải lại (vd. sau khi sửa danh sách IP nội bộ). */
  reloadSignal?: number;
} = {}) {
  const [visits, setVisits] = useState<PageVisitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // IP đang mở xem chi tiết các màn khách đó đã lướt.
  const [expandedIp, setExpandedIp] = useState<string | null>(null);

  // Chỉ nhận kết quả của lần tải MỚI NHẤT: bật/tắt công tắc nhanh thì query view
  // (chậm hơn) về sau không được đè dữ liệu của chế độ đang chọn.
  const loadSeq = useRef(0);

  const load = async () => {
    const seq = ++loadSeq.current;
    setLoading(true);
    setError(null);
    try {
      // View *_khach cùng cột bảng gốc → giữ kiểu Row của bảng gốc (view có id nullable).
      const nguon: string = khachThat ? "page_visits_khach" : "page_visits";
      const { data, error: err } = await supabase
        .from(nguon as "page_visits")
        .select("*")
        .order("visited_at", { ascending: false })
        .limit(200);

      if (seq !== loadSeq.current) return;
      if (err) {
        setError(err.message);
      } else {
        setVisits(data ?? []);
      }
    } catch {
      if (seq !== loadSeq.current) return;
      setError("Không thể tải dữ liệu");
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load đọc khachThat mới nhất
  }, [khachThat, reloadSignal]);

  // Aggregate the fetched rows by source so the admin sees "khách đến từ đâu".
  const sourceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of visits) {
      const key = v.source || "other";
      counts[key] = (counts[key] ?? 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [visits]);

  // Gom theo IP: mỗi IP = 1 khách. Đếm lượt xem + số màn khác nhau, khách xem
  // nhiều nhất lên đầu — để A Khoa thấy ai đang lướt nhiều số mà tư vấn.
  const visitorsByIp = useMemo(() => {
    const map = new Map<string, PageVisitRow[]>();
    for (const v of visits) {
      const key = v.ip || "";
      const arr = map.get(key);
      if (arr) arr.push(v);
      else map.set(key, [v]);
    }
    return Array.from(map.entries())
      .map(([ip, vs]) => ({
        ip,
        visits: vs, // đã sắp mới→cũ theo fetch
        count: vs.length,
        screens: new Set(vs.map((x) => x.path)).size,
        lastAt: vs[0]?.visited_at ?? "",
        source: vs[0]?.source || "other",
      }))
      .sort((a, b) => b.count - a.count || b.screens - a.screens);
  }, [visits]);

  const total = visits.length;

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Globe className="h-4 w-4 text-primary" />
          Trang khách đã xem
          <span
            className={cn(
              "rounded px-1.5 py-0.5 text-[10px] font-semibold",
              khachThat ? "bg-emerald-500/15 text-emerald-400" : "bg-muted text-muted-foreground",
            )}
          >
            {khachThat ? "Chỉ khách thật" : "Gồm nội bộ/bot"}
          </span>
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
      ) : visits.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-12 text-center shadow-card">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Globe className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">Chưa có lượt xem nào</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Dữ liệu sẽ xuất hiện sau khi có khách truy cập trang.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* Khách theo IP — mỗi IP = 1 khách, xem nhiều màn nhất lên đầu */}
          <div className="mb-4 rounded-xl border border-border bg-card p-4 shadow-card">
            <h3 className="mb-1 text-sm font-semibold text-foreground">Khách theo IP</h3>
            <p className="mb-3 text-xs text-muted-foreground">
              {visitorsByIp.length.toLocaleString("vi-VN")} khách · bấm để xem khách đã lướt màn nào (tư vấn)
            </p>
            <div className="divide-y divide-border">
              {visitorsByIp.slice(0, 20).map((vtr) => {
                const meta = SOURCE_LABELS[vtr.source] ?? SOURCE_LABELS.other;
                const open = expandedIp === (vtr.ip || "unknown");
                return (
                  <div key={vtr.ip || "unknown"}>
                    <button
                      type="button"
                      onClick={() => setExpandedIp(open ? null : vtr.ip || "unknown")}
                      className="flex w-full items-center gap-2 py-2 text-left"
                    >
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                          open && "rotate-90",
                        )}
                      />
                      <span className="truncate font-mono text-xs text-foreground">
                        {vtr.ip || "Chưa rõ IP"}
                      </span>
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${meta.color}`}>
                        {meta.label}
                      </span>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">{vtr.screens} màn</span>
                      <span className="w-16 shrink-0 text-right text-sm font-bold text-primary">
                        {vtr.count} lượt
                      </span>
                    </button>
                    {open ? (
                      <ul className="mb-2 ml-6 space-y-1 border-l border-border pl-3">
                        {vtr.visits.map((v) => (
                          <li key={v.id} className="flex items-center justify-between gap-3 text-xs">
                            <span className="truncate font-mono text-foreground">{v.path}</span>
                            <span className="shrink-0 text-muted-foreground">
                              {new Date(v.visited_at).toLocaleString("vi-VN")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </div>
            {visitorsByIp.length === 0 ? (
              <p className="py-2 text-xs text-muted-foreground">Chưa có dữ liệu IP (lượt xem mới sẽ có).</p>
            ) : null}
          </div>

          {/* Khách đến từ đâu — aggregated over the last visits */}
          <div className="mb-4 rounded-xl border border-border bg-card p-4 shadow-card">
            <h3 className="mb-3 text-sm font-semibold text-foreground">Khách đến từ đâu</h3>
            <div className="flex flex-wrap gap-2">
              {sourceCounts.map(([source, count]) => {
                const meta = SOURCE_LABELS[source] ?? SOURCE_LABELS.other;
                const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                return (
                  <span
                    key={source}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs"
                  >
                    <span className={`rounded px-1.5 py-0.5 font-semibold ${meta.color}`}>
                      {meta.label}
                    </span>
                    <span className="font-bold text-foreground">{count}</span>
                    <span className="text-muted-foreground">({pct}%)</span>
                  </span>
                );
              })}
            </div>
            <p className="mt-3 border-t border-border pt-2 text-xs leading-relaxed text-muted-foreground">
              <b className="text-foreground">Trực tiếp / không rõ</b>: trình duyệt không gửi nguồn — gõ tay/lưu link,
              mở từ app (Zalo/Facebook/TikTok in-app hay nuốt nguồn), hoặc Google bị mất referrer.{" "}
              <b className="text-foreground">Nội bộ</b>: bấm từ một trang khác ngay trong web sang.{" "}
              <b className="text-foreground">Google/Facebook…</b>: có referrer từ nơi đó. Nguồn tính theo{" "}
              <b className="text-foreground">lần khách vào web đầu tiên</b> trong phiên. Muốn chắc nguồn 100% thì gắn UTM
              vào link mình đăng (Ads/Facebook/TikTok).
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left text-muted-foreground">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Đường dẫn</th>
                  <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Nguồn</th>
                  <th className="hidden px-4 py-2.5 font-medium md:table-cell">Referrer</th>
                  <th className="px-4 py-2.5 font-medium">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visits.slice(0, 50).map((visit) => {
                  const srcMeta = SOURCE_LABELS[visit.source || "other"] ?? SOURCE_LABELS.other;
                  return (
                    <tr key={visit.id} className="transition-colors hover:bg-muted/30">
                      <td className="max-w-[200px] truncate px-4 py-2.5 font-mono text-xs text-foreground">
                        {visit.path}
                      </td>
                      <td className="hidden px-4 py-2.5 sm:table-cell">
                        <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${srcMeta.color}`}>
                          {srcMeta.label}
                        </span>
                      </td>
                      <td className="hidden max-w-[160px] truncate px-4 py-2.5 text-xs text-muted-foreground md:table-cell md:max-w-[200px]">
                        {visit.referrer || "—"}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">
                        {new Date(visit.visited_at).toLocaleString("vi-VN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
              Hiển thị {Math.min(visits.length, 50)}/{visits.length} lượt gần nhất — tự động ghi khi khách đổi trang.
            </div>
          </div>
        </>
      )}
    </section>
  );
}