"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import type { HangTuKhoa, KetQuaHang } from "@/lib/gscRank";

/**
 * Bảng theo dõi thứ hạng 118 từ khoá mục tiêu.
 *
 * Vì sao nằm TRONG /admin/seo chứ không phải route riêng: roadmap đã có sẵn hai
 * mục mô tả đúng việc này (A5 "có bảng query thay suy đoán từ khoá" và E3 "từ khoá
 * thật thay suy đoán"), và /admin/seo đã là trang về SEO — thêm route thứ ba là ba
 * nơi cùng chủ đề rồi drift.
 *
 * Danh sách từ khoá dùng CHUNG `scripts/seo/keywords.json` với CLI
 * `npm run seo:rank`. Không copy danh sách sang component.
 */

const NHOM_MAU: Record<string, string> = {
  "co": "text-emerald-300",
  "moi-p": "text-amber-300",
  "moi-b": "text-sky-300",
};

const NHAN_TRANG_THAI: Record<string, string> = {
  "co": "đã có trang",
  "moi-p": "cần trang mới",
  "moi-b": "cần viết mới",
};

/**
 * Màu theo thứ hạng. Ngưỡng CHỈ định nghĩa ở đây (route trả số thô) nên không có
 * hai bảng ngưỡng để lệch nhau.
 */
const mauHang = (hang: number | null): string => {
  if (hang == null) return "text-muted-foreground";
  if (hang < 1.5) return "text-emerald-400 font-bold";
  if (hang < 3.5) return "text-emerald-300 font-semibold";
  if (hang <= 10.5) return "text-amber-300";
  if (hang <= 20.5) return "text-orange-300";
  return "text-red-300";
};

const KY = [28, 90, 180] as const;

export default function SeoRankTable() {
  const [soNgay, setSoNgay] = useState<number>(28);
  const [data, setData] = useState<KetQuaHang | null>(null);
  const [dangTai, setDangTai] = useState(true);

  useEffect(() => {
    let huy = false;
    setDangTai(true);
    fetch(`/api/admin/seo-rank?ngay=${soNgay}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j: KetQuaHang) => {
        if (!huy) setData(j);
      })
      .catch(() => {
        if (!huy) setData(null);
      })
      .finally(() => {
        if (!huy) setDangTai(false);
      });
    return () => {
      huy = true;
    };
  }, [soNgay]);

  const nhom = useMemo(() => {
    const ds = data?.tuKhoa ?? [];
    const m = new Map<string, HangTuKhoa[]>();
    for (const k of ds) {
      const key = k.nhom || "khác";
      if (!m.has(key)) m.set(key, []);
      m.get(key)!.push(k);
    }
    // Nhóm nhiều từ khoá lên trước; trong nhóm thì có hạng lên trước, hạng tốt trước.
    return [...m.entries()]
      .sort((a, b) => b[1].length - a[1].length)
      .map(([ten, list]) => [
        ten,
        [...list].sort((x, y) => {
          if (x.hang == null && y.hang == null) return x.tuKhoa.localeCompare(y.tuKhoa);
          if (x.hang == null) return 1;
          if (y.hang == null) return -1;
          return x.hang - y.hang;
        }),
      ] as [string, HangTuKhoa[]]);
  }, [data]);

  const thongKe = useMemo(() => {
    const ds = data?.tuKhoa ?? [];
    const coHang = ds.filter((k) => k.hang != null);
    return {
      tong: ds.length,
      coHang: coHang.length,
      top1: coHang.filter((k) => k.hang! < 1.5).length,
      top3: coHang.filter((k) => k.hang! >= 1.5 && k.hang! < 3.5).length,
      top10: coHang.filter((k) => k.hang! >= 3.5 && k.hang! <= 10.5).length,
      lech: ds.filter((k) => k.lechUrl).length,
    };
  }, [data]);

  return (
    <section className="mt-8 rounded-xl border border-border bg-card p-4 md:p-6">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-primary md:text-xl">
          Thứ hạng từ khoá <span className="text-sm font-normal text-muted-foreground">({thongKe.tong} từ khoá)</span>
        </h2>
        <div className="flex items-center gap-2">
          {KY.map((n) => (
            <button
              key={n}
              onClick={() => setSoNgay(n)}
              className={cn(
                "rounded-lg border px-3 py-1 text-xs font-semibold transition-colors",
                soNgay === n
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {n} ngày
            </button>
          ))}
          <button
            onClick={() => setSoNgay((n) => n)}
            className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground"
            aria-label="Tải lại"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", dangTai && "animate-spin")} />
          </button>
        </div>
      </div>

      {dangTai && !data && (
        <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Đang đọc Search Console…
        </p>
      )}

      {data && !data.daNoiGsc && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="mb-1.5 flex items-center gap-2 font-semibold text-amber-300">
            <TriangleAlert className="h-4 w-4" /> Chưa nối Search Console
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Bảng bên dưới hiện danh sách từ khoá mục tiêu và trang đích, nhưng chưa có cột thứ hạng.
            Thiếu biến: <code className="rounded bg-muted px-1">{data.thieuBien.join(", ")}</code>. Property
            của site đã xác minh sẵn nên Google đã tích luỹ số liệu — cấp quyền là có lịch sử ngay.
          </p>
        </div>
      )}

      {data?.loi && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-4">
          <p className="mb-1.5 flex items-center gap-2 font-semibold text-red-300">
            <TriangleAlert className="h-4 w-4" /> Search Console trả lỗi
          </p>
          <p className="text-sm leading-relaxed text-muted-foreground">{data.loi}</p>
        </div>
      )}

      {data?.daNoiGsc && !data.loi && (
        <div className="mb-4 grid grid-cols-2 gap-2 text-center sm:grid-cols-5">
          {[
            { nhan: "Có dữ liệu", so: thongKe.coHang, mau: "text-foreground" },
            { nhan: "Top 1", so: thongKe.top1, mau: "text-emerald-400" },
            { nhan: "Top 2–3", so: thongKe.top3, mau: "text-emerald-300" },
            { nhan: "Top 4–10", so: thongKe.top10, mau: "text-amber-300" },
            { nhan: "Lệch trang đích", so: thongKe.lech, mau: "text-orange-300" },
          ].map((o) => (
            <div key={o.nhan} className="rounded-lg bg-secondary/40 p-2.5">
              <p className={cn("text-xl font-bold", o.mau)}>{o.so}</p>
              <p className="text-[11px] text-muted-foreground">{o.nhan}</p>
            </div>
          ))}
        </div>
      )}

      {data && (
        <>
          {data.khoang && (
            <p className="mb-3 text-xs text-muted-foreground">
              Kỳ {data.khoang.tuNgay} → {data.khoang.denNgay} · property{" "}
              <code className="rounded bg-muted px-1">{data.site}</code>
            </p>
          )}

          <div className="space-y-5">
            {nhom.map(([ten, list]) => (
              <div key={ten}>
                <h3 className="mb-1.5 text-sm font-semibold text-foreground">
                  {ten} <span className="font-normal text-muted-foreground">({list.length})</span>
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs md:text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="py-1.5 pr-3 font-medium">Từ khoá</th>
                        <th className="py-1.5 pr-3 text-right font-medium">Hạng</th>
                        <th className="py-1.5 pr-3 text-right font-medium">Hiện</th>
                        <th className="py-1.5 pr-3 text-right font-medium">Click</th>
                        <th className="py-1.5 font-medium">Trang đích</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((k) => (
                        <tr key={k.tuKhoa} className="border-b border-border/50">
                          <td className="py-1.5 pr-3 text-foreground">{k.tuKhoa}</td>
                          <td className={cn("py-1.5 pr-3 text-right tabular-nums", mauHang(k.hang))}>
                            {k.hang ?? "—"}
                          </td>
                          <td className="py-1.5 pr-3 text-right tabular-nums text-muted-foreground">
                            {k.hienThi || "—"}
                          </td>
                          <td className="py-1.5 pr-3 text-right tabular-nums text-muted-foreground">
                            {k.click || "—"}
                          </td>
                          <td className="py-1.5 text-muted-foreground">
                            <span className={NHOM_MAU[k.trangThai] ?? ""}>{k.urlDich || "—"}</span>
                            <span className="ml-1.5 text-[10px] opacity-70">
                              {NHAN_TRANG_THAI[k.trangThai] ?? k.trangThai}
                            </span>
                            {k.lechUrl && (
                              <span className="ml-1.5 text-orange-300" title={`Đang xếp hạng bằng ${k.urlThucTe}`}>
                                ⚠ xếp hạng bằng trang khác
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
            Ô hạng trống nghĩa là Search Console KHÔNG có dòng nào cho từ khoá đó trong kỳ — site chưa
            từng hiện ra, <strong>không phải hạng kém</strong>. Số hạng là vị trí trung bình có trọng số
            theo lượt hiện, nên 1,4 nghĩa là phần lớn lần hiện ở hạng 1–2. Danh sách từ khoá sửa ở{" "}
            <code className="rounded bg-muted px-1">scripts/seo/keywords.json</code> — dùng chung với{" "}
            <code className="rounded bg-muted px-1">npm run seo:rank</code>.
          </p>
        </>
      )}
    </section>
  );
}
