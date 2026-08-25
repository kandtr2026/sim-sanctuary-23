"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import SearchBarAdvanced from "@/components/SearchBarAdvanced";
import QuickPickChips from "@/components/QuickPickChips";
import AdvancedFilterSidebar from "@/components/AdvancedFilterSidebar";
import SIMCardNew from "@/components/SIMCardNew";
import RightSidebar from "@/components/RightSidebar";
import ProcessSteps from "@/components/ProcessSteps";
import IntroSection from "@/components/IntroSection";
import ActiveFilterChips from "@/components/ActiveFilterChips";
import SortDropdown from "@/components/SortDropdown";
import MobileFilterDrawer from "@/components/MobileFilterDrawer";
import EmptyStateHelper from "@/components/EmptyStateHelper";
import { defaultFilterState, getPromotionalData } from "@/hooks/useSimData";
import type { FilterState } from "@/hooks/useSimData";
import { ChevronDown, ArrowUp, Loader2, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PRICE_RANGES } from "@/lib/simUtils";
import type { NormalizedSIM, QuyType } from "@/lib/simUtils";

const ITEMS_PER_PAGE = 40;

// ── Port from useSimData: relax order + neutral helpers (thuần, không đọc browser) ──
const RELAX_ORDER: (keyof FilterState)[] = [
  "customSuffix",
  "selectedSuffixes",
  "selectedPrefixes3",
  "selectedPrefixes4",
  "quyType",
  "quyPosition",
  "vipFilter",
  "selectedTags",
  "priceRanges",
  "customPriceMin",
  "customPriceMax",
  "selectedNetworks",
  "searchQuery",
];

const neutralFilterValue = <K extends keyof FilterState>(key: K): FilterState[K] => {
  const neutral = defaultFilterState[key];
  return (Array.isArray(neutral) ? [...neutral] : neutral) as FilterState[K];
};

const resetFilterKey = <K extends keyof FilterState>(target: FilterState, key: K): void => {
  target[key] = neutralFilterValue(key);
};

const isFilterActive = <K extends keyof FilterState>(filters: FilterState, key: K): boolean => {
  const value = filters[key];
  if (Array.isArray(value)) return value.length > 0;
  return value !== defaultFilterState[key];
};

const SimBrowser = () => {
  const [filters, setFilters] = useState<FilterState>(defaultFilterState);
  const [limit, setLimit] = useState(ITEMS_PER_PAGE);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [hashProcessed, setHashProcessed] = useState(false);
  const queryClient = useQueryClient();

  // Reset phân trang mỗi khi filter đổi (giữ hành vi "xem thêm" như cũ).
  useEffect(() => {
    setLimit(ITEMS_PER_PAGE);
  }, [filters]);

  // ── Filter handlers (port từ useSimData — chỉ là setState cục bộ) ─────────
  const updateFilter = useCallback(<K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const togglePriceRange = useCallback((index: number) => {
    setFilters((prev) => ({
      ...prev,
      priceRanges: prev.priceRanges.includes(index)
        ? prev.priceRanges.filter((i) => i !== index)
        : [...prev.priceRanges, index],
    }));
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setFilters((prev) => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter((t) => t !== tag)
        : [...prev.selectedTags, tag],
    }));
  }, []);

  const toggleNetwork = useCallback((network: string) => {
    setFilters((prev) => ({
      ...prev,
      selectedNetworks: prev.selectedNetworks.includes(network)
        ? prev.selectedNetworks.filter((n) => n !== network)
        : [...prev.selectedNetworks, network],
    }));
  }, []);

  const toggleSuffix = useCallback((suffix: string) => {
    setFilters((prev) => ({
      ...prev,
      selectedSuffixes: prev.selectedSuffixes.includes(suffix)
        ? prev.selectedSuffixes.filter((s) => s !== suffix)
        : [...prev.selectedSuffixes, suffix],
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilterState);
    toast.info("Đã đặt lại bộ lọc");
  }, []);

  const relaxFilters = useCallback(() => {
    const relaxedMessages: string[] = [];
    setFilters((prev) => {
      const newFilters = { ...prev };
      for (const key of RELAX_ORDER) {
        if (isFilterActive(newFilters, key)) {
          resetFilterKey(newFilters, key);
          const keyLabels: Record<string, string> = {
            searchQuery: "Từ khóa tìm kiếm",
            selectedSuffixes: "Bộ lọc đuôi số",
            customSuffix: "Đuôi số tùy chỉnh",
            selectedPrefixes3: "Bộ lọc đầu số",
            selectedPrefixes4: "Bộ lọc đầu 4 số",
            quyType: "Bộ lọc quý",
            quyPosition: "Vị trí quý",
            vipFilter: "Bộ lọc VIP",
            selectedTags: "Bộ lọc loại số",
            priceRanges: "Khoảng giá",
            customPriceMin: "Giá tối thiểu",
            customPriceMax: "Giá tối đa",
            selectedNetworks: "Bộ lọc mạng",
          };
          relaxedMessages.push(keyLabels[key] || key);
          break;
        }
      }
      return newFilters;
    });
    if (relaxedMessages.length > 0) toast.info(`Đã bỏ: ${relaxedMessages.join(", ")}`);
  }, []);

  const relaxAllFilters = useCallback(() => {
    setFilters((prev) => {
      const next = { ...prev };
      for (const key of RELAX_ORDER) resetFilterKey(next, key);
      return next;
    });
    toast.success("Đã nới lỏng tất cả bộ lọc");
  }, []);

  // ── Active filter chips (port từ useSimData) ──────────────────────────────
  const activeFilters = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];

    if (filters.searchQuery) {
      chips.push({ key: "search", label: `Tìm: ${filters.searchQuery}`, onRemove: () => updateFilter("searchQuery", "") });
    }
    filters.priceRanges.forEach((index) => {
      chips.push({
        key: `price-${index}`,
        label: PRICE_RANGES[index]?.label ?? `#${index}`,
        onRemove: () => togglePriceRange(index),
      });
    });
    if (filters.customPriceMin !== null || filters.customPriceMax !== null) {
      const min = filters.customPriceMin ? `${(filters.customPriceMin / 1000000).toFixed(0)}tr` : "0";
      const max = filters.customPriceMax ? `${(filters.customPriceMax / 1000000).toFixed(0)}tr` : "∞";
      chips.push({
        key: "custom-price",
        label: `${min} - ${max}`,
        onRemove: () => {
          updateFilter("customPriceMin", null);
          updateFilter("customPriceMax", null);
        },
      });
    }
    filters.selectedTags.forEach((tag) => {
      chips.push({ key: `tag-${tag}`, label: tag, onRemove: () => toggleTag(tag) });
    });
    filters.selectedNetworks.forEach((network) => {
      chips.push({ key: `network-${network}`, label: network, onRemove: () => toggleNetwork(network) });
    });
    filters.selectedPrefixes3.forEach((prefix) => {
      chips.push({
        key: `prefix3-${prefix}`,
        label: `Đầu ${prefix}`,
        onRemove: () => updateFilter("selectedPrefixes3", filters.selectedPrefixes3.filter((p) => p !== prefix)),
      });
    });
    filters.selectedSuffixes.forEach((suffix) => {
      chips.push({ key: `suffix-${suffix}`, label: `Đuôi ${suffix}`, onRemove: () => toggleSuffix(suffix) });
    });
    if (filters.customSuffix) {
      chips.push({ key: "custom-suffix", label: `Đuôi ${filters.customSuffix}`, onRemove: () => updateFilter("customSuffix", "") });
    }
    if (filters.vipFilter === "only") {
      chips.push({ key: "vip-only", label: "Chỉ VIP", onRemove: () => updateFilter("vipFilter", "all") });
    } else if (filters.vipFilter === "hide") {
      chips.push({ key: "vip-hide", label: "Ẩn VIP", onRemove: () => updateFilter("vipFilter", "all") });
    }
    if (filters.quyType) {
      chips.push({
        key: "quyType",
        label: filters.quyType,
        onRemove: () => {
          updateFilter("quyType", null);
          updateFilter("quyPosition", null);
        },
      });
    }

    return chips;
  }, [filters, updateFilter, togglePriceRange, toggleTag, toggleNetwork, toggleSuffix]);

  const activeConstraints = useMemo(() => {
    const constraints: { key: keyof FilterState; label: string; onRemove: () => void }[] = [];

    if (filters.searchQuery) {
      constraints.push({ key: "searchQuery", label: `Tìm: "${filters.searchQuery}"`, onRemove: () => updateFilter("searchQuery", "") });
    }
    if (filters.selectedSuffixes.length > 0) {
      constraints.push({ key: "selectedSuffixes", label: `Đuôi số: ${filters.selectedSuffixes.join(", ")}`, onRemove: () => updateFilter("selectedSuffixes", []) });
    }
    if (filters.customSuffix) {
      constraints.push({ key: "customSuffix", label: `Đuôi: ${filters.customSuffix}`, onRemove: () => updateFilter("customSuffix", "") });
    }
    if (filters.selectedPrefixes3.length > 0) {
      constraints.push({ key: "selectedPrefixes3", label: `Đầu số: ${filters.selectedPrefixes3.join(", ")}`, onRemove: () => updateFilter("selectedPrefixes3", []) });
    }
    if (filters.selectedTags.length > 0) {
      constraints.push({ key: "selectedTags", label: `Loại: ${filters.selectedTags.join(", ")}`, onRemove: () => updateFilter("selectedTags", []) });
    }
    if (filters.priceRanges.length > 0) {
      constraints.push({ key: "priceRanges", label: "Khoảng giá đã chọn", onRemove: () => updateFilter("priceRanges", []) });
    }
    if (filters.customPriceMin !== null || filters.customPriceMax !== null) {
      const min = filters.customPriceMin ? `${(filters.customPriceMin / 1000000).toFixed(0)}tr` : "0";
      const max = filters.customPriceMax ? `${(filters.customPriceMax / 1000000).toFixed(0)}tr` : "∞";
      constraints.push({
        key: "customPriceMin",
        label: `Giá: ${min} - ${max}`,
        onRemove: () => {
          updateFilter("customPriceMin", null);
          updateFilter("customPriceMax", null);
        },
      });
    }
    if (filters.selectedNetworks.length > 0) {
      constraints.push({ key: "selectedNetworks", label: `Mạng: ${filters.selectedNetworks.join(", ")}`, onRemove: () => updateFilter("selectedNetworks", []) });
    }
    if (filters.quyType) {
      constraints.push({
        key: "quyType",
        label: filters.quyType,
        onRemove: () => {
          updateFilter("quyType", null);
          updateFilter("quyPosition", null);
        },
      });
    }

    return constraints;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, updateFilter]);

  // ── Auto-apply filter từ SEO landing hashes (giữ nguyên như cũ) ───────────
  useEffect(() => {
    if (hashProcessed) return;
    const hash = window.location.hash || "";
    if (!hash) return;

    const birthYear = hash.match(/^#ns=(\d{4})$/);
    if (birthYear) {
      updateFilter("selectedTags", ["Năm sinh"]);
      updateFilter("searchQuery", `*${birthYear[1]}`);
    } else if (hash === "#price=under-1m") {
      togglePriceRange(0);
    } else if (hash === "#landing=tamhoa-1-3tr") {
      toggleTag("Tam hoa");
      togglePriceRange(1);
    } else {
      return;
    }

    history.replaceState(null, "", window.location.pathname + window.location.search);
    setHashProcessed(true);
  }, [hashProcessed, updateFilter, togglePriceRange, toggleTag]);

  // ── Facets (tagCounts / prefixes cho sidebar) — 1 lần, cache lâu ──────────
  const facetsQuery = useQuery<{
    items: NormalizedSIM[];
    total: number;
    facets?: { tagCounts: Record<string, number>; prefixes: { prefix3: string[]; prefix4: string[] } };
  }>({
    queryKey: ["sims-facets"],
    queryFn: async () => {
      const res = await fetch("/api/sims?includeFacets=1&limit=1");
      if (!res.ok) throw new Error(`/api/sims facets HTTP ${res.status}`);
      return res.json();
    },
    staleTime: 60 * 60 * 1000,
  });

  const tagCounts = facetsQuery.data?.facets?.tagCounts ?? {};
  const prefixes = facetsQuery.data?.facets?.prefixes ?? { prefix3: [], prefix4: [] };
  const catalogueTotal = facetsQuery.data?.total ?? 0;

  // ── Main query: toàn bộ filter state + trang (server lọc full 49k) ────────
  const queryKey = ["sims", filters, limit] as const;

  const { data, isLoading, isFetching, error, refetch } = useQuery<{
    items: NormalizedSIM[];
    total: number;
  }>({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.searchQuery.trim()) params.set("search", filters.searchQuery);
      if (filters.priceRanges.length) params.set("priceRanges", filters.priceRanges.join(","));
      if (filters.customPriceMin !== null) params.set("priceMin", String(filters.customPriceMin));
      if (filters.customPriceMax !== null) params.set("priceMax", String(filters.customPriceMax));
      if (filters.selectedTags.length) params.set("tags", filters.selectedTags.join(","));
      if (filters.selectedNetworks.length) params.set("networks", filters.selectedNetworks.join(","));
      const prefixList = [...filters.selectedPrefixes3, ...filters.selectedPrefixes4];
      if (prefixList.length) params.set("prefixes", prefixList.join(","));
      const suffixes = [...filters.selectedSuffixes];
      if (filters.customSuffix) suffixes.push(filters.customSuffix);
      if (suffixes.length) params.set("suffixes", suffixes.join(","));
      if (filters.vipFilter !== "all") params.set("vip", filters.vipFilter);
      if (filters.sortBy !== "default") params.set("sort", filters.sortBy);
      if (filters.mobifoneFirst) params.set("mobifoneFirst", "1");
      if (filters.quyType) params.set("quyType", filters.quyType);
      params.set("limit", String(limit));

      const res = await fetch(`/api/sims?${params.toString()}`);
      if (!res.ok) throw new Error(`/api/sims HTTP ${res.status}`);
      return res.json();
    },
  });

  const forceReload = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["sims"] });
    queryClient.invalidateQueries({ queryKey: ["sims-facets"] });
    toast.info("Đang tải lại dữ liệu...");
  }, [queryClient]);

  const displayedSIMs = data?.items ?? [];
  const total = data?.total ?? 0;
  const hasMoreItems = !!data && total > displayedSIMs.length;
  const remainingCount = Math.max(0, total - displayedSIMs.length);

  const handleLoadMore = useCallback(() => {
    setLimit((prev) => prev + ITEMS_PER_PAGE);
  }, []);

  // ── Quý badge cho card (server lọc theo quyType; badge suy từ filter state) ─
  const isQuadOn = filters.quyType === "Tứ quý" || filters.selectedTags.includes("Tứ quý");
  const isQuintOn = filters.quyType === "Ngũ quý" || filters.selectedTags.includes("Ngũ quý");
  const isHexOn = filters.quyType === "Lục quý" || filters.selectedTags.includes("Lục quý");
  const activeQuyType: QuyType | null = isHexOn ? "Lục quý" : isQuintOn ? "Ngũ quý" : isQuadOn ? "Tứ quý" : null;

  const searchSuggestion = useMemo(() => {
    if (total === 0 && filters.searchQuery) {
      const query = filters.searchQuery;
      if (query.includes("*")) return "Thử bỏ dấu * hoặc giảm số ký tự";
      if (query.length > 6) return "Thử tìm với ít số hơn (4-6 số)";
    }
    return null;
  }, [total, filters.searchQuery]);

  const noData = !isLoading && !error && facetsQuery.data !== undefined && catalogueTotal === 0;
  const noMatch = !isLoading && !error && !!data && total === 0 && catalogueTotal > 0;

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const handleScroll = () => setShowBackToTop(window.scrollY > 500);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <div
        className="sticky z-40 -mx-4 mb-4 border-b border-border bg-background/95 px-4 py-1.5 shadow-sm backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:shadow-none lg:backdrop-blur-none"
        style={{ top: "var(--nav-height)" }}
      >
        <SearchBarAdvanced
          value={filters.searchQuery}
          onChange={(value) => updateFilter("searchQuery", value)}
        />
      </div>

      <QuickPickChips
        filters={filters}
        onTogglePriceRange={togglePriceRange}
        onToggleTag={toggleTag}
        onUpdateFilter={updateFilter}
      />

      <div className="lg:hidden mb-4 flex justify-between items-center">
        <MobileFilterDrawer
          filters={filters}
          tagCounts={tagCounts}
          prefixes={prefixes}
          activeFilterCount={activeFilters.length}
          onTogglePriceRange={togglePriceRange}
          onToggleTag={toggleTag}
          onToggleNetwork={toggleNetwork}
          onToggleSuffix={toggleSuffix}
          onUpdateFilter={updateFilter}
          onReset={resetFilters}
        />
        <SortDropdown value={filters.sortBy} onChange={(value) => updateFilter("sortBy", value)} />
      </div>

      <div className="flex gap-4 lg:gap-6">
        <aside className="hidden lg:block w-[160px] flex-shrink-0">
          <AdvancedFilterSidebar
            filters={filters}
            tagCounts={tagCounts}
            prefixes={prefixes}
            onTogglePriceRange={togglePriceRange}
            onToggleTag={toggleTag}
            onToggleNetwork={toggleNetwork}
            onToggleSuffix={toggleSuffix}
            onUpdateFilter={updateFilter}
          />
        </aside>

        <section className="flex-1 min-w-0">
          <div className="bg-card rounded-2xl shadow-card border border-border/50 p-3 md:p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4 mb-4">
              <div className="hidden lg:block">
                <SortDropdown value={filters.sortBy} onChange={(value) => updateFilter("sortBy", value)} />
              </div>
            </div>

            <ActiveFilterChips
              chips={activeFilters}
              resultCount={total}
              onResetAll={resetFilters}
              hideResultCount={true}
            />

            {isLoading && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                <span className="text-muted-foreground">Đang tải dữ liệu...</span>
                <span className="text-xs text-muted-foreground mt-1">Lần đầu có thể mất vài giây</span>
              </div>
            )}

            {error && !isLoading && (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                  <WifiOff className="w-8 h-8 text-destructive" />
                </div>
                <p className="text-destructive text-lg font-medium">Không thể tải dữ liệu</p>
                <p className="text-sm text-muted-foreground mt-2 mb-4">Vui lòng kiểm tra kết nối mạng và thử lại</p>
                <Button onClick={forceReload} disabled={isFetching} className="gap-2">
                  <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
                  Tải lại dữ liệu
                </Button>
              </div>
            )}

            {!isLoading && !error && displayedSIMs.length > 0 && (
              <>
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-2.5 md:gap-3 mt-4">
                  {displayedSIMs.map((sim) => (
                    <div key={sim.id} className="min-w-0">
                      <SIMCardNew
                        sim={sim}
                        promotional={getPromotionalData(sim.id)}
                        quyFilter={activeQuyType}
                        searchQuery={filters.searchQuery}
                      />
                    </div>
                  ))}
                </div>

                {hasMoreItems && (
                  <div className="mt-6 text-center">
                    <button onClick={handleLoadMore} className="btn-cta inline-flex items-center gap-2 px-8 py-3 text-base">
                      <ChevronDown className="w-5 h-5" />
                      <span>Xem thêm {Math.min(remainingCount, ITEMS_PER_PAGE)} SIM</span>
                    </button>
                    <p className="text-sm text-muted-foreground mt-2">Còn {remainingCount.toLocaleString()} SIM khác</p>
                  </div>
                )}

                {!hasMoreItems && total > ITEMS_PER_PAGE && (
                  <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">✓ Đã hiển thị tất cả {total.toLocaleString()} SIM</p>
                  </div>
                )}
              </>
            )}

            {noMatch && (
              <EmptyStateHelper
                constraints={activeConstraints}
                searchSuggestion={searchSuggestion}
                onRelaxOne={relaxFilters}
                onRelaxAll={relaxAllFilters}
                onReset={resetFilters}
                searchQuery={filters.searchQuery}
                filters={filters}
                quyFilter={activeQuyType}
                precomputedSuggestions={[]}
              />
            )}

            {noData && (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">Chưa có dữ liệu SIM</p>
                <Button onClick={forceReload} variant="outline" className="mt-4 gap-2">
                  <RefreshCw className="w-4 h-4" />
                  Tải lại
                </Button>
              </div>
            )}
          </div>
        </section>

        <aside className="hidden lg:block w-[220px] flex-shrink-0">
          <RightSidebar />
        </aside>
      </div>

      <ProcessSteps />

      <section className="my-8">
        <IntroSection simCount={catalogueTotal} />
      </section>

      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed left-4 z-[60] w-11 h-11 md:w-12 md:h-12 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-colors duration-200 animate-fade-in"
          style={{ bottom: "calc(var(--sticky-cta-height) + 12px)" }}
          aria-label="Về đầu trang"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </>
  );
};

export default SimBrowser;
