import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface BarItem {
  label: string;
  count: number;
  fillClass?: string;
}

interface BarListProps {
  title: string;
  items: BarItem[];
  footer?: ReactNode;
}

export function BarList({ title, items, footer }: BarListProps) {
  const maxCount = items.reduce((max, item) => Math.max(max, item.count), 0);

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-card">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có dữ liệu.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item) => {
            const pct = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
            const visiblePct = pct > 0 ? Math.max(pct, 2) : 0;
            return (
              <div key={item.label}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span className="truncate text-muted-foreground">{item.label}</span>
                  <span className="shrink-0 font-medium text-foreground">
                    {item.count.toLocaleString("vi-VN")} · {Math.round(pct)}%
                  </span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-muted"
                  title={`${item.label}: ${item.count.toLocaleString("vi-VN")}`}
                >
                  <div
                    className={cn("h-full rounded-full", item.fillClass ?? "bg-[hsl(var(--gold-soft))]")}
                    style={{ width: `${visiblePct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
      {footer}
    </div>
  );
}
