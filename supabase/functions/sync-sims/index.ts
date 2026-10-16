import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { calculateBeautyScore, detectSimCategories, isVIPSim } from "../_shared/simCategories.ts";
import { normalizePhone, parseSoldCsv, SIM_SOLD_CSV_URL } from "../_shared/simSold.ts";

// ---------------------------------------------------------------------------
// sync-sims: đồng bộ kho SIM từ BẢNG SỐ (`sims_bang_so`) vào bảng `sims`.
//
// Nguồn (từ 16/10/2026): file Excel bảng số nhà cung cấp, nạp vào `sims_bang_so`
// bằng scripts/bang-so/import.mjs. Luật chủ shop chốt:
//   - Giá web = GIÁ BÁN trong bảng số. Có trong bảng số thì BẮT BUỘC lên web.
//   - Không có trong bảng số = không còn tồn tại → gỡ ('removed').
//   - Đã TỪNG nằm trong SIM_SOLD (so theo SỐ ĐIỆN THOẠI, cột "STB chuan", kèm
//     SimID cột SoThueBao và log `sold_sims`) → không lên, vì một số chỉ bán một
//     lần mà bảng số có thể chốt trước lúc bán.
// Tab chính của Google Sheet KHÔNG còn quyết định kho/giá (giá ở đó đã cộng
// ~10% và còn 9.362 số đã rời bảng số tháng 10/2026).
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
//   - Luôn đọc tab SIM_SOLD → đánh dấu sold các SimID + số điện thoại đã bán
//   - Lượt có upsert thì gỡ ('removed') số 'available' đã RỜI bảng số — xem retireMissing
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

/** Bảng số chuẩn. Xem supabase/migrations/20261016100000_sims_bang_so.sql */
const BANG_SO_TABLE = 'sims_bang_so';
/**
 * Bảng số ít hơn ngưỡng này ⇒ nghi nạp hỏng/rỗng ⇒ DỪNG, không upsert không gỡ.
 * Không có chặn này thì bảng số rỗng = gỡ sạch kho (MAX_REMOVE_RATIO chỉ chặn gỡ,
 * không chặn được lượt sau ghi vân tay của tập rỗng).
 */
const MIN_BANG_SO_ROWS = 1000;
/**
 * SimID cho số chưa từng có trong `sims`. Phải khớp SIM_ID_PATTERN của
 * fetch-sim-by-id (`^SIM[A-Z0-9]{1,20}$`) để link /mua-ngay/<id> mở được, và
 * không đụng tiền tố SIMKM của kho khuyến mãi. Số đã có dòng thì GIỮ SimID cũ.
 */
const NEW_ID_PREFIX = 'SIMBS';

const BATCH_SIZE = 1000;
/** PostgREST cap 1000 hàng/response (db-max-rows) — đọc theo trang cỡ này. */
const PAGE_SIZE = 1000;
const READ_CONCURRENCY = 8;
const UPSERT_CONCURRENCY = 4;
const INVALID_CSV_PATTERNS = ['<html', '<!doctype', 'accounts.google.com', 'servicelogin', 'you need access', 'access denied'];

/** Bảng lưu vân tay lần sync trước. Xem supabase/migrations/20260829090000_sims_sync_state.sql */
const SYNC_STATE_TABLE = 'sims_sync_state';
/**
 * Một hàng cho nguồn bảng số (SIM_SOLD đi kèm trong cùng vân tay). Khoá cũ
 * 'sims_sheet' là của nguồn Google Sheet — đổi khoá để lượt đầu sau khi chuyển
 * nguồn chắc chắn upsert + gỡ.
 */
const SYNC_STATE_KEY = 'sims_bang_so';

/**
 * Đổi hằng này khi luật SUY RA cột (tags / beauty_score / is_vip / network /
 * prefix…) thay đổi. Vân tay chỉ băm các cột ĐỌC TRỰC TIẾP từ sheet; cột suy ra
 * là hàm thuần của chúng + phiên bản luật, nên bump version ở đây là cách buộc
 * một lượt ghi lại toàn bộ sau khi sửa luật, mà không phải băm thêm ~10 cột.
 */
const FINGERPRINT_VERSION = 'v6'; // v3 (09/2026): danh mục kiểu simthanglong; v4: chỉnh lặp kép/gánh đảo/dễ nhớ theo 4.482 số hỏi lại; v5: năm sinh chặn trên = năm nay (bỏ 2027–2029); v6 (16/10/2026): nguồn = bảng số Excel, SIM_SOLD so theo số

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

/**
 * Status cho số ĐÃ RỜI nguồn (bảng số tháng mới không còn số đó). Trước 15/10
 * job chỉ upsert dòng CÓ trong nguồn, nên số rời nguồn giữ 'available' mãi mãi
 * và web vẫn bán số đã bán. Số quay lại bảng số thì lượt upsert sau tự trả status.
 */
const STATUS_REMOVED = 'removed';

/**
 * Lượt gỡ đòi gỡ quá tỉ lệ này của số đang bán ⇒ nghi bảng số bị cụt/hỏng,
 * KHÔNG gỡ (chỉ cảnh báo). Rút kho KIT_2026 = 36% vẫn lọt; nguồn trả về rỗng
 * hay cụt quá nửa thì bị chặn. Cần gỡ nhiều hơn thật thì gọi `?reconcile=force`.
 */
const MAX_REMOVE_RATIO = 0.5;

const fetchText = async (url: string): Promise<string> => {
  const res = await fetch(url, { headers: { 'Accept': 'text/csv,*/*' } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  const lower = text.toLowerCase().slice(0, 2000);
  if (INVALID_CSV_PATTERNS.some((p) => lower.includes(p))) throw new Error('Invalid CSV response');
  return text;
};

/**
 * Đọc HẾT một bảng qua PostgREST. Trang đầu kiêm đếm (`count=exact`); bước nhảy
 * offset = số hàng trang đầu THỰC SỰ trả về chứ không phải PAGE_SIZE xin — trần
 * "Max rows" của project từng là 200, khi đó nhảy 1000 sẽ bỏ sót 800 hàng mỗi
 * khối mà mọi response vẫn 200 (xem fetchSimsRowsFromDb bên web). Đọc thiếu
 * hay thừa so với `count` ⇒ ném lỗi: job này gỡ số dựa trên kết quả đọc, nên
 * dữ liệu hụt là gỡ nhầm. `order` phải là cột duy nhất để trang không chồng/hụt.
 */
const fetchAllRows = async <T>(
  supabaseUrl: string,
  serviceKey: string,
  table: string,
  select: string,
  order: string,
): Promise<T[]> => {
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };
  const pageUrl = (limit: number, offset: number) =>
    `${supabaseUrl}/rest/v1/${table}?select=${select}&order=${order}.asc&limit=${limit}&offset=${offset}`;

  const first = await fetch(pageUrl(PAGE_SIZE, 0), { headers: { ...headers, Prefer: 'count=exact' } });
  const m = (first.headers.get('content-range') || '').match(/\/(\d+)$/);
  if (!first.ok || !m) throw new Error(`đọc ${table} trang đầu HTTP ${first.status}: ${await first.text()}`);
  const total = Number(m[1]);
  const firstRows = (await first.json()) as T[];
  const step = firstRows.length;
  if (total > 0 && step === 0) throw new Error(`đọc ${table}: count=${total} mà trang đầu rỗng`);

  const pages = step > 0 ? Math.ceil(total / step) : 0;
  const out: T[][] = [firstRows];
  for (let p = 1; p < pages; p += READ_CONCURRENCY) {
    await Promise.all(Array.from({ length: Math.min(READ_CONCURRENCY, pages - p) }, async (_, k) => {
      const page = p + k;
      const res = await fetch(pageUrl(step, page * step), { headers });
      if (!res.ok) throw new Error(`đọc ${table} trang ${page} HTTP ${res.status}: ${await res.text()}`);
      out[page] = await res.json();
    }));
  }
  const rows = out.flat();
  if (rows.length !== total) throw new Error(`đọc ${table}: ${rows.length}/${total} hàng — dừng, không đồng bộ trên dữ liệu thiếu`);
  return rows;
};

/**
 * Chọn SimID cho từng số đã có dòng trong `sims` để giữ link /mua-ngay/<id> cũ.
 * Một số có thể mang nhiều SimID (cùng số nằm ở nhiều kho của sheet cũ): ưu
 * tiên dòng đang 'available', rồi dòng chưa 'sold', rồi SimID nhỏ nhất cho ổn
 * định giữa các lượt. Dòng không được chọn mà đang 'available' sẽ bị
 * retireMissing gỡ, nên web không hiện một số hai lần.
 */
const pickIdByDigits = (rows: { id: string; raw_digits: string; status: string }[]): Map<string, string> => {
  const rank = (s: string) => (s === 'available' ? 0 : s === 'sold' ? 2 : 1);
  const best = new Map<string, { id: string; r: number }>();
  for (const row of rows) {
    const digits = normalizePhone(row.raw_digits);
    const r = rank(row.status);
    const cur = best.get(digits);
    if (!cur || r < cur.r || (r === cur.r && row.id < cur.id)) best.set(digits, { id: row.id, r });
  }
  return new Map([...best].map(([d, v]) => [d, v.id]));
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
  // Luật "Năm sinh" chặn trên ở NĂM HIỆN TẠI → sang năm mới cột tags/beauty_score
  // đổi dù sheet không đổi. Cho năm vào vân tay để lượt sync đầu năm tự ghi lại.
  const payload = `${FINGERPRINT_VERSION}\n${new Date().getFullYear()}\n${lines.length}\n${lines.join('\n')}`;
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
  const forceReconcile = url.searchParams.get('reconcile') === 'force';

  try {
    // Mốc của lượt chạy: mọi dòng upsert mang `source_updated_at` = mốc này, nên
    // dòng 'available' có mốc CŨ HƠN là dòng không còn trong bảng số (xem bước 5).
    const syncStamp = new Date().toISOString();

    // 1) Đọc bảng số + SIM_SOLD + SimID hiện có + log sold_sims
    type BangSoRow = { raw_digits: string; display_number: string; gia_ban: number; tinh_trang: string | null };
    type SimRow = { id: string; raw_digits: string; status: string };
    const [bangSo, soldCsv, existing, soldLog] = await Promise.all([
      fetchAllRows<BangSoRow>(supabaseUrl, serviceKey, BANG_SO_TABLE, 'raw_digits,display_number,gia_ban,tinh_trang', 'raw_digits'),
      fetchText(SIM_SOLD_CSV_URL),
      fetchAllRows<SimRow>(supabaseUrl, serviceKey, 'sims', 'id,raw_digits,status', 'id'),
      fetchAllRows<{ id: string }>(supabaseUrl, serviceKey, 'sold_sims', 'id', 'id'),
    ]);
    if (bangSo.length < MIN_BANG_SO_ROWS) {
      throw new Error(`Bảng số chỉ có ${bangSo.length} dòng (< ${MIN_BANG_SO_ROWS}) — nghi nạp hỏng, KHÔNG đồng bộ. Nạp lại bằng scripts/bang-so/import.mjs`);
    }

    // "Đã từng nằm trong SIM_SOLD" quy về SỐ ĐIỆN THOẠI: cột STB chuan, cộng
    // SimID (tab hiện tại + log sold_sims — dòng đã xoá khỏi tab vẫn còn trong
    // log) đổi ra số qua bảng `sims`.
    const sold = parseSoldCsv(soldCsv);
    const soldIds = new Set([...sold.ids, ...soldLog.map((r) => r.id.toUpperCase())]);
    const soldPhones = new Set(sold.phones);
    for (const row of existing) {
      if (soldIds.has(row.id.toUpperCase())) soldPhones.add(normalizePhone(row.raw_digits));
    }
    const idByDigits = pickIdByDigits(existing);
    existing.length = 0;

    // 2) Build rows để upsert — làm TRƯỚC khi quyết định skip, vì vân tay được
    //    tính trên chính tập dữ liệu sẽ ghi.
    const toUpsert: Record<string, unknown>[] = [];
    let skippedSold = 0;
    let skippedShortNumber = 0;
    let newIds = 0;
    let invalidPriceCount = 0;
    const invalidPriceSamples: { raw_digits: string; gia_ban: number }[] = [];

    for (const row of bangSo) {
      const digits = normalizePhone(row.raw_digits);
      if (digits.length < 9) { skippedShortNumber++; continue; }
      if (soldPhones.has(digits)) { skippedSold++; continue; }

      const price = Number(row.gia_ban) || 0;
      // Giá không dùng được / dưới ngưỡng ⇒ KHÔNG bao giờ là 'available'.
      const priceUsable = price >= MIN_SELLABLE_PRICE;
      if (!priceUsable) {
        invalidPriceCount++;
        if (invalidPriceSamples.length < 20) invalidPriceSamples.push({ raw_digits: digits, gia_ban: price });
      }

      let id = idByDigits.get(digits);
      if (!id) { id = `${NEW_ID_PREFIX}${digits}`; newIds++; }
      const tags = [...detectSimCategories(digits)];

      // Không gửi cột `kho`: upsert chỉ ghi cột có trong payload, nên dòng cũ giữ
      // nhãn kho (KIT_2026, SONG KHOA…) còn dòng mới để trống. Bảng số không có kho.
      toUpsert.push({
        id,
        raw_digits: digits,
        display_number: row.display_number || digits,
        original_price: price,
        final_price: null,
        effective_price: price,
        discount_type: null,
        discount_value: null,
        tinh_trang: row.tinh_trang || null,
        status: priceUsable ? 'available' : STATUS_INVALID_PRICE,
        network: detectNetwork(digits),
        tags,
        beauty_score: calculateBeautyScore(tags, price),
        is_vip: isVIPSim(tags, price),
        prefix3: digits.slice(0, 3),
        prefix4: digits.slice(0, 4),
        last2: digits.slice(-2),
        last4: digits.slice(-4),
        last6: digits.slice(-6),
        source_updated_at: syncStamp,
        updated_at: syncStamp,
      });
    }

    // 3) So vân tay NỘI DUNG với lần chạy trước. Trả bảng số về cho GC trước khi
    //    băm + gửi batch: edge function chỉ có 256MB.
    bangSo.length = 0;

    const fingerprint = await buildFingerprint(toUpsert);
    const previousFingerprint = force ? null : await readFingerprint(supabaseUrl, serviceKey);

    if (!force && previousFingerprint && previousFingerprint === fingerprint) {
      console.log(`[sync-sims] Nội dung không đổi (${toUpsert.length} dòng, fp ${fingerprint.slice(0, 12)}). Bỏ qua upsert.`);
      // Vẫn chạy markSold: nó còn ghi bảng `sold_sims`, và idempotent, nên chạy cho chắc.
      await markSold(supabaseUrl, serviceKey, sold.ids);
      await markSoldByPhone(supabaseUrl, serviceKey, soldPhones);
      return new Response(JSON.stringify({
        synced: false,
        reason: 'no_content_change',
        rows: toUpsert.length,
        sold: soldPhones.size,
        fingerprint,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // 4) Upsert theo batch, UPSERT_CONCURRENCY batch song song (74 batch tuần tự
    //    sát giới hạn thời gian của edge function).
    for (let i = 0; i < toUpsert.length; i += BATCH_SIZE * UPSERT_CONCURRENCY) {
      await Promise.all(Array.from({ length: UPSERT_CONCURRENCY }, async (_, k) => {
        const start = i + k * BATCH_SIZE;
        if (start >= toUpsert.length) return;
        const batch = toUpsert.slice(start, start + BATCH_SIZE);
        const res = await fetch(`${supabaseUrl}/rest/v1/sims`, {
          method: 'POST',
          headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates,return=minimal' },
          body: JSON.stringify(batch),
        });
        if (!res.ok) throw new Error(`upsert batch ${start} HTTP ${res.status}: ${await res.text()}`);
      }));
    }

    // 5) Gỡ số đã rời bảng số. Chỉ chạy ở nhánh có upsert: nhánh "không đổi" thì
    //    tập SimID y hệt lượt upsert trước, mà lượt đó đã gỡ rồi. Lỗi thì ném ra
    //    để vân tay KHÔNG được ghi ⇒ lượt sau upsert + gỡ lại từ đầu.
    const reconcile = await retireMissing(supabaseUrl, serviceKey, syncStamp, forceReconcile);

    // 6) Đánh dấu sold + ghi log sold (sau bước 5: số vừa gỡ mà có trong
    //    SIM_SOLD thì vẫn về 'sold').
    await markSold(supabaseUrl, serviceKey, sold.ids);
    await markSoldByPhone(supabaseUrl, serviceKey, soldPhones);

    // 7) Chỉ ghi vân tay SAU khi upsert xong: upsert lỗi giữa đường thì vân tay
    //    cũ còn nguyên ⇒ lần chạy sau làm lại từ đầu thay vì tưởng đã xong.
    const fingerprintSaved = await writeFingerprint(supabaseUrl, serviceKey, fingerprint, toUpsert.length);
    const dbRows = await countSims(supabaseUrl, serviceKey);

    if (invalidPriceCount > 0) {
      console.warn(`[sync-sims] ${invalidPriceCount} dòng giá không dùng được → status='${STATUS_INVALID_PRICE}':`, JSON.stringify(invalidPriceSamples));
    }
    if (skippedShortNumber > 0) {
      console.warn(`[sync-sims] Bỏ ${skippedShortNumber} dòng số < 9 chữ số`);
    }
    console.log(`[sync-sims] Synced ${toUpsert.length} rows (${skippedSold} số trong bảng số đã bán, ${newIds} SimID mới, ${invalidPriceCount} invalid price), fp ${fingerprint.slice(0, 12)}${fingerprintSaved ? '' : ' (CHƯA lưu được vân tay)'}`);

    return new Response(JSON.stringify({
      synced: true,
      reason: force ? 'forced' : previousFingerprint ? 'content_changed' : 'no_previous_fingerprint',
      rows: toUpsert.length,
      sold: soldPhones.size,
      skippedSold,
      newIds,
      invalidPrice: invalidPriceCount,
      reconcile,
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

/** Đếm bằng content-range, không chuyển hàng nào (cùng cách với countSims). */
async function countWhere(supabaseUrl: string, serviceKey: string, filter: string): Promise<number> {
  const res = await fetch(`${supabaseUrl}/rest/v1/sims?select=id&limit=0&${filter}`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, Prefer: 'count=exact' },
  });
  const m = (res.headers.get('content-range') || '').match(/\/(\d+)$/);
  if (!res.ok || !m) throw new Error(`đếm sims (${filter}) HTTP ${res.status}`);
  return Number(m[1]);
}

/**
 * Chuyển sang STATUS_REMOVED mọi số 'available' KHÔNG có trong bảng số lượt này,
 * tức `source_updated_at` cũ hơn mốc `syncStamp` mà bước upsert vừa ghi cho mọi
 * dòng còn trong bảng số. Chỉ gọi SAU khi upsert xong hết các batch.
 */
async function retireMissing(
  supabaseUrl: string,
  serviceKey: string,
  syncStamp: string,
  forceReconcile: boolean,
): Promise<{ removed: number; skipped?: string; sample?: { id: string; kho: string | null }[] }> {
  const filter = `status=eq.available&or=(source_updated_at.is.null,source_updated_at.lt.${syncStamp})`;
  const stale = await countWhere(supabaseUrl, serviceKey, filter);
  if (stale === 0) return { removed: 0 };

  const available = await countWhere(supabaseUrl, serviceKey, 'status=eq.available');
  if (!forceReconcile && stale > available * MAX_REMOVE_RATIO) {
    const skipped = `${stale}/${available} số đang bán vắng mặt trong bảng số (> ${MAX_REMOVE_RATIO * 100}%) — nghi bảng số cụt, KHÔNG gỡ. Đúng là rút kho thì gọi ?force=1&reconcile=force`;
    console.warn(`[sync-sims] ${skipped}`);
    return { removed: 0, skipped };
  }

  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json' };
  const sampleRes = await fetch(`${supabaseUrl}/rest/v1/sims?select=id,kho&limit=20&${filter}`, { headers });
  const sample = sampleRes.ok ? await sampleRes.json() : [];

  const res = await fetch(`${supabaseUrl}/rest/v1/sims?${filter}`, {
    method: 'PATCH',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify({ status: STATUS_REMOVED, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) throw new Error(`gỡ số rời bảng số HTTP ${res.status}: ${await res.text()}`);
  console.log(`[sync-sims] Gỡ ${stale} số không còn trong bảng số → status='${STATUS_REMOVED}'. Mẫu:`, JSON.stringify(sample));
  return { removed: stale, sample };
}

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

/**
 * Đánh dấu sold MỌI dòng mang số đã bán, bất kể SimID — số bán dưới SimID của
 * kho khác vẫn bị bắt. Không ghi `sold_sims`: bảng đó khoá theo SimID, và số đã
 * bán vốn đã bị loại khỏi tập upsert nên không thể còn 'available'; bước này chỉ
 * cho status trong DB nói đúng sự thật ('sold' thay vì 'removed').
 */
async function markSoldByPhone(supabaseUrl: string, serviceKey: string, phones: Set<string>): Promise<void> {
  if (phones.size === 0) return;
  const list = Array.from(phones);
  const headers = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' };
  // 500 số × 11 ký tự ≈ 5,5KB query string — dưới hẳn giới hạn URL của gateway.
  for (let i = 0; i < list.length; i += 500) {
    const inList = list.slice(i, i + 500).join(',');
    const res = await fetch(`${supabaseUrl}/rest/v1/sims?status=neq.sold&raw_digits=in.(${inList})`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status: 'sold', updated_at: new Date().toISOString() }),
    });
    if (!res.ok) console.warn('[sync-sims] markSoldByPhone patch warn:', res.status);
  }
}
