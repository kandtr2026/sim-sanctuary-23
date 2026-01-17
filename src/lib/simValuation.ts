// ==============================
// SIM VALUATION LOGIC - VIETNAM MARKET
// Weighted scoring (đuôi ~70%) + calibration
// Chỉ dùng cho trang /dinh-gia-sim
// ==============================

import { getCalibrationData } from './simInventorySheet';

/**
 * Chuẩn hóa số điện thoại - loại bỏ mọi ký tự không phải số
 */
export function normalizePhone(input: string): string {
  return input.replace(/\D/g, '');
}

/**
 * Validate số điện thoại
 */
export function validatePhone(phone: string): { valid: boolean; error?: string } {
  const normalized = normalizePhone(phone);
  
  if (!normalized) {
    return { valid: false, error: 'Vui lòng nhập số SIM' };
  }
  
  if (normalized.length < 10) {
    return { valid: false, error: 'Số SIM phải có ít nhất 10 chữ số' };
  }
  
  if (normalized.length > 11) {
    return { valid: false, error: 'Số SIM không được quá 11 chữ số' };
  }
  
  return { valid: true };
}

/**
 * Nhận diện nhà mạng theo đầu số
 */
export type Carrier = 'Viettel' | 'Vina' | 'Mobi' | 'Vietnamobile' | 'iTel' | 'Gmobile' | 'Unknown';

export function detectCarrier(phone: string): Carrier {
  const normalized = normalizePhone(phone);
  const prefix3 = normalized.slice(0, 3);
  
  // Viettel: 096, 097, 098, 086, 032-039
  if (['096', '097', '098', '086'].includes(prefix3)) return 'Viettel';
  if (['032', '033', '034', '035', '036', '037', '038', '039'].includes(prefix3)) return 'Viettel';
  
  // Vina: 091, 094, 088, 081-085
  if (['091', '094', '088'].includes(prefix3)) return 'Vina';
  if (['081', '082', '083', '084', '085'].includes(prefix3)) return 'Vina';
  
  // Mobi: 090, 093, 089, 070, 076-079
  if (['090', '093', '089', '070'].includes(prefix3)) return 'Mobi';
  if (['076', '077', '078', '079'].includes(prefix3)) return 'Mobi';
  
  // Vietnamobile: 092, 056, 058
  if (['092', '056', '058'].includes(prefix3)) return 'Vietnamobile';
  
  // iTel: 087
  if (prefix3 === '087') return 'iTel';
  
  // Gmobile: 099, 059
  if (['099', '059'].includes(prefix3)) return 'Gmobile';
  
  return 'Unknown';
}

// ==============================
// FEATURE EXTRACTION
// ==============================

interface FeatureResult {
  tailPatterns: string[];
  tailScore: number;
  tailLuck: string[];
  carrierScore: number;
  prefixScore: number;
  prefixClass: string;
  middleScore: number;
  middlePatterns: string[];
  fengshuiScore: number;
  allTags: string[];
  allHighlights: string[];
}

/**
 * Trích xuất đặc trưng từ số điện thoại
 */
function extractFeatures(phone: string, carrier: Carrier): FeatureResult {
  const digits = normalizePhone(phone);
  const tailPatterns: string[] = [];
  const tailLuck: string[] = [];
  const middlePatterns: string[] = [];
  const allTags: string[] = [];
  const allHighlights: string[] = [];
  
  const last6 = digits.slice(-6);
  const last5 = digits.slice(-5);
  const last4 = digits.slice(-4);
  const last3 = digits.slice(-3);
  const middle = digits.slice(3, -3);
  const prefix3 = digits.slice(0, 3);
  
  // ====== TAIL SCORE (0-100) - MẠNH NHẤT ======
  let tailScore = 50; // base
  
  // Sảnh 6
  const checkSequence = (str: string, len: number): string | null => {
    for (let i = 0; i <= str.length - len; i++) {
      const sub = str.slice(i, i + len);
      let isAsc = true, isDesc = true;
      for (let j = 0; j < sub.length - 1; j++) {
        if (parseInt(sub[j + 1]) !== parseInt(sub[j]) + 1) isAsc = false;
        if (parseInt(sub[j + 1]) !== parseInt(sub[j]) - 1) isDesc = false;
      }
      if (isAsc || isDesc) return sub;
    }
    return null;
  };
  
  const seq6 = checkSequence(digits, 6);
  const seq5 = checkSequence(digits, 5);
  const seq4 = checkSequence(digits, 4);
  
  // Lục quý
  if (/^(\d)\1{5}$/.test(last6)) {
    tailScore = 99;
    tailPatterns.push('Lục quý');
    allTags.push('Lục quý');
    allHighlights.push(`Lục quý cuối (${last6})`);
  }
  // Sảnh 6
  else if (seq6) {
    tailScore = 97;
    tailPatterns.push('Sảnh 6');
    allTags.push('Sảnh 6');
    allHighlights.push(`Sảnh tiến 6 số (${seq6})`);
  }
  // Ngũ quý
  else if (/^(\d)\1{4}$/.test(last5)) {
    tailScore = 96;
    tailPatterns.push('Ngũ quý');
    allTags.push('Ngũ quý');
    allHighlights.push(`Ngũ quý cuối (${last5})`);
  }
  // Tam hoa kép
  else if (/^(\d)\1{2}(\d)\2{2}$/.test(last6) && last6[0] !== last6[3]) {
    tailScore = 92;
    tailPatterns.push('Tam hoa kép');
    allTags.push('Tam hoa kép');
    allHighlights.push(`Tam hoa kép cuối (${last6})`);
  }
  // Tứ quý
  else if (/^(\d)\1{3}$/.test(last4)) {
    tailScore = 90;
    tailPatterns.push('Tứ quý');
    allTags.push('Tứ quý');
    allHighlights.push(`Tứ quý cuối (${last4})`);
  }
  // Sảnh 5
  else if (seq5) {
    tailScore = 88;
    tailPatterns.push('Sảnh 5');
    allTags.push('Sảnh 5');
    allHighlights.push(`Sảnh tiến 5 số (${seq5})`);
  }
  // Taxi ABCABC
  else if (last6.length === 6 && last6.slice(0, 3) === last6.slice(3, 6)) {
    tailScore = 86;
    tailPatterns.push('Taxi');
    allTags.push('Taxi');
    allHighlights.push(`Số taxi (${last6})`);
  }
  // Sảnh 4
  else if (seq4) {
    tailScore = 78;
    tailPatterns.push('Sảnh 4');
    allTags.push('Sảnh 4');
    allHighlights.push(`Sảnh tiến 4 số (${seq4})`);
  }
  // Tam hoa
  else if (/^(\d)\1{2}$/.test(last3)) {
    tailScore = 72;
    tailPatterns.push('Tam hoa');
    allTags.push('Tam hoa');
    allHighlights.push(`Tam hoa cuối (${last3})`);
  }
  // ABAB
  else if (/^(\d)(\d)\1\2$/.test(last4) && last4[0] !== last4[1]) {
    tailScore = 70;
    tailPatterns.push('ABAB');
    allTags.push('ABAB');
    allHighlights.push(`Đuôi ABAB (${last4})`);
  }
  // Gánh ABBA
  else if (last4[0] === last4[3] && last4[1] === last4[2] && last4[0] !== last4[1]) {
    tailScore = 68;
    tailPatterns.push('Gánh');
    allTags.push('Gánh');
    allHighlights.push(`Số gánh (${last4})`);
  }
  // AABB
  else if (/^(\d)\1(\d)\2$/.test(last4) && last4[0] !== last4[2]) {
    tailScore = 65;
    tailPatterns.push('AABB');
    allTags.push('AABB');
    allHighlights.push(`Đuôi AABB (${last4})`);
  }
  // Cặp đôi
  else if (/^(\d)\1$/.test(digits.slice(-2))) {
    tailScore = 58;
    tailPatterns.push('Cặp');
    allTags.push('Cặp');
    allHighlights.push(`Đuôi cặp (${digits.slice(-2)})`);
  }
  // Không pattern đặc biệt - dựa vào độ lặp
  else {
    const digitCounts = digits.split('').reduce((acc, d) => {
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    const maxRepeat = Math.max(...Object.values(digitCounts));
    
    if (maxRepeat >= 5) {
      tailScore = 55;
      allHighlights.push('Dễ nhớ (nhiều số lặp)');
    } else {
      tailScore = 48;
    }
  }
  
  // Cụm tài lộc - cộng thêm tối đa +8
  let luckBonus = 0;
  if (last4.includes('68') || last4.includes('86')) {
    tailLuck.push('Lộc phát');
    allTags.push('Lộc phát');
    allHighlights.push('Cụm Lộc phát (68/86)');
    luckBonus = Math.max(luckBonus, 8);
  }
  if (last4.includes('39') || last4.includes('79')) {
    tailLuck.push('Thần tài');
    if (!allTags.includes('Thần tài')) allTags.push('Thần tài');
    if (luckBonus < 8) {
      allHighlights.push('Cụm Thần tài (39/79)');
      luckBonus = Math.max(luckBonus, 6);
    }
  }
  if (last4.includes('38') || last4.includes('78')) {
    tailLuck.push('Ông địa');
    if (!allTags.includes('Ông địa')) allTags.push('Ông địa');
    if (luckBonus < 6) {
      allHighlights.push('Cụm Ông địa (38/78)');
      luckBonus = Math.max(luckBonus, 5);
    }
  }
  if (last4.includes('88') || last4.includes('99')) {
    tailLuck.push('Song phát');
    if (!allTags.includes('Song phát')) allTags.push('Song phát');
    if (luckBonus < 8) {
      allHighlights.push('Cụm Song phát (88/99)');
      luckBonus = Math.max(luckBonus, 8);
    }
  }
  
  tailScore = Math.min(100, tailScore + luckBonus);
  
  // ====== CARRIER SCORE (0-100) ======
  let carrierScore: number;
  switch (carrier) {
    case 'Viettel': carrierScore = 75; break;
    case 'Mobi': carrierScore = 72; break;
    case 'Vina': carrierScore = 70; break;
    case 'iTel':
    case 'Vietnamobile': carrierScore = 62; break;
    case 'Gmobile': carrierScore = 58; break;
    default: carrierScore = 60;
  }
  
  // ====== PREFIX SCORE (0-100) ======
  let prefixScore: number;
  let prefixClass: string;
  
  const classicPrefixes = ['090', '091', '098', '097', '096', '093', '094'];
  const nicePrefixes = ['086', '088', '089'];
  
  if (classicPrefixes.includes(prefix3)) {
    prefixScore = 75;
    prefixClass = 'Đầu số cổ/đẹp';
    allHighlights.push(`Đầu số đẹp (${prefix3})`);
  } else if (nicePrefixes.includes(prefix3)) {
    prefixScore = 72;
    prefixClass = 'Đầu số đẹp';
    allHighlights.push(`Đầu số đẹp (${prefix3})`);
  } else if (/^(03|07|08)/.test(digits)) {
    prefixScore = 65;
    prefixClass = 'Đầu số mới';
  } else {
    prefixScore = 60;
    prefixClass = 'Đầu số khác';
  }
  
  // ====== MIDDLE SCORE (0-100) - RẤT NHẸ ======
  let middleScore = 58;
  
  if (middle.length >= 4) {
    // ABAB ở giữa
    if (/(\d)(\d)\1\2/.test(middle)) {
      middleScore = 72;
      middlePatterns.push('ABAB giữa');
    }
    // AABB ở giữa
    else if (/(\d)\1(\d)\2/.test(middle)) {
      middleScore = 68;
      middlePatterns.push('AABB giữa');
    }
    // Gánh ở giữa
    else if (middle.length >= 4) {
      for (let i = 0; i <= middle.length - 4; i++) {
        const sub = middle.slice(i, i + 4);
        if (sub[0] === sub[3] && sub[1] === sub[2] && sub[0] !== sub[1]) {
          middleScore = 65;
          middlePatterns.push('Gánh giữa');
          break;
        }
      }
    }
    // Lặp 3+ ở giữa
    if (/(\d)\1{2}/.test(middle) && middleScore < 65) {
      middleScore = 62;
      middlePatterns.push('Lặp giữa');
    }
  }
  
  // ====== FENGSHUI SCORE (0-100) - RẤT NHẸ ======
  let fengshuiScore = 60;
  
  // Tổng nút
  const sumDigits = digits.split('').reduce((sum, d) => sum + parseInt(d), 0);
  const nutScore = sumDigits % 10;
  if (nutScore >= 7) fengshuiScore += 4;
  
  // Cân bằng chẵn lẻ
  const evenCount = digits.split('').filter((d) => parseInt(d) % 2 === 0).length;
  const oddCount = digits.length - evenCount;
  if (Math.abs(evenCount - oddCount) <= 2) fengshuiScore += 3;
  
  // Phạt nếu có nhiều 4 hoặc 7
  const count4 = (digits.match(/4/g) || []).length;
  const count7 = (digits.match(/7/g) || []).length;
  if (count4 >= 4) fengshuiScore -= 6;
  if (count7 >= 4) fengshuiScore -= 6;
  if (last4.includes('444') || last4.includes('777')) fengshuiScore -= 8;
  
  fengshuiScore = Math.max(40, Math.min(75, fengshuiScore));
  
  return {
    tailPatterns,
    tailScore,
    tailLuck,
    carrierScore,
    prefixScore,
    prefixClass,
    middleScore,
    middlePatterns,
    fengshuiScore,
    allTags,
    allHighlights,
  };
}

// ==============================
// PRICE CALCULATION
// ==============================

interface PriceRange {
  min: number;
  max: number;
  mid: number;
}

function baseRangeFromScore(score: number): PriceRange {
  let min: number, max: number;
  
  if (score < 45) {
    min = 200000;
    max = 900000;
  } else if (score <= 60) {
    min = 900000;
    max = 2500000;
  } else if (score <= 75) {
    min = 2500000;
    max = 8000000;
  } else if (score <= 88) {
    min = 8000000;
    max = 25000000;
  } else {
    min = 25000000;
    max = 120000000;
  }
  
  const mid = Math.round((min + max) / 2 / 10000) * 10000;
  return { min, max, mid };
}

// ==============================
// MAIN VALUATION
// ==============================

export interface ValuationOutput {
  phone: string;
  carrier: Carrier;
  score: number;
  tierLabel: string;
  price: number;
  range: [number, number];
  highlights: string[];
  tags: string[];
  marketBasis: 'inventory-calibrated' | 'rule-based';
}

/**
 * Hàm định giá chính với weighted scoring
 */
export async function valuateSimAsync(phone: string): Promise<ValuationOutput> {
  const digits = normalizePhone(phone);
  const carrier = detectCarrier(digits);
  
  // Extract features
  const features = extractFeatures(digits, carrier);
  
  // Weighted score calculation
  // tailScore: 70%, carrierScore: 10%, prefixScore: 8%, middleScore: 7%, fengshuiScore: 5%
  const weightedScore = Math.round(
    0.70 * features.tailScore +
    0.10 * features.carrierScore +
    0.08 * features.prefixScore +
    0.07 * features.middleScore +
    0.05 * features.fengshuiScore
  );
  
  const score = Math.max(0, Math.min(100, weightedScore));
  
  // Base price range
  const baseRange = baseRangeFromScore(score);
  let finalMin = baseRange.min;
  let finalMax = baseRange.max;
  let finalPrice = baseRange.mid;
  let marketBasis: 'inventory-calibrated' | 'rule-based' = 'rule-based';
  
  // Try calibration from inventory
  try {
    const calibration = await getCalibrationData(features.allTags, carrier);
    
    if (calibration.median !== null && calibration.p25 !== null && calibration.p75 !== null) {
      // Blend model price với median từ kho (alpha=0.55 nghiêng về kho)
      const alpha = 0.55;
      finalPrice = Math.round(((1 - alpha) * baseRange.mid + alpha * calibration.median) / 10000) * 10000;
      
      // Adjust range
      finalMin = Math.min(baseRange.min, Math.round(calibration.p25 * 0.9));
      finalMax = Math.max(baseRange.max, Math.round(calibration.p75 * 1.1));
      
      marketBasis = 'inventory-calibrated';
    }
  } catch (error) {
    console.warn('Calibration failed, using rule-based pricing', error);
  }
  
  // Tier label
  let tierLabel: string;
  if (score < 50) tierLabel = 'Phổ thông';
  else if (score <= 65) tierLabel = 'Khá đẹp';
  else if (score <= 80) tierLabel = 'Đẹp';
  else if (score <= 90) tierLabel = 'Rất đẹp';
  else tierLabel = 'VIP';
  
  // Build highlights
  const highlights = features.allHighlights.slice(0, 6);
  if (highlights.length === 0) {
    highlights.push('Số điện thoại thông thường');
  }
  
  // Add carrier highlight
  if (carrier !== 'Unknown') {
    highlights.push(`Nhà mạng ${carrier}`);
  }
  
  return {
    phone: digits,
    carrier,
    score,
    tierLabel,
    price: finalPrice,
    range: [finalMin, finalMax],
    highlights: highlights.slice(0, 6),
    tags: [...new Set(features.allTags)].slice(0, 6),
    marketBasis,
  };
}

/**
 * Sync version for backward compatibility (không có calibration)
 */
export function valuateSim(phone: string): ValuationOutput {
  const digits = normalizePhone(phone);
  const carrier = detectCarrier(digits);
  
  const features = extractFeatures(digits, carrier);
  
  const weightedScore = Math.round(
    0.70 * features.tailScore +
    0.10 * features.carrierScore +
    0.08 * features.prefixScore +
    0.07 * features.middleScore +
    0.05 * features.fengshuiScore
  );
  
  const score = Math.max(0, Math.min(100, weightedScore));
  const baseRange = baseRangeFromScore(score);
  
  let tierLabel: string;
  if (score < 50) tierLabel = 'Phổ thông';
  else if (score <= 65) tierLabel = 'Khá đẹp';
  else if (score <= 80) tierLabel = 'Đẹp';
  else if (score <= 90) tierLabel = 'Rất đẹp';
  else tierLabel = 'VIP';
  
  const highlights = features.allHighlights.slice(0, 6);
  if (highlights.length === 0) {
    highlights.push('Số điện thoại thông thường');
  }
  if (carrier !== 'Unknown') {
    highlights.push(`Nhà mạng ${carrier}`);
  }
  
  return {
    phone: digits,
    carrier,
    score,
    tierLabel,
    price: baseRange.mid,
    range: [baseRange.min, baseRange.max],
    highlights: highlights.slice(0, 6),
    tags: [...new Set(features.allTags)].slice(0, 6),
    marketBasis: 'rule-based',
  };
}

/**
 * Format tiền VNĐ
 */
export function formatCurrencyVND(value: number): string {
  return value.toLocaleString('vi-VN');
}

/**
 * Format số SIM hiển thị (thêm dấu chấm)
 */
export function formatPhoneDisplay(phone: string): string {
  const digits = normalizePhone(phone);
  if (digits.length === 10) {
    return `${digits.slice(0, 4)}.${digits.slice(4, 7)}.${digits.slice(7)}`;
  }
  if (digits.length === 11) {
    return `${digits.slice(0, 4)}.${digits.slice(4, 7)}.${digits.slice(7)}`;
  }
  return digits;
}

// Legacy exports
export function analyzePatterns(phone: string) {
  const result = valuateSim(phone);
  return {
    score: result.score,
    reasons: result.highlights,
  };
}

export function priceFromScore(score: number) {
  return baseRangeFromScore(score);
}

export function getScoreDescription(score: number): string {
  if (score < 50) return 'SIM phổ thông';
  if (score <= 65) return 'SIM khá đẹp';
  if (score <= 80) return 'SIM đẹp';
  if (score <= 90) return 'SIM rất đẹp';
  return 'SIM VIP – giá trị cao';
}
