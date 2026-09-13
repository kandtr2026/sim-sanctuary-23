import { LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  email: string;
  lastUpdate: string;
  simCount: number;
  isCache: boolean;
  onSignOut: () => void;
}

export function DashboardHeader({
  email,
  lastUpdate,
  simCount,
  isCache,
  onSignOut,
}: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-card/80 backdrop-blur">
      <div className="container flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-foreground sm:text-lg">Bảng điều khiển</h1>
          <p className="truncate text-xs text-muted-foreground sm:text-sm">{email}</p>
          <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span>
              Cập nhật kho: {lastUpdate} · {simCount.toLocaleString("vi-VN")} SIM
            </span>
            {isCache ? (
              <Badge className="border-none bg-gold/15 px-2 py-px text-[10px] font-medium text-gold">
                dữ liệu tạm
              </Badge>
            ) : null}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="px-2.5 sm:px-3"
            onClick={onSignOut}
            aria-label="Đăng xuất"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
