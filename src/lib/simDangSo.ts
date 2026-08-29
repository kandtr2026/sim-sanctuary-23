/**
 * Thống kê tồn kho cho HAI cụm trang programmatic mới:
 *
 *   1. Trang theo DẠNG SỐ  — /sim-tam-hoa, /sim-tam-hoa-kep, /sim-ganh-dao,
 *      /sim-lap-kep, /sim-de-nho, /sim-taxi, /sim-tien-len
 *   2. Trang theo KHOẢNG GIÁ — /sim-gia, /sim-gia/[dai]
 *
 * Vì sao có file này: mỗi trang cần nói "khoảng giá thật" và "còn bao nhiêu số"
 * bằng con số ĐANG ĐÚNG lúc render (revalidate 300s), chứ không phải số viết
 * cứng rồi mốc dần. Gom vào một chỗ để 12 trang không mỗi trang một cách đếm.
 *
 * RÀNG BUỘC QUAN TRỌNG — biên giá:
 *   Biên của mọi dải giá lấy TỪ `PRICE_RANGES` (src/lib/simUtils.ts). File này
 *   KHÔNG khai lại min/max. Repo từng có sự cố production vì tồn tại hai bảng
 *   biên giá song song (commit b6b9872: bản copy trong serverSimData lệch bậc 7
 *   → sinh `or=()` → PostgREST 400 → âm thầm rơi về lọc in-memory), nên slug của
 *   route `/sim-gia/[dai]` được nối vào `PRICE_RANGES` qua NHÃN, rồi min/max đọc
 *   ra từ đúng phần tử tìm được. Đổi thứ tự bảng gốc cũng không làm lệch trang.
 *
 * Mọi hàm ở đây chỉ ĐỌC `getServerSims()` (đã cache 300s ở module scope của
 * serverSimData) và lọc trong bộ nhớ — không thêm request nào cho mỗi trang.
 */

import { getServerSims } from "@/lib/serverSimData";
import { PRICE_RANGES, calculateBeautyScore } from "@/lib/simUtils";
import type { NormalizedSIM } from "@/lib/simUtils";

/**
 * Điểm đẹp dùng để xếp hạng "dãy đẹp nhất".
 *
 * Cột `beauty_score` của bảng `sims` hiện là 0 cho TOÀN BỘ 49.093 hàng (job
 * sync chưa ghi, cùng kiểu với `tags: []` đã ghi chú trong serverSimData). Nếu
 * xếp thẳng theo `sim.beautyScore`, mọi hàng bằng nhau nên danh sách "đẹp nhất"
 * âm thầm rơi về "rẻ nhất tiếp theo" — trang hứa một thứ rồi giao thứ khác mà
 * không có lỗi nào để thấy.
 *
 * Vì vậy: có điểm thật thì dùng, bằng 0 thì tính lại bằng ĐÚNG scorer dùng
 * chung (`calculateBeautyScore` trong simUtils) trên tag + giá. Không có bảng
 * điểm thứ hai nào được khai ở đây.
 */
const beautyOf = (sim: NormalizedSIM): number =>
  sim.beautyScore > 0 ? sim.beautyScore : calculateBeautyScore(sim.tags, sim.price);

/**
 * Tồn kho tối thiểu để một trang được vào chỉ mục. Dưới ngưỡng → `robots:
 * noindex, follow` (cùng luật với `BIRTH_YEAR_MIN_INVENTORY` của cụm năm sinh).
 */
export const MIN_INDEXABLE_INVENTORY = 8;

const percentile = (sortedAsc: number[], p: number): number =>
  sortedAsc.length === 0 ? 0 : sortedAsc[Math.min(sortedAsc.length - 1, Math.floor(sortedAsc.length * p))];

export interface PriceBand {
  /** Vị trí trong `PRICE_RANGES` — dùng cho `/api/sims?priceRanges=`. */
  index: number;
  label: string;
  min: number;
  max: number;
}

export interface InventoryStats {
  /** Số SIM còn bán (giá > 0) khớp tiêu chí. */
  count: number;
  min: number;
  p25: number;
  median: number;
  p75: number;
  max: number;
  /** Phân bố theo từng bậc của `PRICE_RANGES` (chỉ bậc có hàng). */
  bands: { label: string; count: number }[];
  /** Đầu số 3 chữ số nhiều hàng nhất (tối đa 5). */
  topPrefixes: { prefix: string; count: number }[];
}

const buildStats = (matched: NormalizedSIM[]): InventoryStats => {
  const prices = matched.map((s) => s.price).sort((a, b) => a - b);

  const bands = PRICE_RANGES.map((r) => ({
    label: r.label,
    count: matched.filter((s) => s.price >= r.min && s.price <= r.max).length,
  })).filter((b) => b.count > 0);

  const prefixCounts = new Map<string, number>();
  for (const s of matched) {
    const p = s.prefix3 || s.rawDigits.slice(0, 3);
    prefixCounts.set(p, (prefixCounts.get(p) ?? 0) + 1);
  }
  const topPrefixes = [...prefixCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5)
    .map(([prefix, count]) => ({ prefix, count }));

  return {
    count: matched.length,
    min: prices[0] ?? 0,
    p25: percentile(prices, 0.25),
    median: percentile(prices, 0.5),
    p75: percentile(prices, 0.75),
    max: prices[prices.length - 1] ?? 0,
    bands,
    topPrefixes,
  };
};

/**
 * Thống kê tồn kho của MỘT tag dạng số (tên tag phải nằm trong `ALL_SIM_TAGS`).
 * Trả về `count = 0` khi kho lỗi/rỗng — trang tự chuyển sang noindex, không throw.
 */
export const getTagInventory = async (tag: string): Promise<InventoryStats> => {
  const sims = await getServerSims();
  return buildStats(sims.filter((s) => s.price > 0 && s.tags.includes(tag)));
};

// ── Dải giá: slug ↔ nhãn trong PRICE_RANGES ─────────────────────────────────
//
// CHỈ 4 dải này có trang riêng. Cố ý BỎ "Dưới 1 triệu" (379 số) và các bậc từ 50
// triệu trở lên (74 / 22 / 19 / 3 số): tồn kho quá mỏng cho một trang danh mục,
// dễ thành trang rác trong chỉ mục. Dải rẻ nhất được dẫn sang /mua-sim-gia-re
// (kho khuyến mãi đồng giá) thay vì mở thêm một trang mỏng.
const BAND_SLUG_TO_LABEL: { slug: string; label: string }[] = [
  { slug: "1-3-trieu", label: "1 - 3 triệu" },
  { slug: "3-5-trieu", label: "3 - 5 triệu" },
  { slug: "5-10-trieu", label: "5 - 10 triệu" },
  { slug: "10-50-trieu", label: "10 - 50 triệu" },
];

export const PRICE_BAND_SLUGS = BAND_SLUG_TO_LABEL.map((b) => b.slug);

/**
 * slug → bậc giá trong `PRICE_RANGES`. Nối bằng NHÃN nên min/max luôn là của
 * bảng gốc; slug lạ hoặc nhãn không còn tồn tại → null (trang gọi notFound()).
 */
export const resolvePriceBand = (slug: string): PriceBand | null => {
  const entry = BAND_SLUG_TO_LABEL.find((b) => b.slug === slug);
  if (!entry) return null;
  const index = PRICE_RANGES.findIndex((r) => r.label === entry.label);
  if (index === -1) return null;
  const range = PRICE_RANGES[index];
  return { index, label: range.label, min: range.min, max: range.max };
};

export interface BandInventory extends InventoryStats {
  /** Tag dạng số/phong thủy nhiều hàng nhất trong dải (tối đa 6). */
  topTags: { tag: string; count: number }[];
  /** 8 số rẻ nhất trong dải (giá tăng dần) — cho bảng giá + Product/Offer. */
  cheapest: NormalizedSIM[];
  /** 8 số điểm đẹp cao nhất trong dải, KHÔNG trùng `cheapest`. */
  finest: NormalizedSIM[];
}

/** Thống kê + số thật của một dải giá. `count = 0` khi kho lỗi/rỗng. */
export const getBandInventory = async (band: PriceBand, sampleSize = 8): Promise<BandInventory> => {
  const sims = await getServerSims();
  const matched = sims.filter((s) => s.price > 0 && s.price >= band.min && s.price <= band.max);

  const tagCounts = new Map<string, number>();
  for (const s of matched) {
    for (const t of s.tags) {
      if (t === "VIP") continue; // nhãn nội bộ, không phải dạng số khách tìm
      tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    }
  }
  const topTags = [...tagCounts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 6)
    .map(([tag, count]) => ({ tag, count }));

  const cheapest = [...matched]
    .sort((a, b) => a.price - b.price || beautyOf(b) - beautyOf(a))
    .slice(0, sampleSize);
  const cheapestIds = new Set(cheapest.map((s) => s.id));
  const finest = [...matched]
    .filter((s) => !cheapestIds.has(s.id))
    .sort((a, b) => beautyOf(b) - beautyOf(a) || a.price - b.price)
    .slice(0, sampleSize);

  return { ...buildStats(matched), topTags, cheapest, finest };
};

/**
 * Giá VND → chuỗi "triệu" gọn cho câu văn: 3300000 → "3,3 triệu",
 * 12000000 → "12 triệu", 850000 → "850 nghìn". Chỉ dùng cho câu MÔ TẢ khoảng
 * giá; giá của từng số vẫn đi qua `formatPrice` để không có hai cách in tiền.
 */
export const formatTrieu = (price: number): string => {
  if (!Number.isFinite(price) || price <= 0) return "0";
  if (price < 1_000_000) return `${Math.round(price / 1000).toLocaleString("vi-VN")} nghìn`;
  const trieu = price / 1_000_000;
  const rounded = trieu >= 10 ? Math.round(trieu) : Math.round(trieu * 10) / 10;
  return `${rounded.toLocaleString("vi-VN")} triệu`;
};
