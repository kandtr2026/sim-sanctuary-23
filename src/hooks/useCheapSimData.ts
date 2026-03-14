import { useState, useEffect, useMemo } from 'react';

const SHEET_ID = '1gwlG7hsd_na7XB3d4maI99nhMVRUEmAlpx9ueYOELL4';
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Tongkho`;
const SIM_SOLD_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Sim_Sold`;
const CACHE_KEY = 'cheap_sim_cache';
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

interface CheapSim {
  id: string;
  displayNumber: string;
  rawDigits: string;
  price: number;
  network: string;
}

const detectNetwork = (digits: string): string => {
  const prefix = digits.substring(0, 3);
  if (['090', '093', '089', '070', '076', '077', '078', '079'].includes(prefix)) return 'Mobifone';
  if (['091', '094', '088', '081', '082', '083', '084', '085'].includes(prefix)) return 'Vinaphone';
  if (['086', '096', '097', '098', '032', '033', '034', '035', '036', '037', '038', '039'].includes(prefix)) return 'Viettel';
  if (['099', '059'].includes(prefix)) return 'Gmobile';
  return 'Khác';
};

const parsePrice = (raw: string): number => {
  if (!raw) return 0;
  const cleaned = String(raw).replace(/[^\d]/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
};

const parseCSVLine = (line: string): string[] => {
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

const parseCSV = (csv: string): CheapSim[] => {
  const lines = csv.trim().split('\n').filter(l => l.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim().toUpperCase());
  const stb1Idx = headers.findIndex(h => h === 'STB1');
  const priceIdx = headers.findIndex(h => h.includes('GIÁ BÁN') || h.includes('GIA BAN') || h === 'GIÁBAN');

  if (stb1Idx === -1 || priceIdx === -1) {
    console.warn('[useCheapSimData] Missing columns. Headers:', headers);
    return [];
  }

  const sims: CheapSim[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, '').trim());
    const stb1 = vals[stb1Idx] || '';
    const priceRaw = vals[priceIdx] || '';
    if (!stb1 || !priceRaw) continue;

    const rawDigits = stb1.replace(/\D/g, '');
    if (rawDigits.length < 9) continue;

    const fullDigits = rawDigits.length === 9 ? '0' + rawDigits : rawDigits;
    const price = parsePrice(priceRaw);
    if (price <= 0) continue;

    sims.push({
      id: `cheap-${i}-${fullDigits}`,
      displayNumber: stb1,
      rawDigits: fullDigits,
      price,
      network: detectNetwork(fullDigits),
    });
  }
  return sims;
};

const loadCache = (): { sims: CheapSim[]; ts: number } | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.sims?.length > 0 && parsed?.ts) return parsed;
  } catch {}
  return null;
};

const saveCache = (sims: CheapSim[]) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ sims, ts: Date.now() }));
  } catch {}
};

export const useCheapSimData = () => {
  const cached = useMemo(() => loadCache(), []);
  const [sims, setSims] = useState<CheapSim[]>(cached?.sims || []);
  const [isLoading, setIsLoading] = useState(!cached?.sims?.length);

  useEffect(() => {
    const isFresh = cached?.ts && (Date.now() - cached.ts < CACHE_TTL);
    if (isFresh && cached?.sims?.length) {
      setSims(cached.sims);
      setIsLoading(false);
    }

    // Always fetch in background
    const fetchData = async () => {
      try {
        const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'pfeyyyvhzsuoccwoweco';
        const url = `https://${projectId}.supabase.co/functions/v1/sheet-proxy?url=${encodeURIComponent(SHEET_URL)}`;
        const res = await fetch(url, {
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBmZXl5eXZoenN1b2Njd293ZWNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg0NTIzODEsImV4cCI6MjA4NDAyODM4MX0.RGOXDxNXOZn93fnZliCy48Hn2dH4tjogfAcdhp8KQiQ',
          },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const csv = await res.text();
        const parsed = parseCSV(csv);
        if (parsed.length > 0) {
          setSims(parsed);
          saveCache(parsed);
        }
      } catch (err) {
        console.error('[useCheapSimData] Fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return { sims, isLoading };
};
