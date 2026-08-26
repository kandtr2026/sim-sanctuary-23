/**
 * Server-only SIM data fetcher for build-time snapshot (C6).
 *
 * Fetches the live CSV from the Supabase edge function, parses it, normalises
 * SIMs, and caches at the module level so multiple category pages within the
 * same build worker share a single fetch. If the fetch fails (no network, CORS,
 * timeout) the snapshot degrades gracefully to an empty list → the page renders
 * without the featured section, and the client island still works.
 *
 * The CSV parsing logic mirrors useSimData.ts (header normalisation, row
 * parsing, sold/available filtering, safeParseVnd, price estimation fallback),
 * but is self-contained here so importing it in a server component never pulls
 * in client-side deps (react-query, sonner, localStorage).
 */

import { normalizeSIM, estimatePriceByTags, formatSIMNumber, detectSimTags, detectNetwork } from "@/lib/simUtils";
import type { NormalizedSIM } from "@/lib/simUtils";
import {
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  EDGE_FUNCTIONS_URL,
} from "@/integrations/supabase/config";

// ── Module-level cache ──────────────────────────────────────────────────────
// Across page renders within the same build worker, the same workers share the
// same module instance, so this cache avoids redundant fetches.
let cachedPromise: Promise<NormalizedSIM[]> | null = null;
let cachedResult: NormalizedSIM[] | null = null;

// ── CSV header normalisation (mirrors useSimData.ts) ────────────────────────
const normalizeHeader = (header: string): string => {
  const cleaned = header.trim().toUpperCase().replace(/\s+/g, " ").trim();
  const underscored = header.trim().toUpperCase().replace(/\s+/g, "_").trim();

  if (["SIMID", "SIM ID", "SIM_ID"].includes(cleaned)) return "SIMID";
  if (
    [
      "THUÊ BAO CHUẨN", "THUE BAO CHUAN", "THUÊBAOCHUẨN", "THUEBAOCHUAN",
      "SỐ THUÊ BAO CHUẨN", "SO THUE BAO CHUAN",
    ].includes(cleaned)
  )
    return "RAW";
  if (
    [
      "SỐ THUÊ BAO", "SO THUE BAO", "SỐTHUÊBAO", "SOTHUEBAO",
      "SỐ ĐIỆN THOẠI", "SO DIEN THOAI",
    ].includes(cleaned)
  )
    return "DISPLAY";
  if (
    [
      "GIÁ BÁN", "GIA BAN", "GIÁBAN", "GIABAN", "GIÁ", "GIA",
      "PRICE", "ORIGINAL PRICE", "ORIGINAL_PRICE",
    ].includes(cleaned) ||
    underscored === "ORIGINAL_PRICE"
  )
    return "ORIGINAL_PRICE";
  if (
    [
      "FINAL PRICE", "FINALPRICE", "FINAL_PRICE", "GIÁ CUỐI", "GIA CUOI",
      "GIÁ KHUYẾN MÃI", "GIA KHUYEN MAI",
    ].includes(cleaned) ||
    underscored === "FINAL_PRICE"
  )
    return "FINAL_PRICE";

  if (
    ["TRẠNG THÁI", "TRANG_THAI", "TRANG THAI", "STATUS"].includes(cleaned) ||
    underscored === "TRANG_THAI"
  )
    return "TRANG_THAI";

  return cleaned;
};

// ── CSV parser (mirrors useSimData.ts) ──────────────────────────────────────
const parseCSV = (csvText: string): Record<string, string>[] => {
  const lines = csvText.split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headerLine = lines[0].replace(/^\uFEFF/, "");
  const rawHeaders = headerLine
    .split(",")
    .map((h) => h.trim().replace(/^"|"$/g, "").trim());
  const headers = rawHeaders.map(normalizeHeader);

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (const char of lines[i]) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    if (values.length >= 2) {
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = values[idx] || "";
      });
      rows.push(row);
    }
  }
  return rows;
};

// ── Safe VND parser ─────────────────────────────────────────────────────────
const safeParseVnd = (v: unknown): number => {
  const n = Number(String(v ?? "").replace(/[^\d]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

// ── Fetch + parse + normalise ───────────────────────────────────────────────
// IMPORTANT (Next 16): do NOT pass an AbortController/AbortSignal to this fetch.
// Per node_modules/next/dist/docs/01-app/03-api-reference/04-functions/fetch.md
// ("## Memoization"), a `signal` opts the request OUT of Next's fetch
// memoization/cache. Combined with the (previous) lack of a `cache`/`revalidate`
// option, that made every category route render dynamically (ƒ / SSR) on each
// request and burn crawl budget. We now cache the CSV with `next.revalidate`
// (see caching-without-cache-components.md → "Time-based revalidation") so the
// route can be statically prerendered + ISR, and enforce the fail-fast timeout
// with Promise.race — which never touches the fetch, keeping it cacheable.
const FETCH_TIMEOUT_MS = 15_000;

const fetchCsv = async (): Promise<string> => {
  const url = `${EDGE_FUNCTIONS_URL}/fetch-sim-data`;

  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`fetch-sim-data: timeout after ${FETCH_TIMEOUT_MS}ms`)),
      FETCH_TIMEOUT_MS,
    );
  });

  try {
    const res = await Promise.race([
      fetch(url, {
        method: "GET",
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
        },
        // Cache the CSV for 300s (matches /api/sims `revalidate = 300`) → the
        // consuming routes become statically prerendered + ISR instead of SSR.
        next: { revalidate: 300 },
      }),
      timeout,
    ]);
    if (!res.ok) throw new Error(`fetch-sim-data: HTTP ${res.status}`);
    return await res.text();
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const parseAndNormalize = (csvText: string): NormalizedSIM[] => {
  const rows = parseCSV(csvText);
  const sims: NormalizedSIM[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Filter sold / reserved / hidden
    const trangThai = (
      row["TRANG_THAI"] || ""
    ).trim().toLowerCase();
    if (
      trangThai === "sold" ||
      trangThai === "reserved" ||
      trangThai === "ẩn"
    )
      continue;

    const sheetSimId = row["SIMID"] || "";
    const rawNumber = row["RAW"] || row["DISPLAY"] || "";
    const displayNumber = row["DISPLAY"] || row["RAW"] || rawNumber;
    const originalPriceStr = row["ORIGINAL_PRICE"] || "0";
    const finalPriceStr = row["FINAL_PRICE"] || "";

    const rawDigits = rawNumber.replace(/\D/g, "");
    if (rawDigits.length < 9) continue;

    let originalPrice = safeParseVnd(originalPriceStr);
    const finalPriceRaw = safeParseVnd(finalPriceStr);
    const finalPrice = finalPriceRaw > 0 ? finalPriceRaw : undefined;

    if (!originalPrice || originalPrice <= 0) {
      const tempSim = normalizeSIM(rawNumber, displayNumber, 0, `temp-${i}`);
      originalPrice = estimatePriceByTags(tempSim.tags);
    }

    const effectivePrice = finalPrice ?? originalPrice;
    const simId = sheetSimId.trim() || `sim-${i}`;
    sims.push(normalizeSIM(rawNumber, displayNumber, effectivePrice, simId));
  }

  return sims;
};

// ── Public API ──────────────────────────────────────────────────────────────

// ── Supabase source: đọc kho SIM từ bảng `sims` (đồng bộ bởi sync-sims) ──────
// Ưu tiên hơn CSV: không tải 5.5MB mỗi lần build/request. Chỉ đọc status khác
// 'sold'/'reserved'/'ẩn' (đã lọc sẵn ở sync). Cần 1 + N request phân trang.
const SUPABASE_REST = `${SUPABASE_URL}/rest/v1`;
const SUPABASE_SIMS_PAGE = 2000;

interface SimsDbRow {
  id: string;
  raw_digits: string;
  display_number: string;
  original_price: number;
  final_price: number | null;
  effective_price: number;
  network: string | null;
  tags: string[];
  beauty_score: number;
  is_vip: boolean;
}

const simsDbRowToNormalized = (r: SimsDbRow): NormalizedSIM => {
  const rawDigits = r.raw_digits;
  const tags = r.tags ?? detectSimTags(rawDigits);
  const price = r.effective_price || r.final_price || r.original_price || 0;
  return {
    id: r.id,
    rawDigits,
    displayNumber: r.display_number || rawDigits,
    formattedNumber: formatSIMNumber(rawDigits),
    price,
    prefix3: rawDigits.slice(0, 3),
    prefix4: rawDigits.slice(0, 4),
    last2: rawDigits.slice(-2),
    last3: rawDigits.slice(-3),
    last4: rawDigits.slice(-4),
    last5: rawDigits.slice(-5),
    last6: rawDigits.slice(-6),
    digitCounts: rawDigits.split('').map(Number).reduce((acc, d) => { acc[d]++; return acc; }, [0,0,0,0,0,0,0,0,0,0]),
    sumDigits: rawDigits.split('').reduce((s, d) => s + Number(d), 0),
    tags,
    isVIP: r.is_vip,
    network: (r.network || detectNetwork(rawDigits)) as NormalizedSIM['network'],
    beautyScore: r.beauty_score,
  };
};

const fetchSimsFromDb = async (): Promise<NormalizedSIM[] | null> => {
  try {
    const authHeaders = {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    };
    // Lấy toàn bộ id hợp lệ (status != sold) theo trang. PostgREST giới hạn
    // 1000 rows mặc định → dùng header Range để lấy tối đa mỗi lần.
    const ids: string[] = [];
    for (let offset = 0; ; offset += SUPABASE_SIMS_PAGE) {
      const res = await fetch(
        `${SUPABASE_REST}/sims?select=id&status=neq.sold&offset=${offset}`,
        { headers: { ...authHeaders, Range: `${offset}-${offset + SUPABASE_SIMS_PAGE - 1}` } },
      );
      if (!res.ok) return null;
      const page = (await res.json()) as { id: string }[];
      ids.push(...page.map((x) => x.id));
      if (page.length < SUPABASE_SIMS_PAGE) break;
    }
    if (ids.length === 0) return null;

    const sims: NormalizedSIM[] = [];
    for (let i = 0; i < ids.length; i += SUPABASE_SIMS_PAGE) {
      const chunk = ids.slice(i, i + SUPABASE_SIMS_PAGE);
      const res = await fetch(
        `${SUPABASE_REST}/sims?select=id,raw_digits,display_number,original_price,final_price,effective_price,network,tags,beauty_score,is_vip&id=in.(${chunk.join(',')})`,
        { headers: { ...authHeaders, Range: `0-${chunk.length - 1}` } },
      );
      if (!res.ok) return null;
      const rows = (await res.json()) as SimsDbRow[];
      for (const r of rows) sims.push(simsDbRowToNormalized(r));
    }
    return sims;
  } catch (e) {
    console.warn('[serverSimData] Supabase read failed, falling back to CSV:', e);
    return null;
  }
};

/**
 * Fetch the full SIM catalogue on the server (build or request time).
 * Cached at the module level so multiple pages within the same build worker
 * share one fetch. Returns [] on failure (never throws).
 *
 * Ưu tiên đọc từ Supabase (bảng `sims` — đồng bộ hàng ngày bởi sync-sims, không
 * tải 5.5MB CSV). Nếu Supabase chưa có dữ liệu/lỗi → fallback về CSV như cũ.
 */
export const getServerSims = async (): Promise<NormalizedSIM[]> => {
  if (cachedResult) return cachedResult;
  if (cachedPromise) return cachedPromise;

  cachedPromise = (async () => {
    // 1) Thử Supabase trước — nhẹ, nhanh, luôn tươi theo sync
    const fromDb = await fetchSimsFromDb();
    if (fromDb && fromDb.length > 0) {
      cachedResult = fromDb;
      console.log(`[serverSimData] loaded ${fromDb.length} SIMs from Supabase`);
      return fromDb;
    }
    // 2) Fallback: CSV qua edge function
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const csv = await fetchCsv();
        const sims = parseAndNormalize(csv);
        cachedResult = sims;
        return sims;
      } catch (e) {
        console.warn(`[serverSimData] fetch failed (attempt ${attempt + 1}):`, e);
      }
    }
    return [];
  })();

  const result = await cachedPromise;
  cachedPromise = null;
  return result;
};

/**
 * Filter criteria for a category snapshot. Every field is optional — an empty
 * object returns all SIMs (for general featured sections).
 */
export interface SnapshotFilter {
  suffixes?: string[];
  tags?: string[];
  prefixes?: string[];
  lastDigits?: string[];
  /** rawDigits' LAST 6 digits contain this 4-digit year (sim năm sinh). */
  birthYear?: string;
}

const getDigits = (s: NormalizedSIM): string =>
  s.rawDigits || s.displayNumber.replace(/\D/g, "") || "";

// Sim "năm sinh" match rule (single source of truth — snapshot, count,
// generateStaticParams, sitemap để không bao giờ lệch nhau). Một SIM khớp năm
// YYYY khi 4 số của năm xuất hiện TRONG 6 SỐ CUỐI — bao phủ cả sim đuôi năm
// (…1999) lẫn sim mã hoá ngày sinh DDMMYY (…091299). Trang dùng câu chữ "có số
// {year}" cho khớp luật này; `getCategorySnapshot` xếp sim ĐUÔI đúng năm lên đầu
// để kết quả mạnh nhất hiện trước.
const simMatchesBirthYear = (s: NormalizedSIM, year: string): boolean =>
  getDigits(s).slice(-6).includes(year);

/**
 * Rank a SIM by how well it matches a customer's birth date (YYYY + DD + MM).
 * Higher priority first. Returns -1 when the SIM doesn't match at all.
 *
 * ZONE 1 (rank 0) — đầy đủ ngày-tháng-năm, theo thứ tự d-m-y. Ngày 1 số chỉ
 *   được khi tháng cũng 1 số (bỏ tổ hợp d1+m2 — 40793/4071993 không chấp nhận):
 *     dmyy   (…040793, …04793, …4793)
 *     dmyyyy (…04071993, …0471993, …471993)
 *
 * ZONE 2 (rank 1) — chỉ tháng-năm, KHÔNG nhận năm riêng (yyyy) vì quá rộng
 *     (mọi sim đuôi 1993 đều trúng, không đặc trưng tháng sinh):
 *     mmyyyy (…081987, …81987)
 *
 * KHÔNG nhận các thứ tự khác (mdyy, ymd, ydm) hay "năm lẫn trong 6 số cuối".
 */
const rankBirthDateMatch = (
  s: NormalizedSIM,
  year: string,
  day: string,
  month: string,
): number => {
  const digits = getDigits(s);
  const yy = year.slice(-2);
  const d1 = day; // "5" hoặc "05"
  const d2 = day.padStart(2, "0");
  const m1 = month; // "8" hoặc "08"
  const m2 = month.padStart(2, "0");

  // ZONE 1: ngày-tháng-năm đầy đủ (thứ tự d-m-y). Chỉ nhận ngày 1 số khi tháng
  // 1 số: d2+m2, d2+m1, d1+m1. Bỏ d1+m2 (40793/4071993 không chấp nhận).
  const zone1 = new Set<string>();
  const d1m1 = d1 + m1 + yy;
  const d2m1 = d2 + m1 + yy;
  const d2m2 = d2 + m2 + yy;
  zone1.add(d1m1);
  zone1.add(d2m1);
  zone1.add(d2m2);
  zone1.add(d1 + m1 + year);
  zone1.add(d2 + m1 + year);
  zone1.add(d2 + m2 + year);
  for (const p of zone1) if (digits.endsWith(p)) return 0;

  // ZONE 2: chỉ tháng-năm (mmyyyy: 071993, 71993). Không gồm yy hay yyyy riêng —
  // quá rộng (mọi sim đuôi 1993 đều trúng, không đặc trưng tháng sinh).
  const zone2 = new Set<string>();
  for (const mm of [m1, m2]) {
    zone2.add(mm + year);
  }
  for (const p of zone2) if (digits.endsWith(p)) return 1;

  return -1;
};

/**
 * Lọc sim khớp ngày sinh của khách (YYYY + DD + MM), chia 2 zone:
 *   ZONE 1 (trước): ngày-tháng-năm đầy đủ dmyy / dmyyyy (…040793, …4793, …0471993)
 *   ZONE 2 (fallback): tháng-năm mmyyyy (…071993, …71993) — không nhận năm riêng
 * Trả về top `limit`.
 */
export const getBirthDateSims = async (
  year: string,
  day: string,
  month: string,
  limit = 12,
): Promise<{ sims: NormalizedSIM[]; total: number }> => {
  const all = await getServerSims();
  if (all.length === 0) return { sims: [], total: 0 };

  const matches: { sim: NormalizedSIM; rank: number }[] = [];
  for (const s of all) {
    if (s.price <= 0) continue;
    const rank = rankBirthDateMatch(s, year, day, month);
    if (rank >= 0) matches.push({ sim: s, rank });
  }

  matches.sort(
    (a, b) =>
      a.rank - b.rank ||
      a.sim.price - b.sim.price ||
      b.sim.beautyScore - a.sim.beautyScore,
  );

  return {
    sims: matches.slice(0, limit).map((m) => m.sim),
    total: matches.length,
  };
};

/**
 * Gợi ý sim khi KHÔNG có sim khớp ngày sinh (fallback theo 2 round):
 *   ROUND 1: sim có đuôi yyyy (…1989) hoặc mmyy (…1289 = tháng 12 + năm 89)
 *   ROUND 2 (nếu round 1 không đủ): sim đẹp bất kỳ (giá rẻ → đẹp)
 * Trả về top `limit`.
 */
export const getBirthDateFallbackSims = async (
  year: string,
  month: string,
  limit = 8,
): Promise<NormalizedSIM[]> => {
  const all = await getServerSims();
  if (all.length === 0) return [];

  const yy = year.slice(-2);
  const m1 = String(Number(month)); // "12" hoặc "1"
  const m2 = month.padStart(2, "0");

  // Round 1: đuôi yyyy hoặc mmyy
  const round1: NormalizedSIM[] = [];
  const seen = new Set<string>();
  for (const s of all) {
    if (s.price <= 0) continue;
    const d = getDigits(s);
    const ok =
      d.endsWith(year) ||
      d.endsWith(m1 + yy) ||
      d.endsWith(m2 + yy);
    if (ok) {
      seen.add(s.id);
      round1.push(s);
    }
  }
  round1.sort((a, b) => a.price - b.price || b.beautyScore - a.beautyScore);
  const picked = round1.slice(0, limit);

  // Round 2: nếu chưa đủ, lấp bằng sim đẹp giá rẻ còn lại
  if (picked.length < limit) {
    const others = all
      .filter((s) => s.price > 0 && !seen.has(s.id))
      .sort((a, b) => a.price - b.price || b.beautyScore - a.beautyScore);
    for (const s of others) {
      if (picked.length >= limit) break;
      picked.push(s);
    }
  }

  return picked;
};

/**
 * Filter the full catalogue by category criteria, sort by price ascending, and
 * return the top `limit` SIMs. Pure function — does not fetch.
 */
export const getCategorySnapshot = async (
  filter: SnapshotFilter,
  limit = 8,
): Promise<NormalizedSIM[]> => {
  let sims = await getServerSims();
  if (sims.length === 0) return [];

  // Apply filters
  if (filter.prefixes?.length) {
    sims = sims.filter((s) => filter.prefixes!.some((p) => getDigits(s).startsWith(p)));
  }
  if (filter.suffixes?.length) {
    sims = sims.filter((s) => filter.suffixes!.some((suf) => getDigits(s).endsWith(suf)));
  }
  if (filter.tags?.length) {
    sims = sims.filter((s) => filter.tags!.some((t) => s.tags?.includes(t)));
  }
  if (filter.lastDigits?.length) {
    sims = sims.filter((s) => filter.lastDigits!.includes(getDigits(s).slice(-1)));
  }
  if (filter.birthYear) {
    sims = sims.filter((s) => simMatchesBirthYear(s, filter.birthYear!));
  }

  // Only SIMs with a positive price
  sims = sims.filter((s) => s.price > 0);

  // Sort by price ascending, then by beauty score descending. For birth-year
  // snapshots, surface true "đuôi năm" matches (last 4 === year) first so the
  // strongest, most on-topic results lead the table.
  const by = filter.birthYear;
  sims.sort((a, b) => {
    if (by) {
      const aTail = getDigits(a).slice(-4) === by ? 0 : 1;
      const bTail = getDigits(b).slice(-4) === by ? 0 : 1;
      if (aTail !== bTail) return aTail - bTail;
    }
    return a.price - b.price || b.beautyScore - a.beautyScore;
  });

  return sims.slice(0, limit);
};

// ── Sim "năm sinh" inventory helpers ─────────────────────────────────────────
//
// Match rule lives in `simMatchesBirthYear` above (4-digit year inside the last
// 6 digits). These helpers count inventory per year and are the SINGLE source
// used by the sim-nam-sinh/[year] page (snapshot + generateStaticParams) and by
// sitemap.ts, so the prerendered set and the sitemap always agree.

/** Plausible birth-year window. Wider than we promote — the threshold prunes it. */
const BIRTH_YEAR_RANGE = { from: 1955, to: 2025 } as const;

/** Minimum in-stock SIMs a year needs before we prerender + sitemap it. */
export const BIRTH_YEAR_MIN_INVENTORY = 8;

/** True when `year` is a 4-digit string inside the plausible birth-year window. */
export const isPlausibleBirthYear = (year: string): boolean => {
  if (!/^\d{4}$/.test(year)) return false;
  const y = Number(year);
  return y >= BIRTH_YEAR_RANGE.from && y <= BIRTH_YEAR_RANGE.to;
};

/** Count in-stock (price > 0) SIMs matching birth-year `year` (last-6 contains). */
export const countBirthYearSims = async (year: string): Promise<number> => {
  if (!isPlausibleBirthYear(year)) return 0;
  const sims = await getServerSims();
  let n = 0;
  for (const s of sims) {
    if (s.price > 0 && simMatchesBirthYear(s, year)) n++;
  }
  return n;
};

/**
 * Birth years (as "YYYY") that currently have at least `minInventory` in-stock
 * SIMs matching (4-digit year within the last 6 digits). Shared by
 * `sim-nam-sinh/[year]` `generateStaticParams` AND `sitemap.ts` so both promote
 * the exact same set. Returns [] on data failure (never throws) so the build
 * never fails.
 */
export const getInStockBirthYears = async (
  minInventory = BIRTH_YEAR_MIN_INVENTORY,
): Promise<string[]> => {
  const sims = await getServerSims();
  if (sims.length === 0) return [];

  const counts = new Map<string, number>();
  for (const s of sims) {
    if (s.price <= 0) continue;
    const last6 = getDigits(s).slice(-6);
    // Count each DISTINCT plausible year appearing in the last 6 digits once.
    const seen = new Set<string>();
    for (let i = 0; i + 4 <= last6.length; i++) {
      const cand = last6.slice(i, i + 4);
      if (!seen.has(cand) && isPlausibleBirthYear(cand)) {
        seen.add(cand);
        counts.set(cand, (counts.get(cand) ?? 0) + 1);
      }
    }
  }

  return [...counts.entries()]
    .filter(([, n]) => n >= minInventory)
    .map(([year]) => year)
    .sort();
};