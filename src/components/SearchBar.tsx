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
        <div className="mt-3 rounded-lg border border-border bg-secondary/60 px-4 py-3 text-[13px] text-muted-foreground">
          <p className="mb-2 font-semibold text-foreground text-sm">Hướng dẫn tìm kiếm:</p>
          <ul className="space-y-1">
            <li><strong className="text-foreground">6789</strong> → Chứa "6789"</li>
            <li><strong className="text-foreground">0903*</strong> → Bắt đầu bằng "0903"</li>
            <li><strong className="text-foreground">090*6789</strong> → Đầu "090", đuôi "6789"</li>
            <li><strong className="text-foreground">*8888</strong> → Kết thúc bằng "8888"</li>
            <li><strong className="text-foreground">0909123456</strong> → Chính xác số này</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
