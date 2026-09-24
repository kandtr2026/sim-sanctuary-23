import { useState, useEffect, useMemo } from 'react';
import {
  CHEAP_PRICE_BOUNDS,
  buildCheapSim,
  fetchCheapStock,
  type CheapSim,
} from '@/lib/cheapSimSheet';

export type { CheapSim } from '@/lib/cheapSimSheet';

const CACHE_KEY = 'cheap_sim_cache_v4';
/** Superseded key shapes. They hold whole-object rows and waste the same quota. */
const LEGACY_CACHE_KEYS = ['cheap_sim_cache', 'cheap_sim_cache_v2', 'cheap_sim_cache_v3'];
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * localStorage is ~5 MB per origin *and shared with the homepage cache*, which
 * budgets itself to 700k chars. Storing 9.152 full CheapSim objects costs about
 * 1 MB of JS chars (2 MB UTF-16) and would crowd it out, so rows are cached as
 * `[id, rawDigits, price, goiCuoc]` tuples — displayNumber and network are both
 * pure functions of rawDigits and are recomputed on load. Gói cước is not
 * derivable from anything else, so it has to be stored (~6 chars a row; most
 * rows have no gói and store an empty string).
 */
type CachedCheapRow = [id: string, rawDigits: string, price: number, goiCuoc?: string];

interface CheapCacheEnvelope {
  v: 4;
  ts: number;
  rows: CachedCheapRow[];
}

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
    if (parsed?.v !== 4 || !parsed.ts) return null;
    // The TTL used to gate only the loading spinner, never the data, so a cache
    // written days ago was painted on first render and sold-out SIMs could stay
    // listed indefinitely. Expired entries are discarded outright.
    if (Date.now() - parsed.ts >= CACHE_TTL) return null;
    if (!Array.isArray(parsed.rows) || parsed.rows.length === 0) return null;

    const sims: CheapSim[] = [];
    for (const row of parsed.rows) {
      if (!Array.isArray(row)) continue;
      const [id, rawDigits, price, goiCuoc] = row;
      const sim = buildCheapSim(String(id ?? ''), String(rawDigits ?? ''), String(price ?? ''), CHEAP_PRICE_BOUNDS, String(goiCuoc ?? ''));
      if (sim) sims.push(sim);
    }
    return sims.length > 0 ? sims : null;
  } catch { /* cache hỏng hoặc localStorage bị chặn - bỏ qua */ }
  return null;
};

const saveCache = (sims: CheapSim[]) => {
  const envelope: CheapCacheEnvelope = {
    v: 4,
    ts: Date.now(),
    rows: sims.map(s => [s.id, s.rawDigits, s.price, s.goiCuoc || undefined]),
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
        // Fetch + parse + sold-exclusion live in fetchCheapStock now, shared
        // with the Shopee admin số picker. It throws (fatal) if the sold list
        // is empty or nothing parses — same guarantees as before.
        const parsed = await fetchCheapStock(controller.signal);

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
