// SIM Utility Functions - Tag Detection, Scoring, and Analysis

export interface NormalizedSIM {
  id: string;
  rawDigits: string;
  displayNumber: string;
  formattedNumber: string;
  price: number;
  prefix3: string;
  prefix4: string;
  last2: string;
  last3: string;
  last4: string;
  last5: string;
  last6: string;
  digitCounts: number[];
  sumDigits: number;
  tags: string[];
  isVIP: boolean;
  network: 'Mobifone' | 'Viettel' | 'Vinaphone' | 'iTelecom' | 'Khác';
  beautyScore: number;
}

// Promotional pricing data - kept separate from NormalizedSIM
export interface PromotionalData {
  originalPrice: number;
  finalPrice?: number;
  discountType?: 'percent' | 'amount' | 'fixed';
  discountValue?: number;
}

// Quý type (no position - position-agnostic)
export type QuyType = 'Tứ quý' | 'Ngũ quý' | 'Lục quý';
// Keep QuyPosition type for backward compatibility but it's no longer used
export type QuyPosition = 'Đuôi' | 'Giữa' | 'Đầu';

// Helper to check if all characters are identical
const isAllSame = (str: string): boolean => {
  if (!str || str.length === 0) return false;
  return /^(\d)\1*$/.test(str);
};

// Position-agnostic: Check if rawDigits contains k consecutive same digits anywhere
export const hasKConsecutiveSameDigits = (rawDigits: string, k: number): boolean => {
  if (!rawDigits || rawDigits.length < k) return false;
  
  // Scan the entire string for any substring of length k with all same digits
  for (let i = 0; i <= rawDigits.length - k; i++) {
    const substring = rawDigits.slice(i, i + k);
    if (isAllSame(substring)) {
      return true;
    }
  }
  return false;
};

// Check if SIM matches quý type (position-agnostic)
export const matchesQuyType = (rawDigits: string, quyType: QuyType): boolean => {
  if (!rawDigits) return false;
  
  switch (quyType) {
    case 'Lục quý':
      return hasKConsecutiveSameDigits(rawDigits, 6);
    case 'Ngũ quý':
      return hasKConsecutiveSameDigits(rawDigits, 5);
    case 'Tứ quý':
      return hasKConsecutiveSameDigits(rawDigits, 4);
    default:
      return false;
  }
};

// Check if SIM matches quý filter (position-agnostic, ignores position param for backward compatibility)
export const matchesQuyFilter = (
  rawDigits: string,
  quyType: QuyType | null,
  _position: QuyPosition | null // Ignored - kept for backward compatibility
): boolean => {
  if (!quyType) return true; // No filter active
  if (!rawDigits) return false;
  
  return matchesQuyType(rawDigits, quyType);
};

// Legacy function - kept for backward compatibility but now position-agnostic
export const checkQuyPosition = (
  rawDigits: string, 
  quyType: QuyType, 
  _position: QuyPosition // Ignored
): boolean => {
  return matchesQuyType(rawDigits, quyType);
};

// All SIM tag types
export const ALL_SIM_TAGS = [
  'Lục quý', 'Ngũ quý', 'Tứ quý', 'Tam hoa', 'Tam hoa kép',
  'Lộc phát', 'Thần tài', 'Ông địa',
  'Năm sinh', 'Tiến lên', 'Gánh đảo', 'Lặp kép', 'Dễ nhớ', 'Taxi',
  'VIP'
] as const;

export type SIMTag = typeof ALL_SIM_TAGS[number];

// Network detection by prefix
const NETWORK_PREFIXES = {
  Mobifone: {
    prefix3: ['090', '093', '089', '070', '076', '077', '078', '079'],
    prefix4: [] as string[]
  },
  Viettel: {
    prefix3: ['096', '097', '098', '086'],
    prefix4: ['032', '033', '034', '035', '036', '037', '038', '039']
  },
  Vinaphone: {
    prefix3: ['091', '094', '088'],
    prefix4: ['081', '082', '083', '084', '085']
  },
  iTelecom: {
    prefix3: ['087'],
    prefix4: []
  }
};

export const detectNetwork = (rawDigits: string): NormalizedSIM['network'] => {
  const prefix3 = rawDigits.slice(0, 3);
  const prefix4 = rawDigits.slice(0, 4);

  for (const [network, prefixes] of Object.entries(NETWORK_PREFIXES)) {
    if (prefixes.prefix3.includes(prefix3) || 
        prefixes.prefix4.some(p => prefix4.startsWith(p))) {
      return network as NormalizedSIM['network'];
    }
  }
  return 'Khác';
};

// Detect all SIM tags with high confidence
export const detectSimTags = (rawDigits: string): string[] => {
  const tags: string[] = [];
  const last2 = rawDigits.slice(-2);
  const last3 = rawDigits.slice(-3);
  const last4 = rawDigits.slice(-4);
  const last5 = rawDigits.slice(-5);
  const last6 = rawDigits.slice(-6);

  // Quý patterns (mutually exclusive - most specific wins)
  const allSameLast6 = last6.length === 6 && /^(\d)\1{5}$/.test(last6);
  const allSameLast5 = last5.length === 5 && /^(\d)\1{4}$/.test(last5);
  const allSameLast4 = last4.length === 4 && /^(\d)\1{3}$/.test(last4);
  const allSameLast3 = last3.length === 3 && /^(\d)\1{2}$/.test(last3);

  if (allSameLast6) {
    tags.push('Lục quý');
  } else if (allSameLast5) {
    tags.push('Ngũ quý');
  } else if (allSameLast4) {
    tags.push('Tứ quý');
  } else if (allSameLast3) {
    // Check for Tam hoa kép patterns first
    const isTamHoaKep = 
      /^(\d{3})\1$/.test(last6) || // abcabc like 123123
      /^(\d{2})\1\1$/.test(last6) || // ababab like 121212
      (last6[0] === last6[2] && last6[2] === last6[4] && 
       last6[1] === last6[3] && last6[3] === last6[5] && 
       last6[0] !== last6[1]); // xyxyxy pattern
    
    if (isTamHoaKep) {
      tags.push('Tam hoa kép');
    } else {
      tags.push('Tam hoa');
    }
  }

  // Also check for Tam hoa kép patterns that don't end in tam hoa
  if (!tags.includes('Tam hoa kép') && !tags.some(t => t.includes('quý'))) {
    if (/^(\d{2})\1\1$/.test(last6) || /^(\d{3})\1$/.test(last6)) {
      tags.push('Tam hoa kép');
    }
  }

  // Phong thủy patterns (can coexist)
  if (/39$|79$/.test(rawDigits)) tags.push('Thần tài');
  if (/68$|86$/.test(rawDigits)) tags.push('Lộc phát');
  if (/38$|78$/.test(rawDigits)) tags.push('Ông địa');

  // Tiến lên (ascending last 4)
  if (/0123$|1234$|2345$|3456$|4567$|5678$|6789$/.test(rawDigits)) {
    tags.push('Tiến lên');
  }

  // Gánh đảo (ABBA pattern in last 4, A != B)
  if (last4.length === 4 && 
      last4[0] === last4[3] && 
      last4[1] === last4[2] && 
      last4[0] !== last4[1]) {
    tags.push('Gánh đảo');
  }

  // Lặp kép (AABB in last 4 or AABBCC in last 6)
  if (!tags.some(t => t.includes('quý') || t === 'Tam hoa kép')) {
    if (/^(\d)\1(\d)\2$/.test(last4) && last4[0] !== last4[2]) {
      tags.push('Lặp kép');
    } else if (/^(\d)\1(\d)\2(\d)\3$/.test(last6)) {
      tags.push('Lặp kép');
    }
  }

  // Năm sinh (ends with year 1980-2029)
  const yearMatch = rawDigits.slice(-4);
  const year = parseInt(yearMatch, 10);
  if (year >= 1980 && year <= 2029) {
    tags.push('Năm sinh');
  }

  // Dễ nhớ (ABAB patterns) - only if not already tagged with quý/lặp
  if (!tags.some(t => ['Lặp kép', 'Tứ quý', 'Ngũ quý', 'Lục quý', 'Tam hoa kép'].includes(t))) {
    // ABAB pattern in last 4
    if (/^(\d{2})\1$/.test(last4)) {
      tags.push('Dễ nhớ');
    }
    // ABCABC pattern in last 6
    else if (/^(\d{3})\1$/.test(last6)) {
      tags.push('Dễ nhớ');
    }
  }

  // Taxi (has readable digit groups) - only if no other tags
  if (tags.length === 0) {
    // Check for patterns with repeating pairs
    const groups = last6.match(/(\d)\1+/g);
    if (groups && groups.some(g => g.length >= 2)) {
      tags.push('Taxi');
    }
  }

  return tags;
};

// Calculate beauty score for sorting
export const calculateBeautyScore = (tags: string[], price: number, vipThreshold: number = 50000000): number => {
  let score = 0;

  // Tag scores (based on prompt)
  if (tags.includes('Lục quý')) score += 100;
  if (tags.includes('Ngũ quý')) score += 80;
  if (tags.includes('Tứ quý')) score += 60;
  if (tags.includes('Tam hoa kép')) score += 55;
  if (tags.includes('Tam hoa')) score += 40;
  if (tags.includes('Thần tài')) score += 25;
  if (tags.includes('Lộc phát')) score += 25;
  if (tags.includes('Ông địa')) score += 20;
  if (tags.includes('Tiến lên')) score += 20;
  if (tags.includes('Gánh đảo')) score += 20;
  if (tags.includes('Lặp kép')) score += 20;
  if (tags.includes('Năm sinh')) score += 15;
  if (tags.includes('Dễ nhớ')) score += 10;
  if (tags.includes('Taxi')) score += 5;

  // VIP bonus
  if (price >= vipThreshold) score += 10;

  return score;
};

// Determine if SIM is VIP
export const isVIPSim = (tags: string[], price: number, vipThreshold: number = 50000000): boolean => {
  const vipTags = ['Lục quý', 'Ngũ quý', 'Tứ quý', 'Tam hoa kép'];
  return vipTags.some(t => tags.includes(t)) || price >= vipThreshold;
};

// Format SIM number for display
export const formatSIMNumber = (rawDigits: string): string => {
  if (rawDigits.length === 10) {
    return `${rawDigits.slice(0, 4)}.${rawDigits.slice(4, 7)}.${rawDigits.slice(7)}`;
  }
  if (rawDigits.length === 11) {
    return `${rawDigits.slice(0, 4)}.${rawDigits.slice(4, 7)}.${rawDigits.slice(7)}`;
  }
  return rawDigits;
};

// Calculate digit counts and sum
export const analyzeDigits = (rawDigits: string): { digitCounts: number[]; sumDigits: number } => {
  const counts = new Array(10).fill(0);
  let sum = 0;

  for (const char of rawDigits) {
    const digit = parseInt(char, 10);
    if (!isNaN(digit)) {
      counts[digit]++;
      sum += digit;
    }
  }

  return { digitCounts: counts, sumDigits: sum };
};

// Parse CSV price string to number (robust)
export const parsePrice = (priceStr: string | number): number => {
  if (typeof priceStr === 'number') return priceStr;
  if (!priceStr) return 0;
  
  // Remove all non-numeric characters except for decimal points that might be thousands separators
  let cleaned = String(priceStr)
    .replace(/[^\d]/g, ''); // Remove everything except digits
  
  const value = parseInt(cleaned, 10);
  return isNaN(value) ? 0 : value;
};

// Estimate price based on tags (for missing prices)
export const estimatePriceByTags = (tags: string[]): number => {
  // Price ranges based on prompt specification
  if (tags.includes('Lục quý')) {
    return Math.floor(Math.random() * (650000000 - 120000000) + 120000000);
  }
  if (tags.includes('Ngũ quý')) {
    return Math.floor(Math.random() * (250000000 - 60000000) + 60000000);
  }
  if (tags.includes('Tứ quý')) {
    return Math.floor(Math.random() * (60000000 - 12000000) + 12000000);
  }
  if (tags.includes('Tam hoa kép') || tags.includes('Tam hoa') || 
      tags.includes('Thần tài') || tags.includes('Lộc phát')) {
    return Math.floor(Math.random() * (25000000 - 4000000) + 4000000);
  }
  // Default range for others
  return Math.floor(Math.random() * (1200000 - 390000) + 390000);
};

// Normalize raw SIM data
export const normalizeSIM = (
  rawNumber: string,
  displayNumber: string | null,
  price: number,
  id: string
): NormalizedSIM => {
  const rawDigits = rawNumber.replace(/\D/g, '');
  const tags = detectSimTags(rawDigits);
  const { digitCounts, sumDigits } = analyzeDigits(rawDigits);
  const network = detectNetwork(rawDigits);
  const beautyScore = calculateBeautyScore(tags, price);
  const vip = isVIPSim(tags, price);

  return {
    id,
    rawDigits,
    displayNumber: displayNumber || rawDigits,
    formattedNumber: formatSIMNumber(rawDigits),
    price,
    prefix3: rawDigits.slice(0, 3),
    prefix4: rawDigits.slice(0, 4),
    last2: rawDigits.slice(-2),
    last3: rawDigits.slice(-3),
    last4: rawDigits.slice(-4),
    last5: rawDigits.slice(-5),
    last6: rawDigits.slice(-6),
    digitCounts,
    sumDigits,
    tags,
    isVIP: vip,
    network,
    beautyScore
  };
};

// Search with wildcard support (forgiving)
export const searchSIM = (sim: NormalizedSIM, query: string): boolean => {
  if (!query.trim()) return true;

  // Clean query - remove dots, spaces, and non-digits except * and =
  const cleanQuery = query.replace(/[\.\s]/g, '').trim();
  
  // Less than 2 digits = don't filter
  const digitCount = cleanQuery.replace(/[^\d]/g, '').length;
  if (digitCount < 2) return true;
  
  // Exact match (=prefix)
  if (cleanQuery.startsWith('=')) {
    return sim.rawDigits === cleanQuery.slice(1);
  }

  // Suffix only (*suffix)
  if (cleanQuery.startsWith('*') && !cleanQuery.slice(1).includes('*')) {
    const suffix = cleanQuery.slice(1);
    return sim.rawDigits.endsWith(suffix);
  }

  // Prefix only (prefix*)
  if (cleanQuery.endsWith('*') && !cleanQuery.slice(0, -1).includes('*')) {
    const prefix = cleanQuery.slice(0, -1);
    return sim.rawDigits.startsWith(prefix);
  }

  // Prefix + Suffix (prefix*suffix)
  if (cleanQuery.includes('*')) {
    const parts = cleanQuery.split('*').filter(Boolean);
    if (parts.length === 2) {
      return sim.rawDigits.startsWith(parts[0]) && sim.rawDigits.endsWith(parts[1]);
    }
    // Multiple wildcards - try best effort
    if (parts.length > 2) {
      return parts.every(part => sim.rawDigits.includes(part));
    }
  }

  // Contains (default)
  return sim.rawDigits.includes(cleanQuery);
};

// Price range presets
export const PRICE_RANGES = [
  { label: 'Dưới 1 triệu', min: 0, max: 999999 },
  { label: '1 - 3 triệu', min: 1000000, max: 2999999 },
  { label: '3 - 5 triệu', min: 3000000, max: 4999999 },
  { label: '5 - 10 triệu', min: 5000000, max: 9999999 },
  { label: '10 - 50 triệu', min: 10000000, max: 49999999 },
  { label: '50 - 100 triệu', min: 50000000, max: 99999999 },
  { label: '100 - 200 triệu', min: 100000000, max: 199999999 },
  { label: '200 - 500 triệu', min: 200000000, max: 499999999 },
  { label: 'Trên 500 triệu', min: 500000000, max: Infinity }
];

// Quick suffix presets
export const QUICK_SUFFIXES = ['68', '86', '39', '79', '38', '78', '888', '999', '6666', '8888'];

// Sorting options
export type SortOption = 'default' | 'price_asc' | 'price_desc' | 'beauty' | 'suffix_beauty';

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'default', label: 'Mới nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'beauty', label: 'Đẹp nhất' },
  { value: 'suffix_beauty', label: 'Đuôi đẹp' }
];

// Sort SIMs
export const sortSIMs = (sims: NormalizedSIM[], sortBy: SortOption): NormalizedSIM[] => {
  const sorted = [...sims];

  switch (sortBy) {
    case 'price_asc':
      return sorted.sort((a, b) => a.price - b.price);
    case 'price_desc':
      return sorted.sort((a, b) => b.price - a.price);
    case 'beauty':
      return sorted.sort((a, b) => b.beautyScore - a.beautyScore);
    case 'suffix_beauty':
      return sorted.sort((a, b) => {
        // Priority for ending patterns
        const getSuffixScore = (sim: NormalizedSIM) => {
          let score = 0;
          if (/68$|86$|39$|79$|38$|78$/.test(sim.rawDigits)) score += 50;
          if (/(\d)\1{3}$/.test(sim.rawDigits)) score += 100;
          if (/(\d)\1{2}$/.test(sim.rawDigits)) score += 60;
          if (/(\d)\1$/.test(sim.last4)) score += 30;
          return score + sim.beautyScore;
        };
        return getSuffixScore(b) - getSuffixScore(a);
      });
    default:
      return sorted;
  }
};

// Get unique prefixes from SIM list
export const getUniquePrefixes = (sims: NormalizedSIM[]): { prefix3: string[]; prefix4: string[] } => {
  const prefix3Set = new Set<string>();
  const prefix4Set = new Set<string>();

  sims.forEach(sim => {
    prefix3Set.add(sim.prefix3);
    prefix4Set.add(sim.prefix4);
  });

  return {
    prefix3: Array.from(prefix3Set).sort(),
    prefix4: Array.from(prefix4Set).sort()
  };
};

// Count tags in SIM list - with position-agnostic multi-category quý counting
export const countTags = (sims: NormalizedSIM[]): Record<string, number> => {
  const counts: Record<string, number> = {};
  
  ALL_SIM_TAGS.forEach(tag => {
    counts[tag] = 0;
  });

  sims.forEach(sim => {
    // Standard tag counting (non-quý tags)
    sim.tags.forEach(tag => {
      if (counts[tag] !== undefined && !['Tứ quý', 'Ngũ quý', 'Lục quý'].includes(tag)) {
        counts[tag]++;
      }
    });
    
    // Position-agnostic quý counting (multi-category: if matches k=6, also counts for k=5 and k=4)
    // This ensures a Lục quý SIM contributes to all three counts
    if (hasKConsecutiveSameDigits(sim.rawDigits, 6)) {
      counts['Lục quý']++;
      counts['Ngũ quý']++;
      counts['Tứ quý']++;
    } else if (hasKConsecutiveSameDigits(sim.rawDigits, 5)) {
      counts['Ngũ quý']++;
      counts['Tứ quý']++;
    } else if (hasKConsecutiveSameDigits(sim.rawDigits, 4)) {
      counts['Tứ quý']++;
    }
    
    if (sim.isVIP) {
      counts['VIP']++;
    }
  });

  return counts;
};
