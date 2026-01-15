import { AlertCircle, Eraser, XCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
}

const EmptyStateHelper = ({
  constraints,
  searchSuggestion,
  onRelaxOne,
  onRelaxAll,
  onReset
}: EmptyStateHelperProps) => {
  return (
    <div className="text-center py-8 px-4">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-muted-foreground" />
      </div>
      
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Không có kết quả phù hợp
      </h3>
      
      {searchSuggestion && (
        <p className="text-sm text-primary mb-4">
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
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Thử các cách sau để tìm được SIM:
        </p>
        
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
    </div>
  );
};

export default EmptyStateHelper;
