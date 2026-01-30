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
function parseVnd(v: any): number {
  if (v == null) return NaN;
  if (typeof v === "number") return v;

  const s = String(v).toLowerCase().trim();

  // "3.5 triệu"
  if (s.includes("triệu")) {
    const num = parseFloat(
      s.replace("triệu", "")
        .replace(",", ".")
        .replace(/[^\d.]/g, "")
    );
    return Number.isFinite(num) ? Math.round(num * 1_000_000) : NaN;
  }

  // "3,500,000" / "3.500.000" / "3500000"
  const digits = s.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : NaN;
}

function shuffleInPlace<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function getSimKey(sim: any): string {
  return String(sim?.SimID || sim?.SimRef || sim?.id || "");
}

function getFinalPrice(sim: any): number {
  return parseVnd(sim?.Final_Price ?? sim?.finalPrice ?? sim?.final_price);
}

function reorderForLanding(list: any[]) {
  const min = 3_000_000;
  const max = 5_000_000;

  const in3to5: any[] = [];
  const lowerThan3: any[] = [];
  const others: any[] = [];

  for (const sim of list) {
    const p = getFinalPrice(sim);
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

  shuffleInPlace(in3to5);
  shuffleInPlace(lowerThan3);

  let first100 = in3to5.slice(0, 100);
  if (first100.length < 100) {
    first100 = [...first100, ...lowerThan3.slice(0, 100 - first100.length)];
  }

  const picked = new Set(first100.map(getSimKey));

  const rest = [
    ...in3to5.slice(100),
    ...lowerThan3.filter(s => !picked.has(getSimKey(s))),
    ...others,
  ].filter(s => {
    const k = getSimKey(s);
    if (!k) return true;
    return !picked.has(k);
  });

  // đảm bảo không trùng toàn bộ
  const seen = new Set<string>();
  return [...first100, ...rest].filter(s => {
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

  // Landing page random ordering: prioritize 3-5M SIMs when no filters active
  const isDefaultLanding =
    !isOrFallback &&
    (!filters?.searchQuery || filters.searchQuery.replace(/[.\s]/g, "").trim() === "") &&
    (!activeFilters || (Array.isArray(activeFilters) && activeFilters.length === 0));

  const finalCombinedSuggestions = isDefaultLanding
    ? reorderForLanding(combinedSuggestions)
    : combinedSuggestions;

  const isNoResultsWithSuggestions = filteredSims.length === 0 && finalCombinedSuggestions.length > 0 && !isLoading && !error;

  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [filters]);

  const displayedSIMs = useMemo(() => {
    return filteredSims.slice(0, visibleCount);
  }, [filteredSims, visibleCount]);

  const hasMoreItems = visibleCount < filteredSims.length;
  const remainingCount = filteredSims.length - visibleCount;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, filteredSims.length));
  }, [filteredSims.length]);

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
            onChange={(value) => updateFilter('searchQuery', value)}
          />
        </section>

        {/* Mobile Filter Button */}
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
          <SortDropdown
            value={filters.sortBy}
            onChange={(value) => updateFilter('sortBy', value)}
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
              onTogglePriceRange={togglePriceRange}
              onToggleTag={toggleTag}
              onToggleNetwork={toggleNetwork}
              onToggleSuffix={toggleSuffix}
              onUpdateFilter={updateFilter}
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
                    onChange={(value) => updateFilter('sortBy', value)}
                  />
                </div>
              </div>


              {/* Active Filters */}
              <ActiveFilterChips
                chips={activeFilters}
                resultCount={0}
                onResetAll={resetFilters}
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
                  onRelaxOne={relaxFilters}
                  onRelaxAll={relaxAllFilters}
                  onReset={resetFilters}
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
