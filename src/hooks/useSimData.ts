import { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { invokeEdgeFunctionText } from '@/integrations/supabase/edgeFunctions';
import {
  normalizeSIM,
  
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

// Helper to extract digits from a SIM object (robust, handles various field names)
const normalizeDigits = (v?: unknown) => String(v ?? "").replace(/\D/g, "");

// Every caller passes a NormalizedSIM, so that is the signature. The body then
// widens to a record because the field list below is a deliberate net for sheet
// columns that have been renamed over time (sim_normalized, msisdn, so_sim, ...).
// None of them exist on NormalizedSIM today; the fallbacks stay so an upstream
// rename degrades to a slower lookup instead of returning nothing.
//
// Module scope, not component scope: it closes over nothing, so redefining it on
// every render only served to make it a new identity each time — which is what
// the exhaustive-deps warning on the two useMemos below was reporting. Hoisting
// gives it a stable identity instead of suppressing the warning.
const getSimDigitsRobust = (sim: NormalizedSIM | null | undefined) => {
  const row = sim as unknown as Record<string, unknown> | null | undefined;
  const preferred = [
    row?.rawDigits, row?.sim_normalized, row?.number, row?.formattedNumber, row?.sim,
    row?.phone, row?.msisdn, row?.value, row?.simNumber, row?.displayNumber,
    row?.SimNumber, row?.sim_number, row?.phone_number, row?.so_sim
  ];

  // Try preferred fields first
  for (const v of preferred) {
    const d = normalizeDigits(v);
    if (d.length >= 10) return d;
  }

  // Fallback: scan all object keys
  if (row && typeof row === 'object') {
    for (const k of Object.keys(row)) {
      const v = row[k];
      if (typeof v === 'string' || typeof v === 'number') {
        const d = normalizeDigits(v);
        if (d.length >= 10) return d;
      }
    }
  }

  return '';
};

// Storage keys
const STORAGE_KEY = 'chonsomobifone_sim_cache';

const AUTO_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minutes
const MAX_CACHE_AGE = 60 * 60 * 1000; // 1 hour
const STALE_TIME = 5 * 60 * 1000; // 5 minutes stale-while-revalidate

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

/**
 * Cache budget, in JS characters. localStorage strings are UTF-16, so the byte
 * cost is 2x the character count, and the per-origin quota is typically ~5 MB.
 * 700k chars ≈ 1.4 MB — comfortably inside the quota with room for other keys.
 *
 * This matters because the live sheet is ~49,000 rows. Caching the raw CSV
 * (10.5 MB UTF-16) or the full normalized array (34 MB UTF-16) throws
 * QuotaExceededError on every single write, which silently disabled the entire
 * offline fallback. We now cache a bounded, compact projection instead.
 */
const CACHE_CHAR_BUDGET = 700_000;

/**
 * Compact per-SIM cache row. Everything else on NormalizedSIM (tags, network,
 * beautyScore, digit slices…) is recomputed by normalizeSIM on read, so storing
 * it would just burn quota. `d` is omitted when the display number is identical
 * to the raw digits, which is the common case.
 */
type CachedSimRow = [id: string, rawDigits: string, price: number, display?: string];

interface SimCacheEnvelope {
  v: 2;
  timestamp: number;
  /** Total SIMs the server returned, which may exceed the rows we could store. */
  total: number;
  rows: CachedSimRow[];
}

/** Storage keys from earlier versions that could never fit. Purge to free quota. */
const LEGACY_CACHE_KEYS = ['sim_csv_cache', 'sim_csv_cache_time'];

const purgeLegacyCaches = () => {
  try {
    for (const key of LEGACY_CACHE_KEYS) localStorage.removeItem(key);
  } catch {
    // Storage unavailable (private mode, disabled cookies) — nothing to purge.
  }
};

const toCachedRow = (sim: NormalizedSIM): CachedSimRow =>
  sim.displayNumber && sim.displayNumber !== sim.rawDigits
    ? [sim.id, sim.rawDigits, sim.price, sim.displayNumber]
    : [sim.id, sim.rawDigits, sim.price];

/** Save as many SIMs as fit the character budget, newest-first ordering preserved. */
const saveToCache = (data: NormalizedSIM[]) => {
  purgeLegacyCaches();

  const rows: CachedSimRow[] = [];
  let chars = 0;
  for (const sim of data) {
    const row = toCachedRow(sim);
    // +1 for the delimiter JSON.stringify adds between array elements.
    const cost = JSON.stringify(row).length + 1;
    if (chars + cost > CACHE_CHAR_BUDGET) break;
    rows.push(row);
    chars += cost;
  }

  const envelope: SimCacheEnvelope = { v: 2, timestamp: Date.now(), total: data.length, rows };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
  } catch (e) {
    // Another origin key may be hogging the quota. Drop ours and retry once at
    // a quarter of the size rather than leaving the fallback with nothing.
    try {
      localStorage.removeItem(STORAGE_KEY);
      envelope.rows = rows.slice(0, Math.floor(rows.length / 4));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
    } catch {
      console.warn('Failed to save SIM cache:', e);
    }
  }
};

/** Load cached SIMs, rebuilding the derived fields via normalizeSIM. */
const loadFromCache = (): { data: NormalizedSIM[]; timestamp: number; total: number } | null => {
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (!cached) return null;

    const parsed = JSON.parse(cached) as SimCacheEnvelope | { timestamp: number; data?: unknown };

    // A v1 envelope (full NormalizedSIM[]) can only exist from a build before the
    // compact format. Discard it — it is stale by definition and wastes quota.
    if (!('v' in parsed) || parsed.v !== 2) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }

    if (Date.now() - parsed.timestamp >= MAX_CACHE_AGE) return null;
    if (!Array.isArray(parsed.rows) || parsed.rows.length === 0) return null;

    const data = parsed.rows.map(([id, rawDigits, price, display]) =>
      normalizeSIM(rawDigits, display || rawDigits, price, id),
    );
    return { data, timestamp: parsed.timestamp, total: parsed.total ?? data.length };
  } catch (e) {
    console.warn('Failed to load SIM cache:', e);
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
  if (import.meta.env.DEV) {
    console.log('[SIM] Fetching via backend proxy...');
  }

  const csvText = await invokeEdgeFunctionText('fetch-sim-data');

  // Validate CSV content
  const validation = validateCSV(csvText);
  if (!validation.valid) {
    throw new Error(validation.reason || 'Invalid CSV response from proxy');
  }

  if (import.meta.env.DEV) {
    console.log(`[SIM] Received ${csvText.length} bytes via proxy`);
  }
  return csvText;
};

// Fetch and normalize SIM data
const fetchSimData = async (): Promise<NormalizedSIM[]> => {
  usingCachedData = false;
  
  try {
    // Try fetching via edge function proxy
    const csvText = await fetchCsvViaProxy();

    lastFetchTimestamp = Date.now();
    
    const rows = parseCSV(csvText);
    if (import.meta.env.DEV) {
      console.log(`[SIM] Parsed ${rows.length} rows from CSV`);
    }
    
    const sims: NormalizedSIM[] = [];
    const promotionalDataMap = new Map<string, PromotionalData>();
    
    // Track discount count for verification
    let discountCount = 0;
    
    rows.forEach((row, index) => {
      // Filter by TRẠNG THÁI: only show "available" SIMs, hide "sold" ones
      const trangThai = (row['TRANG_THAI'] || row['TRẠNG THÁI'] || row['TRANG THAI'] || '').trim().toLowerCase();
      if (trangThai === 'sold' || trangThai === 'reserved' || trangThai === 'ẩn') return;
      // Only show SIMs that are explicitly "available" or have no status (backwards compatible)
      // If you want strict filtering (only "available"), uncomment:
      // if (trangThai && trangThai !== 'available') return;
      
      // Use SimID from Google Sheet if available, otherwise generate one
      const sheetSimId = row['SIMID'] || '';
      const rawNumber = row['RAW'] || row['DISPLAY'] || '';
      const displayNumber = row['DISPLAY'] || row['RAW'] || rawNumber;
      const originalPriceStr = row['ORIGINAL_PRICE'] || row['PRICE'] || '0';
      const finalPriceStr = row['FINAL_PRICE'] || '';
      const discountTypeStr = row['DISCOUNT_TYPE'] || '';
      const discountValueStr = row['DISCOUNT_VALUE'] || '';
      
      const rawDigits = rawNumber.replace(/\D/g, '');
      
      // Ignore rows with less than 9 digits
      if (rawDigits.length < 9) return;
      
      // Prefer safe VND parsing for sheet values (handles commas/spaces/etc.)
      let originalPrice = safeParseVnd(originalPriceStr);
      const finalPriceRaw = safeParseVnd(finalPriceStr);
      const finalPrice = finalPriceRaw > 0 ? finalPriceRaw : undefined;

      const discountType = parseDiscountType(discountTypeStr) || undefined;
      const discountValue = safeParseVnd(discountValueStr) || undefined;
      
      // Count SIMs with actual discount (finalPrice < originalPrice)
      if (finalPrice && finalPrice > 0 && finalPrice < originalPrice) {
        discountCount++;
      }
      
      // Estimate price if original price is missing or invalid
      if (!originalPrice || originalPrice <= 0) {
        const tempSim = normalizeSIM(rawNumber, displayNumber, 0, `temp-${index}`);
        originalPrice = estimatePriceByTags(tempSim.tags);
      }
      
      // Use finalPrice for sorting/filtering if available, else originalPrice
      const effectivePrice = finalPrice ?? originalPrice;
      // Use Google Sheet SimID if available, otherwise fallback to index-based id
      const simId = sheetSimId.trim() || `sim-${index}`;
      const sim = normalizeSIM(rawNumber, displayNumber, effectivePrice, simId);
      sims.push(sim);
      
      // Store promotional data separately (keyed by SIM id)
      promotionalDataMap.set(sim.id, {
        originalPrice,
        finalPrice,
        discountType,
        discountValue
      });
    });
    
    // Update module-level promotional data store
    promotionalDataStore = promotionalDataMap;
    
    if (import.meta.env.DEV) {
      console.log(`[SIM] Normalized ${sims.length} SIMs, ${discountCount} with discounts`);
    }
    
    if (sims.length > 0) {
      saveToCache(sims);
    }
    
    return sims;
    
  } catch (error) {
    console.error('[SIM] Fetch failed, trying cache:', error);

    // Cached SIMs are already fully normalized by loadFromCache().
    const cachedData = loadFromCache();
    if (cachedData && cachedData.data.length > 0) {
      usingCachedData = true;
      lastFetchTimestamp = cachedData.timestamp;
      // The cache holds only as many SIMs as fit the quota, so say so rather
      // than implying the visitor is seeing the whole inventory.
      const isPartial = cachedData.total > cachedData.data.length;
      toast.warning(
        isPartial
          ? `Không thể tải dữ liệu mới. Đang hiển thị ${cachedData.data.length.toLocaleString('vi-VN')} SIM đã lưu tạm.`
          : 'Không thể tải dữ liệu mới. Đang dùng dữ liệu tạm (cache).',
        { duration: 5000 }
      );
      return cachedData.data;
    }

    throw error;
  }
};

// Quý filter types
import type { QuyType, QuyPosition } from '@/lib/simUtils';
export type { QuyType, QuyPosition };

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
  // Quý position filter
  quyType: QuyType | null;
  quyPosition: QuyPosition | null;
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
  mobifoneFirst: true,
  quyType: null,
  quyPosition: null
};

const RELAX_ORDER: (keyof FilterState)[] = [
  'customSuffix',
  'selectedSuffixes',
  'selectedPrefixes3',
  'selectedPrefixes4',
  'quyType',
  'quyPosition',
  'selectedTags',
  'priceRanges',
  'customPriceMin',
  'customPriceMax',
  'selectedNetworks',
  'searchQuery'
];
// Pre-compute cached initial data at module level (not inside hook)
const getCachedInitialData = (): NormalizedSIM[] => {
  const cached = loadFromCache();
  // loadFromCache() rebuilds every derived field through normalizeSIM, so these
  // are ready to render as-is.
  if (cached && cached.data.length > 0) return cached.data;
  return SEED_SIMS;
};

const INITIAL_PLACEHOLDER = getCachedInitialData();

export const useSimData = () => {
  const [filters, setFilters] = useState<FilterState>(defaultFilterState);
  const queryClient = useQueryClient();

  const { data: allSims = [], isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['simData'],
    queryFn: fetchSimData,
    staleTime: STALE_TIME,
    gcTime: 30 * 60 * 1000,
    retry: 1,
    refetchInterval: AUTO_REFRESH_INTERVAL,
    refetchIntervalInBackground: false,
    placeholderData: INITIAL_PLACEHOLDER
  });

  const forceReload = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['simData'] });
    toast.info('Đang tải lại dữ liệu...');
  }, [queryClient]);

  const prefixes = useMemo(() => getUniquePrefixes(allSims), [allSims]);

  const filteredSims = useMemo(() => {
    // --- NEW SEARCH RULES (5 cases) ---
    const qRaw = String(filters.searchQuery || "").trim();
    const q = qRaw.replace(/[^0-9*]/g, '');
    const digitsOnly = q.replace(/\*/g, '');

    let result = [...allSims];

    if (q.length > 0 && digitsOnly.length > 0) {
      // RULE A: Exact 10 digits, no wildcard -> exact match, bypass all filters
      if (digitsOnly.length === 10 && !q.includes('*')) {
        const exact = allSims.filter(sim => getSimDigitsRobust(sim) === digitsOnly);
        if (exact.length > 0) {
          return exact;
        }
        // No exact match -> empty, suggestions will handle
        result = [];
      }
      // RULE B: Wildcard patterns
      else if (q.includes('*')) {
        const startsWithStar = q.startsWith('*');
        const endsWithStar = q.endsWith('*');
        const parts = q.split('*').filter(Boolean);

        if (endsWithStar && !startsWithStar && parts.length >= 1) {
          // "0903*" -> startsWith prefix
          const prefix = parts[0];
          result = result.filter(sim => getSimDigitsRobust(sim).startsWith(prefix));
        } else if (startsWithStar && !endsWithStar && parts.length >= 1) {
          // "*8888" -> endsWith suffix
          const suffix = parts[parts.length - 1];
          result = result.filter(sim => getSimDigitsRobust(sim).endsWith(suffix));
        } else if (!startsWithStar && !endsWithStar && parts.length === 2) {
          // "090*6789" -> startsWith AND endsWith
          const prefix = parts[0];
          const suffix = parts[1];
          result = result.filter(sim => {
            const d = getSimDigitsRobust(sim);
            return d.startsWith(prefix) && d.endsWith(suffix);
          });
        } else {
          // Fallback for complex wildcard patterns
          if (digitsOnly.length >= 2) {
            result = result.filter(sim => getSimDigitsRobust(sim).includes(digitsOnly));
          }
        }
      }
      // RULE C: Substring (no *, 1-9 digits) -> contains
      else {
        result = result.filter(sim => getSimDigitsRobust(sim).includes(digitsOnly));
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
        const simDigits = getSimDigitsRobust(sim);
        return allSuffixes.some(suffix => simDigits.endsWith(suffix));
      });
    }

    if (filters.vipFilter === 'only') {
      result = result.filter(sim => sim.isVIP);
    } else if (filters.vipFilter === 'hide') {
      result = result.filter(sim => !sim.isVIP);
    }

    // Quý position filter
    if (filters.quyType) {
      result = result.filter(sim => {
        const simDigits = getSimDigitsRobust(sim);
        return matchesQuyFilter(simDigits, filters.quyType, filters.quyPosition);
      });
    }

    result = sortSIMs(result, filters.sortBy);

    if (filters.mobifoneFirst && filters.sortBy === 'default') {
      result = result.sort((a, b) => {
        if (a.network === 'Mobifone' && b.network !== 'Mobifone') return -1;
        if (a.network !== 'Mobifone' && b.network === 'Mobifone') return 1;
        return 0;
      });
    }

    // Ưu tiên SIM có giảm giá thật lên đầu (stable sort - giữ nguyên thứ tự trong từng nhóm)
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
    
    result = [...discountedSims, ...normalSims];

    return result;
  }, [allSims, filters]);

  // --- SEARCH SUGGESTIONS (per 5 rules, shown when primary results empty) ---
  const searchSuggestions = useMemo((): NormalizedSIM[] => {
    if (filteredSims.length > 0) return [];

    const qRaw = String(filters.searchQuery || "").trim();
    const q = qRaw.replace(/[^0-9*]/g, '');
    const digitsOnly = q.replace(/\*/g, '');

    if (q.length === 0 || digitsOnly.length === 0) return [];

    const MAX_SUGGESTIONS = 40;

    // Rule 5: 10 digits exact, no match -> suggest endsWith last 4 digits
    if (digitsOnly.length === 10 && !q.includes('*')) {
      const tail4 = digitsOnly.slice(-4);
      return allSims
        .filter(sim => getSimDigitsRobust(sim).endsWith(tail4))
        .slice(0, MAX_SUGGESTIONS);
    }

    // Rule 1: Substring (no *, 1-9 digits) -> suggest by 3-char substrings
    if (!q.includes('*') && digitsOnly.length >= 1 && digitsOnly.length < 10) {
      const subs: string[] = [];
      for (let i = 0; i <= digitsOnly.length - 3; i++) {
        subs.push(digitsOnly.slice(i, i + 3));
      }
      if (subs.length === 0) {
        // Query < 3 chars, use full query as substring
        return allSims
          .filter(sim => getSimDigitsRobust(sim).includes(digitsOnly))
          .slice(0, MAX_SUGGESTIONS);
      }

      const scored: { sim: NormalizedSIM; score: number }[] = [];
      for (const sim of allSims) {
        const d = getSimDigitsRobust(sim);
        let score = 0;
        for (const sub of subs) {
          if (d.includes(sub)) score++;
        }
        // Prefer later substrings (suffix match)
        if (subs.length > 1 && d.includes(subs[subs.length - 1])) score += 1;
        if (score > 0) scored.push({ sim, score });
      }
      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, MAX_SUGGESTIONS).map(s => s.sim);
    }

    // Rule 2: "0903*" -> suggest startsWith shorter prefix (first 2 digits)
    if (q.endsWith('*') && !q.startsWith('*')) {
      const prefix = digitsOnly;
      if (prefix.length >= 2) {
        const shortPrefix = prefix.slice(0, 2);
        return allSims
          .filter(sim => getSimDigitsRobust(sim).startsWith(shortPrefix))
          .slice(0, MAX_SUGGESTIONS);
      }
      return [];
    }

    // Rule 4: "*8888" -> suggest endsWith shorter suffix
    if (q.startsWith('*') && !q.endsWith('*')) {
      const suffix = digitsOnly;
      if (suffix.length >= 2) {
        for (let drop = 1; drop < suffix.length - 1; drop++) {
          const shorter = suffix.slice(drop);
          const candidates = allSims.filter(sim =>
            getSimDigitsRobust(sim).endsWith(shorter)
          );
          if (candidates.length > 0) return candidates.slice(0, MAX_SUGGESTIONS);
        }
      }
      return [];
    }

    // Rule 3: "090*6789" -> suggest startsWith short prefix AND endsWith suffix
    if (!q.startsWith('*') && !q.endsWith('*') && q.includes('*')) {
      const parts = q.split('*').filter(Boolean);
      if (parts.length === 2) {
        const prefixDigits = parts[0];
        const suffixDigits = parts[1];
        const shortPrefix = prefixDigits.slice(0, Math.min(2, prefixDigits.length));

        let candidates = allSims.filter(sim => {
          const d = getSimDigitsRobust(sim);
          return d.startsWith(shortPrefix) && d.endsWith(suffixDigits);
        });
        if (candidates.length > 0) return candidates.slice(0, MAX_SUGGESTIONS);

        // Fallback: just endsWith suffix
        candidates = allSims.filter(sim =>
          getSimDigitsRobust(sim).endsWith(suffixDigits)
        );
        return candidates.slice(0, MAX_SUGGESTIONS);
      }
    }

    return [];
  }, [filteredSims.length, filters.searchQuery, allSims]);

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

    if (filters.quyType) {
      constraints.push({
        key: 'quyType',
        label: filters.quyType,
        onRemove: () => {
          updateFilter('quyType', null);
          updateFilter('quyPosition', null);
        }
      });
    }

    return constraints;
    // `updateFilter` is intentionally omitted. It is declared *below* this memo,
    // so listing it here is a TDZ error (TS2448), not just a lint nit — the
    // dep array is evaluated on the first render, before the const exists.
    // Omitting it is safe regardless: updateFilter is useCallback(..., []) and
    // never changes identity, so the closure can never capture a stale one.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            quyType: 'Bộ lọc quý',
            quyPosition: 'Vị trí quý',
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
    searchSuggestion,
    searchSuggestions
  };
};