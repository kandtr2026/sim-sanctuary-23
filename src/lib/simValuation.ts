// ==============================
// SIM VALUATION LOGIC
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

interface PatternAnalysis {
  reasons: string[];
  score: number;
}

/**
 * Phân tích các pattern và tính điểm SIM
 */
export function analyzePatterns(phone: string): PatternAnalysis {
  const digits = normalizePhone(phone);
  const reasons: string[] = [];
  let score = 50; // Base score
  
  // === CỘNG ĐIỂM ===
  
  // Đầu số đẹp
  if (digits.startsWith('090') || digits.startsWith('091')) {
    score += 10;
    reasons.push('Đầu số VIP (090/091)');
  } else if (/^(03|07|08|09)/.test(digits)) {
    score += 6;
    reasons.push('Đầu số di động hợp lệ');
  }
  
  // Tứ quý cuối
  const last4 = digits.slice(-4);
  if (/^(\d)\1{3}$/.test(last4)) {
    score += 45;
    reasons.push('Tứ quý cuối (' + last4 + ')');
  }
  
  // Tam hoa cuối
  const last3 = digits.slice(-3);
  if (!/^(\d)\1{3}$/.test(last4) && /^(\d)\1{2}$/.test(last3)) {
    score += 25;
    reasons.push('Tam hoa cuối (' + last3 + ')');
  }
  
  // Sảnh tiến (dãy số liên tiếp tăng/giảm)
  const checkSequence = (str: string, length: number): boolean => {
    for (let i = 0; i <= str.length - length; i++) {
      const sub = str.slice(i, i + length);
      let isAsc = true, isDesc = true;
      for (let j = 0; j < sub.length - 1; j++) {
        if (parseInt(sub[j + 1]) !== parseInt(sub[j]) + 1) isAsc = false;
        if (parseInt(sub[j + 1]) !== parseInt(sub[j]) - 1) isDesc = false;
      }
      if (isAsc || isDesc) return true;
    }
    return false;
  };
  
  if (checkSequence(digits, 5)) {
    score += 40;
    reasons.push('Sảnh tiến 5 số');
  } else if (checkSequence(digits, 4)) {
    score += 25;
    reasons.push('Sảnh tiến 4 số');
  } else if (checkSequence(digits, 3)) {
    score += 15;
    reasons.push('Sảnh tiến 3 số');
  }
  
  // Lặp ABAB cuối
  if (/(\d)(\d)\1\2$/.test(digits)) {
    score += 20;
    reasons.push('Đuôi lặp ABAB');
  }
  
  // Lặp AABB cuối
  if (/(\d)\1(\d)\2$/.test(digits)) {
    score += 15;
    reasons.push('Đuôi lặp AABB');
  }
  
  // Gánh (xyyx)
  const last4Gánh = digits.slice(-4);
  if (last4Gánh.length === 4 && 
      last4Gánh[0] === last4Gánh[3] && 
      last4Gánh[1] === last4Gánh[2] &&
      last4Gánh[0] !== last4Gánh[1]) {
    score += 18;
    reasons.push('Số gánh (' + last4Gánh + ')');
  }
  
  // Đuôi đẹp
  const last2 = digits.slice(-2);
  if (['68', '86'].includes(last2)) {
    score += 15;
    reasons.push('Đuôi lộc phát (68/86)');
  } else if (['39', '79'].includes(last2)) {
    score += 12;
    reasons.push('Đuôi thịnh vượng (39/79)');
  } else if (['88', '99'].includes(last2)) {
    score += 18;
    reasons.push('Đuôi kép đẹp (' + last2 + ')');
  }
  
  // Số dễ nhớ - lặp nhiều
  const digitCounts = digits.split('').reduce((acc, d) => {
    acc[d] = (acc[d] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const maxRepeat = Math.max(...Object.values(digitCounts));
  if (maxRepeat >= 5) {
    score += 10;
    reasons.push('Nhiều số lặp (dễ nhớ)');
  }
  
  // === TRỪ ĐIỂM ===
  
  // Có nhiều số 4 hoặc 7
  const count4 = (digits.match(/4/g) || []).length;
  const count7 = (digits.match(/7/g) || []).length;
  if (count4 + count7 >= 3) {
    score -= 8;
    reasons.push('Có nhiều số 4/7');
  }
  
  // Giới hạn score 0-100
  score = Math.max(0, Math.min(100, score));
  
  // Nếu không có lý do đặc biệt
  if (reasons.length === 0) {
    reasons.push('Số điện thoại thông thường');
  }
  
  return { score, reasons };
}

interface PriceRange {
  min: number;
  max: number;
  mid: number;
}

/**
 * Map điểm sang khoảng giá
 */
export function priceFromScore(score: number): PriceRange {
  let min: number, max: number;
  
  if (score < 45) {
    min = 300000;
    max = 900000;
  } else if (score <= 60) {
    min = 900000;
    max = 2000000;
  } else if (score <= 75) {
    min = 2000000;
    max = 6000000;
  } else if (score <= 88) {
    min = 6000000;
    max = 15000000;
  } else {
    min = 15000000;
    max = 60000000;
  }
  
  // Trung vị làm tròn 10.000
  const mid = Math.round((min + max) / 2 / 10000) * 10000;
  
  return { min, max, mid };
}

/**
 * Format tiền VNĐ
 */
export function formatCurrencyVND(value: number): string {
  return value.toLocaleString('vi-VN');
}

/**
 * Mô tả mức độ đẹp theo điểm
 */
export function getScoreDescription(score: number): string {
  if (score < 50) return 'SIM phổ thông';
  if (score <= 65) return 'SIM khá đẹp';
  if (score <= 80) return 'SIM đẹp';
  return 'SIM rất đẹp – giá trị cao';
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
