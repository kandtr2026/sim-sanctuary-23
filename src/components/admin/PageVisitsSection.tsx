"use client";

import { useEffect, useState } from "react";
import { Globe, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type PageVisitRow = Tables<"page_visits">;

const Skeleton = () => (
  <div className="space-y-3">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3">
        <div className="h-3 w-2/5 animate-pulse rounded bg-muted" />
        <div className="h-3 w-1/5 animate-pulse rounded bg-muted" />
        <div className="ml-auto h-3 w-16 animate-pulse rounded bg-muted" />
      </div>
    ))}
  </div>
);

export function PageVisitsSection() {
  const [visits, setVisits] = useState<PageVisitRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("page_visits")
        .select("*")
        .order("visited_at", { ascending: false })
        .limit(50);

      if (err) {
        setError(err.message);
      } else {
        setVisits(data ?? []);
      }
    } catch {
      setError("Không thể tải dữ liệu");
    }
    setLoading(false);
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-4">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Globe className="h-4 w-4 text-primary" />
          Trang khách đã xem
        </h2>
        <button
          onClick={() => void load()}
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Làm mới
        </button>
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-card p-4 shadow-card">
          <Skeleton />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-6 py-10 text-center shadow-card">
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={() => void load()}
            className="text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            Thử lại
          </button>
        </div>
      ) : visits.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card px-6 py-12 text-center shadow-card">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <Globe className="h-6 w-6" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">Chưa có lượt xem nào</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Dữ liệu sẽ xuất hiện sau khi có khách truy cập trang.
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 font-medium">Đường dẫn</th>
                <th className="hidden px-4 py-2.5 font-medium sm:table-cell">Referrer</th>
                <th className="px-4 py-2.5 font-medium">Thời gian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visits.map((visit) => (
                <tr key={visit.id} className="transition-colors hover:bg-muted/30">
                  <td className="max-w-[200px] truncate px-4 py-2.5 font-mono text-xs text-foreground">
                    {visit.path}
                  </td>
                  <td className="hidden max-w-[160px] truncate px-4 py-2.5 text-xs text-muted-foreground sm:table-cell sm:max-w-[200px]">
                    {visit.referrer || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-xs text-muted-foreground">
                    {new Date(visit.visited_at).toLocaleString("vi-VN")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
            {visits.length} lượt gần nhất — tự động ghi khi khách đổi trang.
          </div>
        </div>
      )}
    </section>
  );
}