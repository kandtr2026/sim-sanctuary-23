import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { normalizePhone, parseSoldCsv, SIM_SOLD_CSV_URL, type SoldLedger } from "../_shared/simSold.ts";

// ---------------------------------------------------------------------------
// fetch-sim-by-id: một SIM cho trang đặt hàng /mua-ngay/<simId>.
//
// Nguồn (từ 16/10/2026): bảng `sims` — cùng bảng lưới SIM đọc, do sync-sims
// đồng bộ từ BẢNG SỐ Excel. Trước đây hàm này đọc thẳng tab chính Google Sheet
// qua gviz, nên trang đặt hàng hiện giá sheet (cộng ~10%) khác giá trên thẻ SIM,
// và số chỉ có trong bảng số thì báo "SIM không tồn tại".
//
// Vẫn soát SIM_SOLD TRỰC TIẾP (theo SimID lẫn số điện thoại) vì sync-sims chỉ
// chạy 4 lượt/ngày: số vừa bán giữa hai lượt không được đặt tiếp.
// ---------------------------------------------------------------------------

// Best-effort in-memory cache. Deno isolates are ephemeral so this is not
// shared across instances, but within a warm isolate it skips the DB round
// trip. The cache stores the SOLD verdict too, so a warm isolate can't keep
// selling a SIM that this function already refused; staleness is bounded by
// the TTL below.
const BY_ID_CACHE_TTL_MS = 60_000; // 1 minute
const byIdCache = new Map<string, { json: string; httpStatus: number; fetchedAt: number }>();

/** Sổ SIM_SOLD (~470KB) đọc nguyên tab, giữ trong isolate cùng TTL với cache trên. */
let soldCache: { ledger: SoldLedger; fetchedAt: number } | null = null;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Id được validate trước khi ghép vào URL PostgREST. Id thật là `SIM` + số (kho
 * cũ), `SIMBS` + số (số mới từ bảng số) hoặc `SIMKM` + số (kho khuyến mãi —
 * không tới đây, trang đặt hàng tự đọc sheet khuyến mãi).
 */
const SIM_ID_PATTERN = /^SIM[A-Z0-9]{1,20}$/i;

const SIM_SELECT =
  "id,raw_digits,display_number,original_price,final_price,effective_price,discount_type,discount_value,kho,tinh_trang,status,network";

interface SimRow {
  id: string;
  raw_digits: string;
  display_number: string;
  original_price: number;
  final_price: number | null;
  effective_price: number;
  discount_type: string | null;
  discount_value: number | null;
  kho: string | null;
  tinh_trang: string | null;
  status: string;
  network: string | null;
}

/**
 * Sổ đã bán, hoặc null khi không đọc được. Fail-open có chủ ý (y như bản cũ): sự
 * cố Google biến mọi lượt đặt hàng thành "SIM không tồn tại" còn tệ hơn; sync-sims
 * vẫn chặn số đã bán ở lượt kế tiếp. Caller KHÔNG cache câu trả lời chưa soát.
 */
const loadSold = async (now: number): Promise<SoldLedger | null> => {
  if (soldCache && now - soldCache.fetchedAt < BY_ID_CACHE_TTL_MS) return soldCache.ledger;
  try {
    const res = await fetch(SIM_SOLD_CSV_URL, { headers: { Accept: "text/csv,*/*" } });
    if (!res.ok) {
      console.warn(`[fetch-sim-by-id] SIM_SOLD HTTP ${res.status} — selling unverified`);
      return null;
    }
    const text = await res.text();
    if (text.slice(0, 2000).toLowerCase().includes("<html")) {
      console.warn("[fetch-sim-by-id] SIM_SOLD trả HTML — selling unverified");
      return null;
    }
    const ledger = parseSoldCsv(text);
    soldCache = { ledger, fetchedAt: now };
    return ledger;
  } catch (err) {
    console.warn("[fetch-sim-by-id] SIM_SOLD lookup failed — selling unverified:", err instanceof Error ? err.message : String(err));
    return null;
  }
};

const json = (body: unknown, status: number, extra: Record<string, string> = {}) =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", ...extra },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const simId = url.searchParams.get("simId")?.trim();
    if (!simId) return json({ error: "Missing simId parameter", code: "MISSING_SIM_ID" }, 400);
    if (!SIM_ID_PATTERN.test(simId)) return json({ error: "SIM not found", code: "NOT_FOUND" }, 404);

    // Serve from cache when fresh (warm-isolate fast path). Cached 404s (sold /
    // not found) are replayed too, so the guard survives a warm isolate.
    const cacheKey = simId.toUpperCase();
    const cached = byIdCache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.fetchedAt < BY_ID_CACHE_TTL_MS) {
      return json(cached.json, cached.httpStatus, { "Cache-Control": "public, max-age=30, s-maxage=60", "X-Cache": "HIT" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    // `sims` là bảng public-read (RLS select using true) — khoá anon là đủ.
    const key = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !key) throw new Error("Missing SUPABASE_URL / SUPABASE_ANON_KEY");

    // Dòng SIM + sổ đã bán song song: chốt chặn không tốn thêm độ trễ.
    const [rowRes, sold] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/sims?select=${SIM_SELECT}&id=eq.${encodeURIComponent(cacheKey)}&limit=1`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      }),
      loadSold(now),
    ]);
    if (!rowRes.ok) throw new Error(`sims HTTP ${rowRes.status}`);
    const row = ((await rowRes.json()) as SimRow[])[0];

    const remember = (body: unknown, status: number) => {
      const text = JSON.stringify(body);
      // Chỉ cache câu trả lời đã soát sổ đã bán — sự cố Google không được ghim
      // "còn bán" suốt TTL.
      if (sold) byIdCache.set(cacheKey, { json: text, httpStatus: status, fetchedAt: now });
      return json(text, status, { "X-Cache": "MISS", ...(status === 200 ? { "Cache-Control": "public, max-age=30, s-maxage=60" } : {}) });
    };

    if (!row) return remember({ error: "SIM not found", code: "NOT_FOUND" }, 404);

    const digits = normalizePhone(row.raw_digits);
    if (row.status === "sold" || sold?.ids.has(cacheKey) || sold?.phones.has(digits)) {
      return remember({ error: "SIM đã được bán", code: "SOLD" }, 404);
    }
    // 'removed' (rời bảng số), 'invalid_price', 'ẩn'… — fail-closed như lưới SIM.
    if (row.status !== "available") {
      return remember({ error: "SIM không còn được bán", code: "NOT_AVAILABLE" }, 404);
    }

    const finalPrice = row.final_price && row.final_price > 0 ? row.final_price : undefined;
    return remember({
      simId: row.id,
      rawDigits: digits,
      displayNumber: row.display_number || digits,
      originalPriceVnd: row.original_price,
      finalPriceVnd: finalPrice,
      priceVnd: row.effective_price || finalPrice || row.original_price,
      discountType: row.discount_type || undefined,
      discountValue: row.discount_value || undefined,
      kho: row.kho || undefined,
      tinhTrang: row.tinh_trang || undefined,
      network: row.network || "Khác",
    }, 200);
  } catch (err) {
    console.error("[fetch-sim-by-id] Error:", err instanceof Error ? err.message : String(err));
    return json({ error: "Failed to fetch SIM", code: "INTERNAL_ERROR" }, 500);
  }
});
