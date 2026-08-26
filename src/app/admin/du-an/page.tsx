"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Copy, Rocket, Target } from "lucide-react";
import RequireAdmin from "@/components/admin/RequireAdmin";
import { NORTH_STAR, PILLARS, ROADMAP, type RoadmapTask } from "@/data/roadmap";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<RoadmapTask["status"], string> = {
  done: "✅ Xong",
  doing: "🔨 Đang làm",
  todo: "⏳ Chờ",
};

const STATUS_BADGE: Record<RoadmapTask["status"], string> = {
  done: "bg-emerald-500/15 text-emerald-400",
  doing: "bg-amber-500/15 text-amber-400",
  todo: "bg-muted text-muted-foreground",
};

const PRIORITY_BADGE: Record<NonNullable<RoadmapTask["priority"]>, string> = {
  P0: "bg-primary/15 text-primary",
  P1: "bg-muted text-muted-foreground",
  P2: "bg-muted text-muted-foreground",
};

function ProgressBar({ pct, fillClass }: { pct: number; fillClass: string }) {
  return (
    <div
      className="h-2.5 overflow-hidden rounded-full bg-muted"
      title={`${pct}%`}
    >
      <div
        className={cn("h-full rounded-full", fillClass)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/**
 * Mono chip showing `utm_campaign=<slug>` that the shop owner can one-click copy
 * into an Ads/link builder. Falls back silently if the clipboard API is blocked.
 */
function UtmChip({ utm }: { utm: string }) {
  const [copied, setCopied] = useState(false);
  const text = `utm_campaign=${utm}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — the text is still selectable manually */
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      title="Bấm để copy — gắn vào link quảng cáo"
      className="mt-1.5 inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground transition-colors hover:bg-muted/70"
    >
      <span className="select-all">{text}</span>
      {copied ? (
        <Check className="h-3 w-3 text-emerald-400" />
      ) : (
        <Copy className="h-3 w-3 text-muted-foreground" />
      )}
      <span className="sr-only">{copied ? "Đã copy" : "Copy utm_campaign"}</span>
    </button>
  );
}

function AdminDuAnContent() {
  useEffect(() => {
    document.title = "Dự án – CHONSOMOBIFONE.COM";
  }, []);

  const { totalTasks, doneTasks, overallPct } = useMemo(() => {
    const allTasks = ROADMAP.flatMap((phase) => phase.tasks);
    const done = allTasks.filter((task) => task.status === "done").length;
    return {
      totalTasks: allTasks.length,
      doneTasks: done,
      overallPct: allTasks.length > 0 ? Math.round((done / allTasks.length) * 100) : 0,
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur">
        <div className="container flex items-center gap-3 px-4 py-3">
          <a
            href="/admin/dashboard"
            aria-label="Quay lại Bảng điều khiển"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </a>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">Dự án — Make Mobi Great Again</h1>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">
              {doneTasks}/{totalTasks} task xong · {overallPct}%
            </p>
          </div>
        </div>
      </header>

      <main className="container space-y-8 px-4 py-8">
        {/* Header chiến dịch */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-card">
          <p className="flex items-center gap-1.5 text-xs font-semibold tracking-wide text-primary">
            <Rocket className="h-3.5 w-3.5" />
            CHIẾN DỊCH
          </p>
          <h2 className="mt-1 text-xl font-bold text-foreground sm:text-2xl">Make Mobi Great Again</h2>
          <p className="mt-2 flex items-start gap-2 text-sm text-muted-foreground">
            <Target className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <span>
              <span className="font-medium text-foreground">North Star:</span> {NORTH_STAR}
            </span>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {PILLARS.map((pillar) => (
              <span
                key={pillar.name}
                className="inline-flex items-baseline gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs"
              >
                <span className="font-semibold text-foreground">{pillar.name}</span>
                <span className="text-muted-foreground">{pillar.note}</span>
              </span>
            ))}
          </div>
        </section>

        {/* Tiến độ tổng */}
        <section className="rounded-xl border border-border bg-card p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">Tiến độ tổng</h2>
            <span className="text-sm font-medium text-foreground">
              {doneTasks}/{totalTasks} task · <span className="text-gold">{overallPct}%</span>
            </span>
          </div>
          <div className="mt-3">
            <ProgressBar pct={overallPct} fillClass="bg-primary" />
          </div>
        </section>

        {/* Các giai đoạn */}
        {ROADMAP.map((phase) => {
          const phaseDone = phase.tasks.filter((task) => task.status === "done").length;
          const phasePct = phase.tasks.length > 0 ? Math.round((phaseDone / phase.tasks.length) * 100) : 0;

          return (
            <section
              key={phase.id}
              className="rounded-xl border border-border bg-card p-5 shadow-card"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold text-foreground">
                  <span className="text-primary">{phase.id}</span> · {phase.title}
                </h3>
                <span className="text-xs font-medium text-muted-foreground">
                  {phaseDone}/{phase.tasks.length} · <span className="text-gold">{phasePct}%</span>
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{phase.goal}</p>

              <div className="mt-3">
                <ProgressBar pct={phasePct} fillClass="bg-[hsl(var(--gold-soft))]" />
              </div>

              <ul className="mt-4 divide-y divide-border">
                {phase.tasks.map((task) => (
                  <li key={task.id} className="flex items-start justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[11px] font-medium",
                            STATUS_BADGE[task.status],
                          )}
                        >
                          {STATUS_LABELS[task.status]}
                        </span>
                        {task.priority ? (
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                              PRIORITY_BADGE[task.priority],
                            )}
                          >
                            {task.priority}
                          </span>
                        ) : null}
                        <span className="text-[11px] font-medium text-muted-foreground">{task.id}</span>
                      </div>
                      <p className="mt-1 text-sm font-medium text-foreground">{task.title}</p>
                      {task.kpi ? (
                        <p className="mt-0.5 text-xs text-muted-foreground">📊 KPI: {task.kpi}</p>
                      ) : null}
                      {task.utm ? <UtmChip utm={task.utm} /> : null}
                      {task.next ? (
                        <p className="mt-1 text-xs text-muted-foreground">{task.next}</p>
                      ) : null}
                    </div>
                    {task.updated ? (
                      <span className="shrink-0 text-xs text-muted-foreground">{task.updated}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
      </main>
    </div>
  );
}

export default function AdminDuAnPage() {
  return (
    <RequireAdmin>
      <AdminDuAnContent />
    </RequireAdmin>
  );
}
