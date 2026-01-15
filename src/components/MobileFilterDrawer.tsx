import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import AdvancedFilterSidebar from './AdvancedFilterSidebar';
import type { FilterState } from '@/hooks/useSimData';

interface MobileFilterDrawerProps {
  filters: FilterState;
  tagCounts: Record<string, number>;
  prefixes: { prefix3: string[]; prefix4: string[] };
  activeFilterCount: number;
  onTogglePriceRange: (index: number) => void;
  onToggleTag: (tag: string) => void;
  onToggleNetwork: (network: string) => void;
  onToggleSuffix: (suffix: string) => void;
  onUpdateFilter: <K extends keyof FilterState>(key: K, value: FilterState[K]) => void;
  onReset: () => void;
}

const MobileFilterDrawer = ({
  filters,
  tagCounts,
  prefixes,
  activeFilterCount,
  onTogglePriceRange,
  onToggleTag,
  onToggleNetwork,
  onToggleSuffix,
  onUpdateFilter,
  onReset
}: MobileFilterDrawerProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button className="lg:hidden flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium">
          <Filter className="w-4 h-4" />
          Bộ lọc
          {activeFilterCount > 0 && (
            <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-xs">
              {activeFilterCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:w-[400px] p-0 overflow-y-auto">
        <SheetHeader className="p-4 border-b border-border sticky top-0 bg-card z-10">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-primary">Bộ lọc tìm kiếm</SheetTitle>
            <div className="flex items-center gap-2">
              <button
                onClick={onReset}
                className="text-sm text-destructive underline"
              >
                Đặt lại
              </button>
            </div>
          </div>
        </SheetHeader>
        
        <div className="pb-20">
          <AdvancedFilterSidebar
            filters={filters}
            tagCounts={tagCounts}
            prefixes={prefixes}
            onTogglePriceRange={onTogglePriceRange}
            onToggleTag={onToggleTag}
            onToggleNetwork={onToggleNetwork}
            onToggleSuffix={onToggleSuffix}
            onUpdateFilter={onUpdateFilter}
          />
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-card border-t border-border sm:max-w-[400px]">
          <button
            onClick={() => setOpen(false)}
            className="btn-cta w-full py-3 text-base"
          >
            Áp dụng bộ lọc
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileFilterDrawer;
