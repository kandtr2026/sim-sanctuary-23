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
  matchesQuyFilter,
  type NormalizedSIM,
  type SortOption,
  type PromotionalData,
  PRICE_RANGES
} from '@/lib/simUtils';
import { toast } from 'sonner';

// ============= PRIVATE SEARCH HELPERS =============

/**
 * Normalize any value to digits-only string
 * Used for search matching (removes dots, spaces, non-digits)
 */
const normalizeSim = (v?: unknown): string => String(v ?? '').replace(/\D/g, '');

/**
 * Get digits from SIM object, robust field selection with fallback
 * Tries prioritized fields, then searches all keys for longest digit string
 * Returns digits-only string or empty string
 */
const getSimDigits = (sim: NormalizedSIM | Record<string, unknown>): string => {
  // Priority list of known fields
  const priorityFields = [
    (sim as NormalizedSIM)?.rawDigits,
    (sim as Record<string, unknown>)?.sim_normalized,
    (sim as Record<string, unknown>)?.number,
    (sim as NormalizedSIM)?.formattedNumber,
    (sim as Record<string, unknown>)?.sim,
    (sim as Record<string, unknown>)?.phone,
    (sim as Record<string, unknown>)?.value,
    (sim as Record<string, unknown>)?.SIM,
    (sim as Record<string, unknown>)?.simNumber,
    (sim as NormalizedSIM)?.displayNumber,
  ];
  
  // Try priority fields first
  for (const c of priorityFields) {
    if (c) {
      const digits = normalizeSim(c);
      if (digits.length >= 9) return digits;
    }
  }
  
  // Fallback: scan all object keys for a string with >= 8 digits
  if (typeof sim === 'object' && sim !== null) {
    let longestDigits = '';
    for (const key in sim) {
      const val = (sim as Record<string, unknown>)[key];
      if (typeof val === 'string' || typeof val === 'number') {
        const digits = normalizeSim(val);
        if (digits.length >= 8 && digits.length > longestDigits.length) {
          longestDigits = digits;
        }
      }
    }
    if (longestDigits.length >= 8) return longestDigits;
  }
  
  return '';
};

/**
 * Apply search with 3 modes: EXACT, STAR PATTERN, CONTAINS
 * - EXACT: queryDigits.length >= 8 && no '*' => exact match
 * - STAR PATTERN: query contains '*' with prefix*suffix format
 * - CONTAINS: fallback for partial queries
 */
const applySearchFilter = (
  sims: NormalizedSIM[],
  query: string
): NormalizedSIM[] => {
  const queryRaw = (query ?? '').trim();
  if (!queryRaw) return sims;

  const queryDigits = normalizeSim(queryRaw);
  
  // Skip if less than 2 digits
  if (queryDigits.length < 2) return sims;

  // STAR PATTERN: prefix*suffix
  if (queryRaw.includes('*')) {
    const parts = queryRaw.split('*');
    // Only handle exact 2 parts (prefix*suffix), not leading/trailing '*' alone
    if (parts.length === 2 && parts[0] && parts[1]) {
      const prefixDigits = normalizeSim(parts[0]);
      const suffixDigits = normalizeSim(parts[1]);
      
      if (prefixDigits && suffixDigits) {
        return sims.filter(sim => {
          const digits = getSimDigits(sim);
          return digits.startsWith(prefixDigits) && digits.endsWith(suffixDigits);
        });
      }
    }
    // If star pattern is invalid, fall through to CONTAINS
  }

  // EXACT MODE: 8+ digits, no wildcard => exact match only
  if (queryDigits.length >= 8 && !queryRaw.includes('*')) {
    return sims.filter(sim => getSimDigits(sim) === queryDigits);
  }

  // CONTAINS MODE: default partial match
  return sims.filter(sim => getSimDigits(sim).includes(queryDigits));
};

/**
 * Apply non-search filters (price, network, tags, prefixes, suffixes, vip, quy)
 */
const applyNonSearchFilters = (
  sims: NormalizedSIM[],
  filters: FilterState
): NormalizedSIM[] => {
  let result = sims;

  // Price ranges
  if (filters.priceRanges.length > 0) {
    result = result.filter(sim => {
      return filters.priceRanges.some(rangeIndex => {
        const range = PRICE_RANGES[rangeIndex];
        return sim.price >= range.min && sim.price <= range.max;
      });
    });
  }

  // Custom price range
  if (filters.customPriceMin !== null || filters.customPriceMax !== null) {
    const min = filters.customPriceMin ?? 0;
    const max = filters.customPriceMax ?? Infinity;
    result = result.filter(sim => sim.price >= min && sim.price <= max);
  }

  // Tags
  if (filters.selectedTags.length > 0) {
    result = result.filter(sim => {
      return filters.selectedTags.some(tag => {
        if (tag === 'VIP') return sim.isVIP;
        return sim.tags.includes(tag);
      });
    });
  }

  // Networks
  if (filters.selectedNetworks.length > 0) {
    result = result.filter(sim => filters.selectedNetworks.includes(sim.network));
  }

  // Prefix3
  if (filters.selectedPrefixes3.length > 0) {
    result = result.filter(sim => filters.selectedPrefixes3.includes(sim.prefix3));
  }

  // Prefix4
  if (filters.selectedPrefixes4.length > 0) {
    result = result.filter(sim => filters.selectedPrefixes4.includes(sim.prefix4));
  }

  // Suffixes
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

  // Quý position filter
  if (filters.quyType) {
    result = result.filter(sim =>
      matchesQuyFilter(sim.rawDigits, filters.quyType, filters.quyPosition)
    );
  }

  return result;
};

/**
 * Apply sorting with Mobifone-first and discount priority
 */
const applySorting = (
  sims: NormalizedSIM[],
  filters: FilterState
): NormalizedSIM[] => {
  let result = sortSIMs(sims, filters.sortBy);

  // Mobifone first (only for default sort)
  if (filters.mobifoneFirst && filters.sortBy === 'default') {
    result = result.sort((a, b) => {
      if (a.network === 'Mobifone' && b.network !== 'Mobifone') return -1;
      if (a.network !== 'Mobifone' && b.network === 'Mobifone') return 1;
      return 0;
    });
  }

  // Prioritize discounted SIMs (stable sort)
  const discountedSims: NormalizedSIM[] = [];
  const normalSims: NormalizedSIM[] = [];

  result.forEach(sim => {
    const promoData = getPromotionalData(sim.id);
    const originalPrice = promoData?.originalPrice;
    const hasRealDiscount = originalPrice && originalPrice > 0 && sim.price > 0 && originalPrice > sim.price;

    if (hasRealDiscount) {
      discountedSims.push(sim);
    } else {
      normalSims.push(sim);
    }
  });

  return [...discountedSims, ...normalSims];
};

// ============= END SEARCH HELPERS =============

// Seed data: 100 SIMs for instant rendering (prices 3-5 million VND)
const SEED_RAW_DATA = [
  { number: '0938123456', price: 3500000 },
  { number: '0909234567', price: 4200000 },
  { number: '0901345678', price: 3800000 },
  { number: '0933456789', price: 4500000 },
  { number: '0933567890', price: 3200000 },
  { number: '0901678901', price: 4800000 },
  { number: '0933789012', price: 3600000 },
  { number: '0909890123', price: 4100000 },
  { number: '0899901234', price: 3900000 },
  { number: '0899012345', price: 4400000 },
  { number: '0933123789', price: 3300000 },
  { number: '0937234890', price: 4700000 },
  { number: '0937345901', price: 3400000 },
  { number: '0933456012', price: 4000000 },
  { number: '0932567123', price: 3700000 },
  { number: '0938678234', price: 4300000 },
  { number: '0903789345', price: 3100000 },
  { number: '0932890456', price: 4600000 },
  { number: '0899901567', price: 3850000 },
  { number: '0934012678', price: 4150000 },
  { number: '0934123789', price: 3550000 },
  { number: '0764234890', price: 4950000 },
  { number: '0899345901', price: 3250000 },
  { number: '0899456012', price: 4850000 },
  { number: '0899567123', price: 3650000 },
  { number: '0899678234', price: 4050000 },
  { number: '0899789345', price: 3950000 },
  { number: '0899890456', price: 4250000 },
  { number: '0899901567', price: 3150000 },
  { number: '0902012678', price: 4550000 },
  { number: '0995123789', price: 3750000 },
  { number: '0777234890', price: 4350000 },
  { number: '0707345901', price: 3450000 },
  { number: '0773456012', price: 4650000 },
  { number: '0901567123', price: 3050000 },
  { number: '0896678234', price: 4750000 },
  { number: '0899789345', price: 3350000 },
  { number: '0899890456', price: 4450000 },
  { number: '0938901567', price: 3600000 },
  { number: '0903012678', price: 4100000 },
  { number: '0995123789', price: 3800000 },
  { number: '0995234890', price: 4200000 },
  { number: '0995345901', price: 3400000 },
  { number: '0995456012', price: 4600000 },
  { number: '0995567123', price: 3200000 },
  { number: '0909678234', price: 4800000 },
  { number: '0902789345', price: 3500000 },
  { number: '0898890456', price: 4300000 },
  { number: '0995901567', price: 3700000 },
  { number: '0995012678', price: 4500000 },
  { number: '0815123789', price: 3300000 },
  { number: '0899234890', price: 4700000 },
  { number: '0899345901', price: 3100000 },
  { number: '0899456012', price: 4900000 },
  { number: '0995567123', price: 3900000 },
  { number: '0995678234', price: 4400000 },
  { number: '0901789345', price: 3600000 },
  { number: '0933890456', price: 4000000 },
  { number: '0794901567', price: 3850000 },
  { number: '0995012678', price: 4150000 },
  { number: '0931123789', price: 3550000 },
  { number: '0995234890', price: 4550000 },
  { number: '0995345901', price: 3250000 },
  { number: '0899456012', price: 4850000 },
  { number: '0899567123', price: 3650000 },
  { number: '0899678234', price: 4050000 },
  { number: '0899789345', price: 3450000 },
  { number: '0899890456', price: 4250000 },
  { number: '0899901567', price: 3750000 },
  { number: '0899012678', price: 4650000 },
  { number: '0899123789', price: 3050000 },
  { number: '0899234890', price: 4950000 },
  { number: '0899345901', price: 3950000 },
  { number: '0899456012', price: 4350000 },
  { number: '0899567123', price: 3150000 },
  { number: '0899678234', price: 4750000 },
  { number: '0899789345', price: 3850000 },
  { number: '0899890456', price: 4450000 },
  { number: '0899901567', price: 3350000 },
  { number: '0899012678', price: 4550000 },
  { number: '0899123789', price: 3650000 },
  { number: '0899234890', price: 4050000 },
  { number: '0899345901', price: 3950000 },
  { number: '0899456012', price: 4250000 },
  { number: '0899567123', price: 3550000 },
  { number: '0899678234', price: 4850000 },
  { number: '0899789345', price: 3250000 },
  { number: '0899890456', price: 4650000 },
  { number: '0899901567', price: 3450000 },
  { number: '0899012678', price: 4150000 },
  { number: '0899123789', price: 3750000 },
  { number: '0899234890', price: 4450000 },
  { number: '0899345901', price: 3050000 },
  { number: '0899456012', price: 4950000 },
  { number: '0899567123', price: 3850000 },
  { number: '0899678234', price: 4350000 },
  { number: '0899789345', price: 3150000 },
  { number: '0899890456', price: 4750000 },
  { number: '0899901999', price: 3650000 },
  { number: '0899012888', price: 4050000 },
];

// Build seed SIMs from local data for instant rendering
const buildSeedSims = (): NormalizedSIM[] => {
  return SEED_RAW_DATA.map((item, index) => {
    const rawNumber = String(item.number);
    return normalizeSIM(rawNumber, rawNumber, item.price, `seed-${index}`);
  });
};

// Pre-built seed data (computed once at module load)
const SEED_SIMS = buildSeedSims();

// Storage keys
const CSV_CACHE_KEY = 'sim_csv_cache';
const CSV_CACHE_TIME_KEY = 'sim_csv_cache_time';
const STORAGE_KEY = 'chonsomobifone_sim_cache';

const AUTO_REFRESH_INTERVAL = 3 * 60 * 1000; // 3 minutes
const MAX_CACHE_AGE = 60 * 60 * 1000; // 1 hour

// Module-level promotional data storage (keyed by SIM id)
let promotionalDataStore = new Map<string, PromotionalData>();

// Get promotional data for a SIM by id
export const getPromotionalData = (simId: string): PromotionalData | undefined => {
  return promotionalDataStore.get(simId);
};

// Parse VND-like numbers safely (handles commas, spaces, currency symbols, etc.)
// Example: "1,200,000" -> 1200000
const safeParseVnd = (v: unknown): number => {
  const n = Number(String(v ?? '').replace(/[^\d]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

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
  // Aggressive trimming and cleaning to handle CSV quirks
  const cleaned = header.trim().toUpperCase().replace(/\s+/g, ' ').replace(/_/g, ' ').trim();
  const underscored = header.trim().toUpperCase().replace(/\s+/g, '_').trim();

  if (['SIMID', 'SIM ID', 'SIM_ID'].includes(cleaned) || underscored === 'SIMID') {
    return 'SIMID';
  }

  if (['THUÊ BAO CHUẨN', 'THUE BAO CHUAN', 'THUÊBAOCHUẨN', 'THUEBAOCHUAN', 'SỐ THUÊ BAO CHUẨN', 'SO THUE BAO CHUAN'].includes(cleaned)) {
    return 'RAW';
  }

  if (['SỐ THUÊ BAO', 'SO THUE BAO', 'SỐTHUÊBAO', 'SOTHUEBAO', 'SỐ ĐIỆN THOẠI', 'SO DIEN THOAI'].includes(cleaned)) {
    return 'DISPLAY';
  }

  if (['GIÁ BÁN', 'GIA BAN', 'GIÁBAN', 'GIABAN', 'GIÁ', 'GIA', 'PRICE', 'ORIGINAL PRICE', 'ORIGINAL_PRICE'].includes(cleaned) || underscored === 'ORIGINAL_PRICE') {
    return 'ORIGINAL_PRICE';
  }

  // Match FINAL_PRICE with various formats (underscores, spaces, etc.)
  if (['FINAL PRICE', 'FINALPRICE', 'FINAL_PRICE', 'GIÁ CUỐI', 'GIA CUOI', 'GIÁ KHUYẾN MÃI', 'GIA KHUYEN MAI'].includes(cleaned) || underscored === 'FINAL_PRICE') {
    return 'FINAL_PRICE';
  }

  if (['DISCOUNT TYPE', 'DISCOUNT_TYPE', 'LOẠI GIẢM GIÁ', 'LOAI GIAM GIA'].includes(cleaned) || underscored === 'DISCOUNT_TYPE') {
    return 'DISCOUNT_TYPE';
  }

  if (['DISCOUNT VALUE', 'DISCOUNT_VALUE', 'GIÁ TRỊ GIẢM', 'GIA TRI GIAM', 'MỨC GIẢM', 'MUC GIAM'].includes(cleaned) || underscored === 'DISCOUNT_VALUE') {
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
  // Trim all headers properly to avoid key mismatch (e.g., "Final_Price " vs "Final_Price")
  const rawHeaders = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, '').trim());
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

// Fetch CSV from sheet proxy
const fetchSimInventory = async (): Promise<NormalizedSIM[]> => {
  const cacheData = loadCsvFromCache();
  const now = Date.now();
  const isCacheValid = cacheData && (now - cacheData.timestamp) < MAX_CACHE_AGE;

  let csvText: string;

  if (isCacheValid && cacheData) {
    csvText = cacheData.csv;
  } else {
    try {
      const response = await fetch('/api/sheet-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sheetId: '1QRO-BroqUQWccWjOkRT7iICdTbQu3Y_NC1NWCeG0M0Y',
          sheetName: 'Sheet1'
        })
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      csvText = await response.text();
      const validation = validateCSV(csvText);
      if (!validation.valid) throw new Error(validation.reason || 'Invalid CSV');

      saveCsvToCache(csvText);
    } catch (error) {
      console.error('Failed to fetch SIM inventory:', error);
      if (cacheData) {
        console.warn('Using stale cache...');
        csvText = cacheData.csv;
      } else {
        return SEED_SIMS;
      }
    }
  }

  const rows = parseCSV(csvText);
  const sims: NormalizedSIM[] = [];

  for (const row of rows) {
    try {
      const rawNumber = row['RAW'] || row['DISPLAY'] || row['SIMID'] || '';
      const displayNumber = row['DISPLAY'] || row['RAW'] || '';
      const simId = row['SIMID'] || '';
      
      if (!rawNumber) continue;

      const priceStr = row['FINAL_PRICE'] || row['ORIGINAL_PRICE'] || '';
      let price = safeParseVnd(priceStr);

      if (price <= 0) {
        const tags = searchSIM({ rawDigits: rawNumber } as NormalizedSIM, '') ? [] : [];
        price = estimatePriceByTags(tags);
      }

      const sim = normalizeSIM(rawNumber, displayNumber || null, price, simId || `csv-${rawNumber}`);
      sims.push(sim);

      // Store promotional data if present
      const originalPrice = safeParseVnd(row['ORIGINAL_PRICE']);
      if (originalPrice > 0 && price > 0) {
        const discountType = parseDiscountType(row['DISCOUNT_TYPE'] || '');
        const discountValue = safeParseVnd(row['DISCOUNT_VALUE']);
        promotionalDataStore.set(sim.id, {
          originalPrice,
          finalPrice: price,
          discountType,
          discountValue
        });
      }
    } catch (error) {
      console.warn('Error processing SIM row:', error, row);
    }
  }

  return sims.length > 0 ? sims : SEED_SIMS;
};

// Types and Filter State
export interface FilterState {
  searchQuery: string;
  priceRanges: number[];
  customPriceMin: number | null;
  customPriceMax: number | null;
  selectedNetworks: string[];
  selectedTags: string[];
  selectedPrefixes3: string[];
  selectedPrefixes4: string[];
  selectedSuffixes: string[];
  customSuffix: string;
  vipFilter: 'all' | 'only' | 'hide';
  quyType: any;
  quyPosition: any;
  sortBy: SortOption;
  mobifoneFirst: boolean;
}

const defaultFilters: FilterState = {
  searchQuery: '',
  priceRanges: [],
  customPriceMin: null,
  customPriceMax: null,
  selectedNetworks: [],
  selectedTags: [],
  selectedPrefixes3: [],
  selectedPrefixes4: [],
  selectedSuffixes: [],
  customSuffix: '',
  vipFilter: 'all',
  quyType: null,
  quyPosition: null,
  sortBy: 'default',
  mobifoneFirst: true,
};

// Hook
export const useSimData = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  const { data: allSims = [], isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['simInventory'],
    queryFn: fetchSimInventory,
    staleTime: AUTO_REFRESH_INTERVAL,
    gcTime: 10 * 60 * 1000,
    refetchInterval: AUTO_REFRESH_INTERVAL,
  });

  const updateFilter = useCallback(
    (key: keyof FilterState, value: unknown) => {
      setFilters(prev => ({ ...prev, [key]: value }));
    },
    []
  );

  const clearAllFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const refetchData = useCallback(async () => {
    queryClient.invalidateQueries({ queryKey: ['simInventory'] });
    toast.info('Đang tải lại dữ liệu...');
    await refetch();
  }, [refetch, queryClient]);

  const prefixes = useMemo(() => getUniquePrefixes(allSims), [allSims]);

  const filteredSims = useMemo(() => {
    const queryRaw = (filters.searchQuery ?? '').trim();
    const queryDigits = normalizeSim(queryRaw);

    // ============= EXACT RESCUE: Check for exact match in allSims FIRST =============
    // If query is 8+ digits and doesn't contain '*', try to find exact match in entire dataset
    // This must be checked BEFORE applying non-search filters to avoid losing valid results
    if (queryDigits.length >= 8 && !queryRaw.includes('*')) {
      const exactMatches = allSims.filter(sim => getSimDigits(sim) === queryDigits);
      if (exactMatches.length > 0) {
        // Found exact match - return it immediately, bypassing all other filters
        return applySorting(exactMatches, filters);
      }
    }

    // ============= PIPELINE A: Non-search filters (price, network, tags, etc.) =============
    const afterNonSearch = applyNonSearchFilters(allSims, filters);

    // ============= PIPELINE B: Search filter =============
    const afterSearch = applySearchFilter(afterNonSearch, filters.searchQuery);

    // ============= PIPELINE C: Sorting =============
    return applySorting(afterSearch, filters);
  }, [allSims, filters]);

  const tagCounts = useMemo(() => countTags(allSims), [allSims]);
  const filteredTagCounts = useMemo(() => countTags(filteredSims), [filteredSims]);

  const activeConstraints = useMemo(() => {
    const constraints: Array<{ label: string; key: keyof FilterState; onRemove: () => void }> = [];
    
    if (filters.searchQuery) {
      constraints.push({
        label: `Tìm: "${filters.searchQuery}"`,
        key: 'searchQuery',
        onRemove: () => updateFilter('searchQuery', '')
      });
    }

    if (filters.priceRanges.length > 0) {
      const labels = filters.priceRanges.map(i => PRICE_RANGES[i]?.label).filter(Boolean);
      constraints.push({
        label: `Giá: ${labels.join(', ')}`,
        key: 'priceRanges',
        onRemove: () => updateFilter('priceRanges', [])
      });
    }

    if (filters.customPriceMin !== null || filters.customPriceMax !== null) {
      const min = filters.customPriceMin ?? 0;
      const max = filters.customPriceMax ?? Infinity;
      constraints.push({
        label: `Giá tùy chỉnh: ${min.toLocaleString()} - ${max === Infinity ? '∞' : max.toLocaleString()}`,
        key: 'customPriceMin',
        onRemove: () => {
          updateFilter('customPriceMin', null);
          updateFilter('customPriceMax', null);
        }
      });
    }

    if (filters.selectedTags.length > 0) {
      constraints.push({
        label: `Tags: ${filters.selectedTags.join(', ')}`,
        key: 'selectedTags',
        onRemove: () => updateFilter('selectedTags', [])
      });
    }

    if (filters.selectedNetworks.length > 0) {
      constraints.push({
        label: `Mạng: ${filters.selectedNetworks.join(', ')}`,
        key: 'selectedNetworks',
        onRemove: () => updateFilter('selectedNetworks', [])
      });
    }

    if (filters.selectedPrefixes3.length > 0) {
      constraints.push({
        label: `Đầu số 3 chữ: ${filters.selectedPrefixes3.join(', ')}`,
        key: 'selectedPrefixes3',
        onRemove: () => updateFilter('selectedPrefixes3', [])
      });
    }

    if (filters.selectedPrefixes4.length > 0) {
      constraints.push({
        label: `Đầu số 4 chữ: ${filters.selectedPrefixes4.join(', ')}`,
        key: 'selectedPrefixes4',
        onRemove: () => updateFilter('selectedPrefixes4', [])
      });
    }

    if (filters.selectedSuffixes.length > 0) {
      constraints.push({
        label: `Đuôi: ${filters.selectedSuffixes.join(', ')}`,
        key: 'selectedSuffixes',
        onRemove: () => updateFilter('selectedSuffixes', [])
      });
    }

    if (filters.customSuffix) {
      constraints.push({
        label: `Đuôi tùy chỉnh: ${filters.customSuffix}`,
        key: 'customSuffix',
        onRemove: () => updateFilter('customSuffix', '')
      });
    }

    if (filters.vipFilter !== 'all') {
      constraints.push({
        label: `VIP: ${filters.vipFilter === 'only' ? 'Chỉ VIP' : 'Ẩn VIP'}`,
        key: 'vipFilter',
        onRemove: () => updateFilter('vipFilter', 'all')
      });
    }

    if (filters.sortBy !== 'default') {
      const sortLabel = ['Mới nhất', 'Giá tăng dần', 'Giá giảm dần', 'Đẹp nhất', 'Đuôi đẹp'].find(
        (_, i) => ['default', 'price_asc', 'price_desc', 'beauty', 'suffix_beauty'][i] === filters.sortBy
      );
      if (sortLabel) {
        constraints.push({
          label: `Sắp xếp: ${sortLabel}`,
          key: 'sortBy',
          onRemove: () => updateFilter('sortBy', 'default')
        });
      }
    }

    return constraints;
  }, [filters, updateFilter]);

  const searchSuggestion = useMemo(() => {
    if (filteredSims.length === 0 && filters.searchQuery) {
      const query = filters.searchQuery;
      if (query.includes('*')) {
        return `Không tìm thấy SIM nào với mẫu "${query}"`;
      }
      return `Không tìm thấy SIM nào với từ khóa "${query}"`;
    }
    return null;
  }, [filteredSims.length, filters.searchQuery]);

  return {
    allSims,
    filteredSims,
    isLoading,
    error,
    isFetching,
    filters,
    updateFilter,
    clearAllFilters,
    refetch: refetchData,
    prefixes,
    tagCounts,
    filteredTagCounts,
    activeConstraints,
    searchSuggestion,
    vipThreshold: 50000000,
  };
};
