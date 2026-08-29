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
 *
 * Đầu số 4 chữ số (0909, 0938…) KHÔNG liệt kê tay ở đây. Danh sách sinh trang
 * đi theo tồn kho thật, xem `getInStockDauSo4Prefixes()` trong
 * `src/app/sim-dau-so/inventory.ts` — cùng khuôn với `getInStockBirthYears()`.
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

/**
 * Ngưỡng tồn kho để MỞ một trang đầu số 4 chữ số (`/sim-dau-so/0909`).
 *
 * Vì sao cần ngưỡng: dải 090x/093x nghe như "chuẩn thị trường" nhưng kho thật
 * lệch rất mạnh — đo 29/08/2026 trên 49.093 số đang bán: 0909 có 7.664 số, còn
 * 0904 có 1, 0905 có 1, 0936 có 5, 0908 có 7, 0933 có 12, 0907 có 64. Mở đủ
 * 090x/093x là tự tạo hàng chục trang mỏng.
 *
 * 300 số ≈ mười lượt tải lưới (30 số/lượt) → trang có thật hàng để xem, và mức
 * này cắt đúng chỗ dữ liệu tự giãn ra (0776 = 300, kế tiếp tụt xuống 284 → 193).
 * Prefix dưới ngưỡng vẫn render được (link cũ không vỡ) nhưng `noindex, follow`.
 */
export const DAU_SO4_MIN_INVENTORY = 300;

/**
 * Ngưỡng tồn kho để MỞ một trang combo `đầu số × loại đuôi`
 * (`/sim-dau-so/090/than-tai`).
 *
 * Route combo trước đây không có ngưỡng nào, nên 6 trang mỏng đã vào chỉ mục:
 * 079/ong-dia 16 số, 079/than-tai 18, 079/loc-phat 25, 078/ong-dia 43,
 * 089/ong-dia 67, 076/ong-dia 68 (đo 29/08/2026). 80 số ≈ gần ba lượt tải lưới,
 * vượt mốc mỏng nhất kia một khoảng an toàn, mà vẫn giữ được các combo có hàng
 * thật. Combo dưới ngưỡng: vẫn render, nhưng `noindex, follow` và không được
 * cross-link.
 */
export const COMBO_MIN_INVENTORY = 80;

/** True when `v` is one of the 8 đầu số 3 chữ số (URL đang được index). */
export const isDauSo3Prefix = (v: string): boolean => DAU_SO_PREFIXES.includes(v);

/**
 * True when `v` là đầu số 4 chữ số thuộc một dải MobiFone bên trên (0909, 0938…).
 * Cửa này giữ taxonomy chỉ có MobiFone: 0912 (Vinaphone) không lọt vào route,
 * nên câu "đầu số này thuộc MobiFone" trên trang luôn đúng.
 */
export const isDauSo4Prefix = (v: string): boolean =>
  /^\d{4}$/.test(v) && DAU_SO_PREFIXES.includes(v.slice(0, 3));

/** True when `v` is a đầu số the route accepts — 3 hoặc 4 chữ số. */
export const isDauSoPrefix = (v: string): boolean =>
  isDauSo3Prefix(v) || isDauSo4Prefix(v);

/** "0909" → "090"; "090" → null. Dùng cho breadcrumb + link về trang cha. */
export const dauSoParent = (v: string): string | null =>
  isDauSo4Prefix(v) ? v.slice(0, 3) : null;

/** Các đầu số 4 chữ số cùng dải với `v` (bỏ chính nó) trong danh sách `pool`. */
export const dauSoSiblings = (v: string, pool: string[]): string[] => {
  const family = isDauSo4Prefix(v) ? v.slice(0, 3) : v;
  return pool.filter((p) => p !== v && p.startsWith(family));
};

/**
 * Combo "sim [loại] × đầu số" — chỉ các loại đuôi an toàn (không dính rủi ro
 * phong thủy chưa kiểm chứng). `label`/`suffixes`/`y` giữ nguyên nội dung cũ.
 *
 * ⚠️ CHỈ THÊM key mới. than-tai / loc-phat / ong-dia là URL đang được index.
 *
 * `tu-quy` và `tam-hoa` thêm 29/08/2026 để bắt cụm "sim tứ quý đầu số 090",
 * "sim tam hoa đầu số 093". Hai loại này khớp theo ĐUÔI GIỐNG NHAU nên viết
 * thẳng 10 đuôi thay vì sinh bằng vòng lặp — `suffixes` chảy trực tiếp vào
 * `getCategorySnapshot` và `/api/sims?suffixes=`, đọc được là kiểm được.
 *
 * Lưu ý về giao nhau: đuôi "000" cũng khớp số tứ quý "0000". Trang tam hoa vì
 * thế là tập lớn hơn (gồm cả tứ quý) — câu chữ trên trang nói đúng như vậy
 * ("ba số cuối giống nhau"), không hứa loại trừ.
 *
 * `searchHint` chỉ để dựng placeholder ô tìm. Trước đây placeholder ghép
 * `suffixes[0]`/`suffixes[1]`, với loại 10 đuôi sẽ hiện "*0000 / *1111".
 */
export const LOAI = {
  "than-tai": {
    label: "thần tài",
    suffixes: ["39", "79"],
    y: "đuôi 39 (thần tài nhỏ), 79 (thần tài lớn) — cầu tài lộc, buôn may bán đắt",
    searchHint: "*39 / *79",
  },
  "loc-phat": {
    label: "lộc phát",
    suffixes: ["68", "86"],
    y: "đuôi 68 (lộc phát), 86 (phát lộc) — cầu phát đạt",
    searchHint: "*68 / *86",
  },
  "ong-dia": {
    label: "ông địa",
    suffixes: ["38", "78"],
    y: "đuôi 38, 78 — ông địa, giữ của",
    searchHint: "*38 / *78",
  },
  "tu-quy": {
    label: "tứ quý",
    suffixes: ["0000", "1111", "2222", "3333", "4444", "5555", "6666", "7777", "8888", "9999"],
    y: "bốn số cuối giống nhau (0000 → 9999) — dãy hiếm nhất trong kho, thường được chọn làm số đại diện",
    searchHint: "*8888 / *9999",
  },
  "tam-hoa": {
    label: "tam hoa",
    suffixes: ["000", "111", "222", "333", "444", "555", "666", "777", "888", "999"],
    y: "ba số cuối giống nhau (000 → 999) — đọc một lần là nhớ, giá mềm hơn tứ quý",
    searchHint: "*888 / *999",
  },
} as const;

export type LoaiKey = keyof typeof LOAI;

/** Ordered list of loại keys (than-tai, loc-phat, ong-dia, tu-quy, tam-hoa). */
export const LOAI_KEYS = Object.keys(LOAI) as LoaiKey[];

/**
 * 3 loại đuôi ĐÃ CÓ TRANG TỪ TRƯỚC (8 đầu số × 3 loại = 24 URL đang được index).
 * Route combo luôn prerender đúng 24 URL này dù tồn kho có tụt dưới ngưỡng, để
 * không có URL đang index nào rơi xuống render on-demand.
 */
export const LOAI_KEYS_LEGACY: LoaiKey[] = ["than-tai", "loc-phat", "ong-dia"];

/** True when `v` is a known loại key. */
export const isLoaiKey = (v: string): v is LoaiKey =>
  Object.prototype.hasOwnProperty.call(LOAI, v);

/** Khoá phẳng cho map tồn kho combo: ("0909", "than-tai") → "0909|than-tai". */
export const comboKey = (dauso: string, loai: LoaiKey): string => `${dauso}|${loai}`;
