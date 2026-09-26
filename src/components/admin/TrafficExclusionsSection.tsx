"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Copy, Loader2, Plus, RefreshCw, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ExclusionItem {
  id: number;
  ip: string;
  reason: string;
  note: string | null;
  active: boolean;
  auto: boolean;
  valid_from: string | null;
  valid_to: string | null;
  visits14d: number;
  lastVisit: string | null;
}

interface ExclusionsData {
  items: ExclusionItem[];
  totals: { internalVisits14d: number; botVisits14d: number; customerVisits14d: number };
}

const REASON_LABELS: Record<string, string> = {
  admin: "Máy đăng nhập admin",
  staff: "Dáng nhân viên (vào nhiều ngày, cả ngày)",
  heavy: "Lướt dày bất thường (nghi nội bộ/đại lý)",
  server: "Máy chủ/VPS",
  manual: "Thêm tay",
};

/** Link A Khoa mở 1 lần trên máy/điện thoại nhân viên để máy đó thôi bị đếm. */
const NOI_BO_LINK = "https://www.chonsomobifone.com/?noibo=1";

const SHOW_LIMIT = 30;

/** Chỉ nhận IP CHÍNH XÁC (v4/v6) — không nhận dải /24 (CGNAT 4G dùng chung với khách thật). */
function isExactIp(raw: string): boolean {
  const ip = raw.trim();
  const v4 = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) return v4.slice(1).every((p) => Number(p) <= 255);
  return ip.includes(":") && /^[0-9a-f:.]+$/i.test(ip) && ip.length <= 45;
}

const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("vi-VN") : null);
const fmtDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : "—";

async function readError(r: Response): Promise<string> {
  try {
    const j = (await r.json()) as { error?: string };
    if (j?.error) return j.error;
  } catch {
    /* body không phải JSON */
  }
  return `HTTP ${r.status}`;
}

/**
 * Danh sách IP bị LOẠI khỏi thống kê khách (bảng traffic_exclusions) + tổng khách
 * thật / nội bộ / bot 14 ngày. A Khoa bỏ đánh dấu IP nhận nhầm ("Không phải nội
 * bộ") hoặc thêm IP tay; dòng đã sửa tay thì lượt quét tự động không bật lại.
 * Nguồn: /api/admin/traffic-exclusions (requireAdmin, token phiên admin).
 */
export function TrafficExclusionsSection({ token, onChanged }: { token?: string; onChanged?: () => void }) {
  const [data, setData] = useState<ExclusionsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [busyIp, setBusyIp] = useState<string | null>(null);
  const [newIp, setNewIp] = useState("");
  const [newNote, setNewNote] = useState("");
  const [adding, setAdding] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/admin/traffic-exclusions", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
      .then(async (r) => (r.ok ? r.json() : Promise.reject(new Error(await readError(r)))))
      .then((d: ExclusionsData) => {
        if (!cancelled) setData({ items: d.items ?? [], totals: d.totals });
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

  // GOM THEO IP: một IP có thể mang tới 3 lý do (admin + staff + heavy). Hiện mỗi
  // IP một dòng và bật/tắt cả IP một lần — tắt riêng 1 lý do thì IP vẫn bị 2 lý do
  // kia loại, A Khoa sẽ tưởng nút không ăn.
  // Đang loại lên trước, rồi IP nhiều lượt nhất, rồi mới vào gần nhất.
  const groups = useMemo(() => {
    const byIp = new Map<string, ExclusionItem[]>();
    for (const it of data?.items ?? []) {
      const list = byIp.get(it.ip) ?? [];
      list.push(it);
      byIp.set(it.ip, list);
    }
    return [...byIp.entries()]
      .map(([ip, rows]) => ({
        ip,
        rows,
        active: rows.some((r) => r.active),
        visits14d: Math.max(...rows.map((r) => r.visits14d ?? 0)),
        lastVisit: rows.map((r) => r.lastVisit ?? "").sort().at(-1) || null,
        suaTay: rows.some((r) => !r.auto && r.reason !== "manual"),
        note: rows.find((r) => r.reason === "manual" && r.note)?.note ?? null,
      }))
      .sort(
        (a, b) =>
          Number(b.active) - Number(a.active) ||
          b.visits14d - a.visits14d ||
          (b.lastVisit ?? "").localeCompare(a.lastVisit ?? ""),
      );
  }, [data]);
  const shownGroups = showAll ? groups : groups.slice(0, SHOW_LIMIT);

  const toggleIp = async (ip: string, currentlyActive: boolean) => {
    if (!token) return;
    const next = !currentlyActive;
    setBusyIp(ip);
    try {
      const r = await fetch("/api/admin/traffic-exclusions", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ip, active: next }),
      });
      if (!r.ok) throw new Error(await readError(r));
      // Cập nhật ngay trên màn; tải lại để tổng 14 ngày khớp.
      setData((d) =>
        d ? { ...d, items: d.items.map((x) => (x.ip === ip ? { ...x, active: next, auto: false } : x)) } : d,
      );
      toast.success(next ? `Đã loại lại ${ip}` : `${ip} tính là khách thật`);
      setReloadKey((k) => k + 1);
      onChanged?.();
    } catch (e) {
      toast.error(`Không lưu được: ${e instanceof Error ? e.message : "lỗi"}`);
    } finally {
      setBusyIp(null);
    }
  };

  const addIp = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;
    const ip = newIp.trim();
    if (!isExactIp(ip)) {
      toast.error("IP không hợp lệ — nhập đúng 1 IP (vd 1.53.114.105), không nhập dải.");
      return;
    }
    setAdding(true);
    try {
      const r = await fetch("/api/admin/traffic-exclusions", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ ip, note: newNote.trim() || undefined }),
      });
      if (!r.ok) throw new Error(await readError(r));
      toast.success(`Đã loại ${ip} khỏi thống kê khách`);
      setNewIp("");
      setNewNote("");
      setReloadKey((k) => k + 1);
      onChanged?.();
    } catch (err) {
      toast.error(`Không thêm được: ${err instanceof Error ? err.message : "lỗi"}`);
    } finally {
      setAdding(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(NOI_BO_LINK);
      toast.success("Đã copy link — mở 1 lần trên máy nhân viên");
    } catch {
      toast.error("Không copy được — chọn link rồi copy tay");
    }
  };

  const totals = data?.totals;
  const activeCount = groups.filter((g) => g.active).length;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <ShieldOff className="h-5 w-5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Lọc nội bộ &amp; bot</h3>
            <p className="text-xs text-muted-foreground">
              {loading ? "Đang tải…" : `${activeCount.toLocaleString("vi-VN")} IP đang bị loại khỏi thống kê khách`}
            </p>
          </div>
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

      {/* Tổng 14 ngày: khách thật / nội bộ / bot */}
      {totals ? (
        <div className="mb-4 grid grid-cols-3 gap-2">
          {[
            { label: "Khách thật", value: totals.customerVisits14d, cls: "text-emerald-400" },
            { label: "Nội bộ", value: totals.internalVisits14d, cls: "text-foreground" },
            { label: "Bot", value: totals.botVisits14d, cls: "text-muted-foreground" },
          ].map((t) => (
            <div key={t.label} className="rounded-lg border border-border bg-background px-3 py-2">
              <p className="text-[11px] text-muted-foreground">{t.label} · 14 ngày</p>
              <p className={cn("text-lg font-bold tabular-nums", t.cls)}>{(t.value ?? 0).toLocaleString("vi-VN")}</p>
            </div>
          ))}
        </div>
      ) : null}

      {/* Link gắn cờ máy nhân viên */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs text-muted-foreground">
        <span>Mở link này 1 lần trên máy/điện thoại nhân viên — máy đó thôi bị đếm (tắt: <code>?noibo=0</code>):</span>
        <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">{NOI_BO_LINK}</code>
        <button
          type="button"
          onClick={() => void copyLink()}
          className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-1 font-medium text-foreground transition-colors hover:bg-muted"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy
        </button>
      </div>

      {/* Thêm IP tay */}
      <form onSubmit={(e) => void addIp(e)} className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={newIp}
          onChange={(e) => setNewIp(e.target.value)}
          placeholder="IP chính xác, vd 1.53.114.105"
          aria-label="IP cần loại"
          inputMode="decimal"
          className="h-8 w-52 rounded-lg border border-border bg-background px-2.5 font-mono text-xs text-foreground placeholder:font-sans placeholder:text-muted-foreground"
        />
        <input
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Ghi chú (tuỳ chọn)"
          aria-label="Ghi chú"
          maxLength={200}
          className="h-8 min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground"
        />
        <button
          type="submit"
          disabled={adding || !newIp.trim()}
          className="inline-flex h-8 items-center gap-1 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-opacity disabled:opacity-50"
        >
          {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Loại IP này
        </button>
      </form>

      {error ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <p className="text-sm text-muted-foreground">Không tải được danh sách: {error}</p>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="text-sm font-medium text-primary hover:underline">
            Thử lại
          </button>
        </div>
      ) : loading && !data ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 animate-pulse rounded bg-muted" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Chưa có IP nào bị loại.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">IP</th>
                <th className="px-3 py-2 font-medium">Lý do</th>
                <th className="px-3 py-2 text-right font-medium">14 ngày</th>
                <th className="hidden px-3 py-2 font-medium sm:table-cell">Lần cuối</th>
                <th className="px-3 py-2 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shownGroups.map((g) => (
                <tr key={g.ip} className={cn("align-top", !g.active && "opacity-60")}>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-foreground">
                    {g.ip}
                    {g.note ? <p className="mt-0.5 max-w-[180px] truncate font-sans text-[11px] text-muted-foreground">{g.note}</p> : null}
                  </td>
                  <td className="px-3 py-2 text-xs text-foreground">
                    {g.rows.map((row) => {
                      const from = fmtDate(row.valid_from);
                      const to = fmtDate(row.valid_to);
                      return (
                        <div key={row.id} className="[&+&]:mt-1">
                          {REASON_LABELS[row.reason] ?? row.reason}
                          {from || to ? (
                            <span className="ml-1 text-[11px] text-muted-foreground">
                              ({from ?? "…"} → {to ?? "nay"})
                            </span>
                          ) : null}
                        </div>
                      );
                    })}
                  </td>
                  <td className="px-3 py-2 text-right text-xs font-semibold tabular-nums text-foreground">
                    {g.visits14d.toLocaleString("vi-VN")}
                  </td>
                  <td className="hidden whitespace-nowrap px-3 py-2 text-xs text-muted-foreground sm:table-cell">
                    {fmtDateTime(g.lastVisit)}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[10px] font-semibold",
                          g.active ? "bg-primary/15 text-primary" : "bg-emerald-500/15 text-emerald-400",
                        )}
                      >
                        {g.active ? "Đang loại" : "Tính là khách"}
                      </span>
                      {g.suaTay ? (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground" title="Đã sửa tay — quét tự động không đổi lại">
                          sửa tay
                        </span>
                      ) : null}
                      <button
                        type="button"
                        disabled={busyIp === g.ip}
                        onClick={() => void toggleIp(g.ip, g.active)}
                        className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 text-[11px] font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                      >
                        {busyIp === g.ip ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
                        {g.active ? "Không phải nội bộ" : "Loại lại"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {groups.length > SHOW_LIMIT ? (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="w-full border-t border-border px-3 py-2 text-xs font-medium text-primary hover:underline"
            >
              {showAll ? "Thu gọn" : `Xem tất cả ${groups.length.toLocaleString("vi-VN")} IP`}
            </button>
          ) : null}
        </div>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
        Tự nhận: IP có phiên đăng nhập admin (trong thời gian phiên), dáng nhân viên (vào ≥4 ngày, ≥6 khung giờ trong 30
        ngày), lướt dày (≥150 lượt/ngày), máy chủ/VPS. Chỉ loại đúng từng IP, không loại cả dải. Bot nhận theo trình
        duyệt (Googlebot, Facebook, HeadlessChrome…) và dải IP Google/Meta — không liệt kê ở đây.
      </p>
    </div>
  );
}
