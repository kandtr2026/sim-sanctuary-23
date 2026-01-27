import { useState } from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  buttonText?: string;
  showHints?: boolean;
  microCopy?: string;
}

const SearchBar = ({ 
  onSearch, 
  placeholder = "Nhập số cần tìm...",
  buttonText = "Tìm SIM",
  showHints = true,
  microCopy
}: SearchBarProps) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <div className="bg-card rounded-xl p-6 shadow-card border border-border">
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
            type="tel"
            inputMode="tel"
            pattern="[0-9*]*"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-12 pr-4 py-4 rounded-lg border-2 border-border bg-background text-foreground text-lg font-medium focus:border-primary focus:outline-none transition-colors"
          />
        </div>
        <button type="submit" className="btn-cta flex items-center justify-center gap-2 min-w-[140px]">
          <Search className="w-5 h-5" />
          <span>{buttonText}</span>
        </button>
      </form>
      
      {microCopy && (
        <p className="mt-3 text-center text-sm text-gold font-medium">{microCopy}</p>
      )}
      
      {showHints && (
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            Gõ <strong className="text-foreground">6789</strong> → tìm số chứa 6789
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            Gõ <strong className="text-foreground">090*8888</strong> → đầu 090 đuôi 8888
          </span>
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            Gõ <strong className="text-foreground">0914*</strong> → đầu 0914
          </span>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
