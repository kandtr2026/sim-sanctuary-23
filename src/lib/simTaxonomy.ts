/**
 * Single source of truth for the SIM "đầu số / loại" taxonomy.
 *
 * Previously this data was hardcoded (and drifting) in three places:
 *   - src/app/sim-dau-so/[dauso]/page.tsx        (8 đầu số)
 *   - src/app/sim-dau-so/[dauso]/[loai]/page.tsx (24 combo)
 *   - src/app/sitemap.ts
 * Those now all import from here.
 *
 * ⚠️ Do NOT rename `DAU_SO_PREFIXES` — Front's /sim-dau-so hub imports it by
 *    this exact name.
 * ⚠️ These values are LIVE URLs (8 đầu số + 24 combo trang đang được index).
 *    Chỉ THÊM, đừng đổi/bớt nếu chưa thống nhất với HaDT — đổi ở đây là đổi URL.
 */

// Mobifone đầu số có trang landing riêng. Thứ tự giữ nguyên như bản hardcode cũ.
export const DAU_SO_PREFIXES: string[] = [
  "090",
  "093",
  "070",
  "076",
  "077",
  "078",
  "079",
  "089",
];

/** True when `v` is one of the đầu số that has a dedicated page. */
export const isDauSoPrefix = (v: string): boolean => DAU_SO_PREFIXES.includes(v);

/**
 * Combo "sim [loại] × đầu số" — chỉ các loại đuôi an toàn (không dính rủi ro
 * phong thủy chưa kiểm chứng). `label`/`suffixes`/`y` giữ nguyên nội dung cũ.
 */
export const LOAI = {
  "than-tai": {
    label: "thần tài",
    suffixes: ["39", "79"],
    y: "đuôi 39 (thần tài nhỏ), 79 (thần tài lớn) — cầu tài lộc, buôn may bán đắt",
  },
  "loc-phat": {
    label: "lộc phát",
    suffixes: ["68", "86"],
    y: "đuôi 68 (lộc phát), 86 (phát lộc) — cầu phát đạt",
  },
  "ong-dia": {
    label: "ông địa",
    suffixes: ["38", "78"],
    y: "đuôi 38, 78 — ông địa, giữ của",
  },
} as const;

export type LoaiKey = keyof typeof LOAI;

/** Ordered list of loại keys (than-tai, loc-phat, ong-dia). */
export const LOAI_KEYS = Object.keys(LOAI) as LoaiKey[];

/** True when `v` is a known loại key. */
export const isLoaiKey = (v: string): v is LoaiKey =>
  Object.prototype.hasOwnProperty.call(LOAI, v);
