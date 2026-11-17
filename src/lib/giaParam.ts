import { PRICE_RANGES } from "@/lib/simUtils";

/**
 * Tham số `?gia=` cho các trang mệnh (/sim-theo-menh/[hanh], /sim-hop-menh/[hanh])
 * và link mệnh từ sidebar trang chủ.
 *
 * Mỗi bậc trong PRICE_RANGES (9 bậc, nguồn duy nhất của biên giá) có một slug
 * đọc được trên URL — Google Ads và link chia sẻ trỏ thẳng vào được:
 *   duoi-1 · 1-3 · 3-5 · 5-10 · 10-50 · 50-100 · 100-200 · 200-500 · tren-500
 * cộng thêm slug gộp `tren-50` (= 4 bậc cuối) khớp nút "Trên 50 triệu".
 * Nhiều khoảng nối bằng dấu phẩy: `?gia=3-5,5-10`.
 *
 * File này KHÔNG import gì nặng (chạy cả ở client).
 */

/** Slug cho từng chỉ số PRICE_RANGES (cùng thứ tự). */
export const GIA_SLUGS = [
  "duoi-1",
  "1-3",
  "3-5",
  "5-10",
  "10-50",
  "50-100",
  "100-200",
  "200-500",
  "tren-500",
] as const;

if (GIA_SLUGS.length !== PRICE_RANGES.length) {
  // Thêm/bớt bậc ở PRICE_RANGES mà quên ở đây thì báo ngay khi build/test.
  throw new Error("giaParam: GIA_SLUGS phải khớp số bậc của PRICE_RANGES");
}

/** Chỉ số các bậc "Trên 50 triệu" (50–100, 100–200, 200–500, >500). */
const TREN_50 = [5, 6, 7, 8];
const TREN_50_SLUG = "tren-50";

/**
 * Hàng nút "Mức giá" — cùng bộ với CategorySimGrid (Tất cả, <1tr, 1–3, 3–5,
 * 5–10, 10–50, >50tr). `ranges` là chỉ số PRICE_RANGES.
 */
export const GIA_FILTERS: readonly { label: string; ranges: readonly number[] }[] = [
  { label: "Tất cả giá", ranges: [] },
  { label: "Dưới 1 triệu", ranges: [0] },
  { label: "1 - 3 triệu", ranges: [1] },
  { label: "3 - 5 triệu", ranges: [2] },
  { label: "5 - 10 triệu", ranges: [3] },
  { label: "10 - 50 triệu", ranges: [4] },
  { label: "Trên 50 triệu", ranges: TREN_50 },
];

const SLUG_TO_RANGES: Record<string, number[]> = {
  ...Object.fromEntries(GIA_SLUGS.map((s, i) => [s, [i]])),
  [TREN_50_SLUG]: TREN_50,
};

/** Chuẩn hoá một mẩu slug: "5-10tr", "5–10 triệu", "5_10" → "5-10". */
const normalizeSlug = (raw: string): string =>
  raw
    .trim()
    .toLowerCase()
    .replace(/[–—_\s]+/g, "-")
    .replace(/-?(tr|trieu|triệu)$/, "")
    .replace(/^-+|-+$/g, "");

/**
 * `?gia=` → danh sách chỉ số PRICE_RANGES (tăng dần, không trùng). Mẩu không
 * hợp lệ bị bỏ qua; không còn gì thì trả [] (= tất cả giá).
 */
export const parseGia = (raw: string | string[] | null | undefined): number[] => {
  if (raw == null) return [];
  const joined = Array.isArray(raw) ? raw.join(",") : raw;
  const out = new Set<number>();
  for (const part of joined.split(",")) {
    const ranges = SLUG_TO_RANGES[normalizeSlug(part)];
    if (ranges) ranges.forEach((i) => out.add(i));
  }
  return [...out].sort((a, b) => a - b);
};

/**
 * Danh sách chỉ số PRICE_RANGES → giá trị `?gia=` chuẩn (null khi rỗng = không
 * gắn tham số). Đủ 4 bậc trên 50 triệu thì gộp thành `tren-50`.
 */
export const formatGia = (ranges: readonly number[]): string | null => {
  const set = new Set(ranges.filter((i) => Number.isInteger(i) && i >= 0 && i < GIA_SLUGS.length));
  if (set.size === 0) return null;
  const parts: string[] = [];
  const gopTren50 = TREN_50.every((i) => set.has(i));
  for (let i = 0; i < GIA_SLUGS.length; i++) {
    if (!set.has(i)) continue;
    if (gopTren50 && TREN_50.includes(i)) {
      if (i === TREN_50[0]) parts.push(TREN_50_SLUG);
      continue;
    }
    parts.push(GIA_SLUGS[i]);
  }
  return parts.join(",");
};

/** Có chỉ số nào của `ranges` khớp giá này không ([] = mọi giá). */
export const giaKhop = (price: number, ranges: readonly number[]): boolean =>
  ranges.length === 0 ||
  ranges.some((i) => {
    const r = PRICE_RANGES[i];
    return r !== undefined && price >= r.min && price <= r.max;
  });

const trieu = (vnd: number): string => String(Math.round(vnd / 1_000_000));

/**
 * Nhãn cho câu đếm: các bậc liền nhau gộp lại ("3-5,5-10" → "3–10 triệu",
 * "tren-50" → "trên 50 triệu", "duoi-1,1-3" → "dưới 3 triệu").
 */
export const giaLabel = (ranges: readonly number[]): string => {
  const idx = [...new Set(ranges)].filter((i) => PRICE_RANGES[i]).sort((a, b) => a - b);
  if (idx.length === 0) return "mọi mức giá";
  const runs: [number, number][] = [];
  for (const i of idx) {
    const last = runs[runs.length - 1];
    if (last && last[1] === i - 1) last[1] = i;
    else runs.push([i, i]);
  }
  const parts = runs.map(([a, b]) => {
    const lo = PRICE_RANGES[a].min;
    const hiMax = PRICE_RANGES[b].max;
    if (!Number.isFinite(hiMax)) return `trên ${trieu(lo)} triệu`;
    const hi = hiMax + 1;
    if (lo <= 0) return `dưới ${trieu(hi)} triệu`;
    return `${trieu(lo)}–${trieu(hi)} triệu`;
  });
  return parts.join(", ");
};

/** Nút đang sáng khi khoảng giá đã chọn có chạm vào bậc của nút. */
export const giaNutDangChon = (nut: readonly number[], chon: readonly number[]): boolean =>
  nut.length === 0 ? chon.length === 0 : nut.some((i) => chon.includes(i));

/** Ghép `?gia=` vào một đường dẫn (bỏ qua khi không chọn giá). */
export const withGia = (path: string, ranges: readonly number[]): string => {
  const gia = formatGia(ranges);
  return gia ? `${path}?gia=${gia}` : path;
};

/** Câu đếm: "1.261 số hợp mệnh Thổ giá 5–10 triệu". */
export const cauDemMenhGia = (total: number, hanh: string, ranges: readonly number[]): string =>
  `${total.toLocaleString("vi-VN")} số hợp mệnh ${hanh} giá ${giaLabel(ranges)}`;
