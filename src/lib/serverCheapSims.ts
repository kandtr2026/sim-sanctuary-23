/**
 * Server-only fetcher for the 229.000đ promo warehouse (C6, mua-sim-gia-re).
 *
 * `getCategorySnapshot` in serverSimData.ts only covers the MAIN catalogue
 * (the `fetch-sim-data` edge function, `SIM…` ids). The promo warehouse is a
 * *different spreadsheet* (`SIMKM…` ids) read through the `sheet-proxy` edge
 * function, so a server-rendered snapshot for /mua-sim-gia-re needs its own
 * path. This mirrors the client hook `useCheapSimData` — same queries, same
 * parsing primitives from `cheapSimSheet.ts` — but with no React/localStorage,
 * and it degrades to `[]` on any failure so a build (or ISR revalidation) can
 * never break; the client island still renders live data either way.
 */

import {
  CHEAP_HEADER_GUARD,
  CHEAP_KHO,
  CHEAP_PRICE_BOUNDS,
  buildCheapSim,
  fetchSheetCsv,
  gvizUrl,
  normalizeHeader,
  parseCSVLine,
  stripQuotes,
  type CheapSim,
} from "@/lib/cheapSimSheet";

// Same queries the client hook uses: promo stock only (Kho = '0đ'), and the
// full sold list so already-sold numbers are never shown.
const TONGKHO_QUERY = `select A, C, E where G = '${CHEAP_KHO}'`;
const SOLD_QUERY = "select B";

// Module-level cache: multiple renders within one build/ISR worker share a
// single pair of fetches (mirrors serverSimData.ts).
let cachedPromise: Promise<CheapSim[]> | null = null;
let cachedResult: CheapSim[] | null = null;

const parseSoldIds = (csv: string): Set<string> => {
  const out = new Set<string>();
  const lines = csv.trim().split("\n").filter((l) => l.trim());
  for (let i = 1; i < lines.length; i++) {
    const val = stripQuotes(parseCSVLine(lines[i])[0] || "").toUpperCase();
    if (val) out.add(val);
  }
  return out;
};

const parseRows = (csv: string, soldIds: Set<string>): CheapSim[] => {
  const lines = csv.trim().split("\n").filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map(normalizeHeader);
  if (CHEAP_HEADER_GUARD.some((expected, i) => headers[i] !== expected)) {
    console.warn("[serverCheapSims] Unexpected sheet columns:", headers);
    return [];
  }

  const sims: CheapSim[] = [];
  const seen = new Set<string>();
  for (let i = 1; i < lines.length; i++) {
    const [simId, stb1, priceRaw] = parseCSVLine(lines[i]).map(stripQuotes);
    if (simId && soldIds.has(simId.toUpperCase())) continue;

    const sim = buildCheapSim(simId, stb1, priceRaw, CHEAP_PRICE_BOUNDS);
    if (!sim) continue;
    if (seen.has(sim.id)) continue;
    seen.add(sim.id);
    sims.push(sim);
  }

  // Every price is identical (229k), so rawDigits is the deterministic
  // tiebreaker — same ordering the client hook uses for page 1.
  sims.sort((a, b) => a.price - b.price || a.rawDigits.localeCompare(b.rawDigits));
  return sims;
};

/**
 * Fetch the whole available promo warehouse on the server. Cached at module
 * scope; returns `[]` on failure (never throws).
 */
export const getCheapSims = async (): Promise<CheapSim[]> => {
  if (cachedResult) return cachedResult;
  if (cachedPromise) return cachedPromise;

  cachedPromise = (async () => {
    // One retry: the first build fetch can hit a cold edge function.
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const [mainCsv, soldCsv] = await Promise.all([
          fetchSheetCsv(gvizUrl("Tongkho", TONGKHO_QUERY), AbortSignal.timeout(15_000)),
          fetchSheetCsv(gvizUrl("Sim_Sold", SOLD_QUERY), AbortSignal.timeout(15_000)),
        ]);

        const soldIds = parseSoldIds(soldCsv);
        // A failed/empty sold list must not silently republish sold SIMs.
        if (soldIds.size === 0) throw new Error("Sim_Sold returned no rows");

        const sims = parseRows(mainCsv, soldIds);
        if (sims.length === 0) throw new Error("No cheap SIMs after parsing");

        cachedResult = sims;
        return sims;
      } catch (e) {
        console.warn(`[serverCheapSims] fetch failed (attempt ${attempt + 1}):`, e);
      }
    }
    return [];
  })();

  const result = await cachedPromise;
  cachedPromise = null;
  return result;
};

/** Top `limit` promo SIMs for the server-rendered snapshot. */
export const getCheapSnapshot = async (limit = 8): Promise<CheapSim[]> => {
  const sims = await getCheapSims();
  return sims.slice(0, limit);
};
