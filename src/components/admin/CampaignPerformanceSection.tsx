"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye, MousePointerClick, Percent, RefreshCw, Target } from "lucide-react";
import { getCampaignFunnel, getSourceFunnel, type FunnelRow } from "@/lib/campaignAnalytics";
import { StatCard } from "@/components/admin/StatCard";
import { cn } from "@/lib/utils";

type RangeDays = 7 | 30 | 90;
const RANGES: RangeDays[] = [7, 30, 90];

// The analytics lib buckets untagged visits under this exact key.
const NO_TAG = "(không gắn UTM)";

const TYPE_META: Record<"zalo" | "call" | "messenger", { label: string; color: string }> = {
  zalo: { label: "Zalo", color: "bg-sky-500/15 text-sky-400" },
  call: { label: "Gọi", color: "bg-emerald-500/15 text-emerald-400" },
  messenger: { label: "Mess", color: "bg-blue-500/15 text-blue-400" },
};

// Nicer display labels for the common traffic channels (keys arrive lowercased).
const SOURCE_LABELS: Record<string, string> = {
  facebook: "Facebook",
  tiktok: "TikTok",
  google: "Google",
  zalo: "Zalo",
  instagram: "Instagram",
  youtube: "YouTube",
  telegram: "Telegram",
  bing: "Bing",
  coccoc: "Cốc Cốc",
  direct: "Trực tiếp",
  internal: "Nội bộ",
  other: "Khác",
};

const Skeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <div className="h-3 w-2/5 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/6 animate-pulse rounded bg-muted" />
        <div className="ml-auto h-3 w-16 animate-pulse rounded bg-muted" />
      </div>
    ))}
  </div>
);

function LeadBreakdown({ row }: { row: FunnelRow }) {
  const parts = (["zalo", "call", "messenger"] as const).filter((t) => row.byType[t] > 0);
  if (parts.length === 0) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {parts.map((t) => (
        <span key={t} className={cn("rounded px-1.5 py-0.5 text-[11px] font-semibold", TYPE_META[t].color)}>
          {TYPE_META[t].label} {row.byType[t]}
        </span>
      ))}
    </div>
  );
}

function FunnelTable({
  rows,
  firstColLabel,
  labelOf,
}: {
  rows: FunnelRow[];
  firstColLabel: string;
  labelOf: (row: FunnelRow) => string;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-2.5 font-medium">{firstColLabel}</th>
            <th scope="col" className="px-4 py-2.5 text-right font-medium">Lượt xem</th>
            <th scope="col" className="px-4 py-2.5 text-right font-medium">Lead</th>
            <th scope="col" className="px-4 py-2.5 text-right font-medium">Tỉ lệ lead</th>
            <th scope="col" className="hidden px-4 py-2.5 font-medium md:table-cell">Chi tiết lead</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => {
            const untagged = row.key === NO_TAG;
            const label = labelOf(row);
            return (
              <tr key={row.key} className="transition-colors hover:bg-muted/30">
                <td className="max-w-[220px] px-4 py-2.5">
                  <span
                    className={cn("block truncate", untagged ? "italic text-muted-foreground" : "font-medium text-foreground")}
                    title={label}
                  >
                    {label}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right text-foreground">
                  {row.visits.toLocaleString("vi-VN")}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right font-semibold text-foreground">
                  {row.leads.toLocaleString("vi-VN")}
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 text-right">
                  <span className={row.leadRate > 0 ? "font-medium text-primary" : "text-muted-foreground"}>
                    {row.leadRate}%
                  </span>
                </td>
                <td className="hidden px-4 py-2.5 md:table-cell">
                  <LeadBreakdown row={row} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function CampaignPerformanceSection() {
  const [days, setDays] = useState<RangeDays>(30);
  const [campaignRows, setCampaignRows] = useState<FunnelRow[]>([]);
  const [sourceRows, setSourceRows] = useState<FunnelRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (d: RangeDays) => {
    setLoading(true);
    setError(null);
    try {
      // Both helpers already degrade to [] on error / missing permission.
      const [c, s] = await Promise.all([getCampaignFunnel(d), getSourceFunnel(d)]);
      setCampaignRows(c);
      setSourceRows(s);
    } catch {
      setError("Không thể tải dữ liệu chiến dịch");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load(days);
  }, [days, load]);

  const totals = useMemo(() => {
    const visits = campaignRows.reduce((sum, r) => sum + r.visits, 0);
    const leads = campaignRows.reduce((sum, r) => sum + r.leads, 0);
    return { visits, leads, rate: visits > 0 ? Math.round((leads / visits) * 1000) / 10 : 0 };
  }, [campaignRows]);

  const hasData = campaignRows.length > 0 || sourceRows.length > 0;

  const sourceLabelOf = (row: FunnelRow) =>
    SOURCE_LABELS[row.key] ?? (row.key ? row.key[0].toUpperCase() + row.key.slice(1) : row.label);

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Target className="h-4 w-4 text-primary" />
          Hiệu quả chiến dịch
        </h2>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-border p-0.5" role="group" aria-label="Khoảng thời gian">
            {RANGES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDays(d)}
                aria-pressed={days === d}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  days === d ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {d} ngày
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void load(days)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            Làm mới
          </button>
        </div>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <Skeleton />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-6 py-10 text-center shadow-card">
          <p className="text-sm text-destructive">{error}</p>
          <button
            type="button"
            onClick={() => void load(days)}
            className="text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            Thử lại
          </button>
        </div>
      ) : !hasData ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-12 text-center shadow-card">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Target className="h-6 w-6" />
          </span>
          <div className="max-w-md">
            <p className="text-sm font-medium text-foreground">Chưa gom được dữ liệu chiến dịch</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Gắn <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">utm_campaign</code> vào link chiến dịch
              (Google Ads, bài Facebook, ZNS…) thì hệ thống mới gom được lượt xem &amp; lead theo từng chiến dịch.
              Ví dụ: <span className="font-mono text-[11px]">?utm_campaign=gg-search-tuquy</span>.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Tổng quan cả cửa số thời gian */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard label={`Lượt xem (${days} ngày)`} value={totals.visits.toLocaleString("vi-VN")} icon={Eye} />
            <StatCard
              label="Lead (Zalo/gọi/mess)"
              value={totals.leads.toLocaleString("vi-VN")}
              icon={MousePointerClick}
              iconClass="bg-primary/15 text-primary"
              valueClass="text-primary"
            />
            <StatCard
              label="Tỉ lệ lead / lượt xem"
              value={`${totals.rate}%`}
              icon={Percent}
              iconClass="bg-gold/15 text-gold"
              valueClass="text-gold"
            />
          </div>

          {/* Theo chiến dịch (utm_campaign) */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Hiệu quả theo chiến dịch (utm_campaign)</h3>
            {campaignRows.length === 0 ? (
              <p className="rounded-xl border border-border bg-card px-4 py-6 text-center text-xs text-muted-foreground shadow-card">
                Chưa có dữ liệu theo chiến dịch.
              </p>
            ) : (
              <FunnelTable rows={campaignRows} firstColLabel="Chiến dịch" labelOf={(r) => r.label} />
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              Lead = click Zalo/gọi/messenger. Web chưa có bảng đơn nên đây là số{" "}
              <span className="font-medium text-foreground">LEAD</span>, không phải doanh số — ghép chi phí Ads (nhập tay)
              để ra CPL.
            </p>
          </div>

          {/* Theo kênh / nguồn */}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-foreground">Theo kênh / nguồn</h3>
            {sourceRows.length === 0 ? (
              <p className="rounded-xl border border-border bg-card px-4 py-6 text-center text-xs text-muted-foreground shadow-card">
                Chưa có dữ liệu theo kênh.
              </p>
            ) : (
              <FunnelTable rows={sourceRows} firstColLabel="Kênh / nguồn" labelOf={sourceLabelOf} />
            )}
          </div>
        </div>
      )}
    </section>
  );
}
