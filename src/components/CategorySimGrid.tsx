"use client";

import { useState, useMemo } from 'react';
import { Search } from 'lucide-react';
import { useSimData } from '@/hooks/useSimData';
import SIMCardNew from '@/components/SIMCardNew';

/**
 * Reusable "client island" for SIM category pages. Server Components render the
 * page shell + metadata + JSON-LD; this component pulls the live SIM dataset via
 * useSimData and filters it by suffix/tag/prefix — the same mechanisms the
 * homepage SimBrowser uses, without modifying the hook.
 */
interface CategorySimGridProps {
  /** Heading shown above the grid. */
  title: string;
  /** Placeholder text for the search box. */
  searchPlaceholder: string;
  /** Empty-state message when no SIM matches. */
  emptyText: string;
  /** Sim digits must end with one of these suffixes (e.g. "39"). */
  matchSuffixes?: string[];
  /** Sim tags must include one of these (e.g. "Thần tài"). */
  matchTags?: string[];
  /** Sim digits must start with one of these prefixes (e.g. "090"). */
  matchPrefixes?: string[];
  /** Sim's last digit must be one of these (used for mệnh-based filtering). */
  matchLastDigits?: string[];
  /** Show the full kho without filtering (used by phong thủy hợp mệnh). */
  matchAll?: boolean;
}

const getDigits = (s: { rawDigits?: string; displayNumber?: string }): string =>
  s.rawDigits || s.displayNumber?.replace(/\D/g, '') || '';

const CategorySimGrid = ({
  title,
  searchPlaceholder,
  emptyText,
  matchSuffixes,
  matchTags,
  matchPrefixes,
  matchLastDigits,
  matchAll,
}: CategorySimGridProps) => {
  const { allSims, isLoading } = useSimData();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');

  const categorySims = useMemo(() => {
    const list = allSims.filter((s) => {
      if (s.price <= 0) return false;
      if (matchAll) return true;
      const digits = getDigits(s);
      if (matchPrefixes?.length && !matchPrefixes.some((p) => digits.startsWith(p))) return false;
      if (matchSuffixes?.length && !matchSuffixes.some((suf) => digits.endsWith(suf))) return false;
      if (matchTags?.length && !matchTags.some((t) => s.tags?.includes(t))) return false;
      if (matchLastDigits?.length && !matchLastDigits.includes(digits.slice(-1))) return false;
      return true;
    });
    return [...list].sort((a, b) => a.price - b.price).slice(0, 30);
  }, [allSims, matchSuffixes, matchTags, matchPrefixes, matchLastDigits, matchAll]);

  const searchResults = useMemo(() => {
    if (!activeSearch.trim()) return null;
    const raw = activeSearch.replace(/\s/g, '');
    const q = raw.startsWith('*') ? raw.slice(1) : raw;
    const suffixOnly = raw.startsWith('*');
    const clean = q.replace(/\D/g, '');
    if (!clean) return null;
    return allSims
      .filter((s) => {
        if (s.price <= 0) return false;
        const digits = getDigits(s);
        return suffixOnly ? digits.endsWith(clean) : digits.includes(clean);
      })
      .sort((a, b) => a.price - b.price)
      .slice(0, 30);
  }, [allSims, activeSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setActiveSearch('');
  };

  const displaySims = searchResults ?? categorySims;
  const hasActiveSearch = !!activeSearch.trim();

  return (
    <section id="kho-sim" className="rounded-xl border border-border bg-card p-4 shadow-card md:p-6">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h2 className="flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
          <span className="h-8 w-1 rounded-full bg-primary" />
          {hasActiveSearch ? `Kết quả tìm kiếm "${activeSearch}"` : title}
        </h2>
      </div>

      <form onSubmit={handleSearch} className="mx-auto mb-5 max-w-lg">
        <div className="flex overflow-hidden rounded-xl bg-card shadow-elevated ring-1 ring-gold/20">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              inputMode="tel"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.replace(/[^0-9*]/g, ''))}
              placeholder={searchPlaceholder}
              className="w-full bg-card py-3 pl-12 pr-3 text-base text-foreground focus:outline-none md:py-3.5"
            />
          </div>
          <button
            type="submit"
            className="btn-cta flex items-center gap-2 whitespace-nowrap rounded-none px-5 text-sm font-bold md:px-7 md:text-base"
          >
            <Search className="h-4 w-4" />
            <span className="hidden sm:inline">Tìm SIM</span>
          </button>
        </div>
      </form>

      {hasActiveSearch && (
        <button onClick={clearSearch} className="mb-4 text-sm text-primary hover:underline">
          ← Quay lại kho {title.toLowerCase()}
        </button>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-3 rounded-xl border border-border bg-card p-4">
              <div className="h-4 w-16 rounded bg-muted" />
              <div className="h-6 w-full rounded bg-muted" />
              <div className="h-4 w-20 rounded bg-muted" />
              <div className="h-8 w-full rounded bg-muted" />
            </div>
          ))}
        </div>
      ) : displaySims.length > 0 ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {displaySims.map((sim) => (
            <SIMCardNew key={sim.id} sim={sim} />
          ))}
        </div>
      ) : (
        <div className="py-8 text-center text-muted-foreground">{emptyText}</div>
      )}
    </section>
  );
};

export default CategorySimGrid;
