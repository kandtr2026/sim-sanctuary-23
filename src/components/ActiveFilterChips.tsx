import { X, RotateCcw } from 'lucide-react';

interface FilterChip {
  key: string;
  label: string;
  onRemove: () => void;
}

interface ActiveFilterChipsProps {
  chips: FilterChip[];
  resultCount: number;
  onResetAll: () => void;
}

const ActiveFilterChips = ({ chips, resultCount, onResetAll }: ActiveFilterChipsProps) => {
  if (chips.length === 0) {
    return (
      <div className="flex items-center justify-between py-2">
        <span className="text-sm text-muted-foreground">
          Hiển thị <strong className="text-primary">{resultCount.toLocaleString()}</strong> kết quả
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 py-2">
      <span className="text-sm text-muted-foreground whitespace-nowrap">
        <strong className="text-primary">{resultCount.toLocaleString()}</strong> kết quả
      </span>
      
      <div className="flex flex-wrap gap-2 flex-1">
        {chips.map(chip => (
          <button
            key={chip.key}
            onClick={chip.onRemove}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            {chip.label}
            <X className="w-3 h-3" />
          </button>
        ))}
      </div>

      <button
        onClick={onResetAll}
        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium border border-destructive/50 text-destructive hover:bg-destructive/10 transition-colors"
      >
        <RotateCcw className="w-3 h-3" />
        Xóa bộ lọc
      </button>
    </div>
  );
};

export default ActiveFilterChips;
