/**
 * Shared inventory helpers for the MCP tools.
 *
 * Import-safe: no env reads, no I/O, and no throwing at module scope.
 * The Supabase URL is read lazily inside `fetchInventory()`.
 */

export interface SimRow {
  id: string;
  digits: string;
  display: string;
  price: number;
  originalPrice: number;
  network: string;
  tags: string[];
}

const NETWORK_PREFIXES: Record<string, string[]> = {
  MobiFone: ['089', '090', '093', '070', '076', '077', '078', '079'],
  Viettel: ['086', '096', '097', '098', '032', '033', '034', '035', '036', '037', '038', '039'],
  Vinaphone: ['088', '091', '094', '081', '082', '083', '084', '085'],
  Vietnamobile: ['092', '056', '058'],
  Gmobile: ['099', '059'],
};

export function detectNetwork(digits: string): string {
  const p = digits.slice(0, 3);
  for (const [name, prefixes] of Object.entries(NETWORK_PREFIXES)) {
    if (prefixes.includes(p)) return name;
  }
  return 'Khác';
}

export function detectTags(digits: string): string[] {
  const tags: string[] = [];
  const last2 = digits.slice(-2);
  const last3 = digits.slice(-3);
  const last4 = digits.slice(-4);
  const last6 = digits.slice(-6);

  if (/(\d)\1{5}$/.test(digits)) tags.push('Lục quý');
  else if (/(\d)\1{4}$/.test(digits)) tags.push('Ngũ quý');
  else if (/(\d)\1{3}$/.test(digits)) tags.push('Tứ quý');
  else if (/(\d)\1{2}$/.test(digits)) tags.push('Tam hoa');

  if (['68', '86'].includes(last2)) tags.push('Lộc phát');
  if (['39', '79', '38', '78'].includes(last2)) tags.push('Thần tài');
  if (last4[0] === last4[2] && last4[1] === last4[3] && last4[0] !== last4[1]) tags.push('Lặp kép');
  if (/^(\d)(\d)\1\2\1\2$/.test(last6)) tags.push('Taxi');
  if (['012', '123', '234', '345', '456', '567', '678', '789'].includes(last3)) tags.push('Tiến');
  if (digits.slice(-5) === [...digits.slice(-5)].reverse().join('')) tags.push('Gánh đảo');

  return tags;
}

export function formatVnd(value: number): string {
  return new Intl.NumberFormat('vi-VN').format(value) + ' đ';
}

/** Minimal RFC4180-ish CSV parser (handles quoted fields and embedded commas). */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
      continue;
    }
    if (c === '"') { inQuotes = true; continue; }
    if (c === ',') { row.push(field); field = ''; continue; }
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    if (c === '\r') continue;
    field += c;
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

function toNumber(value: string): number {
  const cleaned = String(value || '').replace(/[^\d]/g, '');
  return cleaned ? Number(cleaned) : 0;
}

const HIDDEN_STATUSES = ['sold', 'reserved', 'ẩn', 'an'];

let cache: { rows: SimRow[]; at: number } | null = null;
const CACHE_MS = 60_000;

/**
 * Loads the public SIM inventory through the app's existing public
 * `fetch-sim-data` Edge Function (the same source the website itself uses).
 */
export async function fetchInventory(): Promise<SimRow[]> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.rows;

  const baseUrl = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY;
  if (!baseUrl) throw new Error('Inventory source is not configured.');

  const response = await fetch(`${baseUrl}/functions/v1/fetch-sim-data`, {
    method: 'POST',
    headers: anonKey ? { apikey: anonKey, Authorization: `Bearer ${anonKey}` } : {},
  });
  if (!response.ok) throw new Error(`Inventory request failed (HTTP ${response.status})`);

  const csv = await response.text();
  const table = parseCsv(csv);
  if (table.length < 2) return [];

  const header = table[0].map((h) => h.trim().toUpperCase());
  const idx = (...names: string[]) => {
    for (const n of names) {
      const i = header.indexOf(n);
      if (i !== -1) return i;
    }
    return -1;
  };

  const iId = idx('SIMID');
  const iRaw = idx('RAW', 'DISPLAY');
  const iDisplay = idx('DISPLAY', 'RAW');
  const iOriginal = idx('ORIGINAL_PRICE', 'PRICE');
  const iFinal = idx('FINAL_PRICE');
  const iStatus = idx('TRANG_THAI', 'TRẠNG THÁI', 'TRANG THAI');

  const rows: SimRow[] = [];
  for (let r = 1; r < table.length; r++) {
    const cells = table[r];
    if (!cells || cells.length === 0) continue;

    const status = (iStatus >= 0 ? cells[iStatus] ?? '' : '').trim().toLowerCase();
    if (HIDDEN_STATUSES.includes(status)) continue;

    const rawValue = iRaw >= 0 ? cells[iRaw] ?? '' : '';
    let digits = rawValue.replace(/\D/g, '');
    if (digits.length < 9) continue;
    if (digits.length === 9) digits = `0${digits}`;

    const originalPrice = iOriginal >= 0 ? toNumber(cells[iOriginal] ?? '') : 0;
    const finalPrice = iFinal >= 0 ? toNumber(cells[iFinal] ?? '') : 0;
    const price = finalPrice > 0 ? finalPrice : originalPrice;
    if (price <= 0) continue;

    rows.push({
      id: (iId >= 0 ? cells[iId] ?? '' : '').trim() || `sim-${r}`,
      digits,
      display: (iDisplay >= 0 ? cells[iDisplay] ?? '' : '').trim() || digits,
      price,
      originalPrice: originalPrice > 0 ? originalPrice : price,
      network: detectNetwork(digits),
      tags: detectTags(digits),
    });
  }

  cache = { rows, at: Date.now() };
  return rows;
}

/**
 * Pattern matching identical in spirit to the website search:
 * digits and `*` only. A bare digit string matches as a suffix.
 */
export function matchesPattern(digits: string, pattern: string): boolean {
  const clean = pattern.replace(/[^\d*]/g, '');
  if (!clean) return true;
  if (!clean.includes('*')) return digits.endsWith(clean);
  const regex = new RegExp(`^${clean.replace(/\*/g, '\\d*')}$`);
  return regex.test(digits) || regex.test(digits.slice(1));
}
