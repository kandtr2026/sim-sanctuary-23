import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ---------------------------------------------------------------------------
// Best-effort in-memory cache. Deno isolates are ephemeral so this is not
// shared across instances, but within a warm isolate it turns ~2 s gviz queries
// into ~0 ms. The cache stores the SOLD verdict too, so a warm isolate can't
// keep selling a SIM that this function already refused; staleness is bounded
// by the TTL below.
const BY_ID_CACHE_TTL_MS = 60_000; // 1 minute
const byIdCache = new Map<string, { json: string; httpStatus: number; fetchedAt: number }>();
// ---------------------------------------------------------------------------

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// The main sheet (same Google Sheet that fetch-sim-data reads)
const MAIN_SHEET_GID = "139400129";
const SHEET_ID = "1QRO-BroqUQWccWjOkRT7iICdTbQu3Y_NC1NWCeG0M0Y";

/**
 * Sold ledger. Column B (`SoThueBao`) of the `SIM_SOLD` tab holds SimID values
 * like `SIM036227` — same convention the promo warehouse checks in
 * `src/lib/cheapSimSheet.ts`. Without this query a sold SIM kept resolving here
 * with its price and the checkout form rendered in full, so numbers that were
 * already gone stayed orderable.
 */
const SOLD_SHEET = "SIM_SOLD";

/**
 * gviz string literals are single-quoted and the query language has no reliable
 * escape, so the id is validated instead of escaped — otherwise a `'` in the URL
 * rewrites the WHERE clause. Every real id is `SIM` (or `SIMKM`) + digits.
 */
const SIM_ID_PATTERN = /^SIM[A-Z0-9]{1,20}$/i;

// Build a gviz URL that returns every column for the matching row.
// The where clause is case-insensitive by using UPPER on both sides.
const gvizUrl = (simId: string) =>
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${MAIN_SHEET_GID}&tq=select * where UPPER(A)='${simId.toUpperCase()}'`;

const soldGvizUrl = (simId: string) =>
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${SOLD_SHEET}&tq=${encodeURIComponent(`select B where UPPER(B)='${simId.toUpperCase()}'`)}`;

/**
 * true  = the ledger lists this SimID as sold.
 * false = not listed, OR the ledger could not be read.
 *
 * Fail-open on a read error is deliberate: a gviz hiccup would otherwise turn
 * every checkout into "SIM không tồn tại", which is a worse outage than the
 * pre-existing behaviour. The caller does not cache an unverified answer, so the
 * next request retries the ledger.
 */
const isSold = async (simId: string): Promise<{ sold: boolean; verified: boolean }> => {
  try {
    const res = await fetch(soldGvizUrl(simId));
    if (!res.ok) {
      console.warn(`[fetch-sim-by-id] SIM_SOLD lookup HTTP ${res.status} for ${simId} — selling unverified`);
      return { sold: false, verified: false };
    }
    const lines = (await res.text()).trim().split("\n").filter((l) => l.trim());
    // Header row only ⇒ not sold. Any data row ⇒ gone.
    return { sold: lines.length > 1, verified: true };
  } catch (err) {
    console.warn(
      `[fetch-sim-by-id] SIM_SOLD lookup failed for ${simId} — selling unverified:`,
      err instanceof Error ? err.message : String(err),
    );
    return { sold: false, verified: false };
  }
};

/** Parse a single CSV line into an array of values, handling quoted fields. */
const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const char of line) {
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
  return values;
};

/** Normalise a header name for column matching. */
const normHeader = (h: string) =>
  h.trim().toUpperCase().replace(/\s+/g, " ").replace(/_/g, " ");

const findCol = (headers: string[], ...names: string[]): number => {
  for (const name of names) {
    const idx = headers.findIndex(h => normHeader(h) === normHeader(name));
    if (idx !== -1) return idx;
  }
  return -1;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const simId = url.searchParams.get("simId")?.trim();
    if (!simId) {
      return new Response(
        JSON.stringify({ error: "Missing simId parameter", code: "MISSING_SIM_ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!SIM_ID_PATTERN.test(simId)) {
      return new Response(
        JSON.stringify({ error: "SIM not found", code: "NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Serve from cache when fresh (warm-isolate fast path). Cached 404s (sold /
    // not found) are replayed too, so the guard survives a warm isolate.
    const cacheKey = simId.toUpperCase();
    const cached = byIdCache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.fetchedAt < BY_ID_CACHE_TTL_MS) {
      return new Response(cached.json, {
        status: cached.httpStatus,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=30, s-maxage=60",
          "X-Cache": "HIT",
        },
      });
    }

    // Row + sold ledger in parallel: the guard costs no extra latency.
    const [gvizResponse, soldVerdict] = await Promise.all([
      fetch(gvizUrl(simId)),
      isSold(simId),
    ]);

    if (soldVerdict.sold) {
      const soldJson = JSON.stringify({ error: "SIM đã được bán", code: "SOLD" });
      byIdCache.set(cacheKey, { json: soldJson, httpStatus: 404, fetchedAt: now });
      return new Response(soldJson, {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
      });
    }

    if (!gvizResponse.ok) {
      throw new Error(`gviz HTTP ${gvizResponse.status}`);
    }
    const csvText = await gvizResponse.text();

    // Validate: gviz returns CSV with header + data rows
    const lines = csvText.trim().split("\n").filter(l => l.trim());
    if (lines.length < 2) {
      return new Response(
        JSON.stringify({ error: "SIM not found", code: "NOT_FOUND" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const headerLine = lines[0].replace(/^\uFEFF/, "");
    const headers = parseCsvLine(headerLine);

    // Parse the first data row (gviz returns at most 1 matching row)
    const values = parseCsvLine(lines[1]);

    const col = (idx: number) => (idx >= 0 && idx < values.length ? values[idx] : "");

    // Locate columns by their header names
    const simIdCol = findCol(headers, "SIMID", "SIM ID", "SimID");
    const rawCol = findCol(headers, "SỐ THUÊ BAO CHUẨN", "THUÊ BAO CHUẨN", "THUE BAO CHUAN", "SO THUE BAO CHUAN");
    const displayCol = findCol(headers, "SỐ THUÊ BAO", "SO THUE BAO");
    const priceCol = findCol(headers, "GIÁ BÁN", "GIA BAN");
    const finalPriceCol = findCol(headers, "FINAL_PRICE", "Final_Price");
    const discountTypeCol = findCol(headers, "DISCOUNT_TYPE");
    const discountValueCol = findCol(headers, "DISCOUNT_VALUE");
    const khoCol = findCol(headers, "KHO");
    const tinhTrangCol = findCol(headers, "TÌNH TRẠNG", "TINH TRANG");
    const trangThaiCol = findCol(headers, "TRẠNG THÁI", "TRANG THAI");

    const rawDigits = col(rawCol).replace(/\D/g, "") || col(displayCol).replace(/\D/g, "");
    const displayNumber = col(displayCol) || col(rawCol) || rawDigits;
    const originalPriceVnd = parseInt(col(priceCol).replace(/[^\d]/g, ""), 10) || 0;
    const finalPriceVnd = parseInt(col(finalPriceCol).replace(/[^\d]/g, ""), 10) || undefined;
    const effectivePrice = finalPriceVnd && finalPriceVnd > 0 ? finalPriceVnd : originalPriceVnd;

    // The RAW column sometimes drops the leading 0 (9 digits). Normalise to 10
    // so prefix-based network detection works.
    const normalizedDigits =
      rawDigits.length === 9 ? `0${rawDigits}` : rawDigits;

    // Detect network by prefix
    const prefix = normalizedDigits.substring(0, 3);
    let network = "Khác";
    if (["090", "093", "089", "070", "076", "077", "078", "079"].includes(prefix)) network = "Mobifone";
    else if (["088", "091", "094", "081", "082", "083", "084", "085"].includes(prefix)) network = "Vinaphone";
    else if (["099", "059"].includes(prefix)) network = "Gmobile";

    // `TRẠNG THÁI = ẨN` is the shop deliberately pulling a number from sale. The
    // value was already carried in the response but nothing acted on it, so an
    // ẩn SIM still rendered a full checkout form.
    const trangThaiRaw = trangThaiCol >= 0 ? col(trangThaiCol) : "";
    const hidden = trangThaiRaw.trim().toUpperCase() === "ẨN";
    if (hidden) {
      const hiddenJson = JSON.stringify({ error: "SIM không còn được bán", code: "NOT_AVAILABLE" });
      byIdCache.set(cacheKey, { json: hiddenJson, httpStatus: 404, fetchedAt: now });
      return new Response(hiddenJson, {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json", "X-Cache": "MISS" },
      });
    }

    const result = {
      simId: col(simIdCol) || simId,
      rawDigits: normalizedDigits,
      displayNumber,
      originalPriceVnd,
      finalPriceVnd: finalPriceVnd && finalPriceVnd > 0 ? finalPriceVnd : undefined,
      priceVnd: effectivePrice,
      discountType: discountTypeCol >= 0 ? col(discountTypeCol) || undefined : undefined,
      discountValue: discountValueCol >= 0 ? parseInt(col(discountValueCol).replace(/[^\d]/g, ""), 10) || undefined : undefined,
      kho: khoCol >= 0 ? col(khoCol) || undefined : undefined,
      tinhTrang: tinhTrangCol >= 0 ? col(tinhTrangCol) || undefined : undefined,
      trangThai: trangThaiRaw || undefined,
      network,
    };

    const resultJson = JSON.stringify(result);
    // Only cache an answer whose sold status was actually verified — otherwise a
    // gviz outage would pin "sellable" for the whole TTL.
    if (soldVerdict.verified) {
      byIdCache.set(cacheKey, { json: resultJson, httpStatus: 200, fetchedAt: now });
    }

    return new Response(resultJson, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=30, s-maxage=60",
        "X-Cache": "MISS",
      },
    });
  } catch (err) {
    console.error("[fetch-sim-by-id] Error:", err instanceof Error ? err.message : String(err));
    return new Response(
      JSON.stringify({ error: "Failed to fetch SIM", code: "INTERNAL_ERROR" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});