import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ---------------------------------------------------------------------------
// Best-effort in-memory cache. Deno isolates are ephemeral so this is not
// shared across instances, but within a warm isolate it turns ~2 s gviz queries
// into ~0 ms. SIM_SOLD freshness is not checked here — the storefront's
// `fetch-sim-data` already re-filters sold SIMs, and this function is only the
// per-SIM fast path for checkout. A short TTL bounds staleness.
const BY_ID_CACHE_TTL_MS = 60_000; // 1 minute
const byIdCache = new Map<string, { json: string; fetchedAt: number }>();
// ---------------------------------------------------------------------------

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// The main sheet (same Google Sheet that fetch-sim-data reads)
const MAIN_SHEET_GID = "139400129";
const SHEET_ID = "1QRO-BroqUQWccWjOkRT7iICdTbQu3Y_NC1NWCeG0M0Y";

// Build a gviz URL that returns every column for the matching row.
// The where clause is case-insensitive by using UPPER on both sides.
const gvizUrl = (simId: string) =>
  `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&gid=${MAIN_SHEET_GID}&tq=select * where UPPER(A)='${simId.toUpperCase()}'`;

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

    // Serve from cache when fresh (warm-isolate fast path).
    const cacheKey = simId.toUpperCase();
    const cached = byIdCache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.fetchedAt < BY_ID_CACHE_TTL_MS) {
      return new Response(cached.json, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=30, s-maxage=60",
          "X-Cache": "HIT",
        },
      });
    }

    // Fetch 1 row from Google Sheets via gviz
    const gvizResponse = await fetch(gvizUrl(simId));
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
      trangThai: trangThaiCol >= 0 ? col(trangThaiCol) || undefined : undefined,
      network,
    };

    const resultJson = JSON.stringify(result);
    byIdCache.set(cacheKey, { json: resultJson, fetchedAt: now });

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