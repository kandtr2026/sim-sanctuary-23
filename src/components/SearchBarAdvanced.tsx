import { useState, useEffect, useCallback, ClipboardEvent, ChangeEvent } from 'react';
import { Search, X } from 'lucide-react';

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
          className="w-full pl-12 md:pl-16 pr-20 py-2.5 md:py-6 rounded-2xl border border-border/60 bg-card text-lg md:text-2xl focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/50"
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
        </div>
      </div>
    </div>
  );
};

export default SearchBarAdvanced;
