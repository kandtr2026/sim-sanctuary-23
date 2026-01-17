// Feng Shui SIM helper - only used for /sim-phong-thuy page
// Does NOT affect other pages

export type Menh = 'Kim' | 'Mộc' | 'Thuỷ' | 'Hoả' | 'Thổ';
export type Gender = 'Nam' | 'Nữ';

export interface FengShuiInput {
  year: number;
  gender: Gender;
  menh: Menh;
}

export interface FengShuiSimItem {
  id: string;
  phone: string;          // Display format with dots
  rawDigits: string;      // Raw digits for calculation
  price: number;
  network: string;
  tags: string[];
  url?: string;
  fengShuiScore?: number;
}

// Mapping mệnh to preferred and avoided digits
const MENH_DIGITS: Record<Menh, { preferred: number[]; avoided: number[] }> = {
  'Kim': { preferred: [6, 7], avoided: [9] },
  'Mộc': { preferred: [3, 4], avoided: [6, 7] },
  'Thuỷ': { preferred: [0, 1], avoided: [2, 5, 8] },
  'Hoả': { preferred: [9], avoided: [0, 1] },
  'Thổ': { preferred: [2, 5, 8], avoided: [3, 4] }
};

// Lucky tail patterns
const LUCKY_TAILS = ['68', '86', '39', '79'];

/**
 * Calculate feng shui score for a SIM number
 */
export function calculateFengShuiScore(rawDigits: string, menh: Menh): number {
  const { preferred, avoided } = MENH_DIGITS[menh];
  let score = 0;
  
  // Count preferred digits
  for (const char of rawDigits) {
    const digit = parseInt(char, 10);
    if (preferred.includes(digit)) score += 1;
    if (avoided.includes(digit)) score -= 1;
  }
  
  // Bonus: last 4 digits contain >= 2 preferred digits
  const last4 = rawDigits.slice(-4);
  let preferredInLast4 = 0;
  for (const char of last4) {
    if (preferred.includes(parseInt(char, 10))) preferredInLast4++;
  }
  if (preferredInLast4 >= 2) score += 3;
  
  // Bonus: lucky tail (68/86/39/79)
  const last2 = rawDigits.slice(-2);
  if (LUCKY_TAILS.includes(last2)) score += 2;
  
  return score;
}

/**
 * Detect network from phone number
 */
export function detectNetworkFromPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const prefix3 = digits.slice(0, 3);
  const prefix4 = digits.slice(0, 4);
  
  // Viettel
  const viettel3 = ['096', '097', '098', '086'];
  const viettel4Ranges = ['032', '033', '034', '035', '036', '037', '038', '039'];
  if (viettel3.includes(prefix3) || viettel4Ranges.some(p => prefix4.startsWith(p))) {
    return 'Viettel';
  }
  
  // Vinaphone
  const vina3 = ['091', '094', '088'];
  const vina4Ranges = ['081', '082', '083', '084', '085'];
  if (vina3.includes(prefix3) || vina4Ranges.some(p => prefix4.startsWith(p))) {
    return 'Vinaphone';
  }
  
  // Mobifone
  const mobi3 = ['090', '093', '089'];
  const mobi4Ranges = ['070', '076', '077', '078', '079'];
  if (mobi3.includes(prefix3) || mobi4Ranges.some(p => prefix4.startsWith(p))) {
    return 'Mobifone';
  }
  
  // iTelecom
  if (prefix3 === '087') return 'iTelecom';
  
  // Vietnamobile
  if (prefix3 === '092' || prefix3 === '056' || prefix3 === '058') return 'Vietnamobile';
  
  // Gmobile
  if (prefix3 === '099' || prefix3 === '059') return 'Gmobile';
  
  return 'Mobifone'; // Default
}

/**
 * Parse price string to number
 */
export function parsePriceFromSheet(value: any): number {
  if (typeof value === 'number') return value;
  if (!value) return 0;
  
  const str = String(value).replace(/[,.\s]/g, '');
  return parseInt(str, 10) || 0;
}

/**
 * Extract raw digits from phone display
 */
export function extractRawDigits(phone: string): string {
  return phone.replace(/\D/g, '');
}

/**
 * Format price to VND
 */
export function formatPriceVND(price: number): string {
  if (!price || price <= 0) return '0đ';
  return price.toLocaleString('vi-VN') + 'đ';
}

/**
 * Parse CSV text to rows
 */
export function parseCSV(text: string): Record<string, string>[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  
  // Parse header
  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }
  
  return rows;
}

/**
 * Map sheet row to FengShuiSimItem
 */
export function mapSheetRowToSim(row: Record<string, string>): FengShuiSimItem | null {
  // Try to get phone number
  const phone = row['SỐ THUÊ BAO'] || row['phone'] || row['Phone'] || '';
  if (!phone) return null;
  
  const rawDigits = row['SỐ THUÊ BAO CHUẨN'] || row['rawDigits'] || extractRawDigits(phone);
  
  // Get price
  const priceStr = row['GIÁ BÁN'] || row['Final_Price'] || row['price'] || row['Price'] || '0';
  const price = parsePriceFromSheet(priceStr);
  
  // Get network
  const network = row['network'] || row['Network'] || detectNetworkFromPhone(rawDigits);
  
  // Get tags
  const tagsStr = row['tags'] || row['Tags'] || '';
  const tags = tagsStr ? tagsStr.split(/[,|]/).map(t => t.trim()).filter(Boolean) : [];
  
  // Get ID
  const id = row['SimID'] || row['id'] || rawDigits;
  
  // Get URL if available
  const url = row['url'] || row['URL'] || '';
  
  return {
    id,
    phone,
    rawDigits,
    price,
    network,
    tags,
    url: url || undefined
  };
}

// Web App URL for fetching SIM data
const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycby_3QYkdJSBo43QiJlJ88rSLCsXN7baZtnW5v9VeF3AZJAVzZOjB35bhfFCHZBrVwA/exec';

/**
 * Fetch SIM inventory from Google Sheet web app
 */
export async function fetchFengShuiInventory(): Promise<FengShuiSimItem[]> {
  try {
    const response = await fetch(WEB_APP_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json, text/csv, text/plain'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    
    let items: FengShuiSimItem[] = [];
    
    // Try parsing as JSON first
    if (contentType.includes('application/json') || text.trim().startsWith('[') || text.trim().startsWith('{')) {
      try {
        const json = JSON.parse(text);
        const dataArray = Array.isArray(json) ? json : (json.data || []);
        items = dataArray.map((row: any) => mapSheetRowToSim(row)).filter(Boolean) as FengShuiSimItem[];
      } catch {
        // Try CSV parsing
        const rows = parseCSV(text);
        items = rows.map(row => mapSheetRowToSim(row)).filter(Boolean) as FengShuiSimItem[];
      }
    } else {
      // Parse as CSV
      const rows = parseCSV(text);
      items = rows.map(row => mapSheetRowToSim(row)).filter(Boolean) as FengShuiSimItem[];
    }
    
    if (items.length > 0) {
      return items;
    }
    
    // Fallback to mock data
    return getMockInventory();
  } catch (error) {
    console.error('Failed to fetch feng shui inventory:', error);
    return getMockInventory();
  }
}

/**
 * Get feng shui SIM suggestions based on input
 */
export function getFengShuiSuggestions(
  inventory: FengShuiSimItem[],
  input: FengShuiInput,
  limit: number = 40
): FengShuiSimItem[] {
  // Calculate feng shui score for each SIM
  const scored = inventory.map(sim => ({
    ...sim,
    fengShuiScore: calculateFengShuiScore(sim.rawDigits, input.menh)
  }));
  
  // Sort by score descending
  scored.sort((a, b) => (b.fengShuiScore || 0) - (a.fengShuiScore || 0));
  
  // Return top items
  return scored.slice(0, limit);
}

/**
 * Mock inventory for fallback
 */
function getMockInventory(): FengShuiSimItem[] {
  const mockData = [
    { phone: '0938.868.868', price: 1000000000, network: 'Mobifone' },
    { phone: '0909.686.686', price: 788000000, network: 'Mobifone' },
    { phone: '0901.123.456', price: 639000000, network: 'Mobifone' },
    { phone: '0933.686.666', price: 513000000, network: 'Mobifone' },
    { phone: '0933.116.666', price: 499000000, network: 'Mobifone' },
    { phone: '0901.556.666', price: 399000000, network: 'Mobifone' },
    { phone: '0909.272.727', price: 386000000, network: 'Mobifone' },
    { phone: '0899.898.999', price: 372000000, network: 'Mobifone' },
    { phone: '0933.356.666', price: 368000000, network: 'Mobifone' },
    { phone: '0937.686.666', price: 339000000, network: 'Mobifone' },
    { phone: '0937.796.666', price: 339000000, network: 'Mobifone' },
    { phone: '0933.936.666', price: 319000000, network: 'Mobifone' },
    { phone: '0932.626.666', price: 278000000, network: 'Mobifone' },
    { phone: '0938.856.666', price: 268000000, network: 'Mobifone' },
    { phone: '0903.933.339', price: 249000000, network: 'Mobifone' },
    { phone: '0932.636.666', price: 249000000, network: 'Mobifone' },
    { phone: '0899.888.989', price: 225000000, network: 'Mobifone' },
    { phone: '0934.918.888', price: 219000000, network: 'Mobifone' },
    { phone: '0764.666.888', price: 160000000, network: 'Mobifone' },
    { phone: '0899.899.988', price: 156000000, network: 'Mobifone' },
    { phone: '0902.573.333', price: 150000000, network: 'Mobifone' },
    { phone: '0777.629.999', price: 139000000, network: 'Mobifone' },
    { phone: '0707.779.779', price: 139000000, network: 'Mobifone' },
    { phone: '0773.118.888', price: 120000000, network: 'Mobifone' },
    { phone: '0901.191.111', price: 120000000, network: 'Mobifone' },
    { phone: '0896.888.666', price: 120000000, network: 'Viettel' },
    { phone: '0899.866.886', price: 110000000, network: 'Mobifone' },
    { phone: '0938.999.995', price: 113000000, network: 'Mobifone' },
    { phone: '0903.389.888', price: 99000000, network: 'Mobifone' },
    { phone: '0901.339.779', price: 98000000, network: 'Mobifone' },
    { phone: '0898.868.886', price: 88000000, network: 'Mobifone' },
    { phone: '0909.682.999', price: 79000000, network: 'Mobifone' },
    { phone: '0902.386.999', price: 79000000, network: 'Mobifone' },
    { phone: '0898.868.688', price: 75000000, network: 'Mobifone' },
    { phone: '0815.090.909', price: 69000000, network: 'Vinaphone' },
    { phone: '0899.922.888', price: 68000000, network: 'Mobifone' },
    { phone: '0899.868.666', price: 68000000, network: 'Mobifone' },
    { phone: '0901.322.888', price: 62000000, network: 'Mobifone' },
    { phone: '0898.866.686', price: 62000000, network: 'Mobifone' },
    { phone: '0933.698.698', price: 62000000, network: 'Mobifone' },
    { phone: '0794.181.818', price: 62000000, network: 'Mobifone' },
    { phone: '0931.111.789', price: 59000000, network: 'Mobifone' },
    { phone: '0899.896.999', price: 52000000, network: 'Mobifone' },
    { phone: '0899.897.999', price: 52000000, network: 'Mobifone' },
    { phone: '0899.119.888', price: 52000000, network: 'Mobifone' },
    { phone: '0899.907.999', price: 50000000, network: 'Mobifone' },
    { phone: '0899.906.999', price: 50000000, network: 'Mobifone' },
    { phone: '0899.905.999', price: 50000000, network: 'Mobifone' },
    { phone: '0899.877.888', price: 50000000, network: 'Mobifone' },
    { phone: '0707.070.726', price: 45000000, network: 'Mobifone' },
  ];
  
  return mockData.map(item => ({
    id: item.phone.replace(/\D/g, ''),
    phone: item.phone,
    rawDigits: item.phone.replace(/\D/g, ''),
    price: item.price,
    network: item.network,
    tags: []
  }));
}
