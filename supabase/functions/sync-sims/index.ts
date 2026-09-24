import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { calculateBeautyScore, detectSimCategories, isVIPSim } from "../_shared/simCategories.ts";

// ---------------------------------------------------------------------------
// sync-sims: đồng bộ kho SIM từ Google Sheet vào bảng `sims` trên Supabase.
//
// Trigger:
//   - So DẤU VÂN TAY (SHA-256) của TẬP DỮ LIỆU sẽ ghi với vân tay lần chạy
//     trước (bảng `sims_sync_state`) → sync khi NỘI DUNG đổi, không phải khi
//     SỐ DÒNG đổi. Bản cũ so `dbCount === rows.length`: sai về ý (sửa giá / bật
//     ẨN mà không thêm-bớt dòng thì số dòng không đổi) và sai cả về đo —
//     `dbCount` lấy từ `GET /sims?select=id` không limit, mà PostgREST cap 1000
//     hàng/response, nên với kho 51.639 hàng thì `1000 === 51639` LUÔN sai và
//     nhánh skip CHƯA BAO GIỜ chạy. Tức bản cũ là bom hẹn giờ (kho tụt dưới
//     1000 số hoặc ai nới `db-max-rows` là nó kích hoạt), không phải lỗi đang
//     gây hại: đối chiếu 1.201 SimID sheet↔DB cho 0 dòng lệch giá.
//   - Luôn đọc tab SIM_SOLD → đánh dấu sold các SimID đã bán
//
// Cách gọi (có thể cron qua Vercel / pg_cron / webhook):
//   GET/POST /sync-sims  (có thể kèm ?force=1 để bỏ qua so sánh vân tay)
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

/** Bảng lưu vân tay lần sync trước. Xem supabase/migrations/20260829090000_sims_sync_state.sql */
const SYNC_STATE_TABLE = 'sims_sync_state';
/** Một hàng duy nhất cho nguồn sheet chính (SIM_SOLD đi kèm trong cùng vân tay). */
const SYNC_STATE_KEY = 'sims_sheet';

/**
 * Đổi hằng này khi luật SUY RA cột (tags / beauty_score / is_vip / network /
 * prefix…) thay đổi. Vân tay chỉ băm các cột ĐỌC TRỰC TIẾP từ sheet; cột suy ra
 * là hàm thuần của chúng + phiên bản luật, nên bump version ở đây là cách buộc
 * một lượt ghi lại toàn bộ sau khi sửa luật, mà không phải băm thêm ~10 cột.
 */
const FINGERPRINT_VERSION = 'v3'; // v3 (09/2026): danh mục kiểu simthanglong, 1 số nhiều danh mục

/**
 * Dưới ngưỡng này thì ô giá là lỗi nhập tay hoặc lệch đơn vị, không phải giá
 * bán thật (cùng ngưỡng với CHEAP_MIN_PRICE trong src/lib/cheapSimSheet.ts).
 * Sheet hiện có đúng 1 dòng dưới ngưỡng: SIM135790 `GIÁ BÁN = "  10 "`; số rẻ
 * thật nhất của kho chính là 200.000đ, nên ngưỡng 10.000 còn rất nhiều biên.
 */
const MIN_SELLABLE_PRICE = 10_000;

/**
 * Status cho dòng không có giá dùng được. KHÔNG dùng 'available' để dòng đó
 * không lên lưới / không vào JSON-LD: phía đọc (src/lib/serverSimData.ts) lọc
 * `status=eq.available` theo hướng fail-closed nên mọi giá trị lạ đều bị loại.
 */
const STATUS_INVALID_PRICE = 'invalid_price';

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
  const headerLine = lines[0].replace(/^﻿/, '');
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
  const headers = lines[0].replace(/^﻿/, '').split(',').map((h) => h.trim().replace(/^"|"$/g, '').trim().toUpperCase());
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

/**
 * Đọc một ô giá VND. NGHIÊM NGẶT — chỉ nhận số nguyên có dấu ngăn nghìn hợp lệ.
 *
 * Bản cũ (`safeParseVnd`) vét chữ số bằng `replace(/[^\d]/g, '')`, nên mọi ô
 * nhập tay lệch định dạng đều biến thành một con số trông có vẻ hợp lệ rồi được
 * GHI vào `effective_price`, phục vụ mọi khách cho tới lần sync sau:
 *
 *   "1,5 triệu"                → 15
 *   "4tr5"                     → 45
 *   "2 triệu 500"              → 2500
 *   "229.000 - LH 0933356666"  → 2.290.000.933.356.666
 *
 * Luật ở đây khớp `parseCheapPrice` (src/lib/cheapSimSheet.ts:93): dấu chấm và
 * dấu phẩy đều là ngăn nghìn trong locale của sheet và chỉ xuất hiện theo nhóm
 * 3 chữ số. Không khớp → 0, và caller KHÔNG cho dòng giá 0 lên bán. Bỏ sót một
 * dòng thì còn cứu được (SIM chỉ không hiện); ghi sai giá thì khách đã thấy.
 *
 * Sheet bọc giá trong ngoặc kép kèm khoảng trắng — `"  39,000,000 "` — và
 * parseCSV đã trim, nên chuỗi vào đây là `39,000,000`.
 */
const parseVndStrict = (v: unknown): number => {
  const s = String(v ?? '').trim();
  if (!s) return 0;
  if (!/^\d{1,3}(?:[.,]\d{3})*$|^\d+$/.test(s)) return 0;
  const n = parseInt(s.replace(/[.,]/g, ''), 10);
  return Number.isFinite(n) && n >= 0 ? n : 0;
};

const detectNetwork = (digits: string): string => {
  const p = digits.substring(0, 3);
  if (['090', '093', '089', '070', '076', '077', '078', '079'].includes(p)) return 'Mobifone';
  if (['088', '091', '094', '081', '082', '083', '084', '085'].includes(p)) return 'Vinaphone';
  if (['099', '059'].includes(p)) return 'Gmobile';
  return 'Khác';
};

// ═══════════════════════════════════════════════════════════════════════════
// CHẤM ĐIỂM SIM — import THẲNG file luật dùng chung với web
//
// Trước 09/2026 luật tag/điểm/VIP bị chép tay ở đây ("bản sao 1:1 của simUtils")
// và đã lệch nhau (bản này còn gắn 'Ông địa' sau khi web bỏ). Giờ cả hai cùng
// import supabase/functions/_shared/simCategories.ts — sửa luật ở ĐÓ, rồi bump
// FINGERPRINT_VERSION bên trên để lượt sync kế tiếp ghi lại toàn bộ cột suy ra.
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// VÂN TAY DỮ LIỆU (thay cho so sánh SỐ DÒNG)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * SHA-256 của TẬP DỮ LIỆU sẽ upsert, sắp xếp theo `id` để độc lập với thứ tự
 * dòng trong sheet (kéo-thả lại dòng không tính là "đổi nội dung").
 *
 * Mỗi dòng serialize bằng `JSON.stringify` một mảng cố định: dấu ngoặc kép và
 * dấu phẩy trong ô sheet được escape nên hai tập dữ liệu khác nhau không thể
 * sinh ra cùng một chuỗi (nối chuỗi bằng ký tự phân tách thường thì có).
 *
 * Chỉ băm các cột ĐỌC TRỰC TIẾP từ sheet. Cột suy ra (tags, beauty_score,
 * is_vip, network, prefix3/4, last2/4/6) là hàm thuần của chúng, nên thêm vào
 * chỉ tốn bộ nhớ mà không thêm thông tin; đổi luật suy ra thì bump
 * FINGERPRINT_VERSION.
 */
const buildFingerprint = async (rows: Record<string, unknown>[]): Promise<string> => {
  const lines = rows.map((r) => JSON.stringify([
    r.id,
    r.raw_digits,
    r.display_number,
    r.original_price,
    r.final_price,
    r.effective_price,
    r.discount_type,
    r.discount_value,
    r.kho,
    r.tinh_trang,
    r.status,
  ]));
  lines.sort();
  const payload = `${FINGERPRINT_VERSION}\n${lines.length}\n${lines.join('\n')}`;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
};

/**
 * Vân tay lần chạy trước. FAIL-OPEN: bảng chưa tồn tại (migration chưa chạy)
 * hoặc lỗi mạng → trả null ⇒ coi như "chưa từng sync" ⇒ vẫn upsert. Chọn hướng
 * này vì hỏng kiểu "sync nhiều hơn cần" chỉ tốn request, còn hỏng kiểu "bỏ qua
 * sync" là quay lại đúng con bug đang sửa.
 */
const readFingerprint = async (supabaseUrl: string, serviceKey: string): Promise<string | null> => {
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/${SYNC_STATE_TABLE}?select=fingerprint&key=eq.${SYNC_STATE_KEY}&limit=1`,
      { headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` } },
    );
    if (!res.ok) {
      console.warn(`[sync-sims] readFingerprint HTTP ${res.status} → coi như chưa có vân tay (vẫn sync)`);
      return null;
    }
    const rows = (await res.json()) as { fingerprint: string }[];
    return rows.length > 0 ? rows[0].fingerprint : null;
  } catch (e) {
    console.warn('[sync-sims] readFingerprint lỗi → coi như chưa có vân tay (vẫn sync):', e);
    return null;
  }
};

/** Ghi vân tay sau khi upsert xong. Lỗi ở đây KHÔNG làm job fail (chỉ mất tối ưu). */
const writeFingerprint = async (
  supabaseUrl: string,
  serviceKey: string,
  fingerprint: string,
  rowCount: number,
): Promise<boolean> => {
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/${SYNC_STATE_TABLE}`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify([{
        key: SYNC_STATE_KEY,
        fingerprint,
        row_count: rowCount,
        synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }]),
    });
    if (!res.ok) {
      console.warn(`[sync-sims] writeFingerprint HTTP ${res.status}: ${await res.text()}`);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[sync-sims] writeFingerprint lỗi:', e);
    return false;
  }
};

/** Tổng số hàng trong `sims` — chỉ để log/response, không quyết định sync. */
const countSims = async (supabaseUrl: string, serviceKey: string): Promise<number | null> => {
  try {
    // `Prefer: count=exact` + `limit=0`: PostgREST trả tổng trong header
    // content-range mà KHÔNG chuyển hàng nào. Bản cũ `select=id` không limit bị
    // cap 1000 hàng/response nên `dbCount` luôn = 1000 (xem bàn giao).
    const res = await fetch(`${supabaseUrl}/rest/v1/sims?select=id&limit=0`, {
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, Prefer: 'count=exact' },
    });
    if (!res.ok) return null;
    const m = (res.headers.get('content-range') || '').match(/\/(\d+)$/);
    return m ? Number(m[1]) : null;
  } catch {
    return null;
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// HANDLER
// ═══════════════════════════════════════════════════════════════════════════

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

    // 2) Build rows để upsert — làm TRƯỚC khi quyết định skip, vì vân tay được
    //    tính trên chính tập dữ liệu sẽ ghi (không phải trên CSV thô: CSV có cả
    //    cột không đồng bộ như "GIÁ THU VỀ", đổi cột đó không cần re-sync).
    const toUpsert: Record<string, unknown>[] = [];
    let skippedNoId = 0;
    let skippedShortNumber = 0;
    let invalidPriceCount = 0;
    const invalidPriceSamples: { id: string; original: string; final: string }[] = [];

    for (const row of rows) {
      const simId = (row['SIMID'] || '').trim();
      if (!simId) { skippedNoId++; continue; }
      const raw = row['RAW'] || row['DISPLAY'] || '';
      const display = row['DISPLAY'] || row['RAW'] || raw;
      const digits = normalizePhone(raw);
      if (digits.length < 9) { skippedShortNumber++; continue; }

      const originalPrice = parseVndStrict(row['ORIGINAL_PRICE']);
      const finalPriceRaw = parseVndStrict(row['FINAL_PRICE']);
      const finalPrice = finalPriceRaw > 0 ? finalPriceRaw : undefined;
      const effectivePrice = finalPrice ?? originalPrice;

      // Giá không đọc được / dưới ngưỡng ⇒ KHÔNG bao giờ là 'available'.
      const priceUsable = effectivePrice >= MIN_SELLABLE_PRICE;
      if (!priceUsable) {
        invalidPriceCount++;
        if (invalidPriceSamples.length < 20) {
          invalidPriceSamples.push({
            id: simId,
            original: String(row['ORIGINAL_PRICE'] ?? ''),
            final: String(row['FINAL_PRICE'] ?? ''),
          });
        }
      }

      const statusRaw = (row['TRANG_THAI'] || '').trim().toLowerCase();
      // Thứ tự ưu tiên: đã bán > trạng thái chủ shop đặt tay > giá không dùng
      // được > available. SIM đã bán vẫn là 'sold' dù ô giá có rác.
      const status = soldSet.has(simId.toUpperCase())
        ? 'sold'
        : statusRaw === 'sold' || statusRaw === 'reserved' || statusRaw === 'ẩn'
        ? statusRaw
        : priceUsable
        ? 'available'
        : STATUS_INVALID_PRICE;

      const tags = [...detectSimCategories(digits)];

      toUpsert.push({
        id: simId,
        raw_digits: digits,
        display_number: display || digits,
        original_price: originalPrice,
        final_price: finalPrice ?? null,
        effective_price: effectivePrice,
        discount_type: row['DISCOUNT_TYPE'] || null,
        discount_value: parseVndStrict(row['DISCOUNT_VALUE']) || null,
        kho: row['KHO'] || null,
        tinh_trang: row['TINH_TRANG'] || null,
        status,
        network: detectNetwork(digits),
        tags,
        beauty_score: calculateBeautyScore(tags, effectivePrice),
        is_vip: isVIPSim(tags, effectivePrice),
        prefix3: digits.slice(0, 3),
        prefix4: digits.slice(0, 4),
        last2: digits.slice(-2),
        last4: digits.slice(-4),
        last6: digits.slice(-6),
        source_updated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }

    // 3) So vân tay NỘI DUNG với lần chạy trước.
    //    Trả bảng CSV trung gian về cho GC trước khi băm + gửi 52 batch: job này
    //    giữ đồng thời chuỗi CSV 5,7MB, 51k object CSV và 51k object upsert, còn
    //    edge function chỉ có 256MB.
    rows.length = 0;

    const fingerprint = await buildFingerprint(toUpsert);
    const previousFingerprint = force ? null : await readFingerprint(supabaseUrl, serviceKey);

    if (!force && previousFingerprint && previousFingerprint === fingerprint) {
      console.log(`[sync-sims] Nội dung không đổi (${toUpsert.length} dòng, fp ${fingerprint.slice(0, 12)}). Bỏ qua upsert.`);
      // Vẫn chạy markSold: `status` nằm trong vân tay nên SIM_SOLD có thêm số
      // thì vân tay đã khác và không vào nhánh này — nhưng markSold còn ghi
      // bảng `sold_sims`, và nó idempotent, nên chạy cho chắc.
      await markSold(supabaseUrl, serviceKey, soldSet);
      return new Response(JSON.stringify({
        synced: false,
        reason: 'no_content_change',
        rows: toUpsert.length,
        sold: soldSet.size,
        fingerprint,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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

    // 6) Chỉ ghi vân tay SAU khi upsert xong: upsert lỗi giữa đường thì vân tay
    //    cũ còn nguyên ⇒ lần chạy sau làm lại từ đầu thay vì tưởng đã xong.
    const fingerprintSaved = await writeFingerprint(supabaseUrl, serviceKey, fingerprint, toUpsert.length);
    const dbRows = await countSims(supabaseUrl, serviceKey);

    if (invalidPriceCount > 0) {
      console.warn(`[sync-sims] ${invalidPriceCount} dòng giá không dùng được → status='${STATUS_INVALID_PRICE}':`, JSON.stringify(invalidPriceSamples));
    }
    if (skippedNoId > 0 || skippedShortNumber > 0) {
      console.warn(`[sync-sims] Bỏ ${skippedNoId} dòng thiếu SimID, ${skippedShortNumber} dòng số < 9 chữ số`);
    }
    console.log(`[sync-sims] Synced ${toUpsert.length} rows (${soldSet.size} sold, ${invalidPriceCount} invalid price), fp ${fingerprint.slice(0, 12)}${fingerprintSaved ? '' : ' (CHƯA lưu được vân tay)'}`);

    return new Response(JSON.stringify({
      synced: true,
      reason: force ? 'forced' : previousFingerprint ? 'content_changed' : 'no_previous_fingerprint',
      rows: toUpsert.length,
      sold: soldSet.size,
      invalidPrice: invalidPriceCount,
      skippedNoId,
      skippedShortNumber,
      fingerprint,
      fingerprintSaved,
      dbRows,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
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
