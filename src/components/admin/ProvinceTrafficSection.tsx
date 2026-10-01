"use client";

import { useEffect, useState } from "react";
import { MapPin, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CHUA_XAC_DINH,
  NHOM_PHU,
  VN_CHUA_RO,
  type LuotKhach,
  type TinhHomNay,
  type TinhThongKe,
} from "@/lib/vnProvince";

const laNhomPhu = (t: string) => (NHOM_PHU as readonly string[]).includes(t);

/** "today" = view Hôm nay vs Hôm qua (A Khoa 01/10); số = N ngày lịch gần nhất. */
type Khoang = "today" | 7 | 14 | 30 | 90;
const KHOANG: { v: Khoang; label: string }[] = [
  { v: "today", label: "Hôm nay" },
  { v: 7, label: "7 ngày" },
  { v: 14, label: "14 ngày" },
  { v: 30, label: "30 ngày" },
  { v: 90, label: "90 ngày" },
];

interface GeoData {
  days: number;
  tong: number;
  tinh: TinhThongKe[];
}
interface TodayData {
  view: "today";
  gio: string;
  tong: { homNay: LuotKhach; homQuaCungGio: LuotKhach; homQua: LuotKhach };
  tinh: TinhHomNay[];
}

const so = (n: number) => n.toLocaleString("vi-VN");

/** Chênh hôm nay so với hôm qua cùng giờ: +N xanh / −N đỏ, kèm % khi có mốc. */
function Chenh({ homNay, moc }: { homNay: number; moc: number }) {
  const d = homNay - moc;
  if (d === 0) return <span className="text-muted-foreground">0</span>;
  const pct = moc > 0 ? ` (${d > 0 ? "+" : "−"}${Math.round((Math.abs(d) / moc) * 100)}%)` : "";
  return (
    <span className={cn("font-semibold", d > 0 ? "text-emerald-400" : "text-red-400")}>
      {d > 0 ? "+" : "−"}
      {so(Math.abs(d))}
      <span className="font-normal opacity-80">{pct}</span>
    </span>
  );
}

function TenTinh({ t, chiTiet }: { t: string; chiTiet: { tinhCu: string; luot: number }[] }) {
  const phu = laNhomPhu(t);
  const gop = chiTiet.length > 1 || (chiTiet[0] && chiTiet[0].tinhCu !== t);
  return (
    <>
      <span className={cn("font-medium", phu ? "text-muted-foreground" : "text-foreground")}>{t}</span>
      {gop ? (
        <span className="mt-0.5 block text-[11px] text-muted-foreground">
          gồm {chiTiet.map((c) => `${c.tinhCu} ${so(c.luot)}`).join(" · ")}
        </span>
      ) : null}
    </>
  );
}

/**
 * Traffic theo TỈNH/THÀNH (A Khoa 30/09). Vị trí suy từ IP lúc ghi lượt xem
 * (header geo của Vercel; dữ liệu cũ điền bù bằng GeoIP offline), gộp về 34
 * tỉnh/thành từ 01/07/2025. `khachThat` dùng chung công tắc với các khu khác.
 */
export function ProvinceTrafficSection({
  token,
  khachThat = true,
  reloadSignal = 0,
}: {
  token?: string;
  khachThat?: boolean;
  reloadSignal?: number;
}) {
  const [khoang, setKhoang] = useState<Khoang>(14);
  const [data, setData] = useState<GeoData | TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!token) return;
    let bo = false;
    setLoading(true);
    setError(null);
    const q = khoang === "today" ? "view=today" : `days=${khoang}`;
    fetch(`/api/admin/visit-geo?${q}${khachThat ? "" : "&all=1"}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error || `HTTP ${res.status}`);
        }
        return (await res.json()) as GeoData | TodayData;
      })
      .then((d) => { if (!bo) setData(d); })
      .catch((e: unknown) => { if (!bo) setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu"); })
      .finally(() => { if (!bo) setLoading(false); });
    return () => { bo = true; };
  }, [token, khoang, khachThat, reloadKey, reloadSignal]);

  // Dữ liệu vừa đổi chế độ có thể còn là hình của chế độ cũ → chỉ vẽ khi khớp hình.
  const homNay = khoang === "today" && data && "view" in data ? data : null;
  const theoNgay = khoang !== "today" && data && "days" in data ? data : null;
  const loc = khachThat ? "chỉ khách thật" : "gồm nội bộ/bot";

  const tinhList: { tinh: string }[] = homNay?.tinh ?? theoNgay?.tinh ?? [];
  const tinhCoKhach = tinhList.filter((t) => !laNhomPhu(t.tinh)).length;
  const coNhom = (ten: string) => tinhList.some((t) => t.tinh === ten);

  const moTa = loading && !homNay && !theoNgay
    ? "Đang tải…"
    : homNay
      ? `Hôm nay ${so(homNay.tong.homNay.luot)} lượt (tới ${homNay.gio}) · hôm qua cùng giờ ${so(homNay.tong.homQuaCungGio.luot)} · cả ngày hôm qua ${so(homNay.tong.homQua.luot)} · ${loc}`
      : theoNgay
        ? `${so(theoNgay.tong)} lượt trong ${theoNgay.days} ngày · ${tinhCoKhach} tỉnh/thành có khách · ${loc}`
        : "Đang tải…";

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <MapPin className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Traffic theo tỉnh/thành</h3>
            <p className="text-xs text-muted-foreground">{moTa}</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-border p-0.5">
            {KHOANG.map((k) => (
              <button
                key={k.v}
                type="button"
                onClick={() => setKhoang(k.v)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  khoang === k.v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {k.label}
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
          <p className="text-sm text-muted-foreground">Không tải được traffic theo tỉnh: {error}</p>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="text-sm font-medium text-primary hover:underline">
            Thử lại
          </button>
        </div>
      ) : !homNay && !theoNgay ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Đang tải…</p>
      ) : tinhList.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          {homNay ? "Hôm nay và hôm qua chưa có lượt truy cập." : `Chưa có lượt truy cập trong ${theoNgay?.days} ngày.`}
        </p>
      ) : homNay ? (
        <div className={cn("overflow-x-auto", loading && "opacity-60 transition-opacity")}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="w-8 py-2 pr-2 font-medium">#</th>
                <th className="py-2 pr-3 font-medium">Tỉnh/thành</th>
                <th className="py-2 pr-3 text-right font-medium">Hôm nay</th>
                <th className="py-2 pr-3 text-right font-medium">Hôm qua cùng giờ</th>
                <th className="py-2 pr-3 text-right font-medium">Chênh</th>
                <th className="hidden py-2 text-right font-medium sm:table-cell">Hôm qua cả ngày</th>
              </tr>
            </thead>
            <tbody>
              {homNay.tinh.map((t, i) => {
                const phu = laNhomPhu(t.tinh);
                return (
                  <tr key={t.tinh} className={cn("border-b border-border/50", phu && "text-muted-foreground")}>
                    <td className="py-2 pr-2 text-xs tabular-nums text-muted-foreground">{phu ? "" : i + 1}</td>
                    <td className="py-2 pr-3">
                      <TenTinh t={t.tinh} chiTiet={t.chiTiet} />
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      <span className="font-semibold">{so(t.homNay.luot)}</span>
                      <span className="ml-1 text-[11px] text-muted-foreground">· {so(t.homNay.khach)} khách</span>
                    </td>
                    <td className="py-2 pr-3 text-right tabular-nums">{so(t.homQuaCungGio.luot)}</td>
                    <td className="py-2 pr-3 text-right tabular-nums">
                      <Chenh homNay={t.homNay.luot} moc={t.homQuaCungGio.luot} />
                    </td>
                    <td className="hidden py-2 text-right tabular-nums text-muted-foreground sm:table-cell">{so(t.homQua.luot)}</td>
                  </tr>
                );
              })}
              <tr className="font-semibold">
                <td />
                <td className="py-2 pr-3 text-foreground">Tổng</td>
                <td className="py-2 pr-3 text-right tabular-nums">{so(homNay.tong.homNay.luot)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">{so(homNay.tong.homQuaCungGio.luot)}</td>
                <td className="py-2 pr-3 text-right tabular-nums">
                  <Chenh homNay={homNay.tong.homNay.luot} moc={homNay.tong.homQuaCungGio.luot} />
                </td>
                <td className="hidden py-2 text-right tabular-nums text-muted-foreground sm:table-cell">{so(homNay.tong.homQua.luot)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : theoNgay ? (
        <div className={cn("overflow-x-auto", loading && "opacity-60 transition-opacity")}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="w-8 py-2 pr-2 font-medium">#</th>
                <th className="py-2 pr-3 font-medium">Tỉnh/thành</th>
                <th className="hidden py-2 pr-3 font-medium sm:table-cell">Tỷ trọng</th>
                <th className="py-2 pr-3 text-right font-medium">Lượt xem</th>
                <th className="py-2 text-right font-medium">Khách (IP)</th>
              </tr>
            </thead>
            <tbody>
              {theoNgay.tinh.map((t, i) => {
                const pct = theoNgay.tong > 0 ? (t.luot / theoNgay.tong) * 100 : 0;
                const phu = laNhomPhu(t.tinh);
                return (
                  <tr key={t.tinh} className={cn("border-b border-border/50 last:border-0", phu && "text-muted-foreground")}>
                    <td className="py-2 pr-2 text-xs tabular-nums text-muted-foreground">{phu ? "" : i + 1}</td>
                    <td className="py-2 pr-3">
                      <TenTinh t={t.tinh} chiTiet={t.chiTiet} />
                    </td>
                    <td className="hidden w-[40%] py-2 pr-3 sm:table-cell">
                      <div className="flex items-center gap-2">
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn("h-full rounded-full", phu ? "bg-muted-foreground/40" : "bg-primary")}
                            style={{ width: `${Math.max(pct, 0.5)}%` }}
                          />
                        </div>
                        <span className="w-12 text-right text-xs tabular-nums text-muted-foreground">
                          {pct.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%
                        </span>
                      </div>
                    </td>
                    <td className="py-2 pr-3 text-right font-semibold tabular-nums">{so(t.luot)}</td>
                    <td className="py-2 text-right tabular-nums">{so(t.khach)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        {homNay
          ? `"Hôm qua cùng giờ" = lượt hôm qua tính tới ${homNay.gio} — mốc so công bằng vì hôm nay chưa hết ngày. `
          : ""}
        Vị trí suy từ IP, gộp theo 34 tỉnh/thành từ 01/07/2025 (dòng "gồm …" là tỉnh cũ). IP 4G của nhà mạng hay báo về
        TP.HCM / Hà Nội nên các tỉnh khác có thể bị đếm thiếu — dùng để so sánh tương đối.
        {coNhom(VN_CHUA_RO) ? ` "${VN_CHUA_RO}" = IP Việt Nam mà CSDL vị trí chỉ biết tới quốc gia (hay gặp ở 4G).` : ""}
        {coNhom(CHUA_XAC_DINH) ? ` "${CHUA_XAC_DINH}" = lượt không có vị trí (trước 13/09 web chưa lưu IP).` : ""}
      </p>
    </div>
  );
}
