import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  normalizeSIM, 
  searchSIM, 
  sortSIMs,
  countTags,
  getUniquePrefixes,
  parsePrice,
  estimatePriceByTags,
  type NormalizedSIM,
  type SortOption,
  PRICE_RANGES
} from '@/lib/simUtils';
import { toast } from 'sonner';

// DATA URLS - Primary and Fallback
const PUBLISHED_CSV_URL = ''; // Add published 2PACX URL here if available
const EXPORT_CSV_URL = 'https://docs.google.com/spreadsheets/d/1to6-kNir9gGp9x1oWKYqALUreupHdD7E/export?format=csv&gid=139400129';

// Storage keys
const CSV_CACHE_KEY = 'sim_csv_cache';
const CSV_CACHE_TIME_KEY = 'sim_csv_cache_time';
const STORAGE_KEY = 'chonsomobifone_sim_cache';

const AUTO_REFRESH_INTERVAL = 3 * 60 * 1000; // 3 minutes
const FETCH_TIMEOUT = 10000; // 10 seconds
const MAX_CACHE_AGE = 60 * 60 * 1000; // 1 hour

// Invalid CSV patterns (HTML responses, login pages, etc.)
const INVALID_CSV_PATTERNS = [
  '<html',
  '<!DOCTYPE',
  'accounts.google.com',
  'ServiceLogin',
  'Sign in',
  'You need access',
  'Request access',
  'Access denied'
];

// Valid CSV headers to look for
const VALID_HEADERS = [
  'SỐ THUÊ BAO', 'SO THUE BAO', 'SỐTHUÊBAO', 'SOTHUEBAO',
  'THUÊ BAO CHUẨN', 'THUE BAO CHUAN', 'THUÊBAOCHUẨN', 'THUEBAOCHUAN'
];

// Validate CSV text - reject HTML/login pages
const validateCSV = (text: string): { valid: boolean; reason?: string } => {
  const lowerText = text.toLowerCase().slice(0, 2000); // Check first 2000 chars
  
  // Check for invalid patterns
  for (const pattern of INVALID_CSV_PATTERNS) {
    if (lowerText.includes(pattern.toLowerCase())) {
      return { valid: false, reason: `Invalid response: contains "${pattern}"` };
    }
  }
  
  // Check for valid headers
  const hasValidHeader = VALID_HEADERS.some(header => 
    text.toUpperCase().includes(header.toUpperCase())
  );
  
  if (!hasValidHeader) {
    return { valid: false, reason: 'Missing required CSV headers' };
  }
  
  // Check for minimum content (header + at least 1 data row)
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    return { valid: false, reason: 'CSV has no data rows' };
  }
  
  return { valid: true };
};

// Header normalization mapping
const normalizeHeader = (header: string): string => {
  const cleaned = header.trim().toUpperCase().replace(/\s+/g, ' ');
  
  // Raw number variants
  if (['THUÊ BAO CHUẨN', 'THUE BAO CHUAN', 'THUÊBAOCHUẨN', 'THUEBAOCHUAN'].includes(cleaned)) {
    return 'RAW';
  }
  
  // Display number variants
  if (['SỐ THUÊ BAO', 'SO THUE BAO', 'SỐTHUÊBAO', 'SOTHUEBAO', 'SỐ ĐIỆN THOẠI', 'SO DIEN THOAI'].includes(cleaned)) {
    return 'DISPLAY';
  }
  
  // Price variants
  if (['GIÁ BÁN', 'GIA BAN', 'GIÁBAN', 'GIABAN', 'GIÁ', 'GIA', 'PRICE'].includes(cleaned)) {
    return 'PRICE';
  }
  
  return cleaned;
};

// Parse CSV text to array of objects with header normalization
const parseCSV = (csvText: string): Record<string, string>[] => {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  // Parse header - handle potential BOM
  const headerLine = lines[0].replace(/^\uFEFF/, '');
  const rawHeaders = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const headers = rawHeaders.map(normalizeHeader);
  
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

// Save raw CSV to cache
const saveCsvToCache = (csvText: string) => {
  try {
    localStorage.setItem(CSV_CACHE_KEY, csvText);
    localStorage.setItem(CSV_CACHE_TIME_KEY, Date.now().toString());
  } catch (e) {
    console.warn('Failed to save CSV to cache:', e);
  }
};

// Load raw CSV from cache
const loadCsvFromCache = (): { csv: string; timestamp: number } | null => {
  try {
    const csv = localStorage.getItem(CSV_CACHE_KEY);
    const timeStr = localStorage.getItem(CSV_CACHE_TIME_KEY);
    if (csv && timeStr) {
      return { csv, timestamp: parseInt(timeStr, 10) };
    }
  } catch (e) {
    console.warn('Failed to load CSV from cache:', e);
  }
  return null;
};

// Save normalized SIMs to cache
const saveToCache = (data: NormalizedSIM[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      timestamp: Date.now(),
      data
    }));
  } catch (e) {
    console.warn('Failed to save to cache:', e);
  }
};

// Load normalized SIMs from cache
const loadFromCache = (): { data: NormalizedSIM[]; timestamp: number } | null => {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const { data, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < MAX_CACHE_AGE && data?.length > 0) {
        return { data, timestamp };
      }
    }
  } catch (e) {
    console.warn('Failed to load from cache:', e);
  }
  return null;
};

// Fetch single URL with retry and timeout
const fetchSingleUrl = async (url: string, retries = 3): Promise<string> => {
  const delays = [500, 1000, 2000];
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
      
      // Add cache-busting parameter
      const separator = url.includes('?') ? '&' : '?';
      const bustUrl = `${url}${separator}t=${Date.now()}`;
      
      console.log(`[SIM] Fetching attempt ${attempt + 1}/${retries}: ${bustUrl}`);
      
      const response = await fetch(bustUrl, {
        signal: controller.signal,
        mode: 'cors',
        headers: {
          'Accept': 'text/csv,*/*'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const text = await response.text();
      
      // Validate CSV content
      const validation = validateCSV(text);
      if (!validation.valid) {
        throw new Error(validation.reason || 'Invalid CSV response');
      }
      
      console.log(`[SIM] Successfully fetched valid CSV (${text.length} chars)`);
      return text;
      
    } catch (error) {
      console.warn(`[SIM] Attempt ${attempt + 1} failed:`, error);
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, delays[attempt]));
      } else {
        throw error;
      }
    }
  }
  
  throw new Error('All retries failed');
};

// Fetch CSV with fallback strategy
const fetchCsvWithFallback = async (): Promise<string> => {
  const urls = [
    PUBLISHED_CSV_URL,
    EXPORT_CSV_URL
  ].filter(url => url.trim()); // Filter out empty URLs
  
  let lastError: Error | null = null;
  
  for (const url of urls) {
    try {
      console.log(`[SIM] Trying URL: ${url}`);
      return await fetchSingleUrl(url);
    } catch (error) {
      console.warn(`[SIM] Failed to fetch from ${url}:`, error);
      lastError = error as Error;
    }
  }
  
  // All URLs failed - try cache
  const cached = loadCsvFromCache();
  if (cached && cached.csv) {
    console.log(`[SIM] Using cached CSV from ${new Date(cached.timestamp).toLocaleTimeString()}`);
    return cached.csv;
  }
  
  throw lastError || new Error('Failed to fetch CSV from all sources');
};

// Last fetch timestamp for UI display
let lastFetchTimestamp: number | null = null;
let usingCachedData = false;

// Get last updated info
export const getLastUpdateInfo = (): { timestamp: number | null; isCache: boolean } => ({
  timestamp: lastFetchTimestamp,
  isCache: usingCachedData
});

// Fetch and normalize SIM data
const fetchSimData = async (): Promise<NormalizedSIM[]> => {
  usingCachedData = false;
  
  try {
    const csvText = await fetchCsvWithFallback();
    
    // Save raw CSV to cache on success
    saveCsvToCache(csvText);
    lastFetchTimestamp = Date.now();
    
    const rows = parseCSV(csvText);
    console.log(`[SIM] Parsed ${rows.length} rows from CSV`);
    
    const sims: NormalizedSIM[] = [];
    
    rows.forEach((row, index) => {
      // Use normalized headers
      const rawNumber = row['RAW'] || row['DISPLAY'] || '';
      const displayNumber = row['DISPLAY'] || row['RAW'] || rawNumber;
      const priceStr = row['PRICE'] || '0';
      
      // Extract digits only
      const rawDigits = rawNumber.replace(/\D/g, '');
      
      // Ignore rows with less than 9 digits
      if (rawDigits.length < 9) return;
      
      let price = parsePrice(priceStr);
      
      // Estimate price if missing or invalid
      if (!price || price <= 0) {
        const { tags } = normalizeSIM(rawNumber, displayNumber, 0, `temp-${index}`);
        price = estimatePriceByTags(tags);
      }
      
      const sim = normalizeSIM(rawNumber, displayNumber, price, `sim-${index}`);
      sims.push(sim);
    });
    
    console.log(`[SIM] Normalized ${sims.length} SIMs`);
    
    // Save normalized SIMs to cache
    if (sims.length > 0) {
      saveToCache(sims);
    }
    
    return sims;
    
  } catch (error) {
    console.error('[SIM] Fetch failed, trying cached normalized data:', error);
    
    // Try loading normalized SIMs from cache
    const cachedData = loadFromCache();
    if (cachedData && cachedData.data.length > 0) {
      usingCachedData = true;
      lastFetchTimestamp = cachedData.timestamp;
      toast.warning('Không thể tải dữ liệu mới. Đang dùng dữ liệu tạm (cache).', {
        duration: 5000,
        action: {
          label: 'Tải lại',
          onClick: () => window.location.reload()
        }
      });
      return cachedData.data;
    }
    
    throw error;
  }
};

// Filter state interface
export interface FilterState {
  searchQuery: string;
  priceRanges: number[]; // indices into PRICE_RANGES
  customPriceMin: number | null;
  customPriceMax: number | null;
  selectedTags: string[];
  selectedNetworks: string[]; // Empty = ALL networks (anti 0 results)
  selectedPrefixes3: string[];
  selectedPrefixes4: string[];
  selectedSuffixes: string[];
  customSuffix: string;
  vipFilter: 'all' | 'only' | 'hide';
  vipThreshold: number;
  sortBy: SortOption;
  mobifoneFirst: boolean; // Sort Mobifone higher but don't hide others
}

export const defaultFilterState: FilterState = {
  searchQuery: '',
  priceRanges: [],
  customPriceMin: null,
  customPriceMax: null,
  selectedTags: [],
  selectedNetworks: [], // Default to ALL networks (anti 0 results)
  selectedPrefixes3: [],
  selectedPrefixes4: [],
  selectedSuffixes: [],
  customSuffix: '',
  vipFilter: 'all',
  vipThreshold: 50000000,
  sortBy: 'default',
  mobifoneFirst: true // Sort Mobifone first but show all
};

// Relax filter priority order
const RELAX_ORDER: (keyof FilterState)[] = [
  'customSuffix',
  'selectedSuffixes',
  'selectedPrefixes3',
  'selectedPrefixes4',
  'selectedTags',
  'priceRanges',
  'customPriceMin',
  'customPriceMax',
  'selectedNetworks',
  'searchQuery'
];

export const useSimData = () => {
  const [filters, setFilters] = useState<FilterState>(defaultFilterState);
  const queryClient = useQueryClient();

  // Fetch data with React Query
  const { data: allSims = [], isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['simData'],
    queryFn: fetchSimData,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 0, // We handle retries in fetchWithRetry
    refetchInterval: AUTO_REFRESH_INTERVAL,
    refetchIntervalInBackground: false
  });

  // Force reload function
  const forceReload = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['simData'] });
    toast.info('Đang tải lại dữ liệu...');
  }, [queryClient]);

  // Get unique prefixes
  const prefixes = useMemo(() => getUniquePrefixes(allSims), [allSims]);

  // Apply all filters
  const filteredSims = useMemo(() => {
    let result = [...allSims];

    // Search filter (only if >= 2 digits)
    if (filters.searchQuery) {
      const digitCount = filters.searchQuery.replace(/\D/g, '').length;
      if (digitCount >= 2) {
        result = result.filter(sim => searchSIM(sim, filters.searchQuery));
      }
    }

    // Price range filter (only if selected)
    if (filters.priceRanges.length > 0) {
      result = result.filter(sim => {
        return filters.priceRanges.some(rangeIndex => {
          const range = PRICE_RANGES[rangeIndex];
          return sim.price >= range.min && sim.price <= range.max;
        });
      });
    }

    // Custom price filter (only if set)
    if (filters.customPriceMin !== null || filters.customPriceMax !== null) {
      const min = filters.customPriceMin ?? 0;
      const max = filters.customPriceMax ?? Infinity;
      result = result.filter(sim => sim.price >= min && sim.price <= max);
    }

    // Tag filter (only if selected)
    if (filters.selectedTags.length > 0) {
      result = result.filter(sim => {
        return filters.selectedTags.some(tag => {
          if (tag === 'VIP') return sim.isVIP;
          return sim.tags.includes(tag);
        });
      });
    }

    // Network filter (only if explicitly selected - empty means ALL)
    if (filters.selectedNetworks.length > 0) {
      result = result.filter(sim => filters.selectedNetworks.includes(sim.network));
    }

    // Prefix3 filter (only if selected)
    if (filters.selectedPrefixes3.length > 0) {
      result = result.filter(sim => filters.selectedPrefixes3.includes(sim.prefix3));
    }

    // Prefix4 filter (only if selected)
    if (filters.selectedPrefixes4.length > 0) {
      result = result.filter(sim => filters.selectedPrefixes4.includes(sim.prefix4));
    }

    // Suffix filter (only if selected)
    if (filters.selectedSuffixes.length > 0 || filters.customSuffix) {
      const allSuffixes = [...filters.selectedSuffixes];
      if (filters.customSuffix) {
        allSuffixes.push(filters.customSuffix);
      }
      result = result.filter(sim => {
        return allSuffixes.some(suffix => sim.rawDigits.endsWith(suffix));
      });
    }

    // VIP filter with conflict prevention
    if (filters.vipFilter === 'only') {
      result = result.filter(sim => sim.isVIP);
    } else if (filters.vipFilter === 'hide') {
      result = result.filter(sim => !sim.isVIP);
    }

    // Apply sorting
    result = sortSIMs(result, filters.sortBy);

    // If mobifoneFirst is enabled, sort Mobifone to top (but keep all)
    if (filters.mobifoneFirst && filters.sortBy === 'default') {
      result = result.sort((a, b) => {
        if (a.network === 'Mobifone' && b.network !== 'Mobifone') return -1;
        if (a.network !== 'Mobifone' && b.network === 'Mobifone') return 1;
        return 0;
      });
    }

    return result;
  }, [allSims, filters]);

  // Count tags for all data (not filtered, to show totals)
  const tagCounts = useMemo(() => countTags(allSims), [allSims]);

  // Count tags for filtered results
  const filteredTagCounts = useMemo(() => countTags(filteredSims), [filteredSims]);

  // Get active constraints for "relax mode"
  const activeConstraints = useMemo(() => {
    const constraints: { key: keyof FilterState; label: string; onRemove: () => void }[] = [];

    if (filters.searchQuery) {
      constraints.push({
        key: 'searchQuery',
        label: `Tìm: "${filters.searchQuery}"`,
        onRemove: () => updateFilter('searchQuery', '')
      });
    }

    if (filters.selectedSuffixes.length > 0) {
      constraints.push({
        key: 'selectedSuffixes',
        label: `Đuôi số: ${filters.selectedSuffixes.join(', ')}`,
        onRemove: () => updateFilter('selectedSuffixes', [])
      });
    }

    if (filters.customSuffix) {
      constraints.push({
        key: 'customSuffix',
        label: `Đuôi: ${filters.customSuffix}`,
        onRemove: () => updateFilter('customSuffix', '')
      });
    }

    if (filters.selectedPrefixes3.length > 0) {
      constraints.push({
        key: 'selectedPrefixes3',
        label: `Đầu số: ${filters.selectedPrefixes3.join(', ')}`,
        onRemove: () => updateFilter('selectedPrefixes3', [])
      });
    }

    if (filters.selectedTags.length > 0) {
      constraints.push({
        key: 'selectedTags',
        label: `Loại: ${filters.selectedTags.join(', ')}`,
        onRemove: () => updateFilter('selectedTags', [])
      });
    }

    if (filters.priceRanges.length > 0) {
      constraints.push({
        key: 'priceRanges',
        label: `Khoảng giá đã chọn`,
        onRemove: () => updateFilter('priceRanges', [])
      });
    }

    if (filters.customPriceMin !== null || filters.customPriceMax !== null) {
      const min = filters.customPriceMin ? `${(filters.customPriceMin / 1000000).toFixed(0)}tr` : '0';
      const max = filters.customPriceMax ? `${(filters.customPriceMax / 1000000).toFixed(0)}tr` : '∞';
      constraints.push({
        key: 'customPriceMin',
        label: `Giá: ${min} - ${max}`,
        onRemove: () => {
          updateFilter('customPriceMin', null);
          updateFilter('customPriceMax', null);
        }
      });
    }

    if (filters.selectedNetworks.length > 0) {
      constraints.push({
        key: 'selectedNetworks',
        label: `Mạng: ${filters.selectedNetworks.join(', ')}`,
        onRemove: () => updateFilter('selectedNetworks', [])
      });
    }

    return constraints;
  }, [filters]);

  // Relax filters one by one until results > 0
  const relaxFilters = useCallback(() => {
    const relaxedMessages: string[] = [];
    
    setFilters(prev => {
      const newFilters = { ...prev };
      
      for (const key of RELAX_ORDER) {
        // Check if this filter is active
        const value = newFilters[key];
        const isEmpty = 
          value === '' || 
          value === null || 
          (Array.isArray(value) && value.length === 0);
        
        if (!isEmpty) {
          // Relax this filter
          if (Array.isArray(value)) {
            (newFilters[key] as typeof value) = [];
          } else if (typeof value === 'string') {
            (newFilters[key] as string) = '';
          } else {
            (newFilters[key] as typeof value) = null as typeof value;
          }
          
          // Map key to Vietnamese description
          const keyLabels: Record<string, string> = {
            searchQuery: 'Từ khóa tìm kiếm',
            selectedSuffixes: 'Bộ lọc đuôi số',
            customSuffix: 'Đuôi số tùy chỉnh',
            selectedPrefixes3: 'Bộ lọc đầu số',
            selectedPrefixes4: 'Bộ lọc đầu 4 số',
            selectedTags: 'Bộ lọc loại số',
            priceRanges: 'Khoảng giá',
            customPriceMin: 'Giá tối thiểu',
            customPriceMax: 'Giá tối đa',
            selectedNetworks: 'Bộ lọc mạng'
          };
          
          relaxedMessages.push(keyLabels[key] || key);
          break; // Only relax one filter at a time
        }
      }
      
      return newFilters;
    });

    if (relaxedMessages.length > 0) {
      toast.info(`Đã bỏ: ${relaxedMessages.join(', ')}`);
    }
  }, []);

  // Auto-relax all filters at once
  const relaxAllFilters = useCallback(() => {
    setFilters(prev => ({
      ...prev,
      searchQuery: '',
      priceRanges: [],
      customPriceMin: null,
      customPriceMax: null,
      selectedTags: [],
      selectedNetworks: [],
      selectedPrefixes3: [],
      selectedPrefixes4: [],
      selectedSuffixes: [],
      customSuffix: ''
    }));
    toast.success('Đã nới lỏng tất cả bộ lọc');
  }, []);

  // Filter update helpers
  const updateFilter = useCallback(<K extends keyof FilterState>(
    key: K, 
    value: FilterState[K]
  ) => {
    setFilters(prev => {
      // VIP conflict prevention
      if (key === 'vipFilter') {
        // No special handling needed since we're setting directly
      }
      return { ...prev, [key]: value };
    });
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
    toast.info('Đã đặt lại bộ lọc');
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

    filters.selectedPrefixes3.forEach(prefix => {
      chips.push({
        key: `prefix3-${prefix}`,
        label: `Đầu ${prefix}`,
        onRemove: () => updateFilter('selectedPrefixes3', filters.selectedPrefixes3.filter(p => p !== prefix))
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

  // Check if search returned 0 and might need suggestions
  const searchSuggestion = useMemo(() => {
    if (filteredSims.length === 0 && filters.searchQuery) {
      const query = filters.searchQuery;
      if (query.includes('*')) {
        return 'Thử bỏ dấu * hoặc giảm số ký tự';
      }
      if (query.length > 6) {
        return 'Thử tìm với ít số hơn (4-6 số)';
      }
    }
    return null;
  }, [filteredSims.length, filters.searchQuery]);

  return {
    // Data
    allSims,
    filteredSims,
    isLoading,
    isFetching,
    error,
    refetch,
    forceReload,

    // Metadata
    prefixes,
    tagCounts,
    filteredTagCounts,

    // Filters
    filters,
    setFilters,
    updateFilter,
    togglePriceRange,
    toggleTag,
    toggleNetwork,
    toggleSuffix,
    resetFilters,
    activeFilters,
    
    // Anti 0 results
    activeConstraints,
    relaxFilters,
    relaxAllFilters,
    searchSuggestion
  };
};
