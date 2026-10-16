#!/usr/bin/env node
/**
 * Nạp file Excel bảng số của nhà cung cấp vào bảng `sims_bang_so` — nguồn kho +
 * giá của web (xem supabase/migrations/20261016100000_sims_bang_so.sql).
 *
 *   node scripts/bang-so/import.mjs "C:\...\BANG SO THÁNG 10_2026.xlsx"            # nạp
 *   node scripts/bang-so/import.mjs "<file.xlsx>" --dry-run                         # chỉ đọc + thống kê
 *   node scripts/bang-so/import.mjs "<file.xlsx>" --sync                            # nạp rồi chạy sync-sims
 *
 * Khoá: lấy SUPABASE_SERVICE_ROLE_KEY từ env nếu có, không thì mượn Supabase CLI
 * đã đăng nhập (`supabase projects api-keys`) — không ghi khoá ra file nào.
 *
 * Nạp kiểu THAY TOÀN BỘ nhưng an toàn khi đứt giữa chừng: upsert mọi dòng với
 * mốc `imported_at` mới, XONG HẾT mới xoá dòng mang mốc cũ. Đứt giữa đường thì
 * bảng là hợp của bản cũ + một phần bản mới, không bao giờ cụt.
 */
import { execSync } from 'node:child_process';
import path from 'node:path';
import ExcelJS from 'exceljs';
import { MIN_ROWS, parseBangSo } from './parse.mjs';

const PROJECT_REF = 'xhlpawjvtqvtdkhjanwl';
const SUPABASE_URL = process.env.SUPABASE_URL || `https://${PROJECT_REF}.supabase.co`;
const TABLE = 'sims_bang_so';
const BATCH = 1000;

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const dryRun = args.includes('--dry-run');
const runSync = args.includes('--sync');

if (!file) {
  console.error('Thiếu đường dẫn file Excel. Vd: node scripts/bang-so/import.mjs "BANG SO THÁNG 10_2026.xlsx" --sync');
  process.exit(1);
}

/** Giá trị hiển thị của ô: công thức → kết quả, rich text → nối chữ, hyperlink → text. */
const cellValue = (v) => {
  if (v && typeof v === 'object') {
    if ('result' in v) return v.result;
    if ('richText' in v) return v.richText.map((t) => t.text).join('');
    if ('text' in v) return v.text;
  }
  return v;
};

const serviceKey = () => {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return process.env.SUPABASE_SERVICE_ROLE_KEY;
  const out = execSync(`npx supabase projects api-keys --project-ref ${PROJECT_REF} -o json`, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  });
  const key = JSON.parse(out).find((k) => k.name === 'service_role')?.api_key;
  if (!key) throw new Error('Supabase CLI không trả về service_role key — chạy `npx supabase login` trước.');
  return key;
};

const main = async () => {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const rows = [];
  for (const ws of wb.worksheets) {
    ws.eachRow({ includeEmpty: false }, (row, i) => {
      rows.push({
        sheet: ws.name,
        row: i,
        a: cellValue(row.getCell(1).value),
        b: cellValue(row.getCell(2).value),
        c: cellValue(row.getCell(3).value),
        e: cellValue(row.getCell(5).value),
      });
    });
  }

  const { items, invalidPrice, priceConflicts, duplicates, notPhone } = parseBangSo(rows);
  console.log(`[bang-so] ${path.basename(file)}: ${rows.length} dòng đọc, ${items.length} số hợp lệ, ${duplicates} dòng trùng, ${notPhone} dòng không phải số (tiêu đề/header), ${invalidPrice.length} số thiếu giá`);
  if (invalidPrice.length) console.warn('[bang-so] Số thiếu/sai giá (KHÔNG nạp):', invalidPrice.slice(0, 20));
  if (priceConflicts.length) console.warn(`[bang-so] ${priceConflicts.length} số trùng mà giá khác nhau (giữ dòng gặp trước):`, priceConflicts.slice(0, 20));
  if (items.length < MIN_ROWS) throw new Error(`Chỉ có ${items.length} số (< ${MIN_ROWS}) — nghi nhầm file, KHÔNG nạp.`);
  if (dryRun) return;

  const key = serviceKey();
  const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
  const stamp = new Date().toISOString();
  const nguon = path.basename(file);

  for (let i = 0; i < items.length; i += BATCH) {
    const batch = items.slice(i, i + BATCH).map(({ where: _where, ...r }) => ({ ...r, nguon, imported_at: stamp }));
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}`, {
      method: 'POST',
      headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify(batch),
    });
    if (!res.ok) throw new Error(`upsert batch ${i} HTTP ${res.status}: ${await res.text()}`);
  }

  const del = await fetch(`${SUPABASE_URL}/rest/v1/${TABLE}?imported_at=lt.${encodeURIComponent(stamp)}`, {
    method: 'DELETE',
    headers: { ...headers, Prefer: 'return=minimal,count=exact' },
  });
  if (!del.ok) throw new Error(`xoá bản cũ HTTP ${del.status}: ${await del.text()}`);
  const removed = (del.headers.get('content-range') || '').split('/')[1] ?? '?';
  console.log(`[bang-so] Đã nạp ${items.length} số vào ${TABLE}, xoá ${removed} số không còn trong file.`);

  if (!runSync) {
    console.log('[bang-so] Chưa chạy sync-sims (thêm --sync để web cập nhật ngay; không thì chờ cron).');
    return;
  }
  console.log('[bang-so] Chạy sync-sims...');
  const res = await fetch(`${SUPABASE_URL}/functions/v1/sync-sims`, { method: 'POST', headers });
  console.log(`[bang-so] sync-sims HTTP ${res.status}:`, await res.text());
  if (!res.ok) process.exit(1);
};

main().catch((e) => {
  console.error('[bang-so] Lỗi:', e instanceof Error ? e.message : e);
  process.exit(1);
});
