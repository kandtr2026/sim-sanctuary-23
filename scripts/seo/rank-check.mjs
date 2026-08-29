#!/usr/bin/env node
/**
 * Báo cáo thứ hạng Google theo danh sách từ khoá mục tiêu.
 * Xem đầu file scripts/seo/gsc-auth.mjs cho cách cấu hình và GIỚI HẠN của số liệu.
 *
 *   node scripts/seo/rank-check.mjs
 *   node scripts/seo/rank-check.mjs --ngay 90
 *   node scripts/seo/rank-check.mjs --json > docs/seo/rank-2026-08-29.json
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { napEnv, thieuBien, layAccessToken, BIEN } from './gsc-auth.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const DS_TU_KHOA = join(HERE, 'keywords.json');

const args = process.argv.slice(2);
const soNgay = Number(args[args.indexOf('--ngay') + 1]) || 28;
const raJson = args.includes('--json');

// GSC tính ngày theo giờ Thái Bình Dương; sinh chuỗi ngày theo đúng múi đó để
// không lệch một ngày so với dữ liệu Google. Bỏ "hôm nay" vì chưa có dữ liệu.
const ngayPT = (lui) =>
  new Date(Date.now() - lui * 86_400_000).toLocaleDateString('en-CA', {
    timeZone: 'America/Los_Angeles',
  });

const truyVan = async (token, site, than) => {
  const res = await fetch(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(site)}/searchAnalytics/query`,
    {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(than),
      signal: AbortSignal.timeout(20_000),
    },
  );
  if (!res.ok) {
    const chiTiet = await res.text().catch(() => '');
    if (res.status === 401 || res.status === 403) {
      throw new Error(
        `Search Console từ chối (${res.status}). Kiểm tra đã thêm email service account vào ` +
          `Cài đặt → Người dùng và quyền của property chưa.\n${chiTiet.slice(0, 300)}`,
      );
    }
    if (res.status === 404) {
      throw new Error(
        `Không thấy property "${site}" (404). Kiểm tra ${BIEN.site} viết đúng dạng chưa: ` +
          `"sc-domain:chonsomobifone.com" cho property Domain, hoặc "https://www.chonsomobifone.com/" ` +
          `(có dấu / cuối) cho property URL-prefix.`,
      );
    }
    throw new Error(`Search Console lỗi HTTP ${res.status}: ${chiTiet.slice(0, 300)}`);
  }
  return (await res.json()).rows || [];
};

const chuanHoa = (s) => String(s || '').toLowerCase().replace(/\s+/g, ' ').trim();

const main = async () => {
  napEnv();

  const thieu = thieuBien();
  if (thieu.length) {
    console.error(
      `\nChưa cấu hình Search Console cho chonsomobifone.com. Thiếu biến: ${thieu.join(', ')}\n\n` +
        `Các bước làm một lần:\n` +
        `  1. Search Console → thêm property chonsomobifone.com (nên chọn Domain property).\n` +
        `  2. Google Cloud → tạo service account, tạo key JSON.\n` +
        `  3. Search Console → Cài đặt → Người dùng và quyền → thêm email service account,\n` +
        `     quyền "Đầy đủ" hoặc "Bị hạn chế" (chỉ đọc là đủ).\n` +
        `  4. Đặt 3 biến trong .env.local:\n` +
        `       ${BIEN.site}=sc-domain:chonsomobifone.com\n` +
        `       ${BIEN.email}=…@….iam.gserviceaccount.com\n` +
        `       ${BIEN.key}="-----BEGIN PRIVATE KEY-----\\n…"\n\n` +
        `Lưu ý: GSC chỉ có dữ liệu từ lúc property được thêm trở đi — thêm hôm nay thì\n` +
        `phải chờ vài ngày mới có số, không truy hồi được quá khứ.\n`,
    );
    process.exit(1);
  }

  if (!existsSync(DS_TU_KHOA)) {
    console.error(`Chưa có danh sách từ khoá: ${DS_TU_KHOA}`);
    process.exit(1);
  }
  const dsGoc = JSON.parse(readFileSync(DS_TU_KHOA, 'utf8'));
  const ds = Array.isArray(dsGoc) ? dsGoc : dsGoc.keywords || [];

  const site = process.env[BIEN.site];
  const token = await layAccessToken();
  const khoang = { startDate: ngayPT(soNgay + 1), endDate: ngayPT(1) };

  // Lấy tối đa 25k truy vấn của cả kỳ rồi đối chiếu tại chỗ. Gọi từng từ khoá một
  // sẽ tốn hàng trăm request và vẫn không chính xác hơn.
  const rows = await truyVan(token, site, {
    ...khoang,
    dimensions: ['query', 'page'],
    rowLimit: 25_000,
    dataState: 'final',
  });

  const theoTuKhoa = new Map();
  for (const r of rows) {
    const [query, page] = r.keys;
    const k = chuanHoa(query);
    const cu = theoTuKhoa.get(k);
    // Một truy vấn có thể khớp nhiều URL; giữ URL có nhiều impression nhất.
    if (!cu || r.impressions > cu.impressions) {
      theoTuKhoa.set(k, { query, page, position: r.position, impressions: r.impressions, clicks: r.clicks, ctr: r.ctr });
    }
  }

  const ketQua = ds.map((tk) => {
    const tuKhoa = typeof tk === 'string' ? tk : tk.tuKhoa;
    const d = theoTuKhoa.get(chuanHoa(tuKhoa));
    return {
      tuKhoa,
      nhom: typeof tk === 'string' ? '' : tk.nhom || '',
      urlDich: typeof tk === 'string' ? '' : tk.urlDich || '',
      hang: d ? Number(d.position.toFixed(1)) : null,
      urlThucTe: d ? d.page : null,
      impressions: d ? d.impressions : 0,
      clicks: d ? d.clicks : 0,
    };
  });

  if (raJson) {
    console.log(JSON.stringify({ site, khoang, soNgay, ketQua }, null, 2));
    return;
  }

  const coSo = ketQua.filter((r) => r.hang !== null).sort((a, b) => a.hang - b.hang);
  const chuaCo = ketQua.filter((r) => r.hang === null);

  const bang = (ten, list) => {
    if (!list.length) return;
    console.log(`\n## ${ten} (${list.length})`);
    for (const r of list) {
      const sai = r.urlDich && r.urlThucTe && !r.urlThucTe.includes(r.urlDich) ? '  ⚠ URL khác trang đích' : '';
      console.log(
        `  ${String(r.hang).padStart(5)}  ${String(r.impressions).padStart(6)} hiện  ` +
          `${String(r.clicks).padStart(4)} click  ${r.tuKhoa}${sai}`,
      );
    }
  };

  console.log(`Site: ${site}`);
  console.log(`Kỳ: ${khoang.startDate} → ${khoang.endDate} (${soNgay} ngày)`);
  console.log(`Từ khoá theo dõi: ${ds.length} — có dữ liệu: ${coSo.length}, chưa từng hiện: ${chuaCo.length}`);

  bang('ĐANG TOP 1', coSo.filter((r) => r.hang < 1.5));
  bang('TOP 2-3 — đẩy lên 1 là rẻ nhất', coSo.filter((r) => r.hang >= 1.5 && r.hang < 3.5));
  bang('TOP 4-10', coSo.filter((r) => r.hang >= 3.5 && r.hang <= 10.5));
  bang('TRANG 2 (11-20) — sửa on-page là có thể vào trang 1', coSo.filter((r) => r.hang > 10.5 && r.hang <= 20.5));
  bang('SAU TRANG 2', coSo.filter((r) => r.hang > 20.5));

  if (chuaCo.length) {
    console.log(`\n## CHƯA CÓ DỮ LIỆU (${chuaCo.length})`);
    console.log('  GSC không có dòng nào cho các từ khoá này trong kỳ — nghĩa là site chưa từng');
    console.log('  hiện ra cho chúng, KHÔNG phải hạng kém. Muốn biết đang đứng thứ mấy thì cần');
    console.log('  API SERP trả phí.');
    for (const r of chuaCo) console.log(`  - ${r.tuKhoa}${r.urlDich ? `  → ${r.urlDich}` : ''}`);
  }
};

main().catch((e) => {
  console.error(`\n${e.message}\n`);
  process.exit(1);
});
