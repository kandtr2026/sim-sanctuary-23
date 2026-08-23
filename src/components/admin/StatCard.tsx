import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  iconClass?: string;
  valueClass?: string;
}

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  iconClass = "bg-muted text-foreground",
  valueClass = "text-foreground",
}: StatCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-card transition-transform duration-200 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p className={cn("mt-1.5 break-words text-2xl font-bold leading-tight", valueClass)}>{value}</p>
        </div>
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", iconClass)}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
      {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  );
}
