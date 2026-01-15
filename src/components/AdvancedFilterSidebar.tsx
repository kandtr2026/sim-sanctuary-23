import { useState } from 'react';
import { ChevronDown, ChevronUp, Filter } from 'lucide-react';
import { 
  PRICE_RANGES, 
  ALL_SIM_TAGS, 
  QUICK_SUFFIXES 
} from '@/lib/simUtils';
import type { FilterState } from '@/hooks/useSimData';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';

interface AdvancedFilterSidebarProps {
  filters: FilterState;
  tagCounts: Record<string, number>;
  prefixes: { prefix3: string[]; prefix4: string[] };
  onTogglePriceRange: (index: number) => void;
  onToggleTag: (tag: string) => void;
  onToggleNetwork: (network: string) => void;
  onToggleSuffix: (suffix: string) => void;
  onUpdateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
}

const NETWORKS = ['Mobifone', 'Viettel', 'Vinaphone', 'iTelecom'] as const;

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
        className="w-full flex items-center justify-between p-4 text-left hover:bg-background-secondary transition-colors"
      >
        <span className="font-semibold text-primary text-sm uppercase tracking-wide">{title}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-primary" />
        ) : (
          <ChevronDown className="w-4 h-4 text-primary" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
};

const AdvancedFilterSidebar = ({
  filters,
  tagCounts,
  prefixes,
  onTogglePriceRange,
  onToggleTag,
  onToggleNetwork,
  onToggleSuffix,
  onUpdateFilter
}: AdvancedFilterSidebarProps) => {
  const [showCustomPrice, setShowCustomPrice] = useState(false);
  const [customMinInput, setCustomMinInput] = useState('');
  const [customMaxInput, setCustomMaxInput] = useState('');

  const handleApplyCustomPrice = () => {
    const min = customMinInput ? parseInt(customMinInput) * 1000000 : null;
    const max = customMaxInput ? parseInt(customMaxInput) * 1000000 : null;
    onUpdateFilter('customPriceMin', min);
    onUpdateFilter('customPriceMax', max);
  };

  // Group tags by category
  const quyTags = ['Lục quý', 'Ngũ quý', 'Tứ quý', 'Tam hoa', 'Tam hoa kép'];
  const phongThuyTags = ['Lộc phát', 'Thần tài', 'Ông địa'];
  const styleTags = ['Năm sinh', 'Tiến lên', 'Gánh đảo', 'Lặp kép', 'Dễ nhớ', 'Taxi', 'VIP'];

  return (
    <aside className="bg-card rounded-xl shadow-card border border-border overflow-hidden">
      <div className="bg-primary/5 p-4 border-b border-border flex items-center gap-2">
        <Filter className="w-5 h-5 text-primary" />
        <span className="font-bold text-primary">BỘ LỌC TÌM KIẾM</span>
      </div>

      {/* Price Filter */}
      <FilterSection title="SIM theo giá">
        <div className="space-y-2">
          {PRICE_RANGES.map((range, index) => (
            <button
              key={range.label}
              onClick={() => onTogglePriceRange(index)}
              className={`filter-btn w-full text-left text-sm ${
                filters.priceRanges.includes(index) ? 'active' : ''
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>

        <div className="mt-4">
          <button
            onClick={() => setShowCustomPrice(!showCustomPrice)}
            className="text-xs text-primary underline"
          >
            {showCustomPrice ? 'Ẩn tùy chỉnh' : 'Giá tùy chỉnh'}
          </button>
          
          {showCustomPrice && (
            <div className="mt-2 space-y-2">
              <div className="flex gap-2 items-center">
                <Input
                  type="number"
                  placeholder="Từ (triệu)"
                  value={customMinInput}
                  onChange={(e) => setCustomMinInput(e.target.value)}
                  className="text-sm h-8"
                />
                <span className="text-muted-foreground">-</span>
                <Input
                  type="number"
                  placeholder="Đến (triệu)"
                  value={customMaxInput}
                  onChange={(e) => setCustomMaxInput(e.target.value)}
                  className="text-sm h-8"
                />
              </div>
              <button
                onClick={handleApplyCustomPrice}
                className="btn-cta w-full py-2 text-sm"
              >
                Áp dụng
              </button>
            </div>
          )}
        </div>
      </FilterSection>

      {/* Tag Filter - Quý */}
      <FilterSection title="SIM số quý">
        <div className="flex flex-wrap gap-2">
          {quyTags.map(tag => (
            <button
              key={tag}
              onClick={() => onToggleTag(tag)}
              className={`filter-btn text-xs ${filters.selectedTags.includes(tag) ? 'active' : ''}`}
            >
              {tag}
              <span className="ml-1 opacity-70">({tagCounts[tag] || 0})</span>
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Tag Filter - Phong thủy */}
      <FilterSection title="SIM phong thủy">
        <div className="flex flex-wrap gap-2">
          {phongThuyTags.map(tag => (
            <button
              key={tag}
              onClick={() => onToggleTag(tag)}
              className={`filter-btn text-xs ${filters.selectedTags.includes(tag) ? 'active' : ''}`}
            >
              {tag}
              <span className="ml-1 opacity-70">({tagCounts[tag] || 0})</span>
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Tag Filter - Style */}
      <FilterSection title="Loại số">
        <div className="flex flex-wrap gap-2">
          {styleTags.map(tag => (
            <button
              key={tag}
              onClick={() => onToggleTag(tag)}
              className={`filter-btn text-xs ${filters.selectedTags.includes(tag) ? 'active' : ''}`}
            >
              {tag}
              <span className="ml-1 opacity-70">({tagCounts[tag] || 0})</span>
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Network Filter */}
      <FilterSection title="SIM theo mạng">
        <div className="space-y-2">
          {NETWORKS.map(network => (
            <button
              key={network}
              onClick={() => onToggleNetwork(network)}
              className={`filter-btn w-full text-left text-sm ${
                filters.selectedNetworks.includes(network) ? 'active' : ''
              }`}
            >
              {network}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Prefix Filter */}
      <FilterSection title="Lọc theo đầu số" defaultOpen={false}>
        <div className="space-y-3">
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">Đầu 3 số</Label>
            <div className="flex flex-wrap gap-1">
              {prefixes.prefix3.slice(0, 12).map(prefix => (
                <button
                  key={prefix}
                  onClick={() => {
                    const current = filters.selectedPrefixes3;
                    onUpdateFilter(
                      'selectedPrefixes3',
                      current.includes(prefix)
                        ? current.filter(p => p !== prefix)
                        : [...current, prefix]
                    );
                  }}
                  className={`px-2 py-1 text-xs rounded border ${
                    filters.selectedPrefixes3.includes(prefix)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:border-primary'
                  }`}
                >
                  {prefix}
                </button>
              ))}
            </div>
          </div>
        </div>
      </FilterSection>

      {/* Suffix Filter */}
      <FilterSection title="Lọc theo đuôi" defaultOpen={false}>
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1">
            {QUICK_SUFFIXES.map(suffix => (
              <button
                key={suffix}
                onClick={() => onToggleSuffix(suffix)}
                className={`px-2 py-1 text-xs rounded border ${
                  filters.selectedSuffixes.includes(suffix)
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border hover:border-primary'
                }`}
              >
                {suffix}
              </button>
            ))}
          </div>
          
          <div>
            <Label className="text-xs text-muted-foreground mb-1 block">Đuôi tùy chỉnh</Label>
            <Input
              type="text"
              placeholder="Nhập số đuôi (vd: 1234)"
              value={filters.customSuffix}
              onChange={(e) => onUpdateFilter('customSuffix', e.target.value.replace(/\D/g, ''))}
              className="text-sm h-8"
            />
          </div>
        </div>
      </FilterSection>

      {/* VIP Controls */}
      <FilterSection title="VIP Controls" defaultOpen={false}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Chỉ hiển thị VIP</Label>
            <Switch
              checked={filters.vipFilter === 'only'}
              onCheckedChange={(checked) => 
                onUpdateFilter('vipFilter', checked ? 'only' : 'all')
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label className="text-sm">Ẩn SIM VIP</Label>
            <Switch
              checked={filters.vipFilter === 'hide'}
              onCheckedChange={(checked) => 
                onUpdateFilter('vipFilter', checked ? 'hide' : 'all')
              }
            />
          </div>

          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">
              Ngưỡng VIP: {(filters.vipThreshold / 1000000).toFixed(0)} triệu
            </Label>
            <Slider
              value={[filters.vipThreshold / 1000000]}
              onValueChange={([value]) => onUpdateFilter('vipThreshold', value * 1000000)}
              min={10}
              max={500}
              step={10}
              className="w-full"
            />
          </div>
        </div>
      </FilterSection>
    </aside>
  );
};

export default AdvancedFilterSidebar;
