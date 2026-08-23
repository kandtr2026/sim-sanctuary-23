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

import { normalizeSIM, estimatePriceByTags } from "@/lib/simUtils";
import type { NormalizedSIM } from "@/lib/simUtils";
import {
  EDGE_FUNCTIONS_URL,
  SUPABASE_PUBLISHABLE_KEY,
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
const fetchCsv = async (): Promise<string> => {
  const url = `${EDGE_FUNCTIONS_URL}/fetch-sim-data`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    },
    // Fail fast when called from a build environment where the edge function
    // is unreachable — the client island remains functional.
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`fetch-sim-data: HTTP ${res.status}`);
  return res.text();
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

/**
 * Fetch the full SIM catalogue on the server (build or request time).
 * Cached at the module level so multiple pages within the same build worker
 * share one fetch. Returns [] on failure (never throws).
 */
export const getServerSims = async (): Promise<NormalizedSIM[]> => {
  if (cachedResult) return cachedResult;
  if (cachedPromise) return cachedPromise;

  cachedPromise = (async () => {
    // One retry: the first build fetch can hit a cold edge function or a slow
    // first connection; the second attempt almost always succeeds.
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
}

const getDigits = (s: NormalizedSIM): string =>
  s.rawDigits || s.displayNumber.replace(/\D/g, "") || "";

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

  // Only SIMs with a positive price
  sims = sims.filter((s) => s.price > 0);

  // Sort by price ascending, then by beauty score descending
  sims.sort((a, b) => a.price - b.price || b.beautyScore - a.beautyScore);

  return sims.slice(0, limit);
};