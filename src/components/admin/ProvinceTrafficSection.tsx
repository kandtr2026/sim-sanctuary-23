"use client";

import { useEffect, useState } from "react";
import { MapPin, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHUA_XAC_DINH, NHOM_PHU, VN_CHUA_RO, type TinhThongKe } from "@/lib/vnProvince";

const laNhomPhu = (t: string) => (NHOM_PHU as readonly string[]).includes(t);

const KHOANG = [7, 14, 30, 90] as const;

interface GeoData {
  days: number;
  tong: number;
  tinh: TinhThongKe[];
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
  const [days, setDays] = useState<number>(14);
  const [data, setData] = useState<GeoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!token) return;
    let bo = false;
    setLoading(true);
    setError(null);
    fetch(`/api/admin/visit-geo?days=${days}${khachThat ? "" : "&all=1"}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then(async (res) => {
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error || `HTTP ${res.status}`);
        }
        return (await res.json()) as GeoData;
      })
      .then((d) => { if (!bo) setData(d); })
      .catch((e: unknown) => { if (!bo) setError(e instanceof Error ? e.message : "Lỗi tải dữ liệu"); })
      .finally(() => { if (!bo) setLoading(false); });
    return () => { bo = true; };
  }, [token, days, khachThat, reloadKey, reloadSignal]);

  const tong = data?.tong ?? 0;
  const tinhCoKhach = (data?.tinh ?? []).filter((t) => !laNhomPhu(t.tinh));
  const khongViTri = data?.tinh.find((t) => t.tinh === CHUA_XAC_DINH)?.luot ?? 0;
  const vnChuaRo = data?.tinh.find((t) => t.tinh === VN_CHUA_RO)?.luot ?? 0;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <MapPin className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Traffic theo tỉnh/thành</h3>
            <p className="text-xs text-muted-foreground">
              {loading
                ? "Đang tải…"
                : `${tong.toLocaleString("vi-VN")} lượt trong ${days} ngày · ${tinhCoKhach.length} tỉnh/thành có khách · ${khachThat ? "chỉ khách thật" : "gồm nội bộ/bot"}`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-border p-0.5">
            {KHOANG.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  days === d ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {d} ngày
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
      ) : loading && !data ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Đang tải…</p>
      ) : !data || data.tinh.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Chưa có lượt truy cập trong {days} ngày.</p>
      ) : (
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
              {data.tinh.map((t, i) => {
                const pct = tong > 0 ? (t.luot / tong) * 100 : 0;
                const phu = laNhomPhu(t.tinh);
                const gop = t.chiTiet.length > 1 || (t.chiTiet[0] && t.chiTiet[0].tinhCu !== t.tinh);
                return (
                  <tr key={t.tinh} className={cn("border-b border-border/50 last:border-0", phu && "text-muted-foreground")}>
                    <td className="py-2 pr-2 text-xs tabular-nums text-muted-foreground">{phu ? "" : i + 1}</td>
                    <td className="py-2 pr-3">
                      <span className={cn("font-medium", phu ? "text-muted-foreground" : "text-foreground")}>{t.tinh}</span>
                      {gop ? (
                        <span className="mt-0.5 block text-[11px] text-muted-foreground">
                          gồm {t.chiTiet.map((c) => `${c.tinhCu} ${c.luot.toLocaleString("vi-VN")}`).join(" · ")}
                        </span>
                      ) : null}
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
                    <td className="py-2 pr-3 text-right font-semibold tabular-nums">{t.luot.toLocaleString("vi-VN")}</td>
                    <td className="py-2 text-right tabular-nums">{t.khach.toLocaleString("vi-VN")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Vị trí suy từ IP, gộp theo 34 tỉnh/thành từ 01/07/2025 (dòng "gồm …" là tỉnh cũ). IP 4G của nhà mạng hay báo về
        TP.HCM / Hà Nội nên các tỉnh khác có thể bị đếm thiếu — dùng để so sánh tương đối.
        {vnChuaRo > 0 ? ` "${VN_CHUA_RO}" = IP Việt Nam mà CSDL vị trí chỉ biết tới quốc gia (hay gặp ở 4G).` : ""}
        {khongViTri > 0 ? ` "${CHUA_XAC_DINH}" = lượt không có vị trí (trước 13/09 web chưa lưu IP).` : ""}
      </p>
    </div>
  );
}
