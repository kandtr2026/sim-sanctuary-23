"use client";

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import SIMCardNew from "@/components/SIMCardNew";
import type { NormalizedSIM, QuyType } from "@/lib/simUtils";

/**
 * Reusable "client island" for SIM category pages. Server Components render the
 * page shell + metadata + JSON-LD; this component pulls SIMs from the server via
 * `/api/sims` (server-side filter/search over the FULL catalogue — no more
 * shipping ~10MB CSV / stuck-at-14k cache to the client).
 *
 * Search + filter đều chạy ở server bằng `src/lib/simFilter.ts` (một nguồn sự
 * thật). Ô tìm debounce ~300ms rồi gọi lại API; skeleton hiện lúc tải lần đầu.
 */
interface CategorySimGridProps {
  /** Heading shown above the grid. */
  title: string;
  /** Placeholder text for the search box. */
  searchPlaceholder: string;
  /** Empty-state message when no SIM matches. */
  emptyText: string;
  /** Sim digits must end with one of these suffixes (e.g. "39"). */
  matchSuffixes?: string[];
  /** Sim tags must include one of these (e.g. "Thần tài"). */
  matchTags?: string[];
  /** Sim digits must start with one of these prefixes (e.g. "090"). */
  matchPrefixes?: string[];
  /** Sim's last digit must be one of these (used for mệnh-based filtering). */
  matchLastDigits?: string[];
  /** Show the full kho without filtering (used by phong thủy hợp mệnh). */
  matchAll?: boolean;
  /**
   * When set, cards render the quý block highlighted (e.g. Ngũ quý → *77777*).
   * Matches the quý badges the homepage SimBrowser passes to the same cards.
   */
  quyFilter?: QuyType | null;
}

const CategorySimGrid = ({
  title,
  searchPlaceholder,
  emptyText,
  matchSuffixes,
  matchTags,
  matchPrefixes,
  matchLastDigits,
  matchAll,
  quyFilter,
}: CategorySimGridProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  // Debounce ô tìm: gõ xong ~300ms mới gọi lại API (không spam mỗi phím).
  useEffect(() => {
    const timer = setTimeout(() => setActiveSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const queryKey = [
    "category-sims",
    matchAll ?? false,
    matchPrefixes ?? [],
    matchSuffixes ?? [],
    matchTags ?? [],
    matchLastDigits ?? [],
    quyFilter ?? null,
    activeSearch,
  ] as const;

  const { data, isLoading } = useQuery<{ items: NormalizedSIM[]; total: number }>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeSearch.trim()) params.set("search", activeSearch);
      if (matchAll) params.set("matchAll", "true");
      if (matchPrefixes?.length) params.set("prefixes", matchPrefixes.join(","));
      if (matchSuffixes?.length) params.set("suffixes", matchSuffixes.join(","));
      if (matchTags?.length) params.set("tags", matchTags.join(","));
      if (matchLastDigits?.length) params.set("lastDigits", matchLastDigits.join(","));
      if (quyFilter) params.set("quyType", quyFilter);
      params.set("limit", "30");

      const res = await fetch(`/api/sims?${params.toString()}`);
      if (!res.ok) throw new Error(`/api/sims HTTP ${res.status}`);
      return res.json();
    },
    staleTime: 60_000,
  });

  const displaySims = data?.items ?? [];
  const hasActiveSearch = activeSearch.trim().length > 0;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Bấm Enter / nút Tìm thì áp dụng ngay, không chờ debounce.
    setActiveSearch(searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setActiveSearch("");
  };

  return (
    <section id="kho-sim" className="rounded-xl border border-border bg-card p-4 shadow-card md:p-6">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
          <span className="h-8 w-1 rounded-full bg-primary" />
          {hasActiveSearch ? `Kết quả tìm kiếm "${activeSearch}"` : title}
        </h2>
      </div>

      <form onSubmit={handleSearch} className="mx-auto mb-5 max-w-lg">
        <div className="flex overflow-hidden rounded-xl bg-card shadow-elevated ring-1 ring-gold/20">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              inputMode="tel"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.replace(/[^0-9*]/g, ""))}
              placeholder={searchPlaceholder}
              className="w-full bg-card py-3 pl-12 pr-3 text-base text-foreground focus:outline-none md:py-3.5"
            />
          </div>
          <button
            type="submit"
            className="btn-cta flex items-center gap-2 whitespace-nowrap rounded-none px-5 text-sm font-bold md:px-7 md:text-base"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Tìm SIM</span>
          </button>
        </div>
      </form>

      {hasActiveSearch && (
        <button onClick={clearSearch} className="mb-4 text-sm text-primary hover:underline">
          ← Quay lại kho {title.toLowerCase()}
        </button>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-3 rounded-xl border border-border bg-card p-4">
              <div className="h-4 w-16 rounded bg-muted" />
              <div className="h-6 w-full rounded bg-muted" />
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="h-8 w-full rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : displaySims.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displaySims.map((sim) => (
            <SIMCardNew key={sim.id} sim={sim} quyFilter={quyFilter} />
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-muted-foreground">{emptyText}</div>
      )}
    </section>
  );
};

export default CategorySimGrid;
