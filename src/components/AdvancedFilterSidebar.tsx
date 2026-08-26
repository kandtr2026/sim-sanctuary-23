import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PRICE_RANGES, type QuyType } from '@/lib/simUtils';
import type { FilterState } from '@/hooks/useSimData';

interface AdvancedFilterSidebarProps {
  filters: FilterState;
  tagCounts: Record<string, number>;
  networkCounts: Record<string, number>;
  priceCounts: number[];
  onTogglePriceRange: (index: number) => void;
  onToggleTag: (tag: string) => void;
  onToggleNetwork: (network: string) => void;
  onUpdateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
}

// Networks displayed in filter UI (hiding: Viettel, iTelecom, Khác)
const NETWORKS_UI = ['Mobifone', 'Vinaphone', 'Gmobile'] as const;

const FilterSection = ({
  title, 
  defaultOpen = true, 
  children 
}: { 
  title: string; 
  defaultOpen?: boolean; 
  children: React.ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 max-md:p-2 text-left hover:bg-background-secondary transition-colors"
      >
        <span className="font-semibold text-white uppercase tracking-wide max-md:text-xs" style={{ fontSize: 'clamp(14px, 1.2vw, 18px)' }}>{title}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-primary" />
        ) : (
          <ChevronDown className="w-4 h-4 text-primary" />
        )}
      </button>
      {isOpen && <div className="px-3 pb-3 max-md:px-2 max-md:pb-2">{children}</div>}
    </div>
  );
};

const AdvancedFilterSidebar = ({
  filters,
  tagCounts,
  networkCounts,
  priceCounts,
  onTogglePriceRange,
  onToggleTag,
  onToggleNetwork,
  onUpdateFilter
}: AdvancedFilterSidebarProps) => {
  // NOTE: filters.customPriceMin / customPriceMax are fully supported by
  // useSimData (filtering, active-filter chip, reset) but no control renders
  // them yet. The unused local state + handler that used to live here were
  // dead code; wire new inputs to onUpdateFilter('customPriceMin' | 'customPriceMax')
  // when that UI is designed.

  // Group tags by category - separate quý types from other tags
  const quyTypes: QuyType[] = ['Lục quý', 'Ngũ quý', 'Tứ quý'];
  // Position removed - now position-agnostic
  const otherQuyTags = ['Tam hoa', 'Tam hoa kép'];
  const phongThuyTags = ['Lộc phát', 'Thần tài', 'Ông địa'];
  const styleTags = ['Năm sinh', 'Tiến lên', 'Gánh đảo', 'Lặp kép', 'Dễ nhớ', 'Taxi', 'VIP'];

  // Handle quý type selection (radio-like behavior, no position)
  const handleQuyTypeClick = (quyType: QuyType) => {
    if (filters.quyType === quyType) {
      // Deselect if clicking the same type
      onUpdateFilter('quyType', null);
    } else {
      // Select new type
      onUpdateFilter('quyType', quyType);
    }
    // Clear position (no longer used)
    onUpdateFilter('quyPosition', null);
  };

  // Format count để hiển thị trong ngoặc: (1.234)
  const fmtCount = (n: number | undefined): string =>
    n !== undefined && n > 0 ? ` (${n.toLocaleString('vi-VN')})` : '';

  return (
    <aside className="bg-card rounded-lg shadow-card border border-border overflow-hidden">
      {/* Price Filter */}
      <FilterSection title="SIM theo giá">
        <div className="space-y-1 max-md:space-y-0.5">
          {PRICE_RANGES.map((range, index) => {
            const displayLabel = range.label.replace(/\btriệu\b/gi, 'Tr');
            return (
              <button
                key={range.label}
                onClick={() => onTogglePriceRange(index)}
                className={`filter-btn-sm w-full text-left ${
                  filters.priceRanges.includes(index) ? 'active' : ''
                }`}
              >
                {displayLabel}
                <span className="ml-1 text-[10px] font-medium leading-none text-red-500">{fmtCount(priceCounts[index])}</span>
              </button>
            );
          })}
        </div>

      </FilterSection>


      {/* Tag Filter - Quý (position-agnostic) */}
      <FilterSection title="SIM số quý">
        <div className="space-y-1.5 max-md:space-y-1">
          {/* Main quý type buttons - no position sub-filters */}
          <div className="flex flex-col gap-1 max-md:gap-0.5">
            {quyTypes.map(quyType => {
              const isSelected = filters.quyType === quyType;
              return (
                <button
                  key={quyType}
                  onClick={() => handleQuyTypeClick(quyType)}
                  className={`filter-btn-sm ${isSelected ? 'active' : ''}`}
                >
                  {quyType}
                  <span className="ml-1 text-[10px] font-medium leading-none text-red-500">{fmtCount(tagCounts[quyType])}</span>
                </button>
              );
            })}
          </div>
          
          {/* Other quý-related tags (Tam hoa, Tam hoa kép) */}
          <div className="flex flex-col gap-1 max-md:gap-0.5 pt-1.5 max-md:pt-1 border-t border-border/50">
            {otherQuyTags.map(tag => (
              <button
                key={tag}
                onClick={() => onToggleTag(tag)}
                className={`filter-btn-sm ${filters.selectedTags.includes(tag) ? 'active' : ''}`}
              >
                {tag}
                <span className="ml-1 text-[10px] font-medium leading-none text-red-500">{fmtCount(tagCounts[tag])}</span>
              </button>
            ))}
          </div>
        </div>
      </FilterSection>

      {/* Tag Filter - Phong thủy */}
      <FilterSection title="SIM phong thủy">
        <div className="flex flex-col gap-1 max-md:gap-0.5">
          {phongThuyTags.map(tag => (
            <button
              key={tag}
              onClick={() => onToggleTag(tag)}
              className={`filter-btn-sm ${filters.selectedTags.includes(tag) ? 'active' : ''}`}
            >
              {tag}
              <span className="ml-1 text-[10px] font-medium leading-none text-red-500">{fmtCount(tagCounts[tag])}</span>
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Tag Filter - Style */}
      <FilterSection title="Loại số">
        <div className="flex flex-col gap-1 max-md:gap-0.5">
          {styleTags.map(tag => (
            <button
              key={tag}
              onClick={() => onToggleTag(tag)}
              className={`filter-btn-sm ${filters.selectedTags.includes(tag) ? 'active' : ''}`}
            >
              {tag}
              <span className="ml-1 text-[10px] font-medium leading-none text-red-500">{fmtCount(tagCounts[tag])}</span>
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Network Filter */}
      <FilterSection title="SIM theo mạng">
        <div className="space-y-1 max-md:space-y-0.5">
          <p className="text-[9px] max-md:text-[8px] text-muted-foreground mb-1 max-md:mb-0.5">
            {filters.selectedNetworks.length === 0 
              ? '✓ Hiển thị tất cả mạng' 
              : 'Nhấn để bỏ chọn mạng'}
          </p>
          {NETWORKS_UI.map(network => (
            <button
              key={network}
              onClick={() => onToggleNetwork(network)}
              className={`filter-btn-sm w-full text-left ${
                filters.selectedNetworks.includes(network) ? 'active' : ''
              }`}
            >
              {network}
              <span className="ml-1 text-[10px] font-medium leading-none text-red-500">{fmtCount(networkCounts[network])}</span>
            </button>
          ))}
        </div>
        
      </FilterSection>
    </aside>
  );
};

export default AdvancedFilterSidebar;
