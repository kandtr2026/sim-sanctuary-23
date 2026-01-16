import { useState, useMemo, useCallback, useEffect } from 'react';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import SearchBarAdvanced from '@/components/SearchBarAdvanced';
import HeroBanner from '@/components/HeroBanner';
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

const ITEMS_PER_PAGE = 100;

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
        {/* Hero Banner - Compact, near menu */}
        <section className="mb-4">
          <HeroBanner />
        </section>

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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Filters (Desktop) */}
          <aside className="hidden lg:block lg:col-span-3">
            <div className="lg:sticky lg:top-20">
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
            </div>
          </aside>

          {/* Center - SIM Listing */}
          <section className="lg:col-span-6">
            <div className="bg-card rounded-xl shadow-card border border-border p-4 md:p-6 mb-6">
              {/* Header with sort and reload */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3 flex-wrap">
                  <h2 className="text-xl font-bold text-primary">SIM Số Đẹp</h2>
                  {allSims.length > 0 && (
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                      {allSims.length.toLocaleString()} SIM
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={forceReload}
                    disabled={isFetching}
                    className="h-8 w-8 p-0"
                    title="Tải lại dữ liệu"
                  >
                    <RefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                <div className="hidden lg:block">
                  <SortDropdown
                    value={filters.sortBy}
                    onChange={(value) => updateFilter('sortBy', value)}
                  />
                </div>
              </div>

              {/* Data sync status */}
              {allSims.length > 0 && lastUpdateInfo.timestamp && (
                <div className={`flex items-center gap-2 text-xs mb-3 px-2 py-1 rounded ${
                  lastUpdateInfo.isCache 
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                }`}>
                  {lastUpdateInfo.isCache ? (
                    <CloudOff className="w-3 h-3" />
                  ) : (
                    <Cloud className="w-3 h-3" />
                  )}
                  <span>
                    {lastUpdateInfo.isCache ? 'Dữ liệu từ cache' : 'Dữ liệu đồng bộ từ Google Sheet'}
                    {' • '}
                    Cập nhật: {new Date(lastUpdateInfo.timestamp).toLocaleTimeString('vi-VN')}
                  </span>
                </div>
              )}

              {/* Active Filters */}
              <ActiveFilterChips
                chips={activeFilters}
                resultCount={filteredSims.length}
                onResetAll={resetFilters}
              />

              {/* Loading State */}
              {isLoading && (
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                    {displayedSIMs.map((sim) => (
                      <SIMCardNew 
                        key={sim.id} 
                        sim={sim} 
                        promotional={getPromotionalData(sim.id)}
                        quyFilter={filters.quyType}
                      />
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

              {/* Empty State with Helper */}
              {!isLoading && !error && filteredSims.length === 0 && allSims.length > 0 && (
                <EmptyStateHelper
                  constraints={activeConstraints}
                  searchSuggestion={searchSuggestion}
                  onRelaxOne={relaxFilters}
                  onRelaxAll={relaxAllFilters}
                  onReset={resetFilters}
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

          {/* Right Sidebar */}
          <aside className="lg:col-span-3">
            <div className="lg:sticky lg:top-20">
              <RightSidebar />
            </div>
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
