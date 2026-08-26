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
  network: 'Mobifone' | 'Vinaphone' | 'Gmobile' | 'Khác';
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

// Check if SIM matches quý type (position-agnostic for Lục/Ngũ, suffix-only for Tứ)
export const matchesQuyType = (rawDigits: string, quyType: QuyType): boolean => {
  if (!rawDigits) return false;
  
  switch (quyType) {
    case 'Lục quý':
      return hasKConsecutiveSameDigits(rawDigits, 6);
    case 'Ngũ quý':
      return hasKConsecutiveSameDigits(rawDigits, 5);
    case 'Tứ quý':
      // Tứ quý: chỉ khi đúng 10 số và 4 số ĐUÔI giống nhau
      return rawDigits.length === 10 && /^(\d)\1{3}$/.test(rawDigits.slice(-4));
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
// Only detect Mobifone, Vinaphone, and Gmobile as per requirements
const NETWORK_PREFIXES: Record<string, string[]> = {
  Mobifone: ['090', '093', '089', '070', '076', '077', '078', '079'],
  Vinaphone: ['091', '094', '088', '081', '082', '083', '084', '085'],
  Gmobile: ['099', '059']
};

export const detectNetwork = (rawDigits: string): NormalizedSIM['network'] => {
  // Normalize: remove all non-digit characters
  const normalized = rawDigits.replace(/\D/g, '');
  
  // Extract first 3 digits as prefix
  const prefix3 = normalized.slice(0, 3);

  for (const [network, prefixes] of Object.entries(NETWORK_PREFIXES)) {
    if (prefixes.includes(prefix3)) {
      return network as NormalizedSIM['network'];
    }
  }
  return 'Khác';
};

// Detect all SIM tags with high confidence
export const detectSimTags = (rawDigits: string): string[] => {
  const tags: string[] = [];
  const digitsOnly = rawDigits.replace(/\D/g, '');
  const last2 = digitsOnly.slice(-2);
  const last3 = digitsOnly.slice(-3);
  const last4 = digitsOnly.slice(-4);
  const last6 = digitsOnly.slice(-6);

  // Quý patterns (mutually exclusive - most specific wins)
  // Lục quý / Ngũ quý: 6/5 chữ số giống nhau LIỀN NHAU ở BẤT KỲ VỊ TRÍ NÀO
  // (khớp với isHexAnywhere / isQuintAnywhere trong SimBrowser). Tứ quý vẫn
  // tính ở đuôi (4 số cuối giống nhau) vì đó là quy ước của trang tứ quý.
  const anySame6 = /(\d)\1{5}/.test(digitsOnly);
  const anySame5 = /(\d)\1{4}/.test(digitsOnly);
  const allSameLast4 = digitsOnly.length === 10 && last4.length === 4 && /^(\d)\1{3}$/.test(last4);

  if (anySame6) {
    tags.push('Lục quý');
  } else if (anySame5) {
    tags.push('Ngũ quý');
  } else if (allSameLast4) {
    tags.push('Tứ quý');
  }

  // Tam hoa / Tam hoa kép detection (mutually exclusive)
  // Find all triple identical consecutive digits (xxx) anywhere in the number
  // Count distinct digits that form triples
  if (!tags.some(t => t.includes('quý'))) {
    const tripleMatches = rawDigits.match(/(\d)\1{2}/g) || [];
    const distinctTripleDigits = new Set<string>();
    for (const match of tripleMatches) {
      distinctTripleDigits.add(match[0]); // Add the digit that forms the triple
    }
    
    // Apply tagging logic:
    // - If 2+ distinct triple digits → "Tam hoa kép" ONLY
    // - If exactly 1 distinct triple digit → "Tam hoa" ONLY
    if (distinctTripleDigits.size >= 2) {
      // keep Tam hoa kép logic unchanged
      tags.push('Tam hoa kép');
    } else if (distinctTripleDigits.size === 1) {
      // redefine Tam hoa: only if sim is 10 digits and the last 3 digits are identical
      if (rawDigits.length === 10 && last3[0] === last3[1] && last3[1] === last3[2] && !tags.some(t => t.includes('quý'))) {
        tags.push('Tam hoa');
      }
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

  // Taxi = ABABAB or ABCABC on last 6 digits
  const tail6 = rawDigits.slice(-6);
  // Taxi 2: ABABAB (ab.ab.ab) - positions 0,2,4 same AND 1,3,5 same AND different digits
  const isTaxi2 = tail6.length === 6 &&
    tail6[0] === tail6[2] && tail6[2] === tail6[4] &&
    tail6[1] === tail6[3] && tail6[3] === tail6[5] &&
    tail6[0] !== tail6[1];
  // Taxi 3: ABCABC (abc.abc) - first 3 = last 3, and block is NOT all same digit
  const block3a = tail6.slice(0, 3);
  const block3b = tail6.slice(3, 6);
  const isAllSameDigit = block3a[0] === block3a[1] && block3a[1] === block3a[2];
  const isTaxi3 = tail6.length === 6 &&
    block3a === block3b &&
    !isAllSameDigit;
  if (isTaxi2 || isTaxi3) {
    tags.push('Taxi');
  }

  // Dễ nhớ (ABAB patterns) - only if not already tagged with quý/lặp/Taxi
  if (!tags.some(t => ['Lặp kép', 'Tứ quý', 'Ngũ quý', 'Lục quý', 'Tam hoa kép', 'Taxi'].includes(t))) {
    // ABAB pattern in last 4
    if (/^(\d{2})\1$/.test(last4)) {
      tags.push('Dễ nhớ');
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

// Số ngày trong tháng (1-based index). Dùng để loại "31.11" ra khỏi sim năm sinh.
const NGAY_TRONG_THANG = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

const laNamNhuan = (y: number): boolean =>
  (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

/**
 * Đọc ngày sinh từ 6 chữ số cuối của số thuê bao. Trả về dạng `{d, m, y}` hợp
 * lệ hoặc null.
 *
 * Hai cách đọc được hỗ trợ, theo đúng cách chủ kho đặt tên số năm sinh:
 *
 *   1. DDMMYY (2-2-2): 0903.20.01.98 → 20/01/1998 (năm 2 chữ số)
 *   2. D.M.YYYY (1-1-4): 0908.8.9.2001 → 08/09/2001 (ngày+tháng 1 chữ, năm 4)
 *
 * Số nào đọc theo cách nào thì tuỳ khoá nào ra ngày tháng hợp lệ TRƯỚC (thử
 * DDMMYY trước, vì phổ biến hơn). Ngày phải tồn tại thật trong lịch — "31.11"
 * (tháng 11 chỉ có 30 ngày) và "29.02" không thuộc năm nhuận đều bị loại.
 */
export function parseBirthDate(
  rawDigits: string,
): { d: number; m: number; y: number; display: string } | null {
  const digits = String(rawDigits ?? '').replace(/\D/g, '');
  const tail = digits.slice(-6);
  if (tail.length < 6) return null;

  const tryDate = (d: number, m: number, y: number): boolean => {
    if (d < 1 || m < 1 || m > 12) return false;
    const maxDay = NGAY_TRONG_THANG[m - 1] + (m === 2 && laNamNhuan(y) ? 1 : 0);
    return d <= maxDay;
  };

  // 1) DDMMYY: dd mm yy
  const dd = Number(tail.slice(0, 2));
  const mm = Number(tail.slice(2, 4));
  const yy = Number(tail.slice(4, 6));
  // yy 00–29 → 2000s, 50–99 → 1900s; 30–49 mơ hồ nên bỏ.
  const yFull1 = yy <= 29 ? 2000 + yy : yy >= 50 ? 1900 + yy : null;
  if (yFull1 !== null && tryDate(dd, mm, yFull1)) {
    return { d: dd, m: mm, y: yFull1, display: `${dd}.${mm}.${yy}` };
  }

  // 2) D.M.YYYY: d m yyyy (ngày & tháng mỗi bên 1 chữ số)
  const d = Number(tail[0]);
  const m = Number(tail[1]);
  const yFull2 = Number(tail.slice(2, 6));
  if (d >= 1 && m >= 1 && yFull2 >= 1950 && yFull2 <= 2029 && tryDate(d, m, yFull2)) {
    return { d, m, y: yFull2, display: `${d}.${m}.${yFull2}` };
  }

  return null;
}

/**
 * Format số sim năm sinh cho card: prefix + ngày sinh có dấu chấm.
 * 0909922000 (sinh 09/02/2000) → "0909.9.2.2000"
 * 0908892001 (sinh 08/09/2001) → "0908.8.9.2001"
 *
 * Không đọc được ngày → trả về null để caller giữ nguyên format cũ.
 */
export const formatBirthDateDisplay = (rawDigits: string): string | null => {
  const digits = String(rawDigits ?? '').replace(/\D/g, '');
  const parsed = parseBirthDate(digits);
  if (!parsed) return null;
  return `${digits.slice(0, digits.length - 6)}.${parsed.display}`;
};

/**
 * Parser NỚI + linh hoạt cho hiển thị card (không đổi `parseBirthDate` — bộ lọc
 * chặt "Năm sinh" vẫn dùng parser nghiêm để loại số ảo).
 *
 * Hỗ trợ mọi cách chia ngày/tháng/năm trên phần đuôi 4–8 chữ số:
 *
 *   - DDMMYY    (2-2-2)  0903.20.01.98 → 20/01/1998
 *   - DDMMYYYY  (2-2-4)  0903202000    → 20/03/2000
 *   - DDMYY     (2-1-2)  0909.20.2.13  → 20/02/2013
 *   - DDMYYYY   (2-1-4)  0909.20.2.2000 → 20/02/2000
 *   - DMYYYY    (1-2-4)  0909.9.02.2000 → 09/02/2000
 *   - D.M.YYYY  (1-1-4)  0908.8.9.2001  → 08/09/2001
 *   - … (không giới hạn: thử mọi tổ hợp dLen∈{1,2}, mLen∈{1,2}, yLen∈{2,4})
 *
 * Ngày phải tồn tại thật trong lịch (31.11, 29.02 không nhuận đều bị loại).
 * Ưu tiên năm 4 chữ số trước (rõ ràng nhất), rồi tới 2 chữ số. Trả về
 * `display` CHUẨN dạng `dd.mm.yyyy` (2 chữ số ngày/tháng, 4 chữ số năm) để
 * hiển thị đồng nhất mọi nơi — web tự xử lý, không theo dấu chấm sheet.
 */
export function tryParseBirthDateLenient(
  rawDigits: string,
): { d: number; m: number; y: number; display: string; tailLen: number } | null {
  const digits = String(rawDigits ?? '').replace(/\D/g, '');
  if (digits.length < 4) return null;

  const tryDate = (d: number, m: number, y: number): boolean => {
    if (d < 1 || m < 1 || m > 12) return false;
    const maxDay = NGAY_TRONG_THANG[m - 1] + (m === 2 && laNamNhuan(y) ? 1 : 0);
    return d <= maxDay;
  };

  const pad2 = (n: number): string => String(n).padStart(2, '0');

  // Năm 2 chữ số → năm đầy đủ: 00–29 → 2000s, 50–99 → 1900s; 30–49 mơ hồ bỏ.
  const expand2DigitYear = (yy: number): number | null =>
    yy <= 29 ? 2000 + yy : yy >= 50 ? 1900 + yy : null;

  const is4DigitYear = (y: number): boolean => y >= 1950 && y <= 2035;

  // Mọi tổ hợp [dLen, mLen, yLen] khả thi trên SIM 10 số (prefix mạng 3 số →
  // ngày sinh tối đa 7 số cuối). Ưu tiên năm 4 chữ số trước (rõ nhất), trong
  // đó DDMM đầy đủ trước; rồi tới năm 2 chữ số. Không có [1,1,2]/tailLen 4-8
  // vì quá mơ hồ (dễ false positive với số thường).
  const combos: [number, number, number][] = [
    [2, 2, 4], // DDMMYYYY (2-2-4)
    [2, 1, 4], // DDMYYYY (2-1-4)
    [1, 2, 4], // DMYYYY (1-2-4)
    [1, 1, 4], // D.M.YYYY (1-1-4)
    [2, 2, 2], // DDMMYY (2-2-2)
    [2, 1, 2], // DDMYY (2-1-2)
    [1, 2, 2], // DMMYY (1-2-2)
  ];

  for (const [dLen, mLen, yLen] of combos) {
    const tailLen = dLen + mLen + yLen;
    if (tailLen > digits.length) continue;

    // Phần prefix còn lại phải là 3–4 số (đầu mạng VN: 090, 0909…) — nếu tailLen
    // nhỏ (5) mà số có 10 chữ số thì prefix thành 5 số, không phải SIM năm sinh.
    const prefixLen = digits.length - tailLen;
    if (prefixLen < 3 || prefixLen > 4) continue;

    const tail = digits.slice(-tailLen);

    const d = Number(tail.slice(0, dLen));
    const m = Number(tail.slice(dLen, dLen + mLen));
    const yStr = tail.slice(dLen + mLen);

    let y: number | null = null;
    if (yLen === 4) {
      const yFull = Number(yStr);
      if (is4DigitYear(yFull)) y = yFull;
    } else {
      y = expand2DigitYear(Number(yStr));
    }
    if (y === null) continue;
    if (!tryDate(d, m, y)) continue;

    return { d, m, y, display: `${pad2(d)}.${pad2(m)}.${y}`, tailLen };
  }

  return null;
}

/**
 * Format số sim năm sinh cho card — parser linh hoạt: prefix + ngày sinh chuẩn
 * `dd.mm.yyyy`. 0909922000 (sinh 09/02/2000) → "0909.09.02.2000".
 * Không đọc được ngày → null để caller giữ format 4-3-3.
 */
export const formatBirthDateDisplayLenient = (rawDigits: string): string | null => {
  const digits = String(rawDigits ?? '').replace(/\D/g, '');
  const parsed = tryParseBirthDateLenient(digits);
  if (!parsed) return null;
  return `${digits.slice(0, digits.length - parsed.tailLen)}.${parsed.display}`;
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
  const cleaned = String(priceStr)
    .replace(/[^\d]/g, ''); // Remove everything except digits
  
  const value = parseInt(cleaned, 10);
  return isNaN(value) ? 0 : value;
};

/**
 * Format a VND price for display: 4400000 → "4.400.000đ" (vi-VN grouping, no
 * space before "đ"). Single source of truth for every price on the site — the
 * homepage grid, the landing tools and checkout all call this so the number
 * formatting can't drift apart again. Invalid/zero prices render "Liên hệ"
 * instead of a misleading "0đ".
 */
export const formatPrice = (price: number | undefined | null): string => {
  if (price === undefined || price === null || isNaN(price) || price <= 0) {
    return 'Liên hệ';
  }
  return `${Math.round(price).toLocaleString('vi-VN')}đ`;
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

/**
 * Restore the leading zero on a Vietnamese mobile number.
 *
 * The sheet's `SỐ THUÊ BAO CHUẨN` column is numeric, so Google strips the
 * leading zero: every one of the ~14k rows arrives as 9 digits ("799977799")
 * while the `SỐ THUÊ BAO` display column keeps all 10 ("0799977799").
 *
 * That silently broke every 10-digit assumption downstream — `matchesQuyType`
 * gates Tứ quý on `length === 10`, `detectSimTags` gates Tứ quý and Tam hoa the
 * same way, `detectNetwork` reads prefix3 (so "799" never matched "079" and the
 * whole catalogue resolved to network "Khác"), and `formatSIMNumber` returned
 * the digits unformatted.
 *
 * `useCheapSimData.ts` already normalises this exact way, so this brings the
 * main data path in line rather than inventing a convention. Padding is
 * conditional on length 9: a number that already has its zero, or an 11-digit
 * legacy number, is passed through untouched.
 */
const padLeadingZero = (digits: string): string =>
  digits.length === 9 ? `0${digits}` : digits;

// Normalize raw SIM data
export const normalizeSIM = (
  rawNumber: string,
  displayNumber: string | null,
  price: number,
  id: string
): NormalizedSIM => {
  const rawDigits = padLeadingZero(rawNumber.replace(/\D/g, ''));
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
  const cleanQuery = query.replace(/[.\s]/g, '').trim();
  
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
    
    // Position-agnostic quý counting for Lục/Ngũ; suffix-only for Tứ quý
    // Lục quý & Ngũ quý: position-agnostic (anywhere in string)
    // Tứ quý: chỉ khi đúng 10 số và 4 số ĐUÔI giống nhau
    if (hasKConsecutiveSameDigits(sim.rawDigits, 6)) {
      counts['Lục quý']++;
      counts['Ngũ quý']++;
      // Tứ quý chỉ được đếm nếu đuôi 4 số giống nhau
      if (sim.rawDigits.length === 10 && /^(\d)\1{3}$/.test(sim.rawDigits.slice(-4))) {
        counts['Tứ quý']++;
      }
    } else if (hasKConsecutiveSameDigits(sim.rawDigits, 5)) {
      counts['Ngũ quý']++;
      // Tứ quý chỉ được đếm nếu đuôi 4 số giống nhau
      if (sim.rawDigits.length === 10 && /^(\d)\1{3}$/.test(sim.rawDigits.slice(-4))) {
        counts['Tứ quý']++;
      }
    } else if (
      sim.rawDigits.length === 10 &&
      /^(\d)\1{3}$/.test(sim.rawDigits.slice(-4))
    ) {
      counts['Tứ quý']++;
    }
    
    if (sim.isVIP) {
      counts['VIP']++;
    }
  });

  return counts;
};
