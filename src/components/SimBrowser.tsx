"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
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
import { useSimData, getPromotionalData } from "@/hooks/useSimData";
import { ChevronDown, ArrowUp, Loader2, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { NormalizedSIM, QuyType } from "@/lib/simUtils";

const ITEMS_PER_PAGE = 100;

// Helper: normalize any value to digit-only string
const normalizeSim = (v?: unknown) => String(v ?? "").replace(/\D/g, "");

/**
 * Widen a SIM to a plain record. The lookups below deliberately probe field
 * names that are NOT on NormalizedSIM (sim_normalized, msisdn, SimID, ...) —
 * they are legacy sheet column names kept as fallbacks so an upstream rename
 * degrades to a slower path instead of returning nothing. The cast is confined
 * to this one helper so the rest of the file stays typed.
 */
const asRow = (sim: NormalizedSIM | null | undefined) =>
  sim as unknown as Record<string, unknown> | null | undefined;

// Helper: robust digit extraction from SIM object
const getDigits = (sim: NormalizedSIM | null | undefined) => {
  const row = asRow(sim);

  // Try common fields first
  const direct =
    row?.rawDigits ??
    row?.sim_normalized ??
    row?.number ??
    row?.formattedNumber ??
    row?.sim ??
    row?.phone ??
    row?.msisdn ??
    row?.value ??
    row?.simNumber ??
    row?.displayNumber;

  const d1 = normalizeSim(direct);
  if (d1.length >= 8) return d1;

  // Fallback: scan object values for a string containing many digits
  if (row && typeof row === "object") {
    for (const k of Object.keys(row)) {
      const v = row[k];
      if (typeof v === "string" || typeof v === "number") {
        const d = normalizeSim(v);
        if (d.length >= 8) return d;
      }
    }
  }

  return "";
};

// Helper: extract digits from SIM - uses robust getDigits
const simDigits = (sim: NormalizedSIM | null | undefined) => getDigits(sim);

// Helper: normalize string for comparison
const norm = (s: unknown) => (s ?? "").toString().trim().toLowerCase().replace(/\s+/g, " ");

// Helper: check if array includes a label (case-insensitive)
const includesLabel = (arr: unknown, label: string) => {
  if (!Array.isArray(arr)) return false;
  const target = norm(label);
  return (arr as unknown[]).some((x) => {
    // Handle both string and object with label property
    const val = typeof x === "object" && x !== null ? (x as { label?: unknown }).label : x;
    return norm(val) === target;
  });
};

// Tail-based quý detection (inline for accuracy)
// Tứ quý: 4 số cuối giống nhau (tail-based)
const isQuadTail = (sim: NormalizedSIM) => {
  const d = simDigits(sim);
  return d.length >= 4 && /^(\d)\1{3}$/.test(d.slice(-4));
};

// Ngũ quý: 5 số giống nhau LIỀN NHAU ở bất kỳ vị trí nào
const isQuintAnywhere = (sim: NormalizedSIM) => {
  const d = simDigits(sim);
  if (d.length < 5) return false;
  return /(\d)\1{4}/.test(d);
};

// Lục quý: 6 số giống nhau LIỀN NHAU ở bất kỳ vị trí nào
const isHexAnywhere = (sim: NormalizedSIM) => {
  const d = simDigits(sim);
  if (d.length < 6) return false;
  return /(\d)\1{5}/.test(d);
};

// Helper functions for landing page random ordering

// Seeded random number generator (Mulberry32)
function createSeededRandom(seed: number): () => number {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Seeded shuffle - deterministic based on seed
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  const random = createSeededRandom(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getSimKey(sim: NormalizedSIM | null | undefined): string {
  const row = asRow(sim);
  return String(row?.SimID || row?.SimRef || row?.id || "");
}

// Get numeric VND price for landing filtering
// MUST use sim.price (numeric VND from normalizeSIM), NOT formatted string
function getFinalPriceForLanding(sim: NormalizedSIM | null | undefined): number {
  // Priority: sim.price (the effective price set during normalization)
  // This is the numeric VND value used for display and sorting
  const v = sim?.price;
  if (typeof v === "number" && Number.isFinite(v) && v > 0) {
    return v;
  }
  // Fallback to finalPricePick if price is not available
  const row = asRow(sim);
  const fallback = row?.finalPricePick ?? row?.finalPrice;
  if (typeof fallback === "number" && Number.isFinite(fallback) && fallback > 0) {
    return fallback;
  }
  return NaN;
}

// Reorder for landing: prioritize 3-5M, supplement from <3M, then rest
// Uses seeded shuffle for deterministic randomization
function reorderForLanding(list: NormalizedSIM[], seed: number = 0): NormalizedSIM[] {
  const min = 3_000_000;
  const max = 5_000_000;

  const in3to5: NormalizedSIM[] = [];
  const lowerThan3: NormalizedSIM[] = [];
  const others: NormalizedSIM[] = [];

  for (const sim of list) {
    const p = getFinalPriceForLanding(sim);
    if (!Number.isFinite(p)) {
      others.push(sim);
    } else if (p >= min && p <= max) {
      in3to5.push(sim);
    } else if (p < min) {
      lowerThan3.push(sim);
    } else {
      others.push(sim); // > 5tr
    }
  }

  // Apply seeded shuffle to each group
  const shuffled3to5 = seededShuffle(in3to5, seed);
  const shuffledLower = seededShuffle(lowerThan3, seed + 1);

  // Build initial100: prioritize 3-5M, supplement from <3M if needed
  let initial100 = shuffled3to5.slice(0, 100);
  if (initial100.length < 100) {
    const needed = 100 - initial100.length;
    initial100 = [...initial100, ...shuffledLower.slice(0, needed)];
  }

  // Track picked keys to avoid duplicates
  const pickedKeys = new Set(initial100.map(getSimKey));

  // Build rest: remaining from 3-5M, then <3M (not picked), then others
  const rest = [...shuffled3to5.slice(100), ...shuffledLower.filter((s) => !pickedKeys.has(getSimKey(s))), ...others];

  // Final deduplication
  const seen = new Set<string>();
  return [...initial100, ...rest].filter((s) => {
    const k = getSimKey(s);
    if (!k) return true;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

const SimBrowser = () => {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // Landing list freeze state - prevents re-randomization on scroll
  const [landingSeed, setLandingSeed] = useState(0);
  const [landingFrozenList, setLandingFrozenList] = useState<NormalizedSIM[]>([]);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Flag to prevent duplicate hash processing
  const [hashProcessed, setHashProcessed] = useState(false);
  const {
    allSims,
    filteredSims,
    isLoading,
    isFetching,
    error,
    forceReload,
    prefixes,
    tagCounts,
    filters,
    updateFilter,
    togglePriceRange,
    toggleTag,
    toggleNetwork,
    toggleSuffix,
    resetFilters,
    activeFilters,
    activeConstraints,
    relaxFilters,
    relaxAllFilters,
    searchSuggestion,
    searchSuggestions,
  } = useSimData();

  // Mark interaction and increment seed to trigger new random order
  const markInteracted = useCallback(() => {
    setHasInteracted(true);
    setLandingSeed((s) => s + 1);
    setVisibleCount(ITEMS_PER_PAGE); // Reset pagination when filter/search/sort
  }, []);

  // Wrapped filter handlers that trigger re-randomization
  const updateFilterWithSeed = useCallback(
    <K extends keyof typeof filters>(key: K, value: (typeof filters)[K]) => {
      markInteracted();
      return updateFilter(key, value);
    },
    [updateFilter, markInteracted],
  );

  const togglePriceRangeWithSeed = useCallback(
    (index: number) => {
      markInteracted();
      return togglePriceRange(index);
    },
    [togglePriceRange, markInteracted],
  );

  const toggleTagWithSeed = useCallback(
    (tag: string) => {
      markInteracted();
      return toggleTag(tag);
    },
    [toggleTag, markInteracted],
  );

  const toggleNetworkWithSeed = useCallback(
    (network: string) => {
      markInteracted();
      return toggleNetwork(network);
    },
    [toggleNetwork, markInteracted],
  );

  const toggleSuffixWithSeed = useCallback(
    (suffix: string) => {
      markInteracted();
      return toggleSuffix(suffix);
    },
    [toggleSuffix, markInteracted],
  );

  const resetFiltersWithSeed = useCallback(() => {
    markInteracted();
    return resetFilters();
  }, [resetFilters, markInteracted]);

  const relaxFiltersWithSeed = useCallback(() => {
    markInteracted();
    return relaxFilters();
  }, [relaxFilters, markInteracted]);

  const relaxAllFiltersWithSeed = useCallback(() => {
    markInteracted();
    return relaxAllFilters();
  }, [relaxAllFilters, markInteracted]);

  // Auto-apply filters from SEO landing hashes: #ns=YYYY, #price=under-1m,
  // #landing=tamhoa-1-3tr. One effect, one guard — previously three effects
  // shared a single flag, so whichever ran first blocked the other two.
  useEffect(() => {
    if (hashProcessed) return;

    const hash = window.location.hash || "";
    if (!hash) return;

    const birthYear = hash.match(/^#ns=(\d{4})$/);

    if (birthYear) {
      // Both updates batch into one render — no setTimeout needed.
      updateFilter("selectedTags", ["Năm sinh"]);
      updateFilter("searchQuery", `*${birthYear[1]}`);
    } else if (hash === "#price=under-1m") {
      // "Dưới 1 triệu" = index 0 in PRICE_RANGES
      togglePriceRange(0);
    } else if (hash === "#landing=tamhoa-1-3tr") {
      toggleTag("Tam hoa");
      // "1 - 3 triệu" = index 1 in PRICE_RANGES
      togglePriceRange(1);
    } else {
      // Unrecognised hash — leave it alone (e.g. anchor links).
      return;
    }

    // Clean the hash out of the URL so a refresh doesn't re-apply the filter.
    history.replaceState(null, "", window.location.pathname + window.location.search);
    setHashProcessed(true);
  }, [hashProcessed, updateFilter, togglePriceRange, toggleTag]);

  // Search suggestions from hook (per 5 search rules)
  const combinedSuggestions = searchSuggestions;

  // Check multiple sources for quý filter state
  // Include: filters.selectedTags (toggle chips), filters.quyType (dropdown), activeFilters (chips)
  const typeSources = [filters?.selectedTags, activeFilters].filter(Boolean);

  // Also check quyType directly (it's a separate filter field)
  const quyTypeOn = filters?.quyType;
  const isQuadOn = quyTypeOn === "Tứ quý" || typeSources.some((src) => includesLabel(src, "Tứ quý"));
  const isQuintOn = quyTypeOn === "Ngũ quý" || typeSources.some((src) => includesLabel(src, "Ngũ quý"));
  const isHexOn = quyTypeOn === "Lục quý" || typeSources.some((src) => includesLabel(src, "Lục quý"));
  const anyQuyOn = isQuadOn || isQuintOn || isHexOn;

  /**
   * Which quý badge the cards should show.
   *
   * The cards used to receive `filters.quyType` directly, but that field is only
   * written by the sidebar's quý buttons. The filter itself also honours
   * `filters.selectedTags` and `activeFilters` (see isQuadOn/isQuintOn/isHexOn
   * above), so a quý filter arriving through either of those returned correctly
   * filtered SIMs with no badge on any of them.
   *
   * Deriving the badge from the same flags the filter uses means it cannot drift
   * from the filter again, whichever control set it. The order matches
   * applyQuyFilter's precedence (Lục > Ngũ > Tứ), so the badge always names the
   * rule that actually produced the list — a number like 0777777840 shown under
   * the Ngũ quý filter is badged "Ngũ quý" even though it also has six 7s.
   */
  const activeQuyType: QuyType | null = isHexOn
    ? "Lục quý"
    : isQuintOn
      ? "Ngũ quý"
      : isQuadOn
        ? "Tứ quý"
        : null;

  // Helper: apply quý filter to a list (defined after quý state variables).
  // useCallback so the memos below can list it as a dependency instead of
  // silently depending on the flags it closes over — a plain function would get
  // a fresh identity every render and the dep arrays would be lying about what
  // the memo actually reads.
  const applyQuyFilter = useCallback(
    (list: NormalizedSIM[]) => {
      if (!anyQuyOn) return list;
      if (isHexOn) return list.filter(isHexAnywhere);
      if (isQuintOn) return list.filter(isQuintAnywhere);
      return list.filter(isQuadTail);
    },
    [anyQuyOn, isHexOn, isQuintOn],
  );

  // Check if any type selection is active (for landing detection)
  const hasTypeSelection =
    (Array.isArray(filters?.selectedTags) && filters.selectedTags.length > 0) || !!filters?.quyType;

  // Landing page: check if in default state (no search query AND no active filters AND no quý filter)
  const isDefaultLanding =
    !anyQuyOn &&
    !hasTypeSelection &&
    (!filters?.searchQuery || filters.searchQuery.replace(/[.\s]/g, "").trim() === "") &&
    (!activeFilters || activeFilters.length === 0);

  const finalCombinedSuggestions = isDefaultLanding
    ? reorderForLanding(combinedSuggestions, landingSeed)
    : combinedSuggestions;

  // Apply quý filter to suggestions
  const finalSuggestionsWithQuy = useMemo(
    () => applyQuyFilter(finalCombinedSuggestions),
    [finalCombinedSuggestions, applyQuyFilter],
  );

  const isNoResultsWithSuggestions =
    filteredSims.length === 0 && finalSuggestionsWithQuy.length > 0 && !isLoading && !error;

  // Freeze landing list when in default landing state (random once, keep on scroll)
  // Uses seeded shuffle for deterministic ordering based on landingSeed
  // IMPORTANT: Use allSims (full dataset), NOT filteredSims
  useEffect(() => {
    if (!isDefaultLanding) return;
    if (!allSims || allSims.length === 0) return;

    // Freeze the list based on seed (random once, stable during scroll)
    // reorderForLanding: prioritizes 3-5M SIMs (by finalPricePick), supplements from <3M if needed
    const next = reorderForLanding(allSims, landingSeed);

    setLandingFrozenList(next);
  }, [isDefaultLanding, landingSeed, allSims]);

  // When user returns to default landing after interaction, re-randomize once
  useEffect(() => {
    if (isDefaultLanding && hasInteracted) {
      setHasInteracted(false);
      setLandingSeed((s) => s + 1);
    }
  }, [isDefaultLanding, hasInteracted]);

  // Check if search query is empty (only whitespace/dots)
  const isSearchEmpty = !filters?.searchQuery || filters.searchQuery.replace(/[.\s]/g, "").trim() === "";

  // Apply quý filtering directly (not relying on types array)
  // Tứ quý: tail-based, Ngũ/Lục quý: anywhere in number
  // CRITICAL FIX: When quý filter is ON and no search query, filter from allSims directly
  // This prevents falling into "SỐ TƯƠNG TỰ" branch when filteredSims=0
  const filteredByQuy = useMemo(() => {
    // No quý filter active -> use normal flow
    if (!anyQuyOn) {
      return isDefaultLanding ? landingFrozenList : filteredSims;
    }

    // Quý filter is ON
    // If search is empty, filter directly from allSims (full dataset)
    // This ensures we get results even when filteredSims is empty
    const sourceList = isSearchEmpty ? allSims : filteredSims;

    // Priority: Lục > Ngũ > Tứ
    if (isHexOn) return sourceList.filter(isHexAnywhere);
    if (isQuintOn) return sourceList.filter(isQuintAnywhere);
    return sourceList.filter(isQuadTail);
  }, [
    filteredSims,
    allSims,
    isDefaultLanding,
    landingFrozenList,
    isSearchEmpty,
    anyQuyOn,
    // isQuadOn is deliberately absent: the Tứ quý branch is the unconditional
    // fallback, so this memo never reads it. anyQuyOn already covers the
    // on/off transition, and isQuintOn/isHexOn cover the precedence switches —
    // toggling Tứ quý always flips anyQuyOn, so no recompute is missed.
    isQuintOn,
    isHexOn,
  ]);

  // Base list for display: use filteredByQuy directly (it already handles landing vs filtered logic)
  const baseListForDisplay = filteredByQuy;

  // Reset visible count when landing state changes (filter applied/removed)
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [isDefaultLanding]);

  // Reset pagination when quý filter changes
  useEffect(() => {
    if (isQuadOn || isQuintOn || isHexOn) {
      setVisibleCount(ITEMS_PER_PAGE);
    }
  }, [isQuadOn, isQuintOn, isHexOn]);

  const displayedSIMs = useMemo(() => {
    return baseListForDisplay.slice(0, visibleCount);
  }, [baseListForDisplay, visibleCount]);

  const hasMoreItems = visibleCount < baseListForDisplay.length;
  const remainingCount = baseListForDisplay.length - visibleCount;

  // handleLoadMore: ONLY increases visibleCount, NO re-randomization
  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, baseListForDisplay.length));
  }, [baseListForDisplay.length]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Track scroll position for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* ONE search bar for both breakpoints. There used to be a second, desktop-only
          copy (<section id="sim-so" className="hidden lg:block">) sitting below the
          banner and the process steps, which meant two SearchBarAdvanced instances on
          one page and a desktop search box pushed 863px down. This is sticky on mobile
          and static on desktop. */}
      <div
        className="sticky z-40 -mx-4 mb-4 border-b border-border bg-background/95 px-4 py-1.5 shadow-sm backdrop-blur lg:static lg:mx-0 lg:border-0 lg:bg-transparent lg:px-0 lg:py-0 lg:shadow-none lg:backdrop-blur-none"
        style={{ top: "var(--nav-height)" }}
      >
        <SearchBarAdvanced
          value={filters.searchQuery}
          onChange={(value) => updateFilterWithSeed("searchQuery", value)}
        />
      </div>

      {/* Quick-pick chips replace the banner: one tap gets a visitor who doesn't know
          what to search for into a real result set. Also carries the banner's only
          real CTA (KHO SIM ĐỒNG GIÁ 229K) forward as the "SIM 229K" chip. */}
      <QuickPickChips
        filters={filters}
        onTogglePriceRange={togglePriceRangeWithSeed}
        onToggleTag={toggleTagWithSeed}
        onUpdateFilter={updateFilterWithSeed}
      />

      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-4 flex justify-between items-center">
        <MobileFilterDrawer
          filters={filters}
          tagCounts={tagCounts}
          prefixes={prefixes}
          activeFilterCount={activeFilters.length}
          onTogglePriceRange={togglePriceRangeWithSeed}
          onToggleTag={toggleTagWithSeed}
          onToggleNetwork={toggleNetworkWithSeed}
          onToggleSuffix={toggleSuffixWithSeed}
          onUpdateFilter={updateFilterWithSeed}
          onReset={resetFiltersWithSeed}
        />
        <SortDropdown value={filters.sortBy} onChange={(value) => updateFilterWithSeed("sortBy", value)} />
      </div>

      {/* Main 3-Column Layout */}
      <div className="flex gap-4 lg:gap-6">
        {/* Left Sidebar - Filters (Desktop) - Scrolls with page */}
        <aside className="hidden lg:block w-[160px] flex-shrink-0">
          <AdvancedFilterSidebar
            filters={filters}
            tagCounts={tagCounts}
            prefixes={prefixes}
            onTogglePriceRange={togglePriceRangeWithSeed}
            onToggleTag={toggleTagWithSeed}
            onToggleNetwork={toggleNetworkWithSeed}
            onToggleSuffix={toggleSuffixWithSeed}
            onUpdateFilter={updateFilterWithSeed}
          />
        </aside>

        {/* Center - SIM Listing */}
        <section className="flex-1 min-w-0">
          <div className="bg-card rounded-2xl shadow-card border border-border/50 p-3 md:p-6 mb-6">
            {/* Header with sort and reload */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4 mb-4">
              <div className="hidden lg:block">
                <SortDropdown value={filters.sortBy} onChange={(value) => updateFilterWithSeed("sortBy", value)} />
              </div>
            </div>

            {/* Active Filters */}
            <ActiveFilterChips
              chips={activeFilters}
              resultCount={0}
              onResetAll={resetFiltersWithSeed}
              hideResultCount={true}
            />

            {/* Loading State - only show full-screen when no data yet */}
            {isLoading && allSims.length === 0 && filteredSims.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
                <span className="text-muted-foreground">Đang tải dữ liệu...</span>
                <span className="text-xs text-muted-foreground mt-1">Lần đầu có thể mất vài giây</span>
              </div>
            )}

            {/* Error State with Reload */}
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

            {/* SIM Grid */}
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

                {/* Load More Button */}
                {hasMoreItems && (
                  <div className="mt-6 text-center">
                    <button
                      onClick={handleLoadMore}
                      className="btn-cta inline-flex items-center gap-2 px-8 py-3 text-base"
                    >
                      <ChevronDown className="w-5 h-5" />
                      <span>Xem thêm {Math.min(remainingCount, ITEMS_PER_PAGE)} SIM</span>
                    </button>
                    <p className="text-sm text-muted-foreground mt-2">
                      Còn {remainingCount.toLocaleString()} SIM khác
                    </p>
                  </div>
                )}

                {/* All loaded message */}
                {!hasMoreItems && filteredSims.length > ITEMS_PER_PAGE && (
                  <div className="mt-6 text-center">
                    <p className="text-sm text-muted-foreground">
                      ✓ Đã hiển thị tất cả {filteredSims.length.toLocaleString()} SIM
                    </p>
                  </div>
                )}
              </>
            )}

            {/* Empty State with Helper and Suggestions */}
            {!isLoading && !error && filteredSims.length === 0 && allSims.length > 0 && (
              <EmptyStateHelper
                constraints={activeConstraints}
                searchSuggestion={searchSuggestion}
                onRelaxOne={relaxFiltersWithSeed}
                onRelaxAll={relaxAllFiltersWithSeed}
                onReset={resetFiltersWithSeed}
                allSims={allSims}
                searchQuery={filters.searchQuery}
                filters={filters}
                quyFilter={activeQuyType}
                precomputedSuggestions={finalSuggestionsWithQuy}
              />
            )}

            {/* No Data State (data loaded but empty) */}
            {!isLoading && !error && allSims.length === 0 && (
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

        {/* Right Sidebar - Scrolls with page */}
        <aside className="hidden lg:block w-[220px] flex-shrink-0">
          <RightSidebar />
        </aside>
      </div>

      {/* Process Steps — moved BELOW the grid. It used to sit between the banner and
          the search box, pushing the first SIM card 610px down on mobile. "How to buy"
          only matters after a visitor has found a number they want. */}
      {!isNoResultsWithSuggestions && <ProcessSteps />}

      {/* Introduction Section. simCount comes from the dataset this page has
          already fetched, so the "SIM số đẹp" stat reflects the real kho
          instead of a hard-coded number that goes stale. */}
      <section className="my-8">
        <IntroSection simCount={allSims.length} />
      </section>

      {/* Back to Top Button — bottom-LEFT so it can't collide with the
          floating contact stack / messenger panel on the right. */}
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
