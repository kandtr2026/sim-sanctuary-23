import { useState, useEffect, useMemo } from 'react';
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
} from '@/lib/cheapSimSheet';

export type { CheapSim } from '@/lib/cheapSimSheet';

/**
 * Nothing here used to read the `Kho` column, so the "đồng giá 229K" page
 * rendered all 27.717 rows of the sheet in raw spreadsheet order and the third
 * card on page one was a 39-million-đồng project SIM. The filter now runs in
 * the gviz query — see src/lib/cheapSimSheet.ts for why it belongs server-side.
 */
const TONGKHO_QUERY = `select A, C, E where G = '${CHEAP_KHO}'`;
const SOLD_QUERY = 'select B';

const SHEET_URL = gvizUrl('Tongkho', TONGKHO_QUERY);
const SIM_SOLD_URL = gvizUrl('Sim_Sold', SOLD_QUERY);

const CACHE_KEY = 'cheap_sim_cache_v3';
/** Superseded key shapes. They hold whole-object rows and waste the same quota. */
const LEGACY_CACHE_KEYS = ['cheap_sim_cache', 'cheap_sim_cache_v2'];
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * localStorage is ~5 MB per origin *and shared with the homepage cache*, which
 * budgets itself to 700k chars. Storing 9.152 full CheapSim objects costs about
 * 1 MB of JS chars (2 MB UTF-16) and would crowd it out, so rows are cached as
 * `[id, rawDigits, price]` tuples — displayNumber and network are both pure
 * functions of rawDigits and are recomputed on load. That is ~28 chars a row,
 * ~260k for the whole warehouse.
 */
type CachedCheapRow = [id: string, rawDigits: string, price: number];

interface CheapCacheEnvelope {
  v: 3;
  ts: number;
  rows: CachedCheapRow[];
}

const parseSoldIds = (csv: string): Set<string> => {
  const result = new Set<string>();
  const lines = csv.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return result;

  for (let i = 1; i < lines.length; i++) {
    const val = stripQuotes(parseCSVLine(lines[i])[0] || '').toUpperCase();
    if (val) result.add(val);
  }
  return result;
};

const parseCSV = (csv: string, soldIds: Set<string>): CheapSim[] => {
  const lines = csv.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map(normalizeHeader);
  if (CHEAP_HEADER_GUARD.some((expected, i) => headers[i] !== expected)) {
    console.warn('[useCheapSimData] Unexpected sheet columns:', headers);
    return [];
  }

  const sims: CheapSim[] = [];
  const seen = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const [simId, stb1, priceRaw] = parseCSVLine(lines[i]).map(stripQuotes);

    if (simId && soldIds.has(simId.toUpperCase())) continue;

    const sim = buildCheapSim(simId, stb1, priceRaw, CHEAP_PRICE_BOUNDS);
    if (!sim) continue;

    // The sheet is hand-maintained; a duplicated row would render two cards
    // with the same React key.
    if (seen.has(sim.id)) continue;
    seen.add(sim.id);

    sims.push(sim);
  }

  // Every price is identical, so the tiebreaker is what actually orders the
  // page: numeric, so page 1 is deterministic instead of "whatever order the
  // spreadsheet happens to be in today".
  sims.sort((a, b) => a.price - b.price || a.rawDigits.localeCompare(b.rawDigits));
  return sims;
};

const purgeLegacyCaches = () => {
  try {
    for (const key of LEGACY_CACHE_KEYS) localStorage.removeItem(key);
  } catch { /* storage unavailable - nothing to purge */ }
};

const loadCache = (): CheapSim[] | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CheapCacheEnvelope>;
    if (parsed?.v !== 3 || !parsed.ts) return null;
    // The TTL used to gate only the loading spinner, never the data, so a cache
    // written days ago was painted on first render and sold-out SIMs could stay
    // listed indefinitely. Expired entries are discarded outright.
    if (Date.now() - parsed.ts >= CACHE_TTL) return null;
    if (!Array.isArray(parsed.rows) || parsed.rows.length === 0) return null;

    const sims: CheapSim[] = [];
    for (const row of parsed.rows) {
      if (!Array.isArray(row)) continue;
      const [id, rawDigits, price] = row;
      const sim = buildCheapSim(String(id ?? ''), String(rawDigits ?? ''), String(price ?? ''), CHEAP_PRICE_BOUNDS);
      if (sim) sims.push(sim);
    }
    return sims.length > 0 ? sims : null;
  } catch { /* cache hỏng hoặc localStorage bị chặn - bỏ qua */ }
  return null;
};

const saveCache = (sims: CheapSim[]) => {
  const envelope: CheapCacheEnvelope = {
    v: 3,
    ts: Date.now(),
    rows: sims.map(s => [s.id, s.rawDigits, s.price]),
  };
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(envelope));
  } catch {
    // Out of quota. Drop the key and retry with a quarter of the rows: a
    // partial warm start still beats a blank grid, and the fetch replaces it
    // moments later anyway.
    try {
      localStorage.removeItem(CACHE_KEY);
      envelope.rows = envelope.rows.slice(0, Math.floor(envelope.rows.length / 4));
      localStorage.setItem(CACHE_KEY, JSON.stringify(envelope));
    } catch { /* hết quota hoặc localStorage bị chặn - bỏ qua */ }
  }
};

export const useCheapSimData = () => {
  const cached = useMemo(() => {
    purgeLegacyCaches();
    return loadCache();
  }, []);
  const [sims, setSims] = useState<CheapSim[]>(cached ?? []);
  const [isLoading, setIsLoading] = useState(!cached);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let cancelled = false;

    const fetchData = async () => {
      try {
        const [mainCsv, soldCsv] = await Promise.all([
          fetchSheetCsv(SHEET_URL, controller.signal),
          // A failed sold-list fetch used to be swallowed, which silently
          // republished every sold SIM as available. It is fatal now: better to
          // show a stale list than to sell a number that is already gone.
          fetchSheetCsv(SIM_SOLD_URL, controller.signal),
        ]);

        const soldIds = parseSoldIds(soldCsv);
        if (soldIds.size === 0) throw new Error('Sim_Sold returned no rows');

        const parsed = parseCSV(mainCsv, soldIds);
        if (parsed.length === 0) throw new Error('No cheap SIMs after parsing');

        if (cancelled) return;
        setSims(parsed);
        setHasError(false);
        saveCache(parsed);
      } catch (err) {
        if (cancelled) return;
        console.error('[useCheapSimData] Fetch error:', err);
        setHasError(true);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetchData();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  return { sims, isLoading, hasError };
};
