import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PRICE_RANGES, type QuyType } from '@/lib/simUtils';
import { NGU_HANH_LIST, HANH_MAU } from '@/lib/phongThuy';
import type { FilterState } from '@/hooks/useSimData';

interface AdvancedFilterSidebarProps {
  filters: FilterState;
  tagCounts: Record<string, number>;
  networkCounts: Record<string, number>;
  priceCounts: number[];
  menhCounts: Record<string, number>;
  onTogglePriceRange: (index: number) => void;
  onToggleTag: (tag: string) => void;
  onToggleNetwork: (network: string) => void;
  onUpdateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  /**
   * "rail"   = cột dọc 160px cạnh lưới ở desktop (mặc định) — mỗi lựa chọn là 1
   *            dòng full-width, gọn theo chiều ngang hẹp.
   * "drawer" = ngăn kéo lọc trên mobile (rộng ~85vw). Ở đây dòng full-width nhìn
   *            thưa và "kém chuyên" (góp ý #23), nên chuyển sang LƯỚI 2 CỘT, chip
   *            đặc có nền + vùng chạm 42px, trạng thái chọn tô vàng rõ ràng.
   */
  layout?: 'rail' | 'drawer';
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
  menhCounts,
  onTogglePriceRange,
  onToggleTag,
  onToggleNetwork,
  onUpdateFilter,
  layout = 'rail',
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
  const phongThuyTags = ['Lộc phát', 'Thần tài'];
  const styleTags = ['Năm sinh', 'Tiến lên', 'Gánh đảo', 'Lặp kép', 'Dễ nhớ', 'Taxi', 'VIP'];

  // Handle quý type selection (radio-like behavior, no position)
  const handleQuyTypeClick = (quyType: QuyType) => {
    // Deselect if clicking the same type, otherwise select the new one.
    onUpdateFilter('quyType', filters.quyType === quyType ? null : quyType);
    onUpdateFilter('quyPosition', null); // Clear position (no longer used)
  };

  const isDrawer = layout === 'drawer';

  // Container cho mỗi nhóm lựa chọn: drawer → lưới 2 cột; rail → xếp dọc.
  const listCls = isDrawer ? 'grid grid-cols-2 gap-2' : 'flex flex-col gap-1 max-md:gap-0.5';

  // Class của 1 chip lọc. rail dùng lại .filter-btn-sm (nhỏ, viền vàng); drawer
  // là chip ĐẶC: nền, bo góc, cao 42px dễ chạm, chọn = tô vàng.
  const chip = (active: boolean, textLeft = false) => {
    if (!isDrawer) return `filter-btn-sm ${textLeft ? 'w-full text-left' : ''} ${active ? 'active' : ''}`;
    return [
      'flex min-h-[42px] items-center justify-center gap-1 rounded-lg border px-2 py-1.5',
      'text-center text-[13px] font-semibold leading-tight transition',
      active
        ? 'border-gold bg-gold text-header-bg shadow-sm'
        : 'border-border bg-secondary/40 text-foreground hover:border-gold/60 hover:bg-secondary/70',
    ].join(' ');
  };

  // Format count để hiển thị trong ngoặc: (1.234). Trên chip đã chọn (nền vàng)
  // thì đỏ khó đọc → đổi sang màu chữ tối.
  const fmtCount = (n: number | undefined): string =>
    n !== undefined && n > 0 ? ` (${n.toLocaleString('vi-VN')})` : '';
  const countCls = (active: boolean) =>
    `ml-1 text-[10px] font-semibold leading-none ${isDrawer && active ? 'text-header-bg/70' : 'text-red-500'}`;

  return (
    <aside className={isDrawer ? 'bg-transparent' : 'bg-card rounded-lg shadow-card border border-border overflow-hidden'}>
      {/* SIM theo mệnh — điều hướng sang view ngũ hành của số (trang riêng
          /sim-theo-menh/<hành>), KHÔNG phải bộ lọc lưới. Chuyển từ thanh nav
          xuống đây để nav bớt chật; đặt trên cùng cho khách dễ thấy. */}
      <FilterSection title="SIM theo mệnh">
        <div className={listCls}>
          {NGU_HANH_LIST.map((h) => (
            <Link
              key={h.slug}
              href={`/sim-theo-menh/${h.slug}`}
              className={
                isDrawer
                  ? 'flex min-h-[42px] items-center gap-1.5 rounded-lg border border-border bg-secondary/40 px-2.5 py-1.5 text-[13px] font-semibold leading-tight text-foreground transition hover:border-gold/60 hover:bg-secondary/70'
                  : 'filter-btn-sm flex items-center gap-1.5'
              }
            >
              <span
                aria-hidden
                className="inline-block h-2.5 w-2.5 flex-shrink-0 rounded-full"
                style={{ backgroundColor: HANH_MAU[h.hanh] }}
              />
              <span>
                Mệnh {h.hanh}
                <span className={countCls(false)}>{fmtCount(menhCounts[h.hanh])}</span>
              </span>
            </Link>
          ))}
          <Link
            href="/sim-theo-menh"
            className={`${chip(false)} font-semibold ${isDrawer ? 'col-span-2' : 'mt-0.5 text-center'}`}
          >
            Xem tất cả →
          </Link>
        </div>
      </FilterSection>

      {/* Price Filter */}
      <FilterSection title="SIM theo giá">
        <div className={listCls}>
          {PRICE_RANGES.map((range, index) => {
            const displayLabel = range.label.replace(/\btriệu\b/gi, 'Tr');
            const active = filters.priceRanges.includes(index);
            return (
              <button
                key={range.label}
                onClick={() => onTogglePriceRange(index)}
                className={chip(active, true)}
              >
                {displayLabel}
                <span className={countCls(active)}>{fmtCount(priceCounts[index])}</span>
              </button>
            );
          })}
        </div>
      </FilterSection>


      {/* Tag Filter - Quý (position-agnostic) */}
      <FilterSection title="SIM số quý">
        <div className={isDrawer ? 'space-y-2' : 'space-y-1.5 max-md:space-y-1'}>
          {/* Main quý type buttons - no position sub-filters */}
          <div className={listCls}>
            {quyTypes.map(quyType => {
              const isSelected = filters.quyType === quyType;
              return (
                <button
                  key={quyType}
                  onClick={() => handleQuyTypeClick(quyType)}
                  className={chip(isSelected)}
                >
                  {quyType}
                  <span className={countCls(isSelected)}>{fmtCount(tagCounts[quyType])}</span>
                </button>
              );
            })}
          </div>

          {/* Other quý-related tags (Tam hoa, Tam hoa kép) */}
          <div className={`${listCls} pt-1.5 max-md:pt-1 border-t border-border/50`}>
            {otherQuyTags.map(tag => {
              const active = filters.selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => onToggleTag(tag)}
                  className={chip(active)}
                >
                  {tag}
                  <span className={countCls(active)}>{fmtCount(tagCounts[tag])}</span>
                </button>
              );
            })}
          </div>
        </div>
      </FilterSection>

      {/* Tag Filter - Phong thủy */}
      <FilterSection title="SIM phong thủy">
        <div className={listCls}>
          {phongThuyTags.map(tag => {
            const active = filters.selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => onToggleTag(tag)}
                className={chip(active)}
              >
                {tag}
                <span className={countCls(active)}>{fmtCount(tagCounts[tag])}</span>
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Tag Filter - Style */}
      <FilterSection title="Loại số">
        <div className={listCls}>
          {styleTags.map(tag => {
            const active = filters.selectedTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => onToggleTag(tag)}
                className={chip(active)}
              >
                {tag}
                <span className={countCls(active)}>{fmtCount(tagCounts[tag])}</span>
              </button>
            );
          })}
        </div>
      </FilterSection>

      {/* Network Filter */}
      <FilterSection title="SIM theo mạng">
        <div className={listCls}>
          <p className={`text-[9px] max-md:text-[8px] text-muted-foreground ${isDrawer ? 'col-span-2 mb-0.5 text-[11px] max-md:text-[11px]' : 'mb-1 max-md:mb-0.5'}`}>
            {filters.selectedNetworks.length === 0
              ? '✓ Hiển thị tất cả mạng'
              : 'Nhấn để bỏ chọn mạng'}
          </p>
          {NETWORKS_UI.map(network => {
            const active = filters.selectedNetworks.includes(network);
            return (
              <button
                key={network}
                onClick={() => onToggleNetwork(network)}
                className={chip(active, true)}
              >
                {network}
                <span className={countCls(active)}>{fmtCount(networkCounts[network])}</span>
              </button>
            );
          })}
        </div>
      </FilterSection>
    </aside>
  );
};

export default AdvancedFilterSidebar;
