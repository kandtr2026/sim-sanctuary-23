import { EDGE_FUNCTIONS_URL, SUPABASE_PUBLISHABLE_KEY } from '@/integrations/supabase/config';
import { detectNetwork } from '@/lib/simUtils';
import { formatSimQuyAware } from '@/lib/simDisplay';

/**
 * The 229.000đ promo warehouse.
 *
 * This is a *different spreadsheet* from the one the homepage and the checkout's
 * `fetch-sim-data` function read. Its ids look like `SIMKM0028542`; the main
 * catalogue's look like `SIM128989`, and the two id spaces do not overlap at all
 * (verified: 0 of 49.608 main-catalogue rows contain "SIMKM"). Anything that
 * needs to resolve a promo SIM has to come through here.
 *
 * The `Tongkho` tab mixes two populations that share nothing but a spreadsheet:
 *
 *   Kho = "0đ"    13.075 rows — the 229.000đ promo stock
 *   Kho = "Dự án" 20.786 rows — project SIMs, 1 to 55 million đ
 *
 * They are perfectly separated by that column, with a literal empty gap between
 * them: zero rows priced between 229.001đ and 1.000.000đ.
 */
export const CHEAP_SHEET_ID = '1gwlG7hsd_na7XB3d4maI99nhMVRUEmAlpx9ueYOELL4';

/** The `Kho` value that marks promo stock. */
export const CHEAP_KHO = '0đ';

/** Flat list price of the whole promo warehouse — min = max across all rows. */
export const CHEAP_PRICE = 229_000;

/**
 * Filtering and column projection both run in the gviz query rather than in the
 * browser, which fixes two problems a client-side parse could not:
 *
 *   - payload: 3,6 MB → ~510 KB, because 20.786 rows never leave Google.
 *   - exposure: `select A, C, E` ships SimID, number and list price only. A
 *     `select *` hands every visitor the `Giá Thu` cost column plus Serial,
 *     User, qrText and qrImageFormula. Same for Sim_Sold, where the projection
 *     drops its own `GiaThu`.
 *
 * Column letters are positional in gviz and therefore coupled to the sheet
 * layout. `CHEAP_HEADER_GUARD` fails loudly if the columns are ever reordered,
 * rather than silently parsing the wrong ones.
 */
export const gvizUrl = (sheet: string, query: string) =>
  `https://docs.google.com/spreadsheets/d/${CHEAP_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${sheet}&tq=${encodeURIComponent(query)}`;

/** Expected projected headers of `select A, C, E`, normalised. */
export const CHEAP_HEADER_GUARD = ['simid', 'stb1', 'giaban'];

/** Google blocks direct browser requests to gviz; everything goes via the proxy. */
export const fetchSheetCsv = async (url: string, signal?: AbortSignal): Promise<string> => {
  const response = await fetch(
    `${EDGE_FUNCTIONS_URL}/sheet-proxy?url=${encodeURIComponent(url)}`,
    { headers: { apikey: SUPABASE_PUBLISHABLE_KEY }, signal },
  );
  if (!response.ok) throw new Error(`sheet-proxy HTTP ${response.status}`);
  return response.text();
};

export const parseCSVLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  for (const char of line) {
    if (char === '"') { inQuotes = !inQuotes; }
    else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
    else { current += char; }
  }
  values.push(current.trim());
  return values;
};

export const stripQuotes = (v: string) => v.replace(/^"|"$/g, '').trim();

/** Lowercase, strip diacritics and spaces, map đ→d. "Giá bán" → "giaban". */
export const normalizeHeader = (h: string) =>
  stripQuotes(h)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[\s_]+/g, '');

/**
 * Parse a Vietnamese price cell.
 *
 * A digit-scraping parser turns "1,5 triệu" into 15 and
 * "229.000 - LH 0933356666" into 2.290.000.933.356.666. Here anything that is
 * not a plain thousands-separated integer is rejected outright and the caller
 * drops the row. A dropped row is recoverable (the SIM just doesn't list); a
 * mis-parsed one puts a wrong price in front of a buyer.
 */
export const parseCheapPrice = (raw: string): number => {
  const s = String(raw ?? '').trim();
  if (!s) return 0;
  // 229000 | 229.000 | 229,000 — dot and comma are both thousands separators in
  // the sheet's locale, and both only ever appear in 3-digit groups.
  if (!/^\d{1,3}(?:[.,]\d{3})*$|^\d+$/.test(s)) return 0;
  const n = parseInt(s.replace(/[.,]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
};

/**
 * 11.996 of the 13.075 promo rows (91,7%) arrive 9-digit: the sheet column is
 * formatted as a number, so Google drops the leading zero before we ever see it.
 */
export const padLeadingZero = (digits: string): string =>
  digits.length === 9 ? `0${digits}` : digits;

/** 0901942752 → 0901.942.752. Tứ quý (4 số cuối giống) → 3-3-4: 093.368.6666. */
export const formatCheapNumber = (digits: string): string =>
  formatSimQuyAware(digits);

export interface CheapSim {
  /** Real sheet SimID (SIMKM…), not a row index. Stable across sheet edits. */
  id: string;
  /** Always 10 digits with the leading zero, grouped for display. */
  displayNumber: string;
  /** Always 10 digits, no separators. */
  rawDigits: string;
  price: number;
  network: string;
}

/**
 * Build a `CheapSim` from the three projected cells, or null if the row is not
 * usable. Shared by the list parser and the single-row lookup so a SIM can never
 * pass one path and fail the other.
 */
export const buildCheapSim = (
  simId: string,
  stb1: string,
  priceRaw: string,
  bounds: { min: number; max: number },
): CheapSim | null => {
  if (!simId || !stb1 || !priceRaw) return null;

  const rawDigits = padLeadingZero(stb1.replace(/\D/g, ''));
  if (rawDigits.length !== 10) return null;

  const price = parseCheapPrice(priceRaw);
  if (price < bounds.min || price > bounds.max) return null;

  return {
    id: simId,
    displayNumber: formatCheapNumber(rawDigits),
    rawDigits,
    price,
    network: detectNetwork(rawDigits),
  };
};

/**
 * Every row in the promo warehouse is 229.000đ. The ceiling is a backstop: if
 * someone relabels a project SIM as "0đ" in the sheet, it gets dropped instead
 * of appearing on a page that promises a flat price. Any value in the empty
 * 229.001–1M gap behaves identically.
 */
export const CHEAP_MAX_PRICE = 500_000;
/** Below this a price is a typo or a unit-scaling accident, not a real listing. */
export const CHEAP_MIN_PRICE = 10_000;

export const CHEAP_PRICE_BOUNDS = { min: CHEAP_MIN_PRICE, max: CHEAP_MAX_PRICE };

/**
 * gviz string literals are single-quoted and the query language has no reliable
 * escape, so ids are validated rather than escaped. Every real id in the sheet
 * is `SIMKM` + digits; anything else is either a typo in the URL bar or an
 * injection attempt, and both should simply not resolve.
 */
export const CHEAP_SIM_ID_PATTERN = /^SIMKM[0-9]{1,16}$/i;

export const isCheapSimId = (id: string): boolean => CHEAP_SIM_ID_PATTERN.test(id.trim());

/**
 * Resolve one promo SIM by id, for the checkout page.
 *
 * Two targeted queries instead of a full download: the row itself, and a
 * one-row probe of the sold list. Together they cost a few hundred bytes,
 * against the 5,5 MB the main catalogue's `fetch-sim-data` transfers.
 *
 * Returns null when the id is unknown, is not promo stock, or is already sold —
 * the checkout page renders the same "không tìm thấy" state for all three,
 * which is correct: none of them can be ordered.
 */
export const fetchCheapSimById = async (
  rawId: string,
  signal?: AbortSignal,
): Promise<CheapSim | null> => {
  const simId = rawId.trim();
  if (!isCheapSimId(simId)) return null;

  const [rowCsv, soldCsv] = await Promise.all([
    fetchSheetCsv(gvizUrl('Tongkho', `select A, C, E where A = '${simId}' and G = '${CHEAP_KHO}'`), signal),
    fetchSheetCsv(gvizUrl('Sim_Sold', `select B where B = '${simId}'`), signal),
  ]);

  // Header row only ⇒ not sold. Any data row ⇒ gone.
  const soldLines = soldCsv.trim().split('\n').filter(l => l.trim());
  if (soldLines.length > 1) return null;

  const lines = rowCsv.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return null;

  const headers = parseCSVLine(lines[0]).map(normalizeHeader);
  if (CHEAP_HEADER_GUARD.some((expected, i) => headers[i] !== expected)) return null;

  const [id, stb1, priceRaw] = parseCSVLine(lines[1]).map(stripQuotes);
  return buildCheapSim(id, stb1, priceRaw, CHEAP_PRICE_BOUNDS);
};
