/**
 * T11 — A/B test scaffolding cho card Zalo button.
 *
 * `getCardZaloVariant()` trả về "A" (control) hoặc "B" (test), ổn định
 * theo visitor (localStorage). Mặc định exposure = 0 (100% A) — không ảnh
 * hưởng traffic live. Để chạy A/B thật, sửa `EXPOSURE_PCT` > 0.
 *
 * Cách sử dụng:
 *   - `SIMCardNew` đọc variant → render style khác nhau.
 *   - `useConversionTracker` ghi variant vào DB để sau đó so sánh.
 *
 * Khi muốn bật A/B:
 *   1. Sửa `EXPOSURE_PCT` thành 50 (hoặc % mong muốn).
 *   2. Deploy.
 *   3. Chờ N ngày (tuỳ lượng traffic), query:
 *      SELECT variant, count(*) as clicks
 *      FROM conversion_clicks
 *      WHERE type = 'zalo' AND variant IS NOT NULL
 *      GROUP BY variant;
 *   4. Quyết định thắng/thua, xoá code variant B, set EXPOSURE_PCT = 0.
 */
const STORAGE_KEY = "exp_card_zalo";
const EXPOSURE_PCT = 0; // 0 = 100% control (A); 50 = 50/50

type Variant = "A" | "B";

/** Seed-based hash ổn định trong session. */
const hashStr = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
};

export function getCardZaloVariant(): Variant {
  if (typeof window === "undefined") return "A";

  const stored = window.localStorage.getItem(STORAGE_KEY) as Variant | null;
  if (stored === "A" || stored === "B") return stored;

  // Gán ngẫu nhiên dùng hash của session-identifier
  const sid = window.sessionStorage.getItem("sid") || crypto.randomUUID();
  window.sessionStorage.setItem("sid", sid);
  const bucket = hashStr(sid) % 100; // 0–99
  const variant: Variant = bucket < EXPOSURE_PCT ? "B" : "A";

  window.localStorage.setItem(STORAGE_KEY, variant);
  return variant;
}