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
import { useSimData } from '@/hooks/useSimData';
import { ChevronDown, ArrowUp, Loader2 } from 'lucide-react';

const ITEMS_PER_PAGE = 20;

const Index = () => {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const {
    filteredSims,
    isLoading,
    error,
    prefixes,
    tagCounts,
    filters,
    updateFilter,
    togglePriceRange,
    toggleTag,
    toggleNetwork,
    toggleSuffix,
    resetFilters,
    activeFilters
  } = useSimData();

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

      <main className="container mx-auto px-4 py-6">
        {/* Search Section */}
        <section id="sim-so" className="mb-6">
          <SearchBarAdvanced
            value={filters.searchQuery}
            onChange={(value) => updateFilter('searchQuery', value)}
          />
        </section>

        {/* Hero Banner */}
        <section className="mb-6">
          <HeroBanner />
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
              {/* Header with sort */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h2 className="text-xl font-bold text-primary">SIM Số Đẹp</h2>
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
                resultCount={filteredSims.length}
                onResetAll={resetFilters}
              />

              {/* Loading State */}
              {isLoading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <span className="ml-2 text-muted-foreground">Đang tải dữ liệu...</span>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="text-center py-12">
                  <p className="text-destructive text-lg">Không thể tải dữ liệu</p>
                  <p className="text-sm text-muted-foreground mt-2">Vui lòng thử lại sau</p>
                </div>
              )}

              {/* SIM Grid */}
              {!isLoading && !error && displayedSIMs.length > 0 && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    {displayedSIMs.map((sim) => (
                      <SIMCardNew key={sim.id} sim={sim} />
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

              {/* Empty State */}
              {!isLoading && !error && displayedSIMs.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">Không tìm thấy SIM phù hợp</p>
                  <p className="text-sm text-meta mt-2">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
                  <button
                    onClick={resetFilters}
                    className="mt-4 text-primary underline text-sm"
                  >
                    Xóa tất cả bộ lọc
                  </button>
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
