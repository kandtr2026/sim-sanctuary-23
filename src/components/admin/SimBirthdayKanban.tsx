"use client";

import { useCallback, useEffect, useState } from "react";
import { KanbanSquare, Loader2, RefreshCw, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Bảng Kanban theo dõi khách Sim Birthday (#54). Ba cột:
 *   L1 "Đã check Zalo" — có tác động nhưng chưa nhắn (mở/ có-Zalo/ ko-Zalo).
 *   L2 "Đã nhắn"       — đã gửi tin (kèm ai nhắn + text đã nhắn).
 *   L3 "Kết quả"       — đã chốt kết quả chăm sóc.
 * Mỗi thẻ có log tác động (mở → check → nhắn "text" → kết quả) và nút đặt kết quả.
 *
 * Nguồn: /api/admin/sim-birthday/kanban (RPC gom khách đã có tác động). Các thao
 * tác mở/check/nhắn nằm ở mục "Gửi Zalo"/"Trùng đuôi" phía dưới — kanban là màn
 * quản lý & chốt kết quả. Bấm "Tải lại" để cập nhật sau khi thao tác bên dưới.
 */

interface KanbanRow {
  msisdn: string;
  dob: string | null;
  mo_at: string | null;
  co_zalo: boolean;
  ko_zalo: boolean;
  check_at: string | null;
  nhan_at: string | null;
  nhan_by: string | null;
  nhan_text: string | null;
  ket_qua: string | null;
  kq_at: string | null;
  kq_by: string | null;
  tong: number;
}

const KET_QUA = ["Quan tâm", "Đã chốt", "Từ chối", "Hẹn lại"] as const;

/** Màu cho từng kết quả — nhìn phát biết tình trạng. */
const MAU_KQ: Record<string, string> = {
  "Quan tâm": "bg-sky-500/15 text-sky-300 ring-sky-500/30",
  "Đã chốt": "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  "Từ chối": "bg-primary/15 text-primary ring-primary/30",
  "Hẹn lại": "bg-gold/15 text-gold ring-gold/30",
};

const PAGE = 200;

const gio = (iso: string | null): string => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return new Intl.DateTimeFormat("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    day: "2-digit", month: "2-digit", hour12: false,
  }).format(d).replace(",", "");
};

const capCua = (r: KanbanRow): 1 | 2 | 3 => (r.ket_qua ? 3 : r.nhan_at ? 2 : 1);

export function SimBirthdayKanban({ token }: { token?: string }) {
  const [rows, setRows] = useState<KanbanRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  const tong = rows[0]?.tong ?? 0;
  const soPage = Math.max(1, Math.ceil(tong / PAGE));

  useEffect(() => {
    if (!token) return;
    let bo = false;
    setLoading(true);
    setError(null);
    fetch(`/api/admin/sim-birthday/kanban?limit=${PAGE}&offset=${page * PAGE}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d: { rows: KanbanRow[] }) => { if (!bo) setRows(d.rows ?? []); })
      .catch((e) => { if (!bo) setError(e instanceof Error ? e.message : "Không tải được"); })
      .finally(() => { if (!bo) setLoading(false); });
    return () => { bo = true; };
  }, [token, page, reloadKey]);

  const datKetQua = useCallback(
    async (msisdn: string, kq: string | null) => {
      // Optimistic
      setRows((rs) =>
        rs.map((r) =>
          r.msisdn === msisdn
            ? { ...r, ket_qua: kq, kq_at: kq ? new Date().toISOString() : null, kq_by: kq ? r.kq_by : null }
            : r,
        ),
      );
      try {
        const res = await fetch("/api/admin/sim-birthday/kanban", {
          method: kq ? "POST" : "DELETE",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify(kq ? { msisdn, ket_qua: kq } : { msisdn }),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const d = (await res.json().catch(() => ({}))) as { created_at?: string; created_by?: string | null };
        if (kq && d.created_at) {
          setRows((rs) =>
            rs.map((r) => (r.msisdn === msisdn ? { ...r, kq_at: d.created_at ?? r.kq_at, kq_by: d.created_by ?? null } : r)),
          );
        }
      } catch {
        toast.error("Không lưu được kết quả.");
        setReloadKey((k) => k + 1);
      }
    },
    [token],
  );

  const cot = (cap: 1 | 2 | 3) => rows.filter((r) => capCua(r) === cap);

  const COT_DEF: { cap: 1 | 2 | 3; ten: string; mo_ta: string; mau: string }[] = [
    { cap: 1, ten: "Đã check Zalo", mo_ta: "đã tiếp cận, chưa nhắn", mau: "text-sky-300" },
    { cap: 2, ten: "Đã nhắn", mo_ta: "đã gửi tin, chờ kết quả", mau: "text-violet-300" },
    { cap: 3, ten: "Kết quả", mo_ta: "đã chốt tình trạng", mau: "text-emerald-300" },
  ];

  return (
    <section className="rounded-xl border border-border bg-card shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <KanbanSquare className="h-4 w-4 text-primary" />
            Kanban theo dõi khách
          </h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            Khách đã có tác động, xếp theo tiến trình: đã check → đã nhắn → kết quả. Mỗi thẻ có log
            (mở/check/nhắn cái gì/ai nhắn) và nút chốt kết quả. Thao tác mở/nhắn ở các mục bên dưới —
            xong bấm <b className="text-foreground">Tải lại</b>.
            {tong > 0 && <> Tổng <b className="text-foreground">{tong.toLocaleString("vi-VN")}</b> khách.</>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {soPage > 1 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <button
                type="button"
                disabled={page === 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="rounded-lg border border-border px-2 py-1 disabled:opacity-40"
              >
                ←
              </button>
              <span>{page + 1}/{soPage}</span>
              <button
                type="button"
                disabled={page >= soPage - 1}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-border px-2 py-1 disabled:opacity-40"
              >
                →
              </button>
            </div>
          )}
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
          <p className="text-sm text-muted-foreground">Không tải được kanban: {error}</p>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="text-sm font-medium text-primary hover:underline">
            Thử lại
          </button>
        </div>
      ) : loading ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          Chưa có khách nào được tác động. Mở/nhắn khách ở mục bên dưới, họ sẽ hiện lên đây.
        </p>
      ) : (
        <div className="grid gap-3 p-4 lg:grid-cols-3">
          {COT_DEF.map((c) => {
            const dsCot = cot(c.cap);
            return (
              <div key={c.cap} className="rounded-lg border border-border bg-background/40">
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <div>
                    <span className={cn("text-xs font-semibold", c.mau)}>Level {c.cap} · {c.ten}</span>
                    <p className="text-[10px] text-muted-foreground">{c.mo_ta}</p>
                  </div>
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                    {dsCot.length}
                  </span>
                </div>
                <div className="max-h-[560px] space-y-2 overflow-y-auto p-2">
                  {dsCot.length === 0 ? (
                    <p className="py-6 text-center text-[11px] text-muted-foreground">— trống —</p>
                  ) : (
                    dsCot.map((r) => <TheKhach key={r.msisdn} r={r} onKetQua={datKetQua} />)
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function TheKhach({
  r,
  onKetQua,
}: {
  r: KanbanRow;
  onKetQua: (msisdn: string, kq: string | null) => void;
}) {
  const checkLabel = r.co_zalo ? "Có Zalo" : r.ko_zalo ? "Ko Zalo" : null;
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-sm font-bold text-gold [text-shadow:0_0_8px_rgba(245,179,1,0.45)]">
          {r.msisdn}
        </span>
        <a
          href={`https://zalo.me/${r.msisdn}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:underline"
        >
          Zalo <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      {r.dob && (
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Sinh {r.dob.split("-").reverse().join("/")}
        </p>
      )}

      {/* Log tác động */}
      <ul className="mt-2 space-y-1 border-t border-border/60 pt-2 text-[11px] text-muted-foreground">
        {r.mo_at && <li>• Mở Zalo · {gio(r.mo_at)}</li>}
        {checkLabel && (
          <li>
            • Check: <span className={r.co_zalo ? "text-emerald-400" : "text-primary"}>{checkLabel}</span>
            {r.check_at ? ` · ${gio(r.check_at)}` : ""}
          </li>
        )}
        {r.nhan_at && (
          <li>
            • Đã nhắn · {gio(r.nhan_at)}
            {r.nhan_by ? ` · ${r.nhan_by}` : ""}
          </li>
        )}
        {r.nhan_text && (
          <li className="rounded bg-muted/40 px-1.5 py-1 italic leading-snug text-foreground/80" title={r.nhan_text}>
            “{r.nhan_text.length > 120 ? `${r.nhan_text.slice(0, 120)}…` : r.nhan_text}”
          </li>
        )}
        {r.ket_qua && (
          <li>
            • Kết quả: <b className="text-foreground">{r.ket_qua}</b>
            {r.kq_at ? ` · ${gio(r.kq_at)}` : ""}
            {r.kq_by ? ` · ${r.kq_by}` : ""}
          </li>
        )}
      </ul>

      {/* Chốt kết quả */}
      <div className="mt-2 flex flex-wrap items-center gap-1">
        {KET_QUA.map((kq) => {
          const chon = r.ket_qua === kq;
          return (
            <button
              key={kq}
              type="button"
              onClick={() => onKetQua(r.msisdn, chon ? null : kq)}
              className={cn(
                "rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 transition-colors",
                chon ? MAU_KQ[kq] : "bg-background text-muted-foreground ring-border hover:text-foreground",
              )}
            >
              {chon ? `✓ ${kq}` : kq}
            </button>
          );
        })}
      </div>
    </div>
  );
}
