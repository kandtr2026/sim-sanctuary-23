import { useState, useEffect, useCallback, ClipboardEvent, ChangeEvent } from 'react';
import { Search, HelpCircle, X } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SearchBarAdvancedProps {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

// Sanitize input: only allow digits 0-9 and wildcard *
const sanitizeInput = (value: string): string => {
  return value.replace(/[^0-9*]/g, '');
};

const SearchBarAdvanced = ({ value, onChange, debounceMs = 300 }: SearchBarAdvancedProps) => {
  const [inputValue, setInputValue] = useState(value);

  // Sync with external value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Debounced onChange
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue !== value) {
        onChange(inputValue);
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [inputValue, debounceMs, onChange, value]);

  const handleClear = useCallback(() => {
    setInputValue('');
    onChange('');
  }, [onChange]);

  // Handle typing - sanitize on every change
  const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeInput(e.target.value);
    setInputValue(sanitized);
  }, []);

  // Handle paste - sanitize pasted content
  const handlePaste = useCallback((e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const sanitized = sanitizeInput(pastedText);
    setInputValue(sanitized);
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2 w-6 h-6 md:w-8 md:h-8 text-muted-foreground" />
        <input
          type="tel"
          inputMode="tel"
          pattern="[0-9*]*"
          value={inputValue}
          onChange={handleChange}
          onPaste={handlePaste}
          autoComplete="off"
          placeholder="Nhập số cần tìm... (VD: 0903*, *8888)"
          className="w-full pr-20 py-4 md:py-6 rounded-2xl border border-border/60 bg-card text-lg md:text-2xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
          style={{ paddingLeft: '3rem' }}
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {inputValue && (
            <button
              onClick={handleClear}
              className="p-1 rounded-full hover:bg-muted transition-colors"
              aria-label="Xóa tìm kiếm"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1 rounded-full hover:bg-muted transition-colors">
                  <HelpCircle className="w-5 h-5 text-primary" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs p-4">
                <p className="font-semibold text-primary mb-2">Hướng dẫn tìm kiếm:</p>
                <ul className="text-sm space-y-1.5">
                  <li><code className="bg-muted px-1 rounded">6789</code> → Chứa "6789"</li>
                  <li><code className="bg-muted px-1 rounded">0903*</code> → Bắt đầu bằng "0903"</li>
                  <li><code className="bg-muted px-1 rounded">*8888</code> → Kết thúc bằng "8888"</li>
                  <li><code className="bg-muted px-1 rounded">090*6789</code> → Đầu "090", đuôi "6789"</li>
                  <li><code className="bg-muted px-1 rounded">=0903123456</code> → Chính xác số này</li>
                </ul>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground text-center">
        💡 Sử dụng <code className="bg-muted px-1 rounded">*</code> để tìm theo đầu/đuôi số. 
        Bỏ qua dấu chấm khi tìm kiếm.
      </p>
    </div>
  );
};

export default SearchBarAdvanced;
