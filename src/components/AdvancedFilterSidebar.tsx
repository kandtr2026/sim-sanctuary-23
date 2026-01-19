import { useState } from 'react';
import { ChevronDown, ChevronUp, Filter, AlertTriangle } from 'lucide-react';
import { 
  PRICE_RANGES, 
  QUICK_SUFFIXES,
  type QuyType
} from '@/lib/simUtils';
import type { FilterState } from '@/hooks/useSimData';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';

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
        className="w-full flex items-center justify-between p-3 text-left hover:bg-background-secondary transition-colors"
      >
        <span className="font-semibold text-white uppercase tracking-wide" style={{ fontSize: 'clamp(14px, 1.2vw, 18px)' }}>{title}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-primary" />
        ) : (
          <ChevronDown className="w-4 h-4 text-primary" />
        )}
      </button>
      {isOpen && <div className="px-3 pb-3">{children}</div>}
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

  return (
    <aside className="bg-card rounded-lg shadow-card border border-border overflow-hidden">
      <div className="bg-primary/5 p-3 border-b border-border flex items-center gap-2">
        <Filter className="w-5 h-5 text-primary" />
        <span className="font-bold text-white" style={{ fontSize: 'clamp(14px, 1.2vw, 18px)' }}>BỘ LỌC TÌM KIẾM</span>
      </div>

      {/* Price Filter */}
      <FilterSection title="SIM theo giá">
        <div className="space-y-1">
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
              </button>
            );
          })}
        </div>

        <div className="mt-2">
          <button
            onClick={() => setShowCustomPrice(!showCustomPrice)}
            className="text-[9px] text-primary underline"
          >
            {showCustomPrice ? 'Ẩn tùy chỉnh' : 'Giá tùy chỉnh'}
          </button>
          
          {showCustomPrice && (
            <div className="mt-1.5 space-y-1.5">
              <div className="flex gap-1 items-center">
                <Input
                  type="number"
                  placeholder="Từ (triệu)"
                  value={customMinInput}
                  onChange={(e) => setCustomMinInput(e.target.value)}
                  className="text-[10px] h-6 px-1.5"
                />
                <span className="text-muted-foreground text-[10px]">-</span>
                <Input
                  type="number"
                  placeholder="Đến (triệu)"
                  value={customMaxInput}
                  onChange={(e) => setCustomMaxInput(e.target.value)}
                  className="text-[10px] h-6 px-1.5"
                />
              </div>
              <button
                onClick={handleApplyCustomPrice}
                className="btn-cta-sm w-full py-1 text-[10px]"
              >
                Áp dụng
              </button>
            </div>
          )}
        </div>
      </FilterSection>

      {/* Tag Filter - Quý (position-agnostic) */}
      <FilterSection title="SIM số quý">
        <div className="space-y-1.5">
          {/* Main quý type buttons - no position sub-filters */}
          <div className="flex flex-col gap-1">
            {quyTypes.map(quyType => {
              const isSelected = filters.quyType === quyType;
              return (
                <button
                  key={quyType}
                  onClick={() => handleQuyTypeClick(quyType)}
                  className={`filter-btn-sm ${isSelected ? 'active' : ''}`}
                >
                  {quyType}
                </button>
              );
            })}
          </div>
          
          {/* Other quý-related tags (Tam hoa, Tam hoa kép) */}
          <div className="flex flex-col gap-1 pt-1.5 border-t border-border/50">
            {otherQuyTags.map(tag => (
              <button
                key={tag}
                onClick={() => onToggleTag(tag)}
                className={`filter-btn-sm ${filters.selectedTags.includes(tag) ? 'active' : ''}`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </FilterSection>

      {/* Tag Filter - Phong thủy */}
      <FilterSection title="SIM phong thủy">
        <div className="flex flex-col gap-1">
          {phongThuyTags.map(tag => (
            <button
              key={tag}
              onClick={() => onToggleTag(tag)}
              className={`filter-btn-sm ${filters.selectedTags.includes(tag) ? 'active' : ''}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Tag Filter - Style */}
      <FilterSection title="Loại số">
        <div className="flex flex-col gap-1">
          {styleTags.map(tag => (
            <button
              key={tag}
              onClick={() => onToggleTag(tag)}
              className={`filter-btn-sm ${filters.selectedTags.includes(tag) ? 'active' : ''}`}
            >
              {tag}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Network Filter */}
      <FilterSection title="SIM theo mạng">
        <div className="space-y-1">
          <p className="text-[9px] text-muted-foreground mb-1">
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
            </button>
          ))}
        </div>
        
        {/* Mobifone First Toggle */}
        <div className="mt-1.5 pt-1.5 border-t border-border">
          <div className="flex items-center justify-between">
            <Label className="text-[9px] text-muted-foreground">Mobifone ưu tiên</Label>
            <Switch
              checked={filters.mobifoneFirst}
              onCheckedChange={(checked) => 
                onUpdateFilter('mobifoneFirst', checked)
              }
              className="scale-75"
            />
          </div>
          <p className="text-[8px] text-muted-foreground mt-0.5">
            Sắp xếp Mobifone lên đầu (không ẩn mạng khác)
          </p>
        </div>
      </FilterSection>

      {/* Prefix Filter */}
      <FilterSection title="Lọc theo đầu số" defaultOpen={false}>
        <div className="space-y-1.5">
          <div>
            <Label className="text-[9px] text-muted-foreground mb-1 block">Đầu 3 số</Label>
            <div className="flex flex-wrap gap-0.5">
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
                  className={`px-1 py-0.5 text-[9px] rounded border ${
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
        <div className="space-y-1.5">
          <div className="flex flex-wrap gap-0.5">
            {QUICK_SUFFIXES.map(suffix => (
              <button
                key={suffix}
                onClick={() => onToggleSuffix(suffix)}
                className={`px-1 py-0.5 text-[9px] rounded border ${
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
            <Label className="text-[9px] text-muted-foreground mb-0.5 block">Đuôi tùy chỉnh</Label>
            <Input
              type="text"
              placeholder="Nhập số đuôi (vd: 1234)"
              value={filters.customSuffix}
              onChange={(e) => onUpdateFilter('customSuffix', e.target.value.replace(/\D/g, ''))}
              className="text-[10px] h-6 px-1.5"
            />
          </div>
        </div>
      </FilterSection>

      {/* VIP Controls */}
      <FilterSection title="VIP Controls" defaultOpen={false}>
        <div className="space-y-2">
          {/* VIP conflict warning */}
          {filters.vipFilter === 'only' && (
            <Alert variant="default" className="py-1 px-2">
              <AlertDescription className="text-[9px]">
                Chỉ hiển thị SIM VIP
              </AlertDescription>
            </Alert>
          )}
          {filters.vipFilter === 'hide' && (
            <Alert variant="default" className="py-1 px-2">
              <AlertDescription className="text-[9px]">
                Đang ẩn SIM VIP
              </AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between">
            <Label className="text-[10px]">Chỉ hiển thị VIP</Label>
            <Switch
              checked={filters.vipFilter === 'only'}
              onCheckedChange={(checked) => 
                onUpdateFilter('vipFilter', checked ? 'only' : 'all')
              }
              disabled={filters.vipFilter === 'hide'}
              className="scale-75"
            />
          </div>
          
          <div className="flex items-center justify-between">
            <Label className="text-[10px]">Ẩn SIM VIP</Label>
            <Switch
              checked={filters.vipFilter === 'hide'}
              onCheckedChange={(checked) => 
                onUpdateFilter('vipFilter', checked ? 'hide' : 'all')
              }
              disabled={filters.vipFilter === 'only'}
              className="scale-75"
            />
          </div>

          <div>
            <Label className="text-[9px] text-muted-foreground mb-1 block">
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
