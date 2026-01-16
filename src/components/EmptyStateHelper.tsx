import { useState, useMemo } from 'react';
import { AlertCircle, Eraser, XCircle, Sparkles, Phone, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SIMCardNew from '@/components/SIMCardNew';
import { getSimilarSims } from '@/lib/similarSimSuggestions';
import { getPromotionalData } from '@/hooks/useSimData';
import type { NormalizedSIM } from '@/lib/simUtils';
import type { FilterState } from '@/hooks/useSimData';

interface Constraint {
  key: string;
  label: string;
  onRemove: () => void;
}

interface EmptyStateHelperProps {
  constraints: Constraint[];
  searchSuggestion?: string | null;
  onRelaxOne: () => void;
  onRelaxAll: () => void;
  onReset: () => void;
  // New props for suggestions
  allSims?: NormalizedSIM[];
  searchQuery?: string;
  filters?: FilterState;
  quyFilter?: FilterState['quyType'];
}

const INITIAL_SUGGESTIONS = 12;
const LOAD_MORE_COUNT = 12;

const EmptyStateHelper = ({
  constraints,
  searchSuggestion,
  onRelaxOne,
  onRelaxAll,
  onReset,
  allSims = [],
  searchQuery = '',
  filters,
  quyFilter
}: EmptyStateHelperProps) => {
  const [suggestionLimit, setSuggestionLimit] = useState(INITIAL_SUGGESTIONS);

  // Compute similar SIMs using memoization
  const similarSims = useMemo(() => {
    if (allSims.length === 0 || !filters) return [];
    
    return getSimilarSims({
      allSims,
      searchQuery,
      activeFilters: filters,
      limit: suggestionLimit
    });
  }, [allSims, searchQuery, filters, suggestionLimit]);

  const handleLoadMore = () => {
    setSuggestionLimit(prev => prev + LOAD_MORE_COUNT);
  };

  // Display query for notice (original format, not sanitized)
  const displayQuery = searchQuery || constraints.find(c => c.key === 'searchQuery')?.label.replace('Tìm: "', '').replace('"', '') || '';

  return (
    <div className="py-6 px-4">
      {/* Notice Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-amber-800 mb-1">
              {displayQuery 
                ? `SIM dạng "${displayQuery}" chưa có kết quả`
                : 'Không tìm thấy SIM phù hợp với bộ lọc'}
            </h3>
            <p className="text-sm text-amber-700 mb-2">
              {displayQuery 
                ? 'Số này có thể chưa được cập nhật trong hệ thống.'
                : 'Các bộ lọc đã chọn không khớp với SIM nào trong kho.'}
            </p>
            <div className="flex items-center gap-2 text-sm text-amber-800">
              <Phone className="w-4 h-4" />
              <span>Quý khách có thể gọi <strong className="text-primary">Hotline: 0933.686.666</strong> để được tư vấn</span>
            </div>
            {similarSims.length > 0 && (
              <p className="text-sm text-amber-700 mt-2 font-medium">
                👇 Hoặc tham khảo danh sách số tương tự dưới đây:
              </p>
            )}
          </div>
        </div>
      </div>

      {searchSuggestion && (
        <p className="text-sm text-primary mb-4 text-center">
          💡 Gợi ý: {searchSuggestion}
        </p>
      )}

      {/* Active constraints */}
      {constraints.length > 0 && (
        <div className="mb-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground mb-3">
            Các bộ lọc đang áp dụng:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {constraints.map(constraint => (
              <button
                key={constraint.key}
                onClick={constraint.onRemove}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
              >
                {constraint.label}
                <XCircle className="w-3 h-3" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="space-y-3 mb-6">
        <div className="flex flex-wrap justify-center gap-2">
          {constraints.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={onRelaxOne}
                className="gap-1"
              >
                <Eraser className="w-4 h-4" />
                Bỏ 1 bộ lọc
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={onRelaxAll}
                className="gap-1"
              >
                <Sparkles className="w-4 h-4" />
                Nới lỏng tất cả
              </Button>
            </>
          )}
          
          <Button
            variant="default"
            size="sm"
            onClick={onReset}
            className="gap-1"
          >
            <XCircle className="w-4 h-4" />
            Xóa toàn bộ
          </Button>
        </div>
      </div>

      {/* Similar SIM Suggestions */}
      {similarSims.length > 0 && (
        <div className="mt-6">
          <h4 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Danh sách số tương tự:
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {similarSims.map((sim) => (
              <SIMCardNew
                key={sim.id}
                sim={sim}
                promotional={getPromotionalData(sim.id)}
                quyFilter={quyFilter}
              />
            ))}
          </div>

          {/* Load more button */}
          {similarSims.length >= suggestionLimit && allSims.length > suggestionLimit && (
            <div className="mt-6 text-center">
              <Button
                variant="outline"
                onClick={handleLoadMore}
                className="gap-2"
              >
                <ChevronDown className="w-4 h-4" />
                Xem thêm gợi ý
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EmptyStateHelper;
