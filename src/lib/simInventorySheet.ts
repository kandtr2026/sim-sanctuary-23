// ==============================
// SIM INVENTORY FROM GOOGLE SHEET
// Chỉ dùng cho trang /dinh-gia-sim
// ==============================

import { detectCarrier, normalizePhone, type Carrier } from './simValuation';

const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1QRO-BroqUQWccWjOkRT7iICdTbQu3Y_NC1NWCeG0M0Y/export?format=csv&gid=139400129';

export interface SimItem {
  phone: string;
  price: number;
  carrier: Carrier;
  tags: string[];
  url?: string;
}

/**
 * Parse price từ nhiều định dạng khác nhau
 */
export function parsePriceToNumber(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  const str = String(value).trim();
  // Loại bỏ tất cả dấu chấm/phẩy ngăn cách hàng nghìn, giữ lại số
  const cleaned = str.replace(/[.,\s]/g, '');
  const num = parseInt(cleaned, 10);
  
  return isNaN(num) ? 0 : num;
}

/**
 * Parse tags từ chuỗi (phân tách bằng , hoặc |)
 */
export function parseTags(value: string): string[] {
  if (!value || typeof value !== 'string') return [];
  return value
    .split(/[,|]/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);
}

/**
 * Trích xuất tags từ số điện thoại (fallback khi sheet không có)
 */
export function extractTagsFromPhone(phone: string): string[] {
  const digits = normalizePhone(phone);
  const tags: string[] = [];
  
  const last6 = digits.slice(-6);
  const last5 = digits.slice(-5);
  const last4 = digits.slice(-4);
  const last3 = digits.slice(-3);
  
  // Lục quý
  if (/^(\d)\1{5}$/.test(last6)) {
    tags.push('Lục quý');
  }
  // Ngũ quý
  else if (/^(\d)\1{4}$/.test(last5)) {
    tags.push('Ngũ quý');
  }
  // Tứ quý
  else if (/^(\d)\1{3}$/.test(last4)) {
    tags.push('Tứ quý');
  }
  // Tam hoa kép
  else if (/^(\d)\1{2}(\d)\2{2}$/.test(last6) && last6[0] !== last6[3]) {
    tags.push('Tam hoa kép');
  }
  // Tam hoa
  else if (/^(\d)\1{2}$/.test(last3)) {
    tags.push('Tam hoa');
  }
  
  // Sảnh tiến
  const checkSequence = (str: string, len: number): boolean => {
    for (let i = 0; i <= str.length - len; i++) {
      const sub = str.slice(i, i + len);
      let isAsc = true, isDesc = true;
      for (let j = 0; j < sub.length - 1; j++) {
        if (parseInt(sub[j + 1]) !== parseInt(sub[j]) + 1) isAsc = false;
        if (parseInt(sub[j + 1]) !== parseInt(sub[j]) - 1) isDesc = false;
      }
      if (isAsc || isDesc) return true;
    }
    return false;
  };
  
  if (checkSequence(digits, 6)) tags.push('Sảnh 6');
  else if (checkSequence(digits, 5)) tags.push('Sảnh 5');
  else if (checkSequence(digits, 4)) tags.push('Sảnh 4');
  
  // ABAB
  if (/^(\d)(\d)\1\2$/.test(last4) && last4[0] !== last4[1]) {
    tags.push('ABAB');
  }
  
  // Gánh ABBA
  if (last4[0] === last4[3] && last4[1] === last4[2] && last4[0] !== last4[1]) {
    tags.push('Gánh');
  }
  
  // AABB
  if (/^(\d)\1(\d)\2$/.test(last4) && last4[0] !== last4[2]) {
    tags.push('AABB');
  }
  
  // Taxi ABCABC
  if (last6.length === 6 && last6.slice(0, 3) === last6.slice(3, 6)) {
    tags.push('Taxi');
  }
  
  // Cụm tài lộc
  if (last4.includes('68') || last4.includes('86')) tags.push('Lộc phát');
  if (last4.includes('39') || last4.includes('79')) tags.push('Thần tài');
  
  return tags;
}

/**
 * Parse CSV thành array
 */
function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];
  
  // Header row
  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/["']/g, ''));
  
  const result: Record<string, string>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Simple CSV parse (không xử lý quoted fields phức tạp)
    const values = line.split(',').map((v) => v.trim().replace(/["']/g, ''));
    
    const row: Record<string, string> = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });
    
    result.push(row);
  }
  
  return result;
}

/**
 * Mock inventory fallback (40 dòng mẫu)
 */
function getMockInventory(): SimItem[] {
  return [
    { phone: '0901234567', price: 2500000, carrier: 'Mobi', tags: ['Sảnh 4'], url: '' },
    { phone: '0912345678', price: 3500000, carrier: 'Vina', tags: ['Sảnh 5'], url: '' },
    { phone: '0978888888', price: 150000000, carrier: 'Viettel', tags: ['Lục quý'], url: '' },
    { phone: '0909999999', price: 120000000, carrier: 'Mobi', tags: ['Lục quý'], url: '' },
    { phone: '0988886868', price: 35000000, carrier: 'Viettel', tags: ['Lộc phát', 'ABAB'], url: '' },
    { phone: '0907891189', price: 8500000, carrier: 'Mobi', tags: ['Gánh'], url: '' },
    { phone: '0912222222', price: 85000000, carrier: 'Vina', tags: ['Lục quý'], url: '' },
    { phone: '0968686868', price: 45000000, carrier: 'Viettel', tags: ['ABAB', 'Lộc phát'], url: '' },
    { phone: '0909393939', price: 28000000, carrier: 'Mobi', tags: ['ABAB', 'Thần tài'], url: '' },
    { phone: '0978787878', price: 22000000, carrier: 'Viettel', tags: ['ABAB'], url: '' },
    { phone: '0909111222', price: 15000000, carrier: 'Mobi', tags: ['Tam hoa kép'], url: '' },
    { phone: '0912333444', price: 12000000, carrier: 'Vina', tags: ['Tam hoa kép'], url: '' },
    { phone: '0967777777', price: 95000000, carrier: 'Viettel', tags: ['Lục quý'], url: '' },
    { phone: '0986543210', price: 18000000, carrier: 'Viettel', tags: ['Sảnh 6'], url: '' },
    { phone: '0909012345', price: 12000000, carrier: 'Mobi', tags: ['Sảnh 5'], url: '' },
    { phone: '0912388888', price: 45000000, carrier: 'Vina', tags: ['Ngũ quý'], url: '' },
    { phone: '0988899999', price: 52000000, carrier: 'Viettel', tags: ['Ngũ quý'], url: '' },
    { phone: '0909666666', price: 78000000, carrier: 'Mobi', tags: ['Lục quý'], url: '' },
    { phone: '0978123456', price: 8500000, carrier: 'Viettel', tags: ['Sảnh 6'], url: '' },
    { phone: '0912686868', price: 25000000, carrier: 'Vina', tags: ['ABAB', 'Lộc phát'], url: '' },
    { phone: '0909797979', price: 18000000, carrier: 'Mobi', tags: ['ABAB'], url: '' },
    { phone: '0968881234', price: 6500000, carrier: 'Viettel', tags: ['Tam hoa'], url: '' },
    { phone: '0912999888', price: 9500000, carrier: 'Vina', tags: ['Tam hoa'], url: '' },
    { phone: '0909555555', price: 65000000, carrier: 'Mobi', tags: ['Lục quý'], url: '' },
    { phone: '0978686886', price: 12000000, carrier: 'Viettel', tags: ['Gánh', 'Lộc phát'], url: '' },
    { phone: '0909393979', price: 8500000, carrier: 'Mobi', tags: ['Thần tài'], url: '' },
    { phone: '0912558899', price: 4500000, carrier: 'Vina', tags: ['AABB'], url: '' },
    { phone: '0968112233', price: 3800000, carrier: 'Viettel', tags: ['AABB'], url: '' },
    { phone: '0909778899', price: 4200000, carrier: 'Mobi', tags: ['AABB'], url: '' },
    { phone: '0912345345', price: 5500000, carrier: 'Vina', tags: ['Taxi'], url: '' },
    { phone: '0968123123', price: 6800000, carrier: 'Viettel', tags: ['Taxi'], url: '' },
    { phone: '0909456456', price: 5200000, carrier: 'Mobi', tags: ['Taxi'], url: '' },
    { phone: '0912389389', price: 7500000, carrier: 'Vina', tags: ['Taxi', 'Thần tài'], url: '' },
    { phone: '0978911119', price: 8200000, carrier: 'Viettel', tags: ['Tứ quý'], url: '' },
    { phone: '0909022220', price: 9500000, carrier: 'Mobi', tags: ['Tứ quý'], url: '' },
    { phone: '0912233330', price: 8800000, carrier: 'Vina', tags: ['Tứ quý'], url: '' },
    { phone: '0968044440', price: 7200000, carrier: 'Viettel', tags: ['Tứ quý'], url: '' },
    { phone: '0909855558', price: 11000000, carrier: 'Mobi', tags: ['Tứ quý'], url: '' },
    { phone: '0912366663', price: 10500000, carrier: 'Vina', tags: ['Tứ quý'], url: '' },
    { phone: '0968077770', price: 9800000, carrier: 'Viettel', tags: ['Tứ quý'], url: '' },
  ];
}

let cachedInventory: SimItem[] | null = null;
let cacheTimestamp = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

/**
 * Load inventory từ Google Sheet
 */
export async function loadSimInventory(): Promise<SimItem[]> {
  // Check cache
  if (cachedInventory && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedInventory;
  }
  
  try {
    const response = await fetch(SHEET_CSV_URL, {
      method: 'GET',
      headers: {
        'Accept': 'text/csv',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    const csvText = await response.text();
    const rows = parseCSV(csvText);
    
    if (rows.length === 0) {
      console.warn('Empty CSV, using mock inventory');
      return getMockInventory();
    }
    
    const inventory: SimItem[] = [];
    
    for (const row of rows) {
      // Tìm cột phone (có thể là phone, Phone, so, số, sim...)
      const phoneKey = Object.keys(row).find((k) => 
        ['phone', 'số', 'so', 'sim', 'sodienthoai', 'số điện thoại'].includes(k.toLowerCase())
      );
      const priceKey = Object.keys(row).find((k) =>
        ['price', 'giá', 'gia', 'giaban', 'giá bán'].includes(k.toLowerCase())
      );
      const carrierKey = Object.keys(row).find((k) =>
        ['carrier', 'nhà mạng', 'nha mang', 'mang', 'mạng'].includes(k.toLowerCase())
      );
      const tagsKey = Object.keys(row).find((k) =>
        ['tags', 'tag', 'nhãn', 'loại', 'loai', 'dạng số'].includes(k.toLowerCase())
      );
      const urlKey = Object.keys(row).find((k) =>
        ['url', 'link', 'đường dẫn'].includes(k.toLowerCase())
      );
      
      const phoneRaw = phoneKey ? row[phoneKey] : '';
      const priceRaw = priceKey ? row[priceKey] : '';
      
      if (!phoneRaw || !priceRaw) continue;
      
      const phone = normalizePhone(phoneRaw);
      const price = parsePriceToNumber(priceRaw);
      
      if (phone.length < 10 || price <= 0) continue;
      
      // Carrier
      let carrier: Carrier = 'Unknown';
      if (carrierKey && row[carrierKey]) {
        const carrierStr = row[carrierKey].toLowerCase();
        if (carrierStr.includes('viettel')) carrier = 'Viettel';
        else if (carrierStr.includes('vina') || carrierStr.includes('vinaphone')) carrier = 'Vina';
        else if (carrierStr.includes('mobi') || carrierStr.includes('mobifone')) carrier = 'Mobi';
        else if (carrierStr.includes('vietnamobile')) carrier = 'Vietnamobile';
        else if (carrierStr.includes('itel')) carrier = 'iTel';
        else if (carrierStr.includes('gmobile')) carrier = 'Gmobile';
        else carrier = detectCarrier(phone);
      } else {
        carrier = detectCarrier(phone);
      }
      
      // Tags
      let tags: string[] = [];
      if (tagsKey && row[tagsKey]) {
        tags = parseTags(row[tagsKey]);
      }
      if (tags.length === 0) {
        tags = extractTagsFromPhone(phone);
      }
      
      // URL
      const url = urlKey ? row[urlKey] : undefined;
      
      inventory.push({ phone, price, carrier, tags, url });
    }
    
    if (inventory.length === 0) {
      console.warn('No valid items parsed, using mock inventory');
      return getMockInventory();
    }
    
    cachedInventory = inventory;
    cacheTimestamp = Date.now();
    
    return inventory;
  } catch (error) {
    console.error('Failed to load inventory from sheet:', error);
    return getMockInventory();
  }
}

/**
 * Tìm SIM tương tự từ inventory
 */
export interface SimilarSimsParams {
  phone: string;
  carrier: Carrier;
  tags: string[];
  range: [number, number];
}

export async function getSimilarSims(params: SimilarSimsParams): Promise<SimItem[]> {
  const inventory = await loadSimInventory();
  
  const { phone, carrier, tags, range } = params;
  const [rangeMin, rangeMax] = range;
  
  // Loại SIM trùng số
  const candidates = inventory.filter((item) => item.phone !== normalizePhone(phone));
  
  // Filter giá trong khoảng [rangeMin*0.7, rangeMax*1.3]
  const priceMin = rangeMin * 0.7;
  const priceMax = rangeMax * 1.3;
  
  const inRange = candidates.filter((item) => item.price >= priceMin && item.price <= priceMax);
  
  // Nếu quá ít, nới lỏng filter
  let pool = inRange;
  if (pool.length < 5) {
    pool = candidates.filter((item) => item.price >= rangeMin * 0.5 && item.price <= rangeMax * 2);
  }
  if (pool.length < 5) {
    pool = candidates;
  }
  
  // Chấm điểm
  const mainTag = tags[0] || '';
  const secondaryTags = tags.slice(1);
  
  const scored = pool.map((item) => {
    let score = 0;
    
    // +4 trùng tag chính
    if (mainTag && item.tags.includes(mainTag)) {
      score += 4;
    }
    
    // +2 trùng tag phụ
    for (const t of secondaryTags) {
      if (item.tags.includes(t)) {
        score += 2;
        break;
      }
    }
    
    // +2 cùng carrier
    if (item.carrier === carrier) {
      score += 2;
    }
    
    // +2 giá trong range gốc
    if (item.price >= rangeMin && item.price <= rangeMax) {
      score += 2;
    }
    
    // +1 cùng cụm tài lộc
    const luckTags = ['Lộc phát', 'Thần tài', 'Ông địa', 'Song phát'];
    const hasLuck = luckTags.some((lt) => tags.includes(lt) && item.tags.includes(lt));
    if (hasLuck) {
      score += 1;
    }
    
    return { item, score };
  });
  
  // Sort giảm dần, lấy top 8-12
  scored.sort((a, b) => b.score - a.score);
  
  return scored.slice(0, 12).map((s) => s.item);
}

/**
 * Lấy inventory để calibrate giá
 */
export async function getCalibrationData(tags: string[], carrier: Carrier): Promise<{
  samples: SimItem[];
  median: number | null;
  p25: number | null;
  p75: number | null;
}> {
  const inventory = await loadSimInventory();
  
  const mainTag = tags[0] || '';
  
  // Lọc mẫu tham chiếu
  let samples = inventory.filter((item) => {
    // Ưu tiên trùng tag chính
    if (mainTag && item.tags.includes(mainTag)) return true;
    return false;
  });
  
  // Ưu tiên cùng carrier nếu có đủ
  const sameCarrier = samples.filter((item) => item.carrier === carrier);
  if (sameCarrier.length >= 5) {
    samples = sameCarrier;
  }
  
  if (samples.length < 8) {
    return { samples, median: null, p25: null, p75: null };
  }
  
  // Tính median, p25, p75
  const prices = samples.map((s) => s.price).sort((a, b) => a - b);
  
  const getPercentile = (arr: number[], p: number): number => {
    const idx = (p / 100) * (arr.length - 1);
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    if (lower === upper) return arr[lower];
    return arr[lower] * (upper - idx) + arr[upper] * (idx - lower);
  };
  
  return {
    samples,
    median: getPercentile(prices, 50),
    p25: getPercentile(prices, 25),
    p75: getPercentile(prices, 75),
  };
}
