/**
 * Kiểm thứ hạng Google của chonsomobifone.com theo danh sách từ khoá.
 *
 * Chạy:  node scripts/seo/rank-check.mjs            (28 ngày gần nhất)
 *        node scripts/seo/rank-check.mjs --ngay 90  (90 ngày)
 *        node scripts/seo/rank-check.mjs --json      (xuất JSON để so đợt sau)
 *
 * NGUỒN SỐ: Google Search Console (searchAnalytics.query). Đây là thứ hạng THẬT
 * mà Google ghi nhận cho chính site này, không phải kết quả scrape — nên nó không
 * bị ảnh hưởng bởi cá nhân hoá, vị trí người tra, hay việc Google chặn bot.
 *
 * GIỚI HẠN PHẢI BIẾT TRƯỚC KHI ĐỌC BÁO CÁO: GSC chỉ có dữ liệu cho truy vấn mà
 * site ĐÃ từng hiện ra. Từ khoá chưa bao giờ có impression sẽ không có dòng nào —
 * cột thứ hạng để trống, KHÔNG phải "hạng 0" và cũng không có nghĩa là hạng kém.
 * Muốn biết mình đang đứng thứ mấy cho một từ khoá chưa từng hiện thì phải dùng
 * API SERP trả phí; GSC không trả lời được câu đó.
 *
 * Ngoài ra: "position" của GSC là VỊ TRÍ TRUNG BÌNH có trọng số theo impression
 * trong cả kỳ, nên 1,4 nghĩa là phần lớn lần hiện ở hạng 1-2, không phải "chưa
 * bao giờ hạng 1".
 *
 * Cần 3 biến môi trường (đặt trong .env.local hoặc export trước khi chạy):
 *   GSC_SIM_SITE_URL      "sc-domain:chonsomobifone.com" hoặc
 *                         "https://www.chonsomobifone.com/"
 *   GSC_SIM_CLIENT_EMAIL  email service account (…@….iam.gserviceaccount.com)
 *   GSC_SIM_PRIVATE_KEY   private key của service account (giữ nguyên \n literal)
 *
 * Repo anh em heoiu đã làm y hệt cho kitleather/koileather (xem lib/gsc.js) — cùng
 * khuôn: mỗi site một bộ ba biến riêng, vì hai site là hai project Google Cloud,
 * ký bằng key site này để đòi số site kia thì Google trả 404 mà không nói vì sao.
 */

import { createSign } from 'node:crypto';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = join(HERE, '..', '..');

const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly';
const CHO_MS = 20_000;

// ── Đọc .env.local để không phải export tay mỗi lần chạy ────────────────────
const napEnv = () => {
  for (const ten of ['.env.local', '.env']) {
    const p = join(REPO, ten);
    if (!existsSync(p)) continue;
    for (const dong of readFileSync(p, 'utf8').split(/\r?\n/)) {
      const m = dong.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
      if (!m) continue;
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!process.env[m[1]]) process.env[m[1]] = v;
    }
  }
};

const BIEN = {
  site: 'GSC_SIM_SITE_URL',
  email: 'GSC_SIM_CLIENT_EMAIL',
  key: 'GSC_SIM_PRIVATE_KEY',
};

/**
 * Chỉ email + key là BẮT BUỘC. `GSC_SIM_SITE_URL` là tuỳ chọn: `chonProperty()`
 * trong rank-check.mjs gọi `sites.list` để tự tìm property của
 * chonsomobifone.com, nên không ai phải đoán property là dạng Domain
 * ("sc-domain:…") hay URL-prefix ("https://www.…/"). Đặt biến này chỉ để ghim
 * cứng khi một service account có quyền trên nhiều property cùng tên miền.
 */
const thieuBien = () => [BIEN.email, BIEN.key].filter((b) => !String(process.env[b] || '').trim());

// ── JWT tự ký: rẻ hơn kéo cả google-auth-library vào repo cho một script ────
const b64url = (buf) =>
  Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

const layAccessToken = async () => {
  const email = process.env[BIEN.email];
  // Trên Vercel/CI private key thường dán một dòng với "\n" literal.
  const key = String(process.env[BIEN.key]).replace(/\\n/g, '\n');
  const now = Math.floor(Date.now() / 1000);

  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(
    JSON.stringify({
      iss: email,
      scope: SCOPE,
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    }),
  );
  const sign = createSign('RSA-SHA256');
  sign.update(`${header}.${claim}`);
  const jwt = `${header}.${claim}.${b64url(sign.sign(key))}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
    signal: AbortSignal.timeout(CHO_MS),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error(
      `Không lấy được access token (HTTP ${res.status}): ${data.error_description || data.error || 'không rõ'}`,
    );
  }
  return data.access_token;
};

export { napEnv, thieuBien, layAccessToken, BIEN };
