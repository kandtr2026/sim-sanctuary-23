import Link from 'next/link';
import { PRICE_RANGES, type QuyType } from '@/lib/simUtils';
import type { FilterState } from '@/hooks/useSimData';

interface QuickPickChipsProps {
  filters: FilterState;
  onTogglePriceRange: (index: number) => void;
  onToggleTag: (tag: string) => void;
  onUpdateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
}

// Price chips are matched to PRICE_RANGES by LABEL, not by a hard-coded index.
// The filter chain identifies a price range by its position in that array, so a
// literal 0/1/2 here would silently point at the wrong bracket the moment anyone
// reorders or inserts a range. indexOf keeps the two in sync by construction, and
// a label typo shows up as a missing chip rather than as a wrong filter.
const PRICE_CHIP_LABELS = ['Dưới 1 triệu', '1 - 3 triệu', '3 - 5 triệu'] as const;

const priceChips = PRICE_CHIP_LABELS.map((label) => ({
  label: label.replace(/\btriệu\b/gi, 'Tr'),
  index: PRICE_RANGES.findIndex((r) => r.label === label),
})).filter((c) => c.index !== -1);

// Tag chips reuse the exact tag strings the sidebar sends to onToggleTag, so a chip
// and its sidebar equivalent toggle one shared piece of state (no second source of
// truth beside ActiveFilterChips).
const tagChips = ['Lộc phát', 'Thần tài', 'Năm sinh'];

const QUY_CHIP: QuyType = 'Tứ quý';

const chipBase =
  'flex-shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors';
const chipIdle = 'border-border bg-card text-foreground/80 hover:border-primary hover:text-primary';
const chipActive = 'border-primary bg-primary text-primary-foreground';

const QuickPickChips = ({
  filters,
  onTogglePriceRange,
  onToggleTag,
  onUpdateFilter,
}: QuickPickChipsProps) => {
  return (
    <div className="mb-4">
      {/* Horizontal scroll on mobile: these must stay on one line rather than
          wrapping into a tall block, since the whole point is to keep the SIM grid
          above the fold. */}
      <div
        className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="group"
        aria-label="Chọn nhanh SIM theo giá và loại số"
      >
        <span className="flex-shrink-0 text-xs font-medium text-muted-foreground">Chọn nhanh:</span>

        {priceChips.map((chip) => {
          const isActive = filters.priceRanges.includes(chip.index);
          return (
            <button
              key={chip.label}
              type="button"
              onClick={() => onTogglePriceRange(chip.index)}
              aria-pressed={isActive}
              className={`${chipBase} ${isActive ? chipActive : chipIdle}`}
            >
              {chip.label}
            </button>
          );
        })}

        {/* quyType is single-select (radio-like), matching handleQuyTypeClick in
            AdvancedFilterSidebar: clicking the active one clears it. */}
        <button
          type="button"
          onClick={() => onUpdateFilter('quyType', filters.quyType === QUY_CHIP ? null : QUY_CHIP)}
          aria-pressed={filters.quyType === QUY_CHIP}
          className={`${chipBase} ${filters.quyType === QUY_CHIP ? chipActive : chipIdle}`}
        >
          {QUY_CHIP}
        </button>

        {tagChips.map((tag) => {
          const isActive = filters.selectedTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => onToggleTag(tag)}
              aria-pressed={isActive}
              className={`${chipBase} ${isActive ? chipActive : chipIdle}`}
            >
              {tag}
            </button>
          );
        })}

        {/* Navigation, not a filter — this is the surviving CTA from the deleted hero
            banner ("KHO SIM ĐỒNG GIÁ 229K"), which was the banner's only real function.
            Styled distinctly (gold) so it doesn't read as another filter toggle. */}
        <Link
          href="/mua-sim-gia-re"
          className={`${chipBase} border-gold/60 bg-gold/10 text-gold hover:bg-gold/20`}
        >
          SIM 229K →
        </Link>
      </div>
    </div>
  );
};

export default QuickPickChips;
