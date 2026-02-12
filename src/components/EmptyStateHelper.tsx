import { useState } from "react";
import { AlertCircle, Eraser, XCircle, Sparkles, Phone, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import SIMCardNew from "@/components/SIMCardNew";
import { getPromotionalData } from "@/hooks/useSimData";
import type { NormalizedSIM } from "@/lib/simUtils";
import { getSuggestionHighlightDigits } from "@/lib/highlightUtils";
import type { FilterState } from "@/hooks/useSimData";

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
  allSims?: NormalizedSIM[];
  searchQuery?: string;
  filters?: FilterState;
  quyFilter?: FilterState["quyType"];
  precomputedSuggestions?: NormalizedSIM[];
  isOrFallback?: boolean; // True when showing OR-fallback results instead of similarity suggestions
}

const ITEMS_PER_PAGE = 100;
const LOAD_MORE_COUNT = 100;

const EmptyStateHelper = ({
  constraints,
  searchSuggestion,
  onRelaxOne,
  onRelaxAll,
  onReset,
  allSims = [],
  searchQuery = "",
  filters,
  quyFilter,
  precomputedSuggestions = [],
  isOrFallback = false,
}: EmptyStateHelperProps) => {
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // Digits-only query for highlighting (ignore quotes/spaces/dots/non-digits)
  const normalizedSearchDigits = String(searchQuery || "").replace(/[^0-9]/g, "");

  // Dev-only debug (enable via: localStorage.setItem('debug_highlight','1'))
  if (import.meta.env.DEV && typeof window !== "undefined" && window.localStorage?.getItem("debug_highlight") === "1") {
    // eslint-disable-next-line no-console
    console.log("[highlight] EmptyStateHelper", { normalizedSearchDigits, rawSearchQuery: searchQuery });
  }

  // Use precomputed suggestions from parent
  const similarSims = precomputedSuggestions.slice(0, visibleCount);
  const hasMoreSuggestions = precomputedSuggestions.length > visibleCount;
  const remainingCount = precomputedSuggestions.length - visibleCount;

  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + LOAD_MORE_COUNT);
  };

  // Display query for notice (original format, not sanitized)
  const displayQuery =
    searchQuery ||
    constraints
      .find((c) => c.key === "searchQuery")
      ?.label.replace('Tìm: "', "")
      .replace('"', "") ||
    "";

  const hasSuggestions = precomputedSuggestions.length > 0;

  return (
    <div className={hasSuggestions ? "py-2" : "py-6 px-4"}>
      {/* Similar SIM Suggestions - Show FIRST when available */}
      {hasSuggestions && (
        <div className="mb-4">
          {/* Compact Notice Banner - Yellow background */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span className="text-sm font-medium text-amber-800">
                {displayQuery
                  ? `Không tìm thấy kết quả phù hợp cho "${displayQuery}"`
                  : "Không tìm thấy SIM phù hợp với bộ lọc"}
              </span>
              <span className="text-xs text-amber-700">—</span>
              <span className="text-xs text-amber-700">Dưới đây là các số gợi ý để bạn tham khảo.</span>
              <span className="text-xs text-amber-600 flex items-center gap-1 ml-auto">
                <Phone className="w-3 h-3" />
                Hotline: <strong className="text-primary">0938.868.868</strong>
              </span>
            </div>
          </div>

          {/* Compact filter actions */}
          {constraints.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap mb-3">
              <span className="text-xs text-muted-foreground">Lọc:</span>
              {constraints.slice(0, 3).map((constraint) => (
                <button
                  key={constraint.key}
                  onClick={constraint.onRemove}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                >
                  {constraint.label}
                  <XCircle className="w-3 h-3" />
                </button>
              ))}
              {constraints.length > 3 && (
                <span className="text-xs text-muted-foreground">+{constraints.length - 3}</span>
              )}
              <div className="flex gap-1 ml-auto">
                <Button variant="ghost" size="sm" onClick={onRelaxOne} className="h-6 px-2 text-xs">
                  <Eraser className="w-3 h-3 mr-1" />
                  Bỏ 1
                </Button>
                <Button variant="ghost" size="sm" onClick={onReset} className="h-6 px-2 text-xs">
                  <XCircle className="w-3 h-3 mr-1" />
                  Xóa hết
                </Button>
              </div>
            </div>
          )}

          {/* Title for suggestions */}
          <h4 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            {`GỢI Ý (${precomputedSuggestions.length.toLocaleString()} SIM)`}
          </h4>

          {/* SIM Grid - Same layout as main listing */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {similarSims.map((sim) => {
              // Compute smart highlight for suggestion: find longest matching suffix/substring
              const candidateDigits = String(sim.rawDigits || sim.displayNumber || "").replace(/[^0-9]/g, "");
              const suggestHighlight = getSuggestionHighlightDigits(normalizedSearchDigits, candidateDigits);

              return (
                <SIMCardNew
                  key={sim.id}
                  sim={sim}
                  promotional={getPromotionalData(sim.id)}
                  quyFilter={quyFilter}
                  searchQuery={suggestHighlight}
                />
              );
            })}
          </div>

          {/* Load more button */}
          {hasMoreSuggestions && (
            <div className="mt-4 text-center">
              <button onClick={handleLoadMore} className="btn-cta inline-flex items-center gap-2 px-6 py-2 text-sm">
                <ChevronDown className="w-4 h-4" />
                <span>Xem thêm {Math.min(remainingCount, LOAD_MORE_COUNT)} SIM</span>
              </button>
              <p className="text-xs text-muted-foreground mt-1">Còn {remainingCount.toLocaleString()} SIM gợi ý</p>
            </div>
          )}
        </div>
      )}

      {/* Original empty state layout - Only show if NO suggestions */}
      {!hasSuggestions && (
        <>
          {/* Notice Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-semibold text-amber-800 mb-1">
                  {displayQuery
                    ? `Không tìm thấy kết quả phù hợp cho "${displayQuery}"`
                    : "Không tìm thấy SIM phù hợp với bộ lọc"}
                </h3>
                <p className="text-sm text-amber-700 mb-2">
                  {displayQuery
                    ? "Vui lòng thử tìm kiếm với số khác hoặc liên hệ hotline."
                    : "Các bộ lọc đã chọn không khớp với SIM nào trong kho."}
                </p>
                <div className="flex items-center gap-2 text-sm text-amber-800">
                  <Phone className="w-4 h-4" />
                  <span>
                    Quý khách có thể gọi <strong className="text-primary">Hotline: 0938.868.868</strong> để được tư vấn
                  </span>
                </div>
              </div>
            </div>
          </div>

          {searchSuggestion && <p className="text-sm text-primary mb-4 text-center">💡 Gợi ý: {searchSuggestion}</p>}

          {/* Active constraints */}
          {constraints.length > 0 && (
            <div className="mb-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground mb-3">Các bộ lọc đang áp dụng:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {constraints.map((constraint) => (
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
                  <Button variant="outline" size="sm" onClick={onRelaxOne} className="gap-1">
                    <Eraser className="w-4 h-4" />
                    Bỏ 1 bộ lọc
                  </Button>

                  <Button variant="outline" size="sm" onClick={onRelaxAll} className="gap-1">
                    <Sparkles className="w-4 h-4" />
                    Nới lỏng tất cả
                  </Button>
                </>
              )}

              <Button variant="default" size="sm" onClick={onReset} className="gap-1">
                <XCircle className="w-4 h-4" />
                Xóa toàn bộ
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EmptyStateHelper;
