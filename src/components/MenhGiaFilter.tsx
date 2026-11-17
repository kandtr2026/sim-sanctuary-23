"use client";

import { useCallback, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Filter, MessageCircle } from "lucide-react";
import SIMCardNew from "@/components/SIMCardNew";
import type { NormalizedSIM } from "@/lib/simUtils";
import { cauDemMenhGia, formatGia, giaLabel, giaNutDangChon, GIA_FILTERS, parseGia } from "@/lib/giaParam";
import type { KieuTrangMenh } from "@/lib/menhGia";

/**
 * Bộ lọc MỨC GIÁ cho trang mệnh (/sim-theo-menh/[hanh], /sim-hop-menh/[hanh]).
 *
 * SEO: trang vẫn prerender/ISR như cũ, server KHÔNG đọc `?gia=` (đọc searchParams
 * ở page sẽ biến trang thành dynamic). Khoảng giá chỉ đọc ở client SAU hydrate
 * (useSyncExternalStore: server snapshot = "" → HTML đầu giống hệt bản không có
 * `gia`), rồi lọc toàn kho qua /api/sim-menh. Canonical vẫn là trang không query.
 *
 * URL: bấm nút → history.replaceState(`?gia=5-10`) — Next đồng bộ với router
 * (usePageVisitTracker vẫn thấy URL mới), link chia sẻ / Google Ads mở lại đúng
 * khoảng giá.
 */

const GIA_EVENT = "chonso:gia-change";

const subscribe = (cb: () => void) => {
  window.addEventListener("popstate", cb);
  window.addEventListener(GIA_EVENT, cb);
  return () => {
    window.removeEventListener("popstate", cb);
    window.removeEventListener(GIA_EVENT, cb);
  };
};
const getSnapshot = () => new URLSearchParams(window.location.search).get("gia") ?? "";
const getServerSnapshot = () => "";

/** Khoảng giá đang chọn (chỉ số PRICE_RANGES) đọc từ `?gia=`, kèm hàm đổi. */
export function useGiaParam(): [number[], (ranges: readonly number[]) => void] {
  const raw = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ranges = useMemo(() => parseGia(raw), [raw]);
  const setRanges = useCallback((next: readonly number[]) => {
    const url = new URL(window.location.href);
    const gia = formatGia(next);
    if (gia) url.searchParams.set("gia", gia);
    else url.searchParams.delete("gia");
    // Giữ dấu phẩy dễ đọc trên URL (?gia=3-5,5-10 thay vì 3-5%2C5-10).
    const search = url.searchParams.toString().replace(/%2C/gi, ",");
    window.history.replaceState(null, "", `${url.pathname}${search ? `?${search}` : ""}${url.hash}`);
    window.dispatchEvent(new Event(GIA_EVENT));
  }, []);
  return [ranges, setRanges];
}

/** Hàng nút "Mức giá" — cùng bộ nút với CategorySimGrid. */
export function GiaFilterRow({
  ranges,
  onChange,
  className = "",
}: {
  ranges: readonly number[];
  onChange: (ranges: readonly number[]) => void;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-border/60 bg-muted/40 p-3.5 ${className}`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <span className="flex min-w-[70px] items-center gap-1 text-xs font-semibold text-muted-foreground">
          <Filter className="h-3 w-3" aria-hidden /> Mức giá:
        </span>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Lọc theo mức giá">
          {GIA_FILTERS.map((item) => {
            const active = giaNutDangChon(item.ranges, ranges);
            return (
              <button
                key={item.label}
                type="button"
                aria-pressed={active}
                onClick={() => onChange(item.ranges)}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  active
                    ? "bg-primary font-bold text-primary-foreground shadow-sm"
                    : "border border-border/80 bg-background text-foreground/80 hover:bg-muted"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE = 60;

type Page = { items: NormalizedSIM[]; scores: number[]; total: number };

/**
 * Kết quả lọc mệnh + giá trên toàn kho (xếp theo điểm phong thủy), có "Xem thêm".
 * Chỉ mount khi đã chọn khoảng giá.
 */
export function MenhGiaResults({
  hanhSlug,
  hanh,
  kieu,
  ranges,
  zaloHref,
}: {
  hanhSlug: string;
  hanh: string;
  kieu: KieuTrangMenh;
  ranges: readonly number[];
  zaloHref: string;
}) {
  const gia = formatGia(ranges) ?? "";
  const { data, isPending, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery<Page>({
    queryKey: ["sim-menh-gia", kieu, hanhSlug, gia],
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const qs = new URLSearchParams({ hanh: hanhSlug, kieu, gia, limit: String(PAGE_SIZE), offset: String(pageParam) });
      const res = await fetch(`/api/sim-menh?${qs.toString().replace(/%2C/gi, ",")}`);
      if (!res.ok) throw new Error(`/api/sim-menh HTTP ${res.status}`);
      return res.json();
    },
    getNextPageParam: (last, all) => {
      const loaded = all.reduce((n, p) => n + p.items.length, 0);
      return loaded < last.total && last.items.length > 0 ? loaded : undefined;
    },
    staleTime: 60_000,
  });

  const items = data?.pages.flatMap((p) => p.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  if (isPending) {
    return (
      <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground" aria-live="polite">
        Đang lọc số hợp mệnh {hanh} giá {giaLabel(ranges)}…
      </p>
    );
  }

  if (isError || items.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        {isError ? "Chưa tải được kho, Quý khách thử lại sau ít phút, hoặc " : `Kho tạm chưa có số hợp mệnh ${hanh} giá ${giaLabel(ranges)}. Quý khách chọn mức giá khác, hoặc `}
        <a href={zaloHref} target="_blank" rel="noopener noreferrer" className="font-semibold text-sky-500 hover:underline">
          <MessageCircle className="mb-0.5 mr-0.5 inline h-3.5 w-3.5" />nhắn Zalo
        </a>{" "}
        để em tìm giúp.
      </p>
    );
  }

  return (
    <div>
      <p className="mb-3 text-sm font-semibold text-foreground" aria-live="polite">
        {cauDemMenhGia(total, hanh, ranges)}
        <span className="font-normal text-muted-foreground"> — xếp theo điểm phong thủy cao nhất.</span>
      </p>
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-3 lg:grid-cols-4">
        {items.map((s) => (
          <SIMCardNew key={s.id} sim={s} />
        ))}
      </div>
      <div className="mt-4 flex flex-col items-center gap-1.5">
        <p className="text-xs text-muted-foreground">
          Đang hiện {items.length.toLocaleString("vi-VN")} / {total.toLocaleString("vi-VN")} số
        </p>
        {hasNextPage && (
          <button
            type="button"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
            className="rounded-lg border border-primary px-5 py-2 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
          >
            {isFetchingNextPage ? "Đang tải…" : "Xem thêm"}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Khối kho số có hàng nút "Mức giá" cho trang dựng bảng ở server
 * (/sim-hop-menh/[hanh]). Chưa chọn giá → render nguyên `children` (bảng server,
 * kèm JSON-LD — y như cũ). Chọn giá → thay bằng kết quả lọc toàn kho.
 */
export function MenhGiaSection({
  hanhSlug,
  hanh,
  kieu,
  zaloHref,
  children,
}: {
  hanhSlug: string;
  hanh: string;
  kieu: KieuTrangMenh;
  zaloHref: string;
  children?: ReactNode;
}) {
  const [ranges, setRanges] = useGiaParam();
  return (
    <>
      <GiaFilterRow className="mb-4" ranges={ranges} onChange={setRanges} />
      {ranges.length > 0 ? (
        <MenhGiaResults hanhSlug={hanhSlug} hanh={hanh} kieu={kieu} ranges={ranges} zaloHref={zaloHref} />
      ) : (
        children
      )}
    </>
  );
}
