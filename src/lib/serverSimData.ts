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
 * parsing, sold/available filtering, `parsePrice`), but is self-contained here
 * so importing it in a server component never pulls in client-side deps
 * (react-query, sonner, localStorage).
 */

import { normalizeSIM, parsePrice, formatSIMNumber, detectSimTags, detectNetwork, PRICE_RANGES } from "@/lib/simUtils";
import type { NormalizedSIM } from "@/lib/simUtils";
import {
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  EDGE_FUNCTIONS_URL,
} from "@/integrations/supabase/config";

// ── Module-level cache (có hạn dùng) ────────────────────────────────────────
// Nhiều lần render trong CÙNG một build worker / ISR worker chia sẻ một lần
// fetch — nếu không, build 117 trang sẽ kéo kho SIM 117 lần.
//
// Nhưng cache phải HẾT HẠN. Bản cũ gán `cachedResult` một lần rồi trả mãi: route
// có `revalidate = 300` vẫn render lại đúng hạn, chỉ là render lại trên đúng
// mảng đã đóng băng, nên dữ liệu cũ bằng TUỔI CỦA TIẾN TRÌNH lambda (giá, SIM đã
// bán, facet, JSON-LD Offer) chứ không phải 5 phút như comment ngụ ý.
//
// TTL 300s cho khớp `revalidate = 300` của các route tiêu thụ. Cùng khuôn với
// `simInventorySheet.ts` (cachedInventory + cacheTimestamp + CACHE_DURATION).
const CACHE_TTL_MS = 300_000;
let cachedPromise: Promise<NormalizedSIM[]> | null = null;
let cachedResult: NormalizedSIM[] | null = null;
let cachedAt = 0;

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

    // `parsePrice` là hàm nghiêm ngặt dùng chung (simUtils): ô giá không phải số
    // nguyên có dấu ngăn nghìn → 0, KHÔNG "vét chữ số" thành một con số khác.
    const originalPrice = parsePrice(originalPriceStr);
    const finalPriceRaw = parsePrice(finalPriceStr);
    const finalPrice = finalPriceRaw > 0 ? finalPriceRaw : undefined;

    // Thiếu giá thì để 0 chảy xuống `formatPrice()` → "Liên hệ". Trước đây chỗ
    // này gọi `estimatePriceByTags()` — giá random theo tag, F5 ra số khác.
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
// PostgREST trên Supabase cap 1000 rows/response → phân trang bằng limit+offset.
const SUPABASE_SIMS_PAGE = 1000;

const SIMS_SELECT = 'id,raw_digits,display_number,original_price,final_price,effective_price,network,tags,beauty_score,is_vip';

/**
 * Điều kiện "được phép bán" khi đọc bảng `sims`.
 *
 * Trước đây cả ba chỗ đọc DB đều dùng `status=neq.sold`, nhưng `sync-sims` ghi
 * bốn giá trị: available | sold | reserved | ẩn (xem sync-sims/index.ts:189).
 * `neq.sold` vì thế vẫn cho SIM `reserved` và `ẩn` lên lưới, lên schema và đặt
 * mua được — 302 hàng `ẩn` là số shop đã cố ý ẩn. Nhánh CSV cũ
 * (`parseAndNormalize`) loại đủ cả ba, nên đây là chỗ nhánh DB đi lệch.
 *
 * Chốt theo hướng fail-closed: chỉ `available` mới bán. Thêm một giá trị status
 * mới trong tương lai sẽ bị loại theo mặc định thay vì âm thầm bán ra.
 */
const SELLABLE_STATUS = 'status=eq.available';

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
  // Bảng `sims` trên Supabase hiện lưu `tags` là MẢNG RỖNG cho mọi hàng (job
  // sync chưa ghi tag). `r.tags ?? detect()` không bắt được mảng rỗng, nên trước
  // đây mọi SIM đọc từ DB đều không có tag — kéo theo `getCategorySnapshot({tags})`
  // trả về rỗng và bảng "tứ quý nổi bật" + ItemList/Product schema của
  // /mua-sim-tu-quy, /sim-ngu-quy biến mất khỏi HTML mà không ai thấy lỗi.
  // Coi mảng rỗng là "chưa có tag" và tự suy ra bằng detector dùng chung.
  const tags = r.tags && r.tags.length > 0 ? r.tags : detectSimTags(rawDigits);
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

const fetchWithTimeout = (url: string, opts: RequestInit, ms: number): Promise<Response> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`fetch timeout after ${ms}ms`)), ms);
  });
  return Promise.race([fetch(url, opts), timeout]).finally(() => { if (timer) clearTimeout(timer); }) as Promise<Response>;
};

const fetchSimsFromDb = async (): Promise<NormalizedSIM[] | null> => {
  try {
    const authHeaders = {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    };
    // Lấy toàn bộ sim hợp lệ (status != sold) theo trang 1000. PostgREST cap
    // 1000 rows/response (Range header bị bỏ qua) → dùng limit+offset.
    // Chạy song song thay vì tuần tự để không kéo 50 request nối tiếp (~20s):
    // lấy count trước, rồi bắn toàn bộ trang cùng lúc với độ đồng thời giới hạn.
    const countRes = await fetchWithTimeout(
      `${SUPABASE_REST}/sims?select=id&${SELLABLE_STATUS}&limit=0`,
      { headers: { ...authHeaders, Prefer: 'count=exact' } },
      FETCH_TIMEOUT_MS,
    );
    if (!countRes.ok) return null;
    const cr = countRes.headers.get('content-range') || '';
    const totalMatch = cr.match(/\/(\d+)$/);
    if (!totalMatch) return null;
    const total = Number(totalMatch[1]);
    if (!Number.isFinite(total) || total <= 0) return null;

    const pageCount = Math.ceil(total / SUPABASE_SIMS_PAGE);

    // ── Chạy song song có giới hạn (12 luồng) ──
    const results: (SimsDbRow[] | null)[] = new Array(pageCount).fill(null);
    let next = 0;
    const workers = Array.from({ length: Math.min(12, pageCount) }, async () => {
      while (next < pageCount) {
        const pageIdx = next++;
        const res = await fetchWithTimeout(
          `${SUPABASE_REST}/sims?select=${SIMS_SELECT}&${SELLABLE_STATUS}&limit=${SUPABASE_SIMS_PAGE}&offset=${pageIdx * SUPABASE_SIMS_PAGE}`,
          { headers: authHeaders },
          FETCH_TIMEOUT_MS,
        );
        if (!res.ok) {
          results[pageIdx] = null;
          continue;
        }
        results[pageIdx] = (await res.json()) as SimsDbRow[];
      }
    });
    await Promise.all(workers);

    const sims: NormalizedSIM[] = [];
    for (const rows of results) {
      if (!rows) return null;
      for (const r of rows) sims.push(simsDbRowToNormalized(r));
    }
    return sims;
  } catch (e) {
    console.warn('[serverSimData] Supabase read failed, falling back to CSV:', e);
    return null;
  }
};

export interface DbQueryCriteria {
  search?: string;
  prefixes?: string[];
  suffixes?: string[];
  networks?: string[];
  priceRanges?: number[];
  customPriceMin?: number | null;
  customPriceMax?: number | null;
  vipFilter?: 'all' | 'only' | 'hide';
  sortBy?: string;
  mobifoneFirst?: boolean;
}

/**
 * Query Supabase/PostgREST directly with filter criteria (NOT the full crawl).
 * Uses `like`, `eq`, `in`, `gte`/`lte` operators so PostgREST returns only
 * matching rows — single request, ~100-300ms even on cold start.
 *
 * Returns null when criteria can't be pushed (quyType, birthDateOnly, tags)
 * — the caller falls back to in-memory filterSims(getServerSims()).
 */
export async function querySimsFromDb(
  criteria: DbQueryCriteria,
  limit: number,
  offset: number,
): Promise<{ items: NormalizedSIM[]; total: number } | null> {
  const authHeaders = {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
  };

  const and: string[] = [];
  and.push('effective_price=gt.0');

  // ── Search (RULE A/B/C) ───────────────────────────────────────────────
  const search = (criteria.search ?? '').trim().replace(/[^0-9*]/g, '');
  const digitsOnly = search.replace(/\*/g, '');

  if (search.length > 0 && digitsOnly.length > 0) {
    if (digitsOnly.length === 10 && !search.includes('*')) {
      and.push(`raw_digits=eq.${digitsOnly}`);
    } else if (search.includes('*')) {
      const startsWithStar = search.startsWith('*');
      const endsWithStar = search.endsWith('*');
      const parts = search.split('*').filter(Boolean);

      if (endsWithStar && !startsWithStar && parts.length >= 1) {
        and.push(`raw_digits=like.${parts[0]}*`);
      } else if (startsWithStar && !endsWithStar && parts.length >= 1) {
        and.push(`raw_digits=like.*${parts[parts.length - 1]}`);
      } else if (!startsWithStar && !endsWithStar && parts.length === 2) {
        and.push(`raw_digits=like.${parts[0]}*${parts[1]}`);
      } else {
        and.push(`raw_digits=like.*${digitsOnly}*`);
      }
    } else {
      and.push(`raw_digits=like.*${digitsOnly}*`);
    }
  }

  // ── Prefixes / Suffixes ───────────────────────────────────────────────
  // Trong `or=(...)` PostgREST đòi cú pháp DẤU CHẤM (`col.op.value`). Bản cũ
  // sinh `or=(raw_digits=like.090*,raw_digits=like.093*)` → 400 PGRST100
  // "failed to parse logic tree" (đã xác minh live), `querySimsFromDb` trả null
  // và cả nhánh rơi về lọc in-memory quét 49k hàng. Kết quả vẫn đúng nên không
  // ai thấy, chỉ đắt. Cùng khuôn với khối "Price ranges" bên dưới.
  //
  // Chỉ nhận giá trị TOÀN chữ số: `prefixes`/`suffixes` đến thẳng từ query string
  // (`/api/sims` → splitParam, không lọc), nên một giá trị chứa `,` hay `)` sẽ
  // ghép thêm mệnh đề vào chính logic tree của PostgREST.
  //
  // Loại (chứ không "gột" chữ số) để khớp ĐÚNG nhánh lọc in-memory: ở đó
  // `prefixes.some(p => digits.startsWith(p))` — một giá trị như "0-90" không bao
  // giờ khớp, tức không góp gì vào phép OR. Nếu gột thành "090" thì cùng một URL
  // sẽ trả hai tập kết quả khác nhau tuỳ hôm đó đi nhánh DB hay nhánh fallback.
  const digitGroups = (values: string[] | undefined): string[] =>
    (values ?? []).map((v) => String(v)).filter((v) => /^\d+$/.test(v));

  // Bỏ thành viên không hợp lệ khỏi tập OR là đúng (nó không khớp gì). Nhưng nếu
  // bỏ hết mà vẫn còn yêu cầu lọc thì tập OR rỗng ⇒ không khớp gì — phải trả 0
  // hàng, KHÔNG được bỏ mệnh đề (bỏ đi là âm thầm nới bộ lọc thành "lấy tất cả").
  const prefixes = digitGroups(criteria.prefixes);
  const suffixes = digitGroups(criteria.suffixes);
  if (
    (criteria.prefixes?.length && prefixes.length === 0) ||
    (criteria.suffixes?.length && suffixes.length === 0)
  ) {
    return { items: [], total: 0 };
  }

  if (prefixes.length === 1) {
    and.push(`raw_digits=like.${prefixes[0]}*`);
  } else if (prefixes.length > 1) {
    and.push(`or=(${prefixes.map((p) => `raw_digits.like.${p}*`).join(',')})`);
  }

  if (suffixes.length === 1) {
    and.push(`raw_digits=like.*${suffixes[0]}`);
  } else if (suffixes.length > 1) {
    and.push(`or=(${suffixes.map((s) => `raw_digits.like.*${s}`).join(',')})`);
  }

  // ── Networks ──────────────────────────────────────────────────────────
  if (criteria.networks?.length) {
    if (criteria.networks.length === 1) {
      and.push(`network=eq.${criteria.networks[0]}`);
    } else {
      and.push(`network=in.(${criteria.networks.join(',')})`);
    }
  }

  // ── Price ranges ──────────────────────────────────────────────────────
  // MỘT nguồn biên giá duy nhất: `PRICE_RANGES` trong simUtils (cùng bảng mà
  // chip lọc/facet count dùng). Trước đây file này giữ bản copy 8 bậc lệch
  // (bậc 7 kéo tới 999.999.999) nên số > 500 triệu lọt vào nhãn "200 - 500
  // triệu" và bậc "Trên 500 triệu" (index 8) không tồn tại → sinh `or=()` →
  // PostgREST 400 → rơi âm thầm về lọc in-memory 49k hàng.
  // Bậc cuối có `max: Infinity` → chỉ được phép sinh điều kiện `gte`.
  if (criteria.priceRanges?.length) {
    // Bỏ index lạ (ngoài bảng) thay vì tạo mệnh đề rỗng.
    const ranges = criteria.priceRanges
      .map((idx) => PRICE_RANGES[idx])
      .filter((r): r is (typeof PRICE_RANGES)[number] => Boolean(r));

    if (ranges.length === 1) {
      // Một bậc → đẩy thành các AND term riêng
      const r = ranges[0];
      and.push(`effective_price=gte.${r.min}`);
      if (Number.isFinite(r.max)) and.push(`effective_price=lte.${r.max}`);
    } else if (ranges.length > 1) {
      // Trong `or=(...)` PostgREST đòi cú pháp DẤU CHẤM (`col.op.value`); dùng
      // `col=op.value` ở đây sẽ bị PGRST100 "failed to parse logic tree".
      const terms = ranges.map((r) =>
        Number.isFinite(r.max)
          ? `and(effective_price.gte.${r.min},effective_price.lte.${r.max})`
          : `effective_price.gte.${r.min}`,
      );
      and.push(`or=(${terms.join(',')})`);
    }
    // ranges.length === 0 (toàn index lạ) → không thêm mệnh đề nào
  }

  if (criteria.customPriceMin != null) and.push(`effective_price=gte.${criteria.customPriceMin}`);
  if (criteria.customPriceMax != null) and.push(`effective_price=lte.${criteria.customPriceMax}`);

  // ── VIP filter ──────────────────────────────────────────────────────────
  if (criteria.vipFilter === 'only') {
    and.push('is_vip=is.true');
  } else if (criteria.vipFilter === 'hide') {
    and.push('is_vip=is.false');
  }

  // ── Build query ────────────────────────────────────────────────────────
  const params = new URLSearchParams();
  params.set('select', SIMS_SELECT);

  // status != sold (sync marks sold sims)
  and.push(SELLABLE_STATUS);

  // The AND clauses appear as simple query params (PostgREST conjoints them)
  for (const clause of and) {
    const eqIdx = clause.indexOf('=');
    if (eqIdx === -1) continue;
    const key = clause.slice(0, eqIdx);
    const val = clause.slice(eqIdx + 1);
    params.append(key, val);
  }

  // ── Sort ────────────────────────────────────────────────────────────────
  const s = criteria.sortBy;
  if (s === 'price_asc') params.set('order', 'effective_price.asc');
  else if (s === 'price_desc') params.set('order', 'effective_price.desc');
  else if (s === 'beauty') params.set('order', 'beauty_score.desc');
  else if (s === 'suffix_beauty') params.set('order', 'last4.asc,beauty_score.desc');
  else params.set('order', 'effective_price.asc,beauty_score.desc');

  params.set('limit', String(limit));
  params.set('offset', String(offset));

  const url = `${SUPABASE_REST}/sims?${params.toString()}`;

  try {
    const res = await fetchWithTimeout(url, {
      headers: { ...authHeaders, Prefer: 'count=exact', Range: `${offset}-${offset + limit - 1}` },
    }, FETCH_TIMEOUT_MS);
    if (!res.ok) return null;

    const rows = (await res.json()) as SimsDbRow[];
    const cr = res.headers.get('content-range') || '';
    const totalMatch = cr.match(/\/(\d+)$/);
    const total = totalMatch ? Number(totalMatch[1]) : rows.length;

    const items = rows.map(simsDbRowToNormalized);
    return { items, total };
  } catch (e) {
    console.warn('[serverSimData] querySimsFromDb failed:', e);
    return null;
  }
}

/**
 * Fetch the full SIM catalogue on the server (build or request time).
 * Cached at the module level for `CACHE_TTL_MS` (300s — khớp `revalidate = 300`
 * của các route tiêu thụ) nên nhiều trang trong cùng một build/ISR worker chia
 * sẻ một lần fetch, mà dữ liệu vẫn tươi lại sau 5 phút thay vì đóng băng theo
 * tuổi tiến trình. Returns [] on failure (never throws).
 *
 * Ưu tiên đọc từ Supabase (bảng `sims` — đồng bộ hàng ngày bởi sync-sims, không
 * tải 5.5MB CSV). Nếu Supabase chưa có dữ liệu/lỗi → fallback về CSV như cũ.
 */
export const getServerSims = async (): Promise<NormalizedSIM[]> => {
  // Hết hạn thì coi như chưa có cache và fetch lại.
  if (cachedResult && Date.now() - cachedAt < CACHE_TTL_MS) return cachedResult;
  // Đang có một lần fetch dở dang → chờ chung, không bắn thêm request.
  if (cachedPromise) return cachedPromise;

  const store = (sims: NormalizedSIM[]): NormalizedSIM[] => {
    cachedResult = sims;
    cachedAt = Date.now();
    return sims;
  };

  cachedPromise = (async () => {
    // 1) Thử Supabase trước — nhẹ, nhanh, luôn tươi theo sync
    const fromDb = await fetchSimsFromDb();
    if (fromDb && fromDb.length > 0) {
      console.log(`[serverSimData] loaded ${fromDb.length} SIMs from Supabase`);
      return store(fromDb);
    }
    // 2) Fallback: CSV qua edge function
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const csv = await fetchCsv();
        return store(parseAndNormalize(csv));
      } catch (e) {
        console.warn(`[serverSimData] fetch failed (attempt ${attempt + 1}):`, e);
      }
    }
    // Thất bại: KHÔNG cache mảng rỗng — lần gọi sau phải thử lại ngay.
    return [];
  })();

  try {
    return await cachedPromise;
  } finally {
    cachedPromise = null;
  }
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