"use client";

import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ChevronLeft, ChevronRight, X, ArrowUpDown, Filter, Sparkles, Phone, Compass } from "lucide-react";
import SIMCardNew from "@/components/SIMCardNew";
import type { NormalizedSIM, QuyType, SortOption } from "@/lib/simUtils";

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

const PRICE_FILTERS = [
  { label: "Tất cả giá", value: null },
  { label: "Dưới 1 triệu", value: "0" },
  { label: "1 - 3 triệu", value: "1" },
  { label: "3 - 5 triệu", value: "2" },
  { label: "5 - 10 triệu", value: "3" },
  { label: "10 - 50 triệu", value: "4" },
  { label: "Trên 50 triệu", value: "5,6,7,8" },
];

const PREFIX_FILTERS = [
  { label: "Tất cả đầu số", value: null },
  { label: "Đầu 090", value: "090" },
  { label: "Đầu 093", value: "093" },
  { label: "Đầu 089", value: "089" },
  { label: "Đầu 07x", value: "070,076,077,078,079" },
];

const MENH_FILTERS = [
  { label: "Tất cả mệnh", value: null, color: null },
  { label: "Mệnh Kim", value: "Kim", color: "#eab308" },
  { label: "Mệnh Mộc", value: "Mộc", color: "#22c55e" },
  { label: "Mệnh Thủy", value: "Thủy", color: "#0ea5e9" },
  { label: "Mệnh Hỏa", value: "Hỏa", color: "#ef4444" },
  { label: "Mệnh Thổ", value: "Thổ", color: "#a16207" },
];

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
  { label: "Điểm phong thuỷ thấp dần", value: "beauty" },
  { label: "Giá thấp đến cao", value: "price_asc" },
  { label: "Giá cao đến thấp", value: "price_desc" },
];

const ITEMS_PER_PAGE = 60;

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
  const [selectedPrice, setSelectedPrice] = useState<string | null>(null);
  const [selectedPrefix, setSelectedPrefix] = useState<string | null>(null);
  const [selectedMenh, setSelectedMenh] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>("beauty");
  const [currentPage, setCurrentPage] = useState(1);

  // Debounce ô tìm kiếm ~300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setActiveSearch(searchQuery);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const queryKey = [
    "category-sims-v2",
    matchAll ?? false,
    matchPrefixes ?? [],
    selectedPrefix ?? "",
    selectedMenh ?? "",
    matchSuffixes ?? [],
    matchTags ?? [],
    matchLastDigits ?? [],
    quyFilter ?? null,
    activeSearch,
    selectedPrice ?? "",
    sortBy,
    currentPage,
  ] as const;

  const { data, isLoading, isPlaceholderData } = useQuery<{ items: NormalizedSIM[]; total: number }>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (activeSearch.trim()) params.set("search", activeSearch);
      if (matchAll) params.set("matchAll", "true");

      // Ghép prefix mặc định với prefix người dùng chọn
      const effectivePrefixes: string[] = [];
      if (selectedPrefix) {
        effectivePrefixes.push(...selectedPrefix.split(","));
      } else if (matchPrefixes?.length) {
        effectivePrefixes.push(...matchPrefixes);
      }
      if (effectivePrefixes.length) params.set("prefixes", effectivePrefixes.join(","));

      if (matchSuffixes?.length) params.set("suffixes", matchSuffixes.join(","));
      if (matchTags?.length) params.set("tags", matchTags.join(","));
      if (matchLastDigits?.length) params.set("lastDigits", matchLastDigits.join(","));
      if (quyFilter) params.set("quyType", quyFilter);

      if (selectedPrice) params.set("priceRanges", selectedPrice);
      if (selectedMenh) params.set("menh", selectedMenh);
      if (sortBy) params.set("sort", sortBy);

      params.set("limit", String(ITEMS_PER_PAGE));
      params.set("offset", String(offset));

      const res = await fetch(`/api/sims?${params.toString()}`);
      if (!res.ok) throw new Error(`/api/sims HTTP ${res.status}`);
      return res.json();
    },
    staleTime: 60_000,
  });

  const displaySims = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE) || 1;
  const hasActiveSearch = activeSearch.trim().length > 0;
  const hasActiveFilters = Boolean(selectedPrice || selectedPrefix || selectedMenh || hasActiveSearch || sortBy !== "beauty");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchQuery);
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setSearchQuery("");
    setActiveSearch("");
    setSelectedPrice(null);
    setSelectedPrefix(null);
    setSelectedMenh(null);
    setSortBy("beauty");
    setCurrentPage(1);
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    const element = document.getElementById("kho-sim");
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // Tạo mảng số trang hiển thị thông minh
  const pageNumbers = useMemo(() => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [currentPage, totalPages]);

  return (
    <section id="kho-sim" className="rounded-2xl border border-border/80 bg-card p-4 shadow-card md:p-6 scroll-mt-20">
      {/* ── 1. TIÊU ĐỀ 1 DÒNG DUY NHẤT & SỐ LƯỢNG KHO (Chuẩn Sim Thăng Long) ──────────────── */}
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-border/40 pb-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className="h-5 w-1.5 rounded-full bg-primary" />
          <h1 className="text-lg sm:text-xl font-black text-foreground">
            {hasActiveSearch ? `Tìm kiếm: "${activeSearch}"` : title}
          </h1>
          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 border border-red-500/30 px-2.5 py-0.5 text-xs font-bold text-red-500 dark:text-red-400">
            <Sparkles className="h-3 w-3" />
            <span>Số lượng: <strong>{total.toLocaleString("vi-VN")}</strong> SIM</span>
          </span>
        </div>

        <a
          href="https://zalo.me/0933686666"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-xs font-bold text-header-bg hover:bg-gold-light transition-all"
        >
          <Phone className="h-3.5 w-3.5" /> Chat Zalo tư vấn
        </a>
      </div>

      {/* ── 2. THANH TÌM KIẾM SỐ THÔNG MINH ─────────────────────────────── */}
      <div className="mb-5">
        <form onSubmit={handleSearch} className="mx-auto max-w-2xl">
          <div className="flex overflow-hidden rounded-xl bg-background border border-border shadow-sm focus-within:ring-2 focus-within:ring-primary/40 focus-within:border-primary transition-all">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                inputMode="tel"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.replace(/[^0-9*]/g, ""))}
                placeholder={searchPlaceholder}
                className="w-full bg-transparent py-3 pl-11 pr-9 text-base text-foreground focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              className="bg-primary hover:bg-primary/90 text-primary-foreground flex items-center gap-2 px-6 text-sm font-bold transition-colors"
            >
              <Search className="h-4 w-4" />
              <span>Tìm SIM</span>
            </button>
          </div>
        </form>

        {/* Hướng dẫn tìm nhanh */}
        <p className="mt-2 text-center text-xs text-muted-foreground">
          💡 <strong>Mẹo tìm nhanh:</strong> Gõ <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono font-semibold">*39</code> để tìm đuôi 39 · Gõ <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono font-semibold">090*</code> để tìm đầu 090 · Gõ <code className="bg-muted px-1.5 py-0.5 rounded text-foreground font-mono font-semibold">*68*</code> để tìm số chứa 68
        </p>
      </div>

      {/* ── 3. BỘ LỌC KHOẢNG GIÁ & ĐẦU SỐ (Quick Filter Pills) ──────────── */}
      <div className="mb-6 space-y-3 rounded-xl bg-muted/40 p-3.5 border border-border/60">
        {/* Lọc khoảng giá */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground min-w-[70px] flex items-center gap-1">
            <Filter className="h-3 w-3" /> Mức giá:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRICE_FILTERS.map((item) => {
              const active = selectedPrice === item.value;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setSelectedPrice(item.value);
                    setCurrentPage(1);
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                    active
                      ? "bg-primary text-primary-foreground font-bold shadow-sm"
                      : "bg-background text-foreground/80 hover:bg-muted border border-border/80"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lọc đầu số */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground min-w-[70px] flex items-center gap-1">
            📞 Đầu số:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PREFIX_FILTERS.map((item) => {
              const active = selectedPrefix === item.value;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setSelectedPrefix(item.value);
                    setCurrentPage(1);
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                    active
                      ? "bg-primary text-primary-foreground font-bold shadow-sm"
                      : "bg-background text-foreground/80 hover:bg-muted border border-border/80"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Lọc theo mệnh ngũ hành */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground min-w-[70px] flex items-center gap-1">
            <Compass className="h-3 w-3 text-gold" /> Hợp mệnh:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {MENH_FILTERS.map((item) => {
              const active = selectedMenh === item.value;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setSelectedMenh(item.value);
                    setCurrentPage(1);
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                    active
                      ? "bg-primary text-primary-foreground font-bold shadow-sm"
                      : "bg-background text-foreground/80 hover:bg-muted border border-border/80"
                  }`}
                >
                  {item.color && (
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ background: item.color }}
                    />
                  )}
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sắp xếp & Nút xoá lọc */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
              <ArrowUpDown className="h-3 w-3" /> Sắp xếp:
            </span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as SortOption);
                setCurrentPage(1);
              }}
              className="rounded-lg bg-background border border-border px-2.5 py-1 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-xs font-medium text-red-500 hover:text-red-600 hover:underline flex items-center gap-1"
            >
              <X className="h-3.5 w-3.5" /> Xoá tất cả bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Thông tin hiển thị */}
      <div className="mb-4 flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          Đang hiển thị <strong>{total > 0 ? offset + 1 : 0} - {Math.min(offset + ITEMS_PER_PAGE, total)}</strong> trong tổng số <strong>{total.toLocaleString("vi-VN")}</strong> SIM
        </span>
        <span>Trang {currentPage} / {totalPages}</span>
      </div>

      {/* ── 4. DANH SÁCH SIM (GRID CARD CHUẨN ĐẸP) ────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-3 rounded-xl border border-border bg-card p-4">
              <div className="flex justify-between">
                <div className="h-4 w-16 rounded bg-muted" />
                <div className="h-4 w-12 rounded bg-muted" />
              </div>
              <div className="h-8 w-full rounded bg-muted" />
              <div className="h-5 w-24 rounded bg-muted" />
              <div className="h-9 w-full rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : displaySims.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {displaySims.map((sim) => (
            <SIMCardNew key={sim.id} sim={sim} quyFilter={quyFilter} searchQuery={activeSearch} />
          ))}
        </div>
      ) : (
        <div className="my-8 rounded-2xl border border-primary/30 bg-primary/5 p-6 sm:p-8 text-center shadow-sm">
          {hasActiveSearch ? (
            <div className="mx-auto max-w-lg space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-foreground">
                Không tìm thấy sim {title} có chứa &ldquo;{activeSearch}&rdquo;
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Chuyên mục này chỉ lọc các số đặc thù {matchSuffixes?.length ? `(như đuôi ${matchSuffixes.join(", ")})` : ""}.
                <br />
                Quý khách có muốn tìm kiếm <strong>&ldquo;{activeSearch}&rdquo;</strong> trên <strong>toàn bộ kho hơn 50.000 SIM</strong> không?
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a
                  href={`/?q=${encodeURIComponent(activeSearch)}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs sm:text-sm font-bold text-primary-foreground shadow-md hover:bg-primary/90 transition-all hover:scale-[1.02]"
                >
                  <Search className="h-4 w-4" />
                  Tìm &ldquo;{activeSearch}&rdquo; trên toàn bộ kho số →
                </a>
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors"
                >
                  <X className="h-3.5 w-3.5" /> Xoá tìm kiếm
                </button>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-md space-y-3">
              <p className="text-sm text-muted-foreground">{emptyText}</p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  ✕ Xóa tất cả bộ lọc
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── 5. PHÂN TRANG (PAGINATION) DUYỆT 100% KHO SIM ──────────────── */}
      {totalPages > 1 && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/60 pt-6">
          <div className="text-xs text-muted-foreground">
            Trang <strong>{currentPage}</strong> trên <strong>{totalPages}</strong> ({total.toLocaleString("vi-VN")} SIM)
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage <= 1 || isPlaceholderData}
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Trước
            </button>

            {pageNumbers.map((p, idx) => {
              if (p === "...") {
                return (
                  <span key={`dots-${idx}`} className="px-2 text-xs text-muted-foreground">
                    ...
                  </span>
                );
              }
              const isActive = p === currentPage;
              return (
                <button
                  key={p}
                  onClick={() => goToPage(p)}
                  disabled={isPlaceholderData}
                  className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "border border-border hover:bg-muted text-foreground"
                  }`}
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= totalPages || isPlaceholderData}
              className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              Sau <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default CategorySimGrid;
