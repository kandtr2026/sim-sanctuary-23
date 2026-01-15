import { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  type PromotionalPricing,
  PRICE_RANGES
} from '@/lib/simUtils';
import { toast } from 'sonner';

// Storage keys
const CSV_CACHE_KEY = 'sim_csv_cache';
const CSV_CACHE_TIME_KEY = 'sim_csv_cache_time';
const STORAGE_KEY = 'chonsomobifone_sim_cache';

const AUTO_REFRESH_INTERVAL = 3 * 60 * 1000; // 3 minutes
const MAX_CACHE_AGE = 60 * 60 * 1000; // 1 hour

// Valid CSV headers to look for
const VALID_HEADERS = [
  'SỐ THUÊ BAO', 'SO THUE BAO', 'SỐTHUÊBAO', 'SOTHUEBAO',
  'THUÊ BAO CHUẨN', 'THUE BAO CHUAN', 'THUÊBAOCHUẨN', 'THUEBAOCHUAN'
];

// Validate CSV text
const validateCSV = (text: string): { valid: boolean; reason?: string } => {
  // Check for HTML content
  if (text.trim().startsWith('<') || text.toLowerCase().includes('<!doctype')) {
    return { valid: false, reason: 'Received HTML instead of CSV' };
  }
  
  // Check for valid headers
  const upperText = text.toUpperCase();
  const hasValidHeader = VALID_HEADERS.some(header => 
    upperText.includes(header.toUpperCase())
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
  
  if (['THUÊ BAO CHUẨN', 'THUE BAO CHUAN', 'THUÊBAOCHUẨN', 'THUEBAOCHUAN'].includes(cleaned)) {
    return 'RAW';
  }
  
  if (['SỐ THUÊ BAO', 'SO THUE BAO', 'SỐTHUÊBAO', 'SOTHUEBAO', 'SỐ ĐIỆN THOẠI', 'SO DIEN THOAI'].includes(cleaned)) {
    return 'DISPLAY';
  }
  
  if (['GIÁ BÁN', 'GIA BAN', 'GIÁBAN', 'GIABAN', 'GIÁ', 'GIA', 'PRICE', 'ORIGINAL_PRICE'].includes(cleaned)) {
    return 'ORIGINAL_PRICE';
  }
  
  if (['FINAL_PRICE', 'GIÁ CUỐI', 'GIA CUOI', 'GIÁ KHUYẾN MÃI', 'GIA KHUYEN MAI'].includes(cleaned)) {
    return 'FINAL_PRICE';
  }
  
  if (['DISCOUNT_TYPE', 'LOẠI GIẢM GIÁ', 'LOAI GIAM GIA'].includes(cleaned)) {
    return 'DISCOUNT_TYPE';
  }
  
  if (['DISCOUNT_VALUE', 'GIÁ TRỊ GIẢM', 'GIA TRI GIAM', 'MỨC GIẢM', 'MUC GIAM'].includes(cleaned)) {
    return 'DISCOUNT_VALUE';
  }
  
  return cleaned;
};

// Parse discount type from string
const parseDiscountType = (value: string): 'percent' | 'amount' | 'fixed' | null => {
  if (!value) return null;
  const cleaned = value.trim().toLowerCase();
  if (cleaned === 'percent' || cleaned === 'phần trăm' || cleaned === 'phan tram' || cleaned === '%') {
    return 'percent';
  }
  if (cleaned === 'amount' || cleaned === 'số tiền' || cleaned === 'so tien') {
    return 'amount';
  }
  if (cleaned === 'fixed' || cleaned === 'cố định' || cleaned === 'co dinh') {
    return 'fixed';
  }
  return null;
};

// Parse CSV text to array of objects
const parseCSV = (csvText: string): Record<string, string>[] => {
  const lines = csvText.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

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

// Last fetch timestamp for UI display
let lastFetchTimestamp: number | null = null;
let usingCachedData = false;

// Get last updated info
export const getLastUpdateInfo = (): { timestamp: number | null; isCache: boolean } => ({
  timestamp: lastFetchTimestamp,
  isCache: usingCachedData
});

// Fetch CSV via edge function (bypasses CORS)
const fetchCsvViaProxy = async (): Promise<string> => {
  console.log('[SIM] Fetching via backend proxy...');
  
  const { data, error } = await supabase.functions.invoke('fetch-sim-data');
  
  if (error) {
    console.error('[SIM] Edge function error:', error);
    throw new Error(error.message || 'Failed to fetch from proxy');
  }
  
  // The edge function returns CSV text directly
  const csvText = typeof data === 'string' ? data : String(data);
  
  // Validate CSV content
  const validation = validateCSV(csvText);
  if (!validation.valid) {
    throw new Error(validation.reason || 'Invalid CSV response from proxy');
  }
  
  console.log(`[SIM] Received ${csvText.length} bytes via proxy`);
  return csvText;
};

// Fetch and normalize SIM data
const fetchSimData = async (): Promise<NormalizedSIM[]> => {
  usingCachedData = false;
  
  try {
    // Try fetching via edge function proxy
    const csvText = await fetchCsvViaProxy();
    
    // Save raw CSV to cache on success
    saveCsvToCache(csvText);
    lastFetchTimestamp = Date.now();
    
    const rows = parseCSV(csvText);
    console.log(`[SIM] Parsed ${rows.length} rows from CSV`);
    
    const sims: NormalizedSIM[] = [];
    
    rows.forEach((row, index) => {
      const rawNumber = row['RAW'] || row['DISPLAY'] || '';
      const displayNumber = row['DISPLAY'] || row['RAW'] || rawNumber;
      const originalPriceStr = row['ORIGINAL_PRICE'] || row['PRICE'] || '0';
      const finalPriceStr = row['FINAL_PRICE'] || '';
      const discountTypeStr = row['DISCOUNT_TYPE'] || '';
      const discountValueStr = row['DISCOUNT_VALUE'] || '';
      
      const rawDigits = rawNumber.replace(/\D/g, '');
      
      // Ignore rows with less than 9 digits
      if (rawDigits.length < 9) return;
      
      let originalPrice = parsePrice(originalPriceStr);
      const finalPriceRaw = parsePrice(finalPriceStr);
      const finalPrice = finalPriceRaw > 0 ? finalPriceRaw : null;
      const discountType = parseDiscountType(discountTypeStr);
      const discountValue = parsePrice(discountValueStr) || null;
      
      // Estimate price if original price is missing or invalid
      if (!originalPrice || originalPrice <= 0) {
        const tempSim = normalizeSIM(rawNumber, displayNumber, 0, `temp-${index}`);
        originalPrice = estimatePriceByTags(tempSim.tags);
      }
      
      const promotional: PromotionalPricing = {
        originalPrice,
        finalPrice,
        discountType,
        discountValue
      };
      
      const sim = normalizeSIM(rawNumber, displayNumber, originalPrice, `sim-${index}`, promotional);
      sims.push(sim);
    });
    
    console.log(`[SIM] Normalized ${sims.length} SIMs`);
    
    if (sims.length > 0) {
      saveToCache(sims);
    }
    
    return sims;
    
  } catch (error) {
    console.error('[SIM] Fetch failed, trying cache:', error);
    
    // Try loading from CSV cache first
    const csvCache = loadCsvFromCache();
    if (csvCache && csvCache.csv) {
      console.log('[SIM] Using cached CSV');
      const rows = parseCSV(csvCache.csv);
      const sims: NormalizedSIM[] = [];
      
      rows.forEach((row, index) => {
        const rawNumber = row['RAW'] || row['DISPLAY'] || '';
        const displayNumber = row['DISPLAY'] || row['RAW'] || rawNumber;
        const originalPriceStr = row['ORIGINAL_PRICE'] || row['PRICE'] || '0';
        const finalPriceStr = row['FINAL_PRICE'] || '';
        const discountTypeStr = row['DISCOUNT_TYPE'] || '';
        const discountValueStr = row['DISCOUNT_VALUE'] || '';
        const rawDigits = rawNumber.replace(/\D/g, '');
        
        if (rawDigits.length < 9) return;
        
        let originalPrice = parsePrice(originalPriceStr);
        const finalPriceRaw = parsePrice(finalPriceStr);
        const finalPrice = finalPriceRaw > 0 ? finalPriceRaw : null;
        const discountType = parseDiscountType(discountTypeStr);
        const discountValue = parsePrice(discountValueStr) || null;
        
        if (!originalPrice || originalPrice <= 0) {
          const tempSim = normalizeSIM(rawNumber, displayNumber, 0, `temp-${index}`);
          originalPrice = estimatePriceByTags(tempSim.tags);
        }
        
        const promotional: PromotionalPricing = {
          originalPrice,
          finalPrice,
          discountType,
          discountValue
        };
        
        const sim = normalizeSIM(rawNumber, displayNumber, originalPrice, `sim-${index}`, promotional);
        sims.push(sim);
      });
      
      if (sims.length > 0) {
        usingCachedData = true;
        lastFetchTimestamp = csvCache.timestamp;
        toast.warning('Không thể tải dữ liệu mới. Đang dùng dữ liệu tạm (cache).', {
          duration: 5000
        });
        return sims;
      }
    }
    
    // Try loading normalized SIMs from cache
    const cachedData = loadFromCache();
    if (cachedData && cachedData.data.length > 0) {
      usingCachedData = true;
      lastFetchTimestamp = cachedData.timestamp;
      toast.warning('Không thể tải dữ liệu mới. Đang dùng dữ liệu tạm (cache).', {
        duration: 5000
      });
      return cachedData.data;
    }
    
    throw error;
  }
};

// Filter state interface
export interface FilterState {
  searchQuery: string;
  priceRanges: number[];
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
  mobifoneFirst: boolean;
}

export const defaultFilterState: FilterState = {
  searchQuery: '',
  priceRanges: [],
  customPriceMin: null,
  customPriceMax: null,
  selectedTags: [],
  selectedNetworks: [],
  selectedPrefixes3: [],
  selectedPrefixes4: [],
  selectedSuffixes: [],
  customSuffix: '',
  vipFilter: 'all',
  vipThreshold: 50000000,
  sortBy: 'default',
  mobifoneFirst: true
};

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

  const { data: allSims = [], isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['simData'],
    queryFn: fetchSimData,
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    refetchInterval: AUTO_REFRESH_INTERVAL,
    refetchIntervalInBackground: false
  });

  const forceReload = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['simData'] });
    toast.info('Đang tải lại dữ liệu...');
  }, [queryClient]);

  const prefixes = useMemo(() => getUniquePrefixes(allSims), [allSims]);

  const filteredSims = useMemo(() => {
    let result = [...allSims];

    if (filters.searchQuery) {
      const digitCount = filters.searchQuery.replace(/\D/g, '').length;
      if (digitCount >= 2) {
        result = result.filter(sim => searchSIM(sim, filters.searchQuery));
      }
    }

    if (filters.priceRanges.length > 0) {
      result = result.filter(sim => {
        return filters.priceRanges.some(rangeIndex => {
          const range = PRICE_RANGES[rangeIndex];
          return sim.price >= range.min && sim.price <= range.max;
        });
      });
    }

    if (filters.customPriceMin !== null || filters.customPriceMax !== null) {
      const min = filters.customPriceMin ?? 0;
      const max = filters.customPriceMax ?? Infinity;
      result = result.filter(sim => sim.price >= min && sim.price <= max);
    }

    if (filters.selectedTags.length > 0) {
      result = result.filter(sim => {
        return filters.selectedTags.some(tag => {
          if (tag === 'VIP') return sim.isVIP;
          return sim.tags.includes(tag);
        });
      });
    }

    if (filters.selectedNetworks.length > 0) {
      result = result.filter(sim => filters.selectedNetworks.includes(sim.network));
    }

    if (filters.selectedPrefixes3.length > 0) {
      result = result.filter(sim => filters.selectedPrefixes3.includes(sim.prefix3));
    }

    if (filters.selectedPrefixes4.length > 0) {
      result = result.filter(sim => filters.selectedPrefixes4.includes(sim.prefix4));
    }

    if (filters.selectedSuffixes.length > 0 || filters.customSuffix) {
      const allSuffixes = [...filters.selectedSuffixes];
      if (filters.customSuffix) {
        allSuffixes.push(filters.customSuffix);
      }
      result = result.filter(sim => {
        return allSuffixes.some(suffix => sim.rawDigits.endsWith(suffix));
      });
    }

    if (filters.vipFilter === 'only') {
      result = result.filter(sim => sim.isVIP);
    } else if (filters.vipFilter === 'hide') {
      result = result.filter(sim => !sim.isVIP);
    }

    result = sortSIMs(result, filters.sortBy);

    if (filters.mobifoneFirst && filters.sortBy === 'default') {
      result = result.sort((a, b) => {
        if (a.network === 'Mobifone' && b.network !== 'Mobifone') return -1;
        if (a.network !== 'Mobifone' && b.network === 'Mobifone') return 1;
        return 0;
      });
    }

    return result;
  }, [allSims, filters]);

  const tagCounts = useMemo(() => countTags(allSims), [allSims]);
  const filteredTagCounts = useMemo(() => countTags(filteredSims), [filteredSims]);

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

  const relaxFilters = useCallback(() => {
    const relaxedMessages: string[] = [];
    
    setFilters(prev => {
      const newFilters = { ...prev };
      
      for (const key of RELAX_ORDER) {
        const value = newFilters[key];
        const isEmpty = 
          value === '' || 
          value === null || 
          (Array.isArray(value) && value.length === 0);
        
        if (!isEmpty) {
          if (Array.isArray(value)) {
            (newFilters[key] as typeof value) = [];
          } else if (typeof value === 'string') {
            (newFilters[key] as string) = '';
          } else {
            (newFilters[key] as typeof value) = null as typeof value;
          }
          
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
          break;
        }
      }
      
      return newFilters;
    });

    if (relaxedMessages.length > 0) {
      toast.info(`Đã bỏ: ${relaxedMessages.join(', ')}`);
    }
  }, []);

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
    toast.info('Đã đặt lại bộ lọc');
  }, []);

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
    allSims,
    filteredSims,
    isLoading,
    isFetching,
    error,
    refetch,
    forceReload,
    prefixes,
    tagCounts,
    filteredTagCounts,
    filters,
    setFilters,
    updateFilter,
    togglePriceRange,
    toggleTag,
    toggleNetwork,
    toggleSuffix,
    resetFilters,
    activeFilters,
    activeConstraints,
    relaxFilters,
    relaxAllFilters,
    searchSuggestion
  };
};