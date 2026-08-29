import {
  fetchSheetCsv,
  normalizeHeader,
  padLeadingZero,
  parseCheapPrice as parseSheetPrice,
  parseCSVLine,
  stripQuotes,
} from '@/lib/cheapSimSheet';

/**
 * "ĐƠN HÀNG GẦN ĐÂY" — the homepage social-proof ticker.
 *
 * The main catalogue spreadsheet, i.e. the one `fetch-sim-data` and
 * `sync-sims` read. Not `CHEAP_SHEET_ID`: that is the separate 229.000đ promo
 * warehouse, and the two id spaces never overlap.
 *
 * Two columns of this sheet must never reach a browser, and until this module
 * existed both did: `Sheet1!H` (GIÁ THU VỀ) and `Sheet1!L` (Giá Thu Điều
 * Chỉnh) are what the shop pays, and `SIM_SOLD!C` (GiaThu) is the same figure
 * per sold row. The old ticker fetched both tabs with `select *` and printed
 * `SIM_SOLD!C` as if it were the sale price, so every visitor saw the shop
 * publish its own numbers at 63–75% of the listed price.
 *
 * The price shown here is `Sheet1!D` (GIÁ BÁN) — the same column
 * `serverSimData.ts` and `fetch-sim-by-id` resolve to a listing price, so the
 * ticker and the listing on the same page can no longer disagree.
 */
export const MAIN_SHEET_ID = '1QRO-BroqUQWccWjOkRT7iICdTbQu3Y_NC1NWCeG0M0Y';

const SOLD_TAB = 'SIM_SOLD';
const LISTING_TAB = 'Sheet1';

/** gviz needs `tqx=out:csv`; Google refuses direct browser calls, hence the proxy. */
const gvizCsvUrl = (sheet: string, query: string) =>
  `https://docs.google.com/spreadsheets/d/${MAIN_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${sheet}&tq=${encodeURIComponent(query)}`;

/**
 * Column letters are positional in gviz, so both queries are coupled to the
 * current sheet layout, verified 29/08/2026 with `select *` on each tab:
 *
 *   Sheet1   A SimID · B SỐ THUÊ BAO CHUẨN · C SỐ THUÊ BAO · D GIÁ BÁN ·
 *            E Discount_Type · F Discount_Value · G Final_Price ·
 *            H GIÁ THU VỀ · I TÌNH TRẠNG · J KHO · K TRẠNG THÁI ·
 *            L Giá Thu Điều Chỉnh · M Lo Ori · N Check · O Status_Post
 *   SIM_SOLD A SoldID · B SoThueBao (holds SimID) · C GiaThu · D NgayBan ·
 *            E TrangThai · F Kênh bán · G GhiChu · H Ngày nhập liệu ·
 *            I STB chuan · J Status
 *
 * C rather than B on Sheet1: B is a number column, so Google has already
 * dropped the leading zero by the time we see it.
 *
 * The guards below are the tripwire. If a column is inserted or moved, the
 * header labels stop matching and the ticker renders empty with a console
 * error, instead of quietly printing whatever now sits in that position.
 */
export const SOLD_HEADER_GUARD = ['sothuebao', 'year(ngayban)', 'month(ngayban)', 'day(ngayban)'];
export const LISTING_HEADER_GUARD = ['simid', 'sothuebao', 'giaban'];

/**
 * `NgayBan` is a real date column, so `order by D desc` sorts chronologically
 * and the newest sales arrive first. The date is requested as three integers
 * rather than as `D`: gviz renders a date cell using the *sheet's* display
 * pattern (currently `m/d/yyyy`) and ignores a `format` clause on CSV output,
 * which makes 1/2 versus 2/1 unrecoverable the day someone reformats the
 * column. `month()` is 0-based, like gviz's own `Date(2026,7,28)`.
 */
const soldQuery = (rows: number) =>
  `select B, year(D), month(D), day(D) where B is not null and D is not null order by D desc limit ${rows}`;

/**
 * Every id in `SIM_SOLD!B` is `SIM` + 6 digits (2.272 of 2.274 rows; the other
 * two are a blank and a SoldID pasted into the wrong column). gviz string
 * literals are single-quoted with no reliable escape, so ids are validated
 * instead of escaped — a value that cannot appear in the sheet is simply not
 * looked up.
 */
export const SOLD_SIM_ID_PATTERN = /^SIM[0-9]{4,12}$/;

const listingQuery = (simIds: string[]) =>
  `select A, C, D where ${simIds.map((id) => `A = '${id}'`).join(' or ')}`;

/**
 * Sub-100.000đ is a data-entry accident, not a listing: of 51.639 rows exactly
 * four are below it — three blank and one reading "10" — while 40 rows sit in
 * the 100k–300k band and are genuine. The promo stock priced at 229.000đ lives
 * in the other spreadsheet and never reaches this tab.
 */
export const MIN_LISTED_PRICE = 100_000;

/**
 * Sold rows are oversampled so that dropping the unmatchable ones does not
 * shorten the ticker. All 40 of the most recent resolved on 29/08/2026; the
 * headroom costs ~1,2 KB.
 */
const SOLD_SAMPLE_ROWS = 40;

/** Rows rendered by the sidebar. */
export const TICKER_SIZE = 8;

export interface RecentOrder {
  /** Sheet SimID, e.g. `SIM128041`. Used as the join key and the React key. */
  simId: string;
  /** Always 10 digits, no separators. The caller masks before rendering. */
  digits: string;
  /** GIÁ BÁN, in đồng. Never a cost column. */
  price: number;
  /** Sale date as dd/MM/yyyy. */
  soldLabel: string;
}

interface SoldEntry {
  simId: string;
  soldAt: number;
  soldLabel: string;
}

/**
 * Data rows of a proxied CSV, or null when the header row does not match the
 * guard. Null and empty are deliberately different: null means the sheet
 * changed shape and nothing may be trusted, empty means there is no data.
 */
const parseGuardedCsv = (csv: string, guard: string[], tab: string): string[][] | null => {
  const lines = csv.trim().split('\n').filter((line) => line.trim());
  if (!lines.length) {
    console.error(`[recentOrders] ${tab}: empty response from sheet-proxy`);
    return null;
  }

  const headers = parseCSVLine(lines[0]).map(normalizeHeader);
  if (guard.some((expected, i) => headers[i] !== expected)) {
    console.error(`[recentOrders] ${tab}: columns moved. Expected`, guard, 'got', headers);
    return null;
  }

  return lines.slice(1).map((line) => parseCSVLine(line).map(stripQuotes));
};

/** dd/MM/yyyy plus a sortable timestamp, or null if the three parts are unusable. */
const toSoldEntry = (cells: string[]): SoldEntry | null => {
  const [simId, yearRaw, monthRaw, dayRaw] = cells;
  if (!SOLD_SIM_ID_PATTERN.test(simId ?? '')) return null;

  const year = Number(yearRaw);
  const month0 = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return null;
  if (!Number.isInteger(month0) || month0 < 0 || month0 > 11) return null;
  if (!Number.isInteger(day) || day < 1 || day > 31) return null;

  return {
    simId,
    // UTC only to keep the comparison free of DST; the label carries the date.
    soldAt: Date.UTC(year, month0, day),
    soldLabel: `${String(day).padStart(2, '0')}/${String(month0 + 1).padStart(2, '0')}/${year}`,
  };
};

/**
 * Recent sales with their **list** price, newest first.
 *
 * A sold row with no resolvable GIÁ BÁN is dropped rather than shown with a
 * fallback: one row missing from social proof costs nothing, while a cost price
 * or a "Liên hệ" placed next to a number that is still listed at a higher price
 * hands every visitor an opening bid.
 *
 * The two requests are sequential because the second is a targeted lookup of
 * exactly the ids the first returned. Together they replace the 14,1 MB
 * (13,9 MB Sheet1 + 801 KB SIM_SOLD) that `select *` used to ship to every
 * homepage visitor.
 */
export const fetchRecentOrders = async (
  limit: number = TICKER_SIZE,
  signal?: AbortSignal,
): Promise<RecentOrder[]> => {
  const soldCsv = await fetchSheetCsv(gvizCsvUrl(SOLD_TAB, soldQuery(SOLD_SAMPLE_ROWS)), signal);
  const soldRows = parseGuardedCsv(soldCsv, SOLD_HEADER_GUARD, SOLD_TAB);
  if (!soldRows) return [];

  // 10 of 2.264 ids are recorded twice (resold after a return); keeping the
  // most recent sale keeps the ticker from listing one number twice.
  const seen = new Set<string>();
  const sold: SoldEntry[] = [];
  for (const cells of soldRows) {
    const entry = toSoldEntry(cells);
    if (!entry || seen.has(entry.simId)) continue;
    seen.add(entry.simId);
    sold.push(entry);
  }
  if (!sold.length) return [];

  // gviz already ordered these; re-sorting locally keeps the ticker correct if
  // the sheet's date column ever stops being date-typed.
  sold.sort((a, b) => b.soldAt - a.soldAt);

  const listingCsv = await fetchSheetCsv(
    gvizCsvUrl(LISTING_TAB, listingQuery(sold.map((entry) => entry.simId))),
    signal,
  );
  const listingRows = parseGuardedCsv(listingCsv, LISTING_HEADER_GUARD, LISTING_TAB);
  if (!listingRows) return [];

  const listings = new Map<string, { digits: string; price: number }>();
  for (const [simId, msisdnRaw, priceRaw] of listingRows) {
    if (!simId) continue;

    // Column C is free text: "0903.989.909" and "0708657678" both occur.
    const digits = padLeadingZero(String(msisdnRaw ?? '').replace(/\D/g, ''));
    if (digits.length !== 10) continue;

    // parseSheetPrice rejects anything that is not a plain thousands-separated
    // integer, so "1,5 triệu" or "2.000.000 - LH 09xx" drops the row instead of
    // becoming a fabricated number.
    const price = parseSheetPrice(priceRaw ?? '');
    if (price < MIN_LISTED_PRICE) continue;

    listings.set(simId, { digits, price });
  }

  const orders: RecentOrder[] = [];
  for (const entry of sold) {
    const listing = listings.get(entry.simId);
    if (!listing) continue;
    orders.push({
      simId: entry.simId,
      digits: listing.digits,
      price: listing.price,
      soldLabel: entry.soldLabel,
    });
    if (orders.length >= limit) break;
  }

  return orders;
};
