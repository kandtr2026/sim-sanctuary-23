import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  normalizeSIM, 
  searchSIM, 
  sortSIMs,
  countTags,
  getUniquePrefixes,
  parsePrice,
  type NormalizedSIM,
  type SortOption,
  PRICE_RANGES
} from '@/lib/simUtils';

const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1to6-kNir9gGp9x1oWKYqALUreupHdD7E/export?format=csv&gid=139400129';

// Parse CSV text to array of objects
const parseCSV = (csvText: string): Record<string, string>[] => {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  // Parse header - handle potential BOM
  const headerLine = lines[0].replace(/^\uFEFF/, '');
  const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  const rows: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    if (values.length >= 2) {
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }
  }
  
  return rows;
};

// Fetch and normalize SIM data
const fetchSimData = async (): Promise<NormalizedSIM[]> => {
  const response = await fetch(GOOGLE_SHEET_CSV_URL);
  if (!response.ok) {
    throw new Error('Failed to fetch SIM data');
  }
  
  const csvText = await response.text();
  const rows = parseCSV(csvText);
  
  const sims: NormalizedSIM[] = [];
  
  rows.forEach((row, index) => {
    // Try different column names for the phone number
    const rawNumber = row['THUÊ BAO CHUẨN'] || row['SỐ THUÊ BAO'] || row['SO THUE BAO'] || '';
    const displayNumber = row['SỐ THUÊ BAO'] || row['SO THUE BAO'] || rawNumber;
    const priceStr = row['GIÁ BÁN'] || row['GIA BAN'] || row['Giá'] || '0';
    
    if (rawNumber) {
      const price = parsePrice(priceStr);
      const sim = normalizeSIM(rawNumber, displayNumber, price, `sim-${index}`);
      sims.push(sim);
    }
  });
  
  return sims;
};

// Filter state interface
export interface FilterState {
  searchQuery: string;
  priceRanges: number[]; // indices into PRICE_RANGES
  customPriceMin: number | null;
  customPriceMax: number | null;
  selectedTags: string[];
  selectedNetworks: string[];
  selectedPrefixes3: string[];
  selectedPrefixes4: string[];
  selectedSuffixes: string[];
  customSuffix: string;
  vipFilter: 'all' | 'only' | 'hide';
  vipThreshold: number;
  sortBy: SortOption;
}

export const defaultFilterState: FilterState = {
  searchQuery: '',
  priceRanges: [],
  customPriceMin: null,
  customPriceMax: null,
  selectedTags: [],
  selectedNetworks: ['Mobifone'], // Default to Mobifone
  selectedPrefixes3: [],
  selectedPrefixes4: [],
  selectedSuffixes: [],
  customSuffix: '',
  vipFilter: 'all',
  vipThreshold: 50000000,
  sortBy: 'default'
};

export const useSimData = () => {
  const [filters, setFilters] = useState<FilterState>(defaultFilterState);

  // Fetch data with React Query
  const { data: allSims = [], isLoading, error, refetch } = useQuery({
    queryKey: ['simData'],
    queryFn: fetchSimData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 3
  });

  // Get unique prefixes
  const prefixes = useMemo(() => getUniquePrefixes(allSims), [allSims]);

  // Apply all filters
  const filteredSims = useMemo(() => {
    let result = [...allSims];

    // Search filter
    if (filters.searchQuery) {
      result = result.filter(sim => searchSIM(sim, filters.searchQuery));
    }

    // Price range filter
    if (filters.priceRanges.length > 0) {
      result = result.filter(sim => {
        return filters.priceRanges.some(rangeIndex => {
          const range = PRICE_RANGES[rangeIndex];
          return sim.price >= range.min && sim.price <= range.max;
        });
      });
    }

    // Custom price filter
    if (filters.customPriceMin !== null || filters.customPriceMax !== null) {
      const min = filters.customPriceMin ?? 0;
      const max = filters.customPriceMax ?? Infinity;
      result = result.filter(sim => sim.price >= min && sim.price <= max);
    }

    // Tag filter
    if (filters.selectedTags.length > 0) {
      result = result.filter(sim => {
        return filters.selectedTags.some(tag => {
          if (tag === 'VIP') return sim.isVIP;
          return sim.tags.includes(tag);
        });
      });
    }

    // Network filter
    if (filters.selectedNetworks.length > 0) {
      result = result.filter(sim => filters.selectedNetworks.includes(sim.network));
    }

    // Prefix3 filter
    if (filters.selectedPrefixes3.length > 0) {
      result = result.filter(sim => filters.selectedPrefixes3.includes(sim.prefix3));
    }

    // Prefix4 filter
    if (filters.selectedPrefixes4.length > 0) {
      result = result.filter(sim => filters.selectedPrefixes4.includes(sim.prefix4));
    }

    // Suffix filter
    if (filters.selectedSuffixes.length > 0 || filters.customSuffix) {
      const allSuffixes = [...filters.selectedSuffixes];
      if (filters.customSuffix) {
        allSuffixes.push(filters.customSuffix);
      }
      result = result.filter(sim => {
        return allSuffixes.some(suffix => sim.rawDigits.endsWith(suffix));
      });
    }

    // VIP filter
    if (filters.vipFilter === 'only') {
      result = result.filter(sim => sim.isVIP);
    } else if (filters.vipFilter === 'hide') {
      result = result.filter(sim => !sim.isVIP);
    }

    // Apply sorting
    result = sortSIMs(result, filters.sortBy);

    return result;
  }, [allSims, filters]);

  // Count tags for filtered results
  const tagCounts = useMemo(() => countTags(filteredSims), [filteredSims]);

  // Count tags for all data (for showing total)
  const allTagCounts = useMemo(() => countTags(allSims), [allSims]);

  // Filter update helpers
  const updateFilter = useCallback(<K extends keyof FilterState>(
    key: K, 
    value: FilterState[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const togglePriceRange = useCallback((index: number) => {
    setFilters(prev => ({
      ...prev,
      priceRanges: prev.priceRanges.includes(index)
        ? prev.priceRanges.filter(i => i !== index)
        : [...prev.priceRanges, index]
    }));
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setFilters(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter(t => t !== tag)
        : [...prev.selectedTags, tag]
    }));
  }, []);

  const toggleNetwork = useCallback((network: string) => {
    setFilters(prev => ({
      ...prev,
      selectedNetworks: prev.selectedNetworks.includes(network)
        ? prev.selectedNetworks.filter(n => n !== network)
        : [...prev.selectedNetworks, network]
    }));
  }, []);

  const toggleSuffix = useCallback((suffix: string) => {
    setFilters(prev => ({
      ...prev,
      selectedSuffixes: prev.selectedSuffixes.includes(suffix)
        ? prev.selectedSuffixes.filter(s => s !== suffix)
        : [...prev.selectedSuffixes, suffix]
    }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilterState);
  }, []);

  // Get active filter chips
  const activeFilters = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];

    if (filters.searchQuery) {
      chips.push({
        key: 'search',
        label: `Tìm: ${filters.searchQuery}`,
        onRemove: () => updateFilter('searchQuery', '')
      });
    }

    filters.priceRanges.forEach(index => {
      chips.push({
        key: `price-${index}`,
        label: PRICE_RANGES[index].label,
        onRemove: () => togglePriceRange(index)
      });
    });

    if (filters.customPriceMin !== null || filters.customPriceMax !== null) {
      const min = filters.customPriceMin ? `${(filters.customPriceMin / 1000000).toFixed(0)}tr` : '0';
      const max = filters.customPriceMax ? `${(filters.customPriceMax / 1000000).toFixed(0)}tr` : '∞';
      chips.push({
        key: 'custom-price',
        label: `${min} - ${max}`,
        onRemove: () => {
          updateFilter('customPriceMin', null);
          updateFilter('customPriceMax', null);
        }
      });
    }

    filters.selectedTags.forEach(tag => {
      chips.push({
        key: `tag-${tag}`,
        label: tag,
        onRemove: () => toggleTag(tag)
      });
    });

    filters.selectedNetworks.forEach(network => {
      chips.push({
        key: `network-${network}`,
        label: network,
        onRemove: () => toggleNetwork(network)
      });
    });

    filters.selectedSuffixes.forEach(suffix => {
      chips.push({
        key: `suffix-${suffix}`,
        label: `Đuôi ${suffix}`,
        onRemove: () => toggleSuffix(suffix)
      });
    });

    if (filters.customSuffix) {
      chips.push({
        key: 'custom-suffix',
        label: `Đuôi ${filters.customSuffix}`,
        onRemove: () => updateFilter('customSuffix', '')
      });
    }

    if (filters.vipFilter === 'only') {
      chips.push({
        key: 'vip-only',
        label: 'Chỉ VIP',
        onRemove: () => updateFilter('vipFilter', 'all')
      });
    } else if (filters.vipFilter === 'hide') {
      chips.push({
        key: 'vip-hide',
        label: 'Ẩn VIP',
        onRemove: () => updateFilter('vipFilter', 'all')
      });
    }

    return chips;
  }, [filters, updateFilter, togglePriceRange, toggleTag, toggleNetwork, toggleSuffix]);

  return {
    // Data
    allSims,
    filteredSims,
    isLoading,
    error,
    refetch,

    // Metadata
    prefixes,
    tagCounts,
    allTagCounts,

    // Filters
    filters,
    setFilters,
    updateFilter,
    togglePriceRange,
    toggleTag,
    toggleNetwork,
    toggleSuffix,
    resetFilters,
    activeFilters
  };
};
