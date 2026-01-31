import { useState, useMemo, useCallback, useEffect } from 'react';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import SearchBarAdvanced from '@/components/SearchBarAdvanced';

import AdvancedFilterSidebar from '@/components/AdvancedFilterSidebar';
import SIMCardNew from '@/components/SIMCardNew';
import RightSidebar from '@/components/RightSidebar';
import IntroSection from '@/components/IntroSection';
import FAQSection from '@/components/FAQSection';
import Footer from '@/components/Footer';
import ActiveFilterChips from '@/components/ActiveFilterChips';
import SortDropdown from '@/components/SortDropdown';
import MobileFilterDrawer from '@/components/MobileFilterDrawer';
import EmptyStateHelper from '@/components/EmptyStateHelper';
import { useSimData, getLastUpdateInfo, getPromotionalData } from '@/hooks/useSimData';
import { ChevronDown, ArrowUp, Loader2, RefreshCw, WifiOff, Cloud, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getSimilarSims } from '@/lib/similarSimSuggestions';
import type { NormalizedSIM } from '@/lib/simUtils';

const ITEMS_PER_PAGE = 100;

// Helper functions for landing page random ordering

// Seeded random number generator (Mulberry32)
function createSeededRandom(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
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

function getSimKey(sim: any): string {
  return String(sim?.SimID || sim?.SimRef || sim?.id || "");
}

// Get numeric VND price from Final_Price column (finalPricePick field)
// MUST use finalPricePick (numeric VND), NOT price (display string)
function getFinalPriceForLanding(sim: any): number {
  // Priority: finalPricePick (mapped from Final_Price column in Google Sheet)
  const v = sim?.finalPricePick ?? sim?.finalPrice ?? sim?.Final_Price;
  if (typeof v === "number" && Number.isFinite(v) && v > 0) {
    return v;
  }
  // Log warning for debugging - should not happen with valid data
  return NaN;
}

// Reorder for landing: prioritize 3-5M, supplement from <3M, then rest
// Uses seeded shuffle for deterministic randomization
function reorderForLanding(list: any[], seed: number = 0): any[] {
  const min = 3_000_000;
  const max = 5_000_000;

  const in3to5: any[] = [];
  const lowerThan3: any[] = [];
  const others: any[] = [];

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
  const rest = [
    ...shuffled3to5.slice(100),
    ...shuffledLower.filter(s => !pickedKeys.has(getSimKey(s))),
    ...others,
  ];

  // Final deduplication
  const seen = new Set<string>();
  return [...initial100, ...rest].filter(s => {
    const k = getSimKey(s);
    if (!k) return true;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

const Index = () => {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [showBackToTop, setShowBackToTop] = useState(false);
  
  // Landing list freeze state - prevents re-randomization on scroll
  const [landingSeed, setLandingSeed] = useState(0);
  const [landingFrozenList, setLandingFrozenList] = useState<NormalizedSIM[]>([]);
  const [hasInteracted, setHasInteracted] = useState(false);

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
    searchSuggestion
  } = useSimData();

  // Mark interaction and increment seed to trigger new random order
  const markInteracted = useCallback(() => {
    setHasInteracted(true);
    setLandingSeed((s) => s + 1);
  }, []);

  // Wrapped filter handlers that trigger re-randomization
  const updateFilterWithSeed = useCallback(<K extends keyof typeof filters>(key: K, value: typeof filters[K]) => {
    markInteracted();
    return updateFilter(key, value);
  }, [updateFilter, markInteracted]);

  const togglePriceRangeWithSeed = useCallback((index: number) => {
    markInteracted();
    return togglePriceRange(index);
  }, [togglePriceRange, markInteracted]);

  const toggleTagWithSeed = useCallback((tag: string) => {
    markInteracted();
    return toggleTag(tag);
  }, [toggleTag, markInteracted]);

  const toggleNetworkWithSeed = useCallback((network: string) => {
    markInteracted();
    return toggleNetwork(network);
  }, [toggleNetwork, markInteracted]);

  const toggleSuffixWithSeed = useCallback((suffix: string) => {
    markInteracted();
    return toggleSuffix(suffix);
  }, [toggleSuffix, markInteracted]);

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

  // Get last update info for display
  const lastUpdateInfo = getLastUpdateInfo();

  // Compute OR-fallback when main search returns 0 results with prefix*suffix pattern
  const orFallbackSims = useMemo(() => {
    if (filteredSims.length > 0 || allSims.length === 0) return [];
    
    const query = filters.searchQuery.replace(/[\.\s]/g, '').trim();
    
    // Only apply OR fallback for prefix*suffix pattern
    if (!query.includes('*')) return [];
    
    const parts = query.split('*').filter(Boolean);
    if (parts.length !== 2 || query.startsWith('*') || query.endsWith('*')) return [];
    
    const prefix = parts[0];
    const suffix = parts[1];
    
    const matchBoth: NormalizedSIM[] = [];
    const matchPrefix: NormalizedSIM[] = [];
    const matchSuffix: NormalizedSIM[] = [];
    
    for (const sim of allSims) {
      if (!sim.rawDigits) continue;
      
      const hasP = sim.rawDigits.startsWith(prefix);
      const hasS = sim.rawDigits.endsWith(suffix);
      
      if (hasP && hasS) {
        matchBoth.push(sim);
      } else if (hasP) {
        matchPrefix.push(sim);
      } else if (hasS) {
        matchSuffix.push(sim);
      }
    }
    
    // Combine: both first, then prefix, then suffix
    return [...matchBoth, ...matchPrefix, ...matchSuffix].slice(0, 200);
  }, [allSims, filteredSims.length, filters.searchQuery]);

  // Check if we're in no-results-with-suggestions state
  const similarSims = useMemo(() => {
    // If we have OR fallback results, use those instead of similarity suggestions
    if (orFallbackSims.length > 0) return [];
    if (filteredSims.length > 0 || allSims.length === 0) return [];
    return getSimilarSims({
      allSims,
      searchQuery: filters.searchQuery,
      activeFilters: filters,
      limit: 100
    });
  }, [allSims, filteredSims.length, filters, orFallbackSims.length]);

  // Combined suggestions: OR fallback takes priority over similarity suggestions
  const combinedSuggestions = orFallbackSims.length > 0 ? orFallbackSims : similarSims;
  const isOrFallback = orFallbackSims.length > 0;

  // Landing page: check if in default state (no search query)
  const isDefaultLanding =
    !isOrFallback &&
    (!filters?.searchQuery || filters.searchQuery.replace(/[.\s]/g, "").trim() === "");

  const finalCombinedSuggestions = isDefaultLanding
    ? reorderForLanding(combinedSuggestions, landingSeed)
    : combinedSuggestions;

  const isNoResultsWithSuggestions = filteredSims.length === 0 && finalCombinedSuggestions.length > 0 && !isLoading && !error;

  // Freeze landing list when in default landing state (random once, keep on scroll)
  // Uses seeded shuffle for deterministic ordering based on landingSeed
  // IMPORTANT: Use allSims (full dataset), NOT filteredSims
  useEffect(() => {
    if (!isDefaultLanding) return;
    if (!allSims || allSims.length === 0) return;

    // Freeze the list based on seed (random once, stable during scroll)
    // reorderForLanding: prioritizes 3-5M SIMs (by finalPricePick), supplements from <3M if needed
    const next = reorderForLanding(allSims, landingSeed);
    
    // Debug: log first 5 prices to verify correct field is used
    if (next.length > 0) {
      const sample = next.slice(0, 5).map(s => ({
        id: s.id,
        finalPricePick: s.finalPricePick,
        priceUsed: getFinalPriceForLanding(s)
      }));
      console.log('[Landing] First 5 SIMs price check:', sample);
    }
    
    setLandingFrozenList(next);
  }, [isDefaultLanding, landingSeed, allSims]);

  // When user returns to default landing after interaction, re-randomize once
  useEffect(() => {
    if (isDefaultLanding && hasInteracted) {
      setHasInteracted(false);
      setLandingSeed((s) => s + 1);
    }
  }, [isDefaultLanding, hasInteracted]);

  // Base list for display: frozen list for landing, filteredSims for search/filter
  const baseListForDisplay = isDefaultLanding ? landingFrozenList : filteredSims;

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [filters]);

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Track scroll position for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />

      <main className="container mx-auto px-4 pt-3 pb-6">
        {/* Hero Banner - Compact, near menu - Hidden when no results with suggestions */}
        {!isNoResultsWithSuggestions && (
          <section className="mb-4">
            <div className="rounded-xl overflow-hidden">
              <img 
                src="/home-banner.png" 
                alt="CHONSOMOBIFONE.COM banner" 
                className="w-full h-full object-cover"
              />
            </div>
          </section>
        )}

        {/* Search Section - Below banner */}
        <section id="sim-so" className="mb-5">
          <SearchBarAdvanced
            value={filters.searchQuery}
            onChange={(value) => updateFilterWithSeed('searchQuery', value)}
          />
        </section>

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
          <SortDropdown
            value={filters.sortBy}
            onChange={(value) => updateFilterWithSeed('sortBy', value)}
          />
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
            <div className="bg-card rounded-xl shadow-card border border-border p-4 md:p-6 mb-6">
              {/* Header with sort and reload */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4 mb-4">
                <div className="hidden lg:block">
                  <SortDropdown
                    value={filters.sortBy}
                    onChange={(value) => updateFilterWithSeed('sortBy', value)}
                  />
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
                  <span className="text-xs text-muted-foreground mt-1">
                    Lần đầu có thể mất vài giây
                  </span>
                </div>
              )}

              {/* Error State with Reload */}
              {error && !isLoading && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                    <WifiOff className="w-8 h-8 text-destructive" />
                  </div>
                  <p className="text-destructive text-lg font-medium">Không thể tải dữ liệu</p>
                  <p className="text-sm text-muted-foreground mt-2 mb-4">
                    Vui lòng kiểm tra kết nối mạng và thử lại
                  </p>
                  <Button onClick={forceReload} disabled={isFetching} className="gap-2">
                    <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                    Tải lại dữ liệu
                  </Button>
                </div>
              )}

              {/* SIM Grid */}
              {!isLoading && !error && displayedSIMs.length > 0 && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-4">
                    {displayedSIMs.map((sim) => (
                      <div key={sim.id} className="min-w-0">
                        <SIMCardNew 
                          sim={sim} 
                          promotional={getPromotionalData(sim.id)}
                          quyFilter={filters.quyType}
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
                  quyFilter={filters.quyType}
                  precomputedSuggestions={finalCombinedSuggestions}
                  isOrFallback={isOrFallback}
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

        {/* Introduction Section */}
        <section className="my-8">
          <IntroSection />
        </section>

        {/* FAQ Section */}
        <section id="phong-thuy" className="mb-8">
          <FAQSection />
        </section>

      </main>

      <Footer />

      {/* Back to Top Button */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 z-50 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center hover:bg-primary/90 transition-all duration-300 animate-fade-in"
          aria-label="Về đầu trang"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default Index;
