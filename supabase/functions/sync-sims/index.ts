import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ---------------------------------------------------------------------------
// sync-sims: đồng bộ kho SIM từ Google Sheet vào bảng `sims` trên Supabase.
//
// Trigger:
//   - Khi số dòng CSV khác với số dòng đang lưu trong DB → re-sync toàn bộ
//   - Luôn đọc tab SIM_SOLD → đánh dấu sold các SimID đã bán
//
// Cách gọi (có thể cron qua Vercel / pg_cron / webhook):
//   GET/POST /sync-sims  (có thể kèm ?force=1 để bỏ qua so sánh dòng)
//
// Cần env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// (service role key — chỉ dùng phía server, tuyệt đối không public)
// ---------------------------------------------------------------------------

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GOOGLE_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/1QRO-BroqUQWccWjOkRT7iICdTbQu3Y_NC1NWCeG0M0Y/export?format=csv&gid=139400129';
const SIM_SOLD_CSV_URL = 'https://docs.google.com/spreadsheets/d/1QRO-BroqUQWccWjOkRT7iICdTbQu3Y_NC1NWCeG0M0Y/gviz/tq?tqx=out:csv&sheet=SIM_SOLD';

const BATCH_SIZE = 1000;
const INVALID_CSV_PATTERNS = ['<html', '<!doctype', 'accounts.google.com', 'servicelogin', 'you need access', 'access denied'];

const normalizeHeader = (header: string): string => {
  const cleaned = header.trim().toUpperCase().replace(/\s+/g, ' ').trim();
  const underscored = header.trim().toUpperCase().replace(/\s+/g, '_').trim();
  if (['SIMID', 'SIM ID', 'SIM_ID'].includes(cleaned)) return 'SIMID';
  if (['THUÊ BAO CHUẨN', 'THUE BAO CHUAN', 'THUÊBAOCHUẨN', 'THUEBAOCHUAN', 'SỐ THUÊ BAO CHUẨN', 'SO THUE BAO CHUAN'].includes(cleaned)) return 'RAW';
  if (['SỐ THUÊ BAO', 'SO THUE BAO', 'SỐTHUÊBAO', 'SOTHUEBAO', 'SỐ ĐIỆN THOẠI', 'SO DIEN THOAI'].includes(cleaned)) return 'DISPLAY';
  if (['GIÁ BÁN', 'GIA BAN', 'GIÁ', 'GIA', 'PRICE', 'ORIGINAL PRICE', 'ORIGINAL_PRICE'].includes(cleaned) || underscored === 'ORIGINAL_PRICE') return 'ORIGINAL_PRICE';
  if (['FINAL PRICE', 'FINALPRICE', 'FINAL_PRICE', 'GIÁ CUỐI', 'GIA CUOI', 'GIÁ KHUYẾN MÃI', 'GIA KHUYEN MAI'].includes(cleaned) || underscored === 'FINAL_PRICE') return 'FINAL_PRICE';
  if (['TRẠNG THÁI', 'TRANG_THAI', 'TRANG THAI', 'STATUS'].includes(cleaned) || underscored === 'TRANG_THAI') return 'TRANG_THAI';
  if (['KHO'].includes(cleaned) || underscored === 'KHO') return 'KHO';
  if (['TÌNH TRẠNG', 'TINH TRANG'].includes(cleaned) || underscored === 'TINH_TRANG') return 'TINH_TRANG';
  if (['DISCOUNT_TYPE', 'DISCOUNT TYPE'].includes(cleaned)) return 'DISCOUNT_TYPE';
  if (['DISCOUNT_VALUE', 'DISCOUNT VALUE'].includes(cleaned)) return 'DISCOUNT_VALUE';
  return cleaned;
};

const parseCSV = (csvText: string): Record<string, string>[] => {
  const lines = csvText.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headerLine = lines[0].replace(/^\uFEFF/, '');
  const rawHeaders = headerLine.split(',').map((h) => h.trim().replace(/^"|"$/g, '').trim());
  const headers = rawHeaders.map(normalizeHeader);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of lines[i]) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else current += char;
    }
    values.push(current.trim());
    if (values.length >= 2) {
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
      rows.push(row);
    }
  }
  return rows;
};

const parseSoldSimIds = (csvText: string): Set<string> => {
  const result = new Set<string>();
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return result;
  const headers = lines[0].replace(/^\uFEFF/, '').split(',').map((h) => h.trim().replace(/^"|"$/g, '').trim().toUpperCase());
  const colIdx = headers.findIndex((h) => h === 'SOTHUEBAO' || h === 'SO THUE BAO' || h === 'SỐTHUÊBAO');
  if (colIdx === -1) return result;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') inQuotes = !inQuotes;
      else if (char === ',' && !inQuotes) { values.push(current.trim()); current = ''; }
      else current += char;
    }
    values.push(current.trim());
    if (colIdx < values.length) {
      const v = values[colIdx].replace(/^"|"$/g, '').trim();
      if (v) result.add(v.toUpperCase());
    }
  }
  return result;
};

const fetchText = async (url: string): Promise<string> => {
  const res = await fetch(url, { headers: { 'Accept': 'text/csv,*/*' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  const lower = text.toLowerCase().slice(0, 2000);
  if (INVALID_CSV_PATTERNS.some((p) => lower.includes(p))) throw new Error('Invalid CSV response');
  return text;
};

const normalizePhone = (raw: string): string => {
  const digits = String(raw || '').replace(/\D/g, '');
  return digits.length === 9 ? '0' + digits : digits;
};

const safeParseVnd = (v: unknown): number => {
  const n = Number(String(v ?? '').replace(/[^\d]/g, ''));
  return Number.isFinite(n) ? n : 0;
};

const detectNetwork = (digits: string): string => {
  const p = digits.substring(0, 3);
  if (['090', '093', '089', '070', '076', '077', '078', '079'].includes(p)) return 'Mobifone';
  if (['088', '091', '094', '081', '082', '083', '084', '085'].includes(p)) return 'Vinaphone';
  if (['099', '059'].includes(p)) return 'Gmobile';
  return 'Khác';
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: 'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(req.url);
  const force = url.searchParams.get('force') === '1';

  try {
    // 1) Fetch main CSV + SIM_SOLD
    const [mainCsv, soldCsv] = await Promise.all([fetchText(GOOGLE_SHEET_CSV_URL), fetchText(SIM_SOLD_CSV_URL)]);
    const rows = parseCSV(mainCsv);
    const soldSet = parseSoldSimIds(soldCsv);

    // 2) Đếm số dòng đang lưu trong DB
    const countRes = await fetch(`${supabaseUrl}/rest/v1/sims?select=id`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
    });
    if (!countRes.ok) throw new Error(`count HTTP ${countRes.status}`);
    const existing = (await countRes.json()) as { id: string }[];
    const dbCount = existing.length;

    // So sánh: chỉ sync khi số dòng khác (admin sửa file) hoặc force
    if (!force && dbCount === rows.length) {
      console.log(`[sync-sims] No change (${dbCount} rows). Skipping.`);
      // vẫn đánh dấu sold bổ sung
      await markSold(supabaseUrl, serviceKey, soldSet);
      return new Response(JSON.stringify({ synced: false, reason: 'no_change', rows: dbCount, sold: soldSet.size }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3) Build rows để upsert
    const toUpsert: Record<string, unknown>[] = [];
    for (const row of rows) {
      const simId = (row['SIMID'] || '').trim();
      if (!simId) continue;
      const raw = row['RAW'] || row['DISPLAY'] || '';
      const display = row['DISPLAY'] || row['RAW'] || raw;
      const digits = normalizePhone(raw);
      if (digits.length < 9) continue;

      const originalPrice = safeParseVnd(row['ORIGINAL_PRICE']);
      const finalPriceRaw = safeParseVnd(row['FINAL_PRICE']);
      const finalPrice = finalPriceRaw > 0 ? finalPriceRaw : undefined;
      const effectivePrice = finalPrice ?? originalPrice;
      const statusRaw = (row['TRANG_THAI'] || '').trim().toLowerCase();

      toUpsert.push({
        id: simId,
        raw_digits: digits,
        display_number: display || digits,
        original_price: originalPrice,
        final_price: finalPrice ?? null,
        effective_price: effectivePrice,
        discount_type: row['DISCOUNT_TYPE'] || null,
        discount_value: safeParseVnd(row['DISCOUNT_VALUE']) || null,
        kho: row['KHO'] || null,
        tinh_trang: row['TINH_TRANG'] || null,
        status: soldSet.has(simId.toUpperCase()) ? 'sold' : statusRaw === 'sold' || statusRaw === 'reserved' || statusRaw === 'ẩn' ? statusRaw : 'available',
        network: detectNetwork(digits),
        prefix3: digits.slice(0, 3),
        prefix4: digits.slice(0, 4),
        last2: digits.slice(-2),
        last4: digits.slice(-4),
        last6: digits.slice(-6),
        source_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // 4) Upsert theo batch
    for (let i = 0; i < toUpsert.length; i += BATCH_SIZE) {
      const batch = toUpsert.slice(i, i + BATCH_SIZE);
      const res = await fetch(`${supabaseUrl}/rest/v1/sims`, {
        method: 'POST',
        headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
        body: JSON.stringify(batch),
      });
      if (!res.ok) throw new Error(`upsert batch ${i} HTTP ${res.status}: ${await res.text()}`);
    }

    // 5) Đánh dấu sold + ghi log sold
    await markSold(supabaseUrl, serviceKey, soldSet);

    console.log(`[sync-sims] Synced ${toUpsert.length} rows (${soldSet.size} sold)`);
    return new Response(JSON.stringify({ synced: true, rows: toUpsert.length, sold: soldSet.size }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[sync-sims] Error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Đánh dấu sold từng SimID đã bán + ghi vào sold_sims
async function markSold(supabaseUrl: string, serviceKey: string, soldSet: Set<string>): Promise<void> {
  if (soldSet.size === 0) return;
  const ids = Array.from(soldSet);
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' };

  // update sims.status = 'sold'
  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    const inList = batch.map((x) => `"${x}"`).join(',');
    const res = await fetch(`${supabaseUrl}/rest/v1/sims?status=neq.sold&id=in.(${inList})`, {
      method: 'PATCH',
      headers: { ...headers, Prefer: 'return=minimal' },
      body: JSON.stringify({ status: 'sold', updated_at: new Date().toISOString() }),
    });
    if (!res.ok) console.warn('[sync-sims] markSold patch warn:', res.status);
  }

  // upsert sold_sims (resolution merge — idempotent)
  const soldRows = ids.map((id) => ({ id, sold_at: new Date().toISOString() }));
  for (let i = 0; i < soldRows.length; i += BATCH_SIZE) {
    const batch = soldRows.slice(i, i + BATCH_SIZE);
    const res = await fetch(`${supabaseUrl}/rest/v1/sold_sims`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(batch),
    });
    if (!res.ok) console.warn('[sync-sims] sold_sims upsert warn:', res.status);
  }
}
