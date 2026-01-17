// ==============================
// SIM VALUATION LOGIC - VIETNAM MARKET
// Chỉ dùng cho trang /dinh-gia-sim
// ==============================

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
  const prefix4 = normalized.slice(0, 4);
  
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

/**
 * Điều chỉnh điểm theo nhà mạng
 */
function getCarrierBonus(carrier: Carrier): number {
  switch (carrier) {
    case 'Viettel': return 5;
    case 'Mobi': return 4;
    case 'Vina': return 3;
    case 'iTel':
    case 'Vietnamobile': return 1;
    default: return 0;
  }
}

interface PatternResult {
  scoreDelta: number;
  highlights: string[];
  tags: string[];
  multiplierRange: [number, number];
}

/**
 * Phân tích pattern theo thị trường Việt Nam
 */
function analyzeVietnamSim(phone: string): PatternResult {
  const digits = normalizePhone(phone);
  let scoreDelta = 0;
  const highlights: string[] = [];
  const tags: string[] = [];
  let multiplierRange: [number, number] = [1, 1];
  
  const last6 = digits.slice(-6);
  const last5 = digits.slice(-5);
  const last4 = digits.slice(-4);
  const last3 = digits.slice(-3);
  const last2 = digits.slice(-2);
  
  // === 3.1 Pattern VIP (tác động rất mạnh) ===
  
  // Lục quý (xxxxxx) ở cuối
  if (/^(\d)\1{5}$/.test(last6)) {
    scoreDelta += 90;
    tags.push('Lục quý');
    highlights.push(`Lục quý cuối (${last6})`);
    multiplierRange = [20, 60];
  }
  // Ngũ quý (xxxxx) ở cuối
  else if (/^(\d)\1{4}$/.test(last5)) {
    scoreDelta += 70;
    tags.push('Ngũ quý');
    highlights.push(`Ngũ quý cuối (${last5})`);
    multiplierRange = [10, 25];
  }
  // Tứ quý (xxxx) ở cuối
  else if (/^(\d)\1{3}$/.test(last4)) {
    scoreDelta += 55;
    tags.push('Tứ quý');
    highlights.push(`Tứ quý cuối (${last4})`);
    multiplierRange = [4, 10];
  }
  // Tam hoa kép (AAABBB cuối 6 số)
  else if (/^(\d)\1{2}(\d)\2{2}$/.test(last6) && last6[0] !== last6[3]) {
    scoreDelta += 65;
    tags.push('Tam hoa kép');
    highlights.push(`Tam hoa kép cuối (${last6})`);
    multiplierRange = [6, 15];
  }
  // Tam hoa (xxx) ở cuối
  else if (/^(\d)\1{2}$/.test(last3)) {
    scoreDelta += 28;
    tags.push('Tam hoa');
    highlights.push(`Tam hoa cuối (${last3})`);
    multiplierRange = [1.6, 3.0];
  }
  
  // Sảnh tiến 5 số (12345 / 67890 / 98765...)
  const checkSequence = (str: string, length: number): string | null => {
    for (let i = 0; i <= str.length - length; i++) {
      const sub = str.slice(i, i + length);
      let isAsc = true, isDesc = true;
      for (let j = 0; j < sub.length - 1; j++) {
        if (parseInt(sub[j + 1]) !== parseInt(sub[j]) + 1) isAsc = false;
        if (parseInt(sub[j + 1]) !== parseInt(sub[j]) - 1) isDesc = false;
      }
      if (isAsc || isDesc) return sub;
    }
    return null;
  };
  
  const seq5 = checkSequence(digits, 5);
  const seq4 = checkSequence(digits, 4);
  
  if (seq5 && !tags.includes('Lục quý') && !tags.includes('Ngũ quý')) {
    scoreDelta += 60;
    tags.push('Sảnh 5');
    highlights.push(`Sảnh tiến 5 số (${seq5})`);
    if (multiplierRange[0] < 5) multiplierRange = [5, 12];
  } else if (seq4 && !tags.includes('Tứ quý') && !tags.includes('Sảnh 5')) {
    scoreDelta += 42;
    tags.push('Sảnh 4');
    highlights.push(`Sảnh tiến 4 số (${seq4})`);
    if (multiplierRange[0] < 2.5) multiplierRange = [2.5, 6];
  }
  
  // === 3.2 Pattern "Đẹp phổ biến" ===
  
  // ABAB cuối 4 số (6868, 7979...)
  if (/^(\d)(\d)\1\2$/.test(last4) && last4[0] !== last4[1] && !tags.includes('Tứ quý')) {
    scoreDelta += 24;
    tags.push('ABAB');
    highlights.push(`Đuôi ABAB (${last4})`);
    if (multiplierRange[0] < 1.5) multiplierRange = [1.5, 2.8];
  }
  
  // Gánh (ABBA) cuối 4 số (1221, 6886)
  if (last4.length === 4 && 
      last4[0] === last4[3] && 
      last4[1] === last4[2] &&
      last4[0] !== last4[1] &&
      !tags.includes('ABAB') &&
      !tags.includes('Tứ quý')) {
    scoreDelta += 22;
    tags.push('Gánh');
    highlights.push(`Số gánh (${last4})`);
    if (multiplierRange[0] < 1.4) multiplierRange = [1.4, 2.6];
  }
  
  // AABB cuối 4 số
  if (/^(\d)\1(\d)\2$/.test(last4) && last4[0] !== last4[2] && !tags.includes('Tứ quý')) {
    scoreDelta += 18;
    tags.push('AABB');
    highlights.push(`Đuôi AABB (${last4})`);
    if (multiplierRange[0] < 1.3) multiplierRange = [1.3, 2.2];
  }
  
  // Cặp đôi 2 số cuối (00, 11, 22...)
  if (/^(\d)\1$/.test(last2) && !tags.includes('Tam hoa') && !tags.includes('Tứ quý') && !tags.includes('AABB')) {
    scoreDelta += 10;
    tags.push('Cặp');
    highlights.push(`Đuôi cặp (${last2})`);
  }
  
  // === 3.3 Cụm số tài lộc (tác động vừa) - tối đa 2 cụm ===
  let locCount = 0;
  const maxLocTags = 2;
  
  const locPatterns: Array<{ pattern: RegExp | string[]; score: number; tag: string }> = [
    { pattern: ['68', '86'], score: 12, tag: 'Lộc phát' },
    { pattern: ['39', '79'], score: 10, tag: 'Thần tài' },
    { pattern: ['38', '78'], score: 9, tag: 'Ông địa' },
    { pattern: ['88', '99'], score: 12, tag: 'Song phát' },
    { pattern: ['66'], score: 8, tag: 'Lộc lộc' },
    { pattern: ['333'], score: 8, tag: 'Tài' },
    { pattern: ['555'], score: 8, tag: 'Sinh' },
  ];
  
  for (const lp of locPatterns) {
    if (locCount >= maxLocTags) break;
    
    const patterns = Array.isArray(lp.pattern) ? lp.pattern : [lp.pattern];
    for (const p of patterns) {
      if (typeof p === 'string' && last4.includes(p)) {
        scoreDelta += lp.score;
        if (!tags.includes(lp.tag)) {
          tags.push(lp.tag);
          highlights.push(`Cụm ${lp.tag} (${p})`);
          locCount++;
        }
        break;
      }
    }
  }
  
  // === 3.4 Dễ nhớ ===
  const digitCounts = digits.split('').reduce((acc, d) => {
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const maxRepeat = Math.max(...Object.values(digitCounts));
  
  if (maxRepeat >= 6) {
    scoreDelta += 18;
    tags.push('Hiếm');
    highlights.push('Số hiếm (nhiều số giống nhau)');
  } else if (maxRepeat >= 5) {
    scoreDelta += 8;
    tags.push('Dễ nhớ');
    highlights.push('Dễ nhớ (nhiều số lặp)');
  }
  
  return { scoreDelta, highlights, tags, multiplierRange };
}

/**
 * Tính điểm phạt theo quan niệm
 */
function getPenalty(phone: string): { penalty: number; reason?: string } {
  const digits = normalizePhone(phone);
  const last4 = digits.slice(-4);
  
  let penalty = 0;
  let reason: string | undefined;
  
  // Nếu "444" hoặc "777" nằm ở đuôi
  if (last4.includes('444') || last4.includes('777')) {
    penalty += 8;
    reason = 'Có cụm 444/777 ở đuôi';
  }
  
  // Nếu có >=4 số 4 hoặc 7
  const count4 = (digits.match(/4/g) || []).length;
  const count7 = (digits.match(/7/g) || []).length;
  
  if (count4 >= 4) {
    penalty += 6;
    reason = reason || 'Có nhiều số 4';
  }
  if (count7 >= 4) {
    penalty += 6;
    reason = reason || 'Có nhiều số 7';
  }
  
  return { penalty, reason };
}

interface PriceRange {
  min: number;
  max: number;
  mid: number;
}

/**
 * Tính giá theo tier và multiplier
 */
function calculatePrice(score: number, multiplierRange: [number, number]): PriceRange {
  let baseMin: number, baseMax: number;
  
  // Tier theo score
  if (score < 45) {
    baseMin = 200000;
    baseMax = 900000;
  } else if (score <= 60) {
    baseMin = 900000;
    baseMax = 2500000;
  } else if (score <= 75) {
    baseMin = 2500000;
    baseMax = 8000000;
  } else if (score <= 88) {
    baseMin = 8000000;
    baseMax = 25000000;
  } else {
    baseMin = 25000000;
    baseMax = 120000000;
  }
  
  // Apply multiplier
  const avgMultiplier = (multiplierRange[0] + multiplierRange[1]) / 2;
  
  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
  
  const finalMin = clamp(Math.round(baseMin * avgMultiplier), 200000, 2000000000);
  const finalMax = clamp(Math.round(baseMax * avgMultiplier), 300000, 5000000000);
  
  // Trung vị làm tròn 10.000
  const mid = Math.round((finalMin + finalMax) / 2 / 10000) * 10000;
  
  return { min: finalMin, max: finalMax, mid };
}

export interface ValuationOutput {
  phone: string;
  carrier: Carrier;
  score: number;
  tierLabel: string;
  price: number;
  range: [number, number];
  highlights: string[];
  tags: string[];
}

/**
 * Hàm định giá chính
 */
export function valuateSim(phone: string): ValuationOutput {
  const digits = normalizePhone(phone);
  const carrier = detectCarrier(digits);
  
  // Base score
  let score = 50;
  const highlights: string[] = [];
  const tags: string[] = [];
  
  // Đầu số đẹp
  if (digits.startsWith('090') || digits.startsWith('091')) {
    score += 10;
    highlights.push('Đầu số VIP (090/091)');
    tags.push('Đầu VIP');
  } else if (/^(03|07|08|09)/.test(digits)) {
    score += 6;
    highlights.push('Đầu số di động hợp lệ');
  }
  
  // Analyze patterns
  const patternResult = analyzeVietnamSim(digits);
  score += patternResult.scoreDelta;
  highlights.push(...patternResult.highlights);
  tags.push(...patternResult.tags);
  
  // Carrier bonus
  const carrierBonus = getCarrierBonus(carrier);
  if (carrierBonus > 0) {
    score += carrierBonus;
    highlights.push(`Nhà mạng ${carrier} (+${carrierBonus} điểm)`);
  }
  
  // Penalty
  const { penalty, reason } = getPenalty(digits);
  if (penalty > 0) {
    score -= penalty;
    if (reason) highlights.push(reason + ' (-điểm)');
  }
  
  // Clamp score
  score = Math.max(0, Math.min(100, score));
  
  // Calculate price
  const priceResult = calculatePrice(score, patternResult.multiplierRange);
  
  // Tier label
  let tierLabel: string;
  if (score < 50) tierLabel = 'Phổ thông';
  else if (score <= 65) tierLabel = 'Khá đẹp';
  else if (score <= 80) tierLabel = 'Đẹp';
  else if (score <= 90) tierLabel = 'Rất đẹp';
  else tierLabel = 'VIP';
  
  // Nếu không có highlight đặc biệt
  if (highlights.length === 0) {
    highlights.push('Số điện thoại thông thường');
  }
  
  return {
    phone: digits,
    carrier,
    score,
    tierLabel,
    price: priceResult.mid,
    range: [priceResult.min, priceResult.max],
    highlights: highlights.slice(0, 6),
    tags: [...new Set(tags)].slice(0, 5),
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

// Legacy exports for backward compatibility
export function analyzePatterns(phone: string) {
  const result = valuateSim(phone);
  return {
    score: result.score,
    reasons: result.highlights,
  };
}

export function priceFromScore(score: number) {
  const result = calculatePrice(score, [1, 1]);
  return result;
}

export function getScoreDescription(score: number): string {
  if (score < 50) return 'SIM phổ thông';
  if (score <= 65) return 'SIM khá đẹp';
  if (score <= 80) return 'SIM đẹp';
  if (score <= 90) return 'SIM rất đẹp';
  return 'SIM VIP – giá trị cao';
}
