/**
 * UTM / click-ID attribution capture.
 *
 * Google Ads & Meta land on the site with `?gclid=…` / `?fbclid=…` (and often
 * no referrer), which the referrer-based `classifySource` buckets as "direct".
 * This module snapshots the UTM params on the FIRST landing (first-touch) into
 * sessionStorage and lets the tracking hooks attach them to `conversion_clicks`
 * and `page_visits`, so the admin dashboard can show which campaign a lead came
 * from — even after internal navigation.
 *
 * Server-safe: every browser access is guarded with `typeof window`.
 */

const ATTR_KEY = "attr";
const ATTR_PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
] as const;

export type Attribution = Record<string, string | null>;

/**
 * Persist the attribution params of the current URL into sessionStorage.
 * First-touch: only writes when nothing has been captured in this session yet,
 * so navigating internally later never overwrites the original campaign.
 */
export function captureAttribution(): void {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const attr: Attribution = {};
  let found = false;
  for (const key of ATTR_PARAMS) {
    const value = params.get(key);
    if (value) {
      attr[key] = value;
      found = true;
    }
  }
  if (!found) return;

  try {
    if (!sessionStorage.getItem(ATTR_KEY)) {
      sessionStorage.setItem(ATTR_KEY, JSON.stringify(attr));
    }
  } catch {
    // sessionStorage can be blocked (private mode / security settings) —
    // attribution is a nice-to-have, never break the page.
  }
}

/**
 * Read back the captured attribution (empty object if none / on the server).
 * Safe to spread into a Supabase insert payload: extra keys map to columns,
 * and missing keys simply stay undefined.
 */
export function getAttribution(): Attribution {
  if (typeof window === "undefined") return {};

  try {
    const raw = sessionStorage.getItem(ATTR_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null
      ? (parsed as Attribution)
      : {};
  } catch {
    return {};
  }
}

// ── Nguồn vào lần đầu (first-touch source) ──────────────────────────────────────
//
// TẠI SAO: `classifySource(document.referrer)` đọc referrer TẠI THỜI ĐIỂM ghi.
// Khi khách vào từ Google rồi bấm loanh quanh trong web bằng điều hướng full-load,
// referrer đổi thành trang cùng tên miền → nguồn bị rớt thành "internal" (Nội bộ),
// hoặc mất hẳn → "direct" (Trực tiếp). Kết quả là dashboard hiểu sai khách "từ đâu
// đến" (đúng lo ngại của A Khoa: khách mò từ Google mà lại ghi Trực tiếp/Nội bộ).
//
// Giải pháp: chốt nguồn NGAY LẦN VÀO ĐẦU (first-touch) vào sessionStorage rồi dùng
// lại cho mọi lượt xem + chuyển đổi trong phiên. Lưu ý: nếu khách vào từ app
// (Zalo/FB/TikTok in-app) hay Google bị chặn referrer thì lần đầu cũng rỗng →
// vẫn là "Trực tiếp / không rõ"; chỉ gắn UTM vào link mình kiểm soát mới chắc chắn.

const SRC_KEY = "attr_src";

export interface FirstTouchSource {
  source: string;
  referrer: string | null;
}

/** Chốt nguồn lần vào đầu (no-op nếu phiên đã có). Hook truyền source đã phân loại. */
export function captureFirstTouchSource(source: string, referrer: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!sessionStorage.getItem(SRC_KEY)) {
      sessionStorage.setItem(SRC_KEY, JSON.stringify({ source, referrer }));
    }
  } catch {
    // sessionStorage bị chặn → bỏ qua, tracking không bao giờ làm hỏng trang.
  }
}

/** Đọc nguồn lần vào đầu; null nếu chưa có / trên server. */
export function getFirstTouchSource(): FirstTouchSource | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(SRC_KEY);
    if (!raw) return null;
    const p: unknown = JSON.parse(raw);
    if (p && typeof p === "object" && typeof (p as FirstTouchSource).source === "string") {
      return p as FirstTouchSource;
    }
    return null;
  } catch {
    return null;
  }
}
