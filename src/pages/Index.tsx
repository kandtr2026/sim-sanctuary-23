import { useState, useMemo, useCallback } from 'react';
import Header from '@/components/Header';
import Navigation from '@/components/Navigation';
import SearchBar from '@/components/SearchBar';
import HeroBanner from '@/components/HeroBanner';
import FilterSidebar from '@/components/FilterSidebar';
import SIMCard from '@/components/SIMCard';
import RightSidebar from '@/components/RightSidebar';
import IntroSection from '@/components/IntroSection';
import FAQSection from '@/components/FAQSection';
import Footer from '@/components/Footer';
import { generateSampleSIMs, type SIMData } from '@/data/simData';
import { ChevronDown, ArrowUp } from 'lucide-react';

const ITEMS_PER_PAGE = 20;

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState<{ min: number; max: number } | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>([]);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const allSIMs = useMemo(() => generateSampleSIMs(), []);

  const filteredSIMs = useMemo(() => {
    let result = [...allSIMs];

    // Search filter
    if (searchQuery) {
      // Remove dots first, then convert wildcards to regex pattern
      const cleanQuery = searchQuery.replace(/\./g, '');
      // Escape special regex characters except *, then convert * to .*
      const escapedQuery = cleanQuery
        .replace(/[+?^${}()|[\]\\]/g, '\\$&')
        .replace(/\*/g, '.*');
      
      try {
        const regex = new RegExp(escapedQuery, 'i');
        result = result.filter((sim) => regex.test(sim.number));
      } catch {
        // If regex is still invalid, fall back to simple includes
        result = result.filter((sim) => 
          sim.number.includes(cleanQuery.replace(/\*/g, ''))
        );
      }
    }

    // Price filter
    if (selectedPriceRange) {
      result = result.filter(
        (sim) => sim.price >= selectedPriceRange.min && sim.price <= selectedPriceRange.max
      );
    }

    // Type filter
    if (selectedTypes.length > 0) {
      result = result.filter((sim) =>
        selectedTypes.some((type) => {
          if (type === 'VIP') return sim.isVIP;
          return sim.types.includes(type);
        })
      );
    }

    // Network filter
    if (selectedNetworks.length > 0) {
      result = result.filter((sim) => selectedNetworks.includes(sim.network));
    }

    return result;
  }, [allSIMs, searchQuery, selectedPriceRange, selectedTypes, selectedNetworks]);

  // Reset visible count when filters change
  useMemo(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [searchQuery, selectedPriceRange, selectedTypes, selectedNetworks]);

  const displayedSIMs = useMemo(() => {
    return filteredSIMs.slice(0, visibleCount);
  }, [filteredSIMs, visibleCount]);

  const hasMoreItems = visibleCount < filteredSIMs.length;
  const remainingCount = filteredSIMs.length - visibleCount;

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + ITEMS_PER_PAGE, filteredSIMs.length));
  }, [filteredSIMs.length]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Track scroll position for back-to-top button
  useMemo(() => {
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
          <SearchBar onSearch={setSearchQuery} />
        </section>

        {/* Hero Banner */}
        <section className="mb-6">
          <HeroBanner />
        </section>

        {/* Main 3-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Filters */}
          <aside className="lg:col-span-3 order-2 lg:order-1">
            <div className="lg:sticky lg:top-20">
              <FilterSidebar
                selectedPriceRange={selectedPriceRange}
                selectedTypes={selectedTypes}
                selectedNetworks={selectedNetworks}
                onPriceChange={setSelectedPriceRange}
                onTypeChange={setSelectedTypes}
                onNetworkChange={setSelectedNetworks}
              />
            </div>
          </aside>

          {/* Center - SIM Listing */}
          <section className="lg:col-span-6 order-1 lg:order-2">
            <div className="bg-card rounded-xl shadow-card border border-border p-4 md:p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-primary">
                  SIM Số Đẹp
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({filteredSIMs.length} kết quả)
                  </span>
                </h2>
                <span className="text-sm text-muted-foreground">
                  Hiển thị {displayedSIMs.length} / {filteredSIMs.length}
                </span>
              </div>

              {displayedSIMs.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {displayedSIMs.map((sim) => (
                      <SIMCard key={sim.id} sim={sim} />
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
                        Còn {remainingCount} SIM khác
                      </p>
                    </div>
                  )}

                  {/* All loaded message */}
                  {!hasMoreItems && filteredSIMs.length > ITEMS_PER_PAGE && (
                    <div className="mt-6 text-center">
                      <p className="text-sm text-muted-foreground">
                        ✓ Đã hiển thị tất cả {filteredSIMs.length} SIM
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground text-lg">
                    Không tìm thấy SIM phù hợp
                  </p>
                  <p className="text-sm text-meta mt-2">
                    Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Right Sidebar */}
          <aside className="lg:col-span-3 order-3">
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
