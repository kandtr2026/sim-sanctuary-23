import { useState, useMemo } from 'react';
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

const Index = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState<{ min: number; max: number } | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedNetworks, setSelectedNetworks] = useState<string[]>([]);

  const allSIMs = useMemo(() => generateSampleSIMs(), []);

  const filteredSIMs = useMemo(() => {
    let result = [...allSIMs];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.replace(/\*/g, '.*').replace(/\./g, '');
      const regex = new RegExp(query, 'i');
      result = result.filter((sim) => regex.test(sim.number));
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
              </div>

              {filteredSIMs.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredSIMs.map((sim) => (
                    <SIMCard key={sim.id} sim={sim} />
                  ))}
                </div>
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
    </div>
  );
};

export default Index;
