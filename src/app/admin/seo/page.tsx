"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Loader2, RefreshCw, Search } from "lucide-react";
import RequireAdmin from "@/components/admin/RequireAdmin";
import {
  SEO_BASELINE,
  SEO_GROUPS,
  SEO_NORTH_STAR,
  type SeoStatus,
  type SeoTask,
} from "@/data/seoChecklist";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<SeoStatus, string> = {
  done: "Xong",
  doing: "Đang làm",
  todo: "Chờ làm",
};

const STATUS_BADGE: Record<SeoStatus, string> = {
  done: "bg-emerald-500/15 text-emerald-400",
  doing: "bg-amber-500/15 text-amber-400",
  todo: "bg-muted text-muted-foreground",
};

const OWNER_LABEL = {
  "chu-shop": "Chủ shop",
  dev: "Dev",
  "ca-hai": "Cả hai",
} as const;

const OWNER_BADGE = {
  "chu-shop": "bg-primary/15 text-primary",
  dev: "bg-sky-500/15 text-sky-400",
  "ca-hai": "bg-violet-500/15 text-violet-400",
} as const;

const PRIORITY_BADGE = {
  P0: "bg-red-500/15 text-red-400",
  P1: "bg-amber-500/15 text-amber-400",
  P2: "bg-muted text-muted-foreground",
} as const;

interface LiveStatus {
  cronSecret: boolean;
  gscConnected: boolean;
  syncState: boolean | null;
}

function AdminSeoContent() {
  const [live, setLive] = useState<LiveStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loi, setLoi] = useState<string | null>(null);

  const tai = async () => {
    setLoading(true);
    setLoi(null);
    try {
      const res = await fetch("/api/admin/seo-status", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setLive((await res.json()) as LiveStatus);
    } catch {
      // Không kiểm được thì giữ trạng thái viết tay trong file, và nói rõ là
      // không kiểm được — im lặng ở đây sẽ khiến một việc đã làm hiện "chờ làm".
      setLoi("Chưa đọc được trạng thái thật, bảng dưới đang hiện trạng thái ghi tay trong code.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void tai();
  }, []);

  useEffect(() => {
    document.title = "Việc SEO cần làm – CHONSOMOBIFONE.COM";
  }, []);

  /** Trạng thái hiển thị: kết quả kiểm thật (nếu có) đè lên trạng thái ghi tay. */
  const trangThai = (task: SeoTask): SeoStatus => {
    if (!task.liveCheck || !live) return task.status;
    const v = live[task.liveCheck];
    if (v === null || v === undefined) return task.status;
    return v ? "done" : "todo";
  };

  const groups = useMemo(
    () =>
      SEO_GROUPS.map((g) => {
        const tasks = g.tasks.map((t) => ({ ...t, hienTai: trangThai(t) }));
        const xong = tasks.filter((t) => t.hienTai === "done").length;
        return { ...g, tasks, xong, tong: tasks.length };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [live],
  );

  const tongXong = groups.reduce((s, g) => s + g.xong, 0);
  const tongViec = groups.reduce((s, g) => s + g.tong, 0);
  const conNo = groups
    .flatMap((g) => g.tasks)
    .filter((t) => t.hienTai !== "done" && t.priority === "P0");

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-5xl px-4 py-6 md:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Về dashboard
          </Link>
          <button
            onClick={() => void tai()}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            Kiểm lại
          </button>
        </div>

        <h1 className="mb-2 flex items-center gap-3 text-2xl font-bold text-foreground md:text-3xl">
          <Search className="h-6 w-6 text-primary" />
          Việc SEO cần làm
        </h1>
        <p className="mb-6 max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-base">
          {SEO_NORTH_STAR}
        </p>

        <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
          {SEO_BASELINE.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-3.5">
              <p className="text-xl font-bold text-gold md:text-2xl">{s.value}</p>
              <p className="text-xs font-medium text-foreground md:text-sm">{s.label}</p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{s.note}</p>
            </div>
          ))}
        </div>

        {loi && (
          <p className="mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-300">
            {loi}
          </p>
        )}

        <div className="mb-6 rounded-xl border border-border bg-card p-4 md:p-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-foreground">
              Đã xong {tongXong}/{tongViec} việc
            </p>
            {conNo.length > 0 && (
              <p className="text-sm font-semibold text-red-400">Còn {conNo.length} việc gấp (P0)</p>
            )}
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${tongViec ? Math.round((tongXong / tongViec) * 100) : 0}%` }}
            />
          </div>
          {conNo.length > 0 && (
            <ul className="mt-3 space-y-1 text-sm text-muted-foreground">
              {conNo.map((t) => (
                <li key={t.id}>
                  <span className="font-medium text-foreground">{t.title}</span> —{" "}
                  {OWNER_LABEL[t.owner]}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="space-y-6">
          {groups.map((g) => (
            <section key={g.id} className="rounded-xl border border-border bg-card p-4 md:p-6">
              <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="text-lg font-bold text-primary md:text-xl">{g.title}</h2>
                <span className="text-sm font-medium text-muted-foreground">
                  {g.xong}/{g.tong}
                </span>
              </div>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{g.goal}</p>

              <ul className="space-y-3">
                {g.tasks.map((t) => (
                  <li
                    key={t.id}
                    className={cn(
                      "rounded-lg border p-3.5 md:p-4",
                      t.hienTai === "done"
                        ? "border-emerald-500/20 bg-emerald-500/5"
                        : "border-border bg-secondary/30",
                    )}
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {t.hienTai === "done" && <Check className="h-4 w-4 shrink-0 text-emerald-400" />}
                      <span className="font-semibold text-foreground">{t.title}</span>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[11px] font-bold",
                          STATUS_BADGE[t.hienTai],
                        )}
                      >
                        {STATUS_LABEL[t.hienTai]}
                      </span>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[11px] font-bold",
                          OWNER_BADGE[t.owner],
                        )}
                      >
                        {OWNER_LABEL[t.owner]}
                      </span>
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[11px] font-bold",
                          PRIORITY_BADGE[t.priority],
                        )}
                      >
                        {t.priority}
                      </span>
                      {t.liveCheck && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground">
                          tự kiểm
                        </span>
                      )}
                    </div>

                    <p className="text-sm leading-relaxed text-muted-foreground">{t.why}</p>

                    {t.how && (
                      <p className="mt-2 rounded bg-background/60 p-2.5 text-xs leading-relaxed text-foreground/80 md:text-sm">
                        <span className="font-semibold">Cách làm: </span>
                        {t.how}
                      </p>
                    )}

                    {t.risk && (
                      <p className="mt-2 text-xs leading-relaxed text-amber-300/90 md:text-sm">
                        <span className="font-semibold">Nếu không làm: </span>
                        {t.risk}
                      </p>
                    )}

                    {t.updated && (
                      <p className="mt-2 text-[11px] text-muted-foreground">Cập nhật {t.updated}</p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-6 text-xs leading-relaxed text-muted-foreground">
          Danh sách này đọc từ <code className="rounded bg-muted px-1">src/data/seoChecklist.ts</code>.
          Các việc gắn nhãn “tự kiểm” lấy trạng thái thật từ server nên không cần sửa file. Bảng 118 từ
          khoá và công cụ đo thứ hạng nằm ở <code className="rounded bg-muted px-1">scripts/seo/</code>,
          chạy bằng <code className="rounded bg-muted px-1">npm run seo:rank</code>.
        </p>
      </div>
    </div>
  );
}

export default function AdminSeoPage() {
  return (
    <RequireAdmin>
      <AdminSeoContent />
    </RequireAdmin>
  );
}
