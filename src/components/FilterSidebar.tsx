import { useState } from 'react';
import { priceRanges, simTypes } from '@/data/simData';
import { ChevronDown, ChevronUp } from 'lucide-react';

// Networks displayed in filter UI (hiding: Viettel, iTelecom, Khác)
const networksUI = ['Mobifone', 'Vinaphone', 'Gmobile'];

interface FilterSidebarProps {
  selectedPriceRange: { min: number; max: number } | null;
  selectedTypes: string[];
  selectedNetworks: string[];
  onPriceChange: (range: { min: number; max: number } | null) => void;
  onTypeChange: (types: string[]) => void;
  onNetworkChange: (networks: string[]) => void;
}

const FilterSidebar = ({
  selectedPriceRange,
  selectedTypes,
  selectedNetworks,
  onPriceChange,
  onTypeChange,
  onNetworkChange,
}: FilterSidebarProps) => {
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    type: true,
    network: true,
  });

  const toggleSection = (section: 'price' | 'type' | 'network') => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      onTypeChange(selectedTypes.filter((t) => t !== type));
    } else {
      onTypeChange([...selectedTypes, type]);
    }
  };

  const toggleNetwork = (network: string) => {
    if (selectedNetworks.includes(network)) {
      onNetworkChange(selectedNetworks.filter((n) => n !== network));
    } else {
      onNetworkChange([...selectedNetworks, network]);
    }
  };

  return (
    <aside className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
      {/* Price Filter */}
      <div className="border-b border-border">
        <button
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-background-secondary transition-colors"
        >
          <span className="section-title mb-0 pb-0 border-0">SIM THEO GIÁ</span>
          {expandedSections.price ? (
            <ChevronUp className="w-5 h-5 text-primary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-primary" />
          )}
        </button>
        {expandedSections.price && (
          <div className="px-4 pb-4 space-y-2">
            {priceRanges.map((range) => (
              <button
                key={range.label}
                onClick={() =>
                  selectedPriceRange?.min === range.min
                    ? onPriceChange(null)
                    : onPriceChange({ min: range.min, max: range.max })
                }
                className={`filter-btn w-full text-left ${
                  selectedPriceRange?.min === range.min ? 'active' : ''
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Type Filter */}
      <div className="border-b border-border">
        <button
          onClick={() => toggleSection('type')}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-background-secondary transition-colors"
        >
          <span className="section-title mb-0 pb-0 border-0">SIM THEO LOẠI</span>
          {expandedSections.type ? (
            <ChevronUp className="w-5 h-5 text-primary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-primary" />
          )}
        </button>
        {expandedSections.type && (
          <div className="px-4 pb-4 flex flex-wrap gap-2">
            {simTypes.map((type) => (
              <button
                key={type}
                onClick={() => toggleType(type)}
                className={`filter-btn ${selectedTypes.includes(type) ? 'active' : ''}`}
              >
                {type}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Network Filter */}
      <div>
        <button
          onClick={() => toggleSection('network')}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-background-secondary transition-colors"
        >
          <span className="section-title mb-0 pb-0 border-0">SIM THEO MẠNG</span>
          {expandedSections.network ? (
            <ChevronUp className="w-5 h-5 text-primary" />
          ) : (
            <ChevronDown className="w-5 h-5 text-primary" />
          )}
        </button>
        {expandedSections.network && (
          <div className="px-4 pb-4 space-y-2">
            {networksUI.map((network) => (
              <button
                key={network}
                onClick={() => toggleNetwork(network)}
                className={`filter-btn w-full text-left ${
                  selectedNetworks.includes(network) ? 'active' : ''
                }`}
              >
                {network}
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};

export default FilterSidebar;
