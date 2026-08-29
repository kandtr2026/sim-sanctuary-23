/**
 * Tồn kho theo đầu số — NGUỒN DUY NHẤT cho cụm /sim-dau-so.
 *
 * Cùng khuôn với `getInStockBirthYears()` / `BIRTH_YEAR_MIN_INVENTORY` trong
 * `src/lib/serverSimData.ts`: danh sách trang được sinh ra đi theo tồn kho THẬT,
 * không phải theo danh sách đầu số viết tay. Ba chỗ dùng chung file này nên
 * không bao giờ lệch nhau:
 *   - `[dauso]/page.tsx`      → generateStaticParams + ngưỡng noindex + số liệu trong meta
 *   - `[dauso]/[loai]/page.tsx` → như trên, cho combo
 *   - `src/app/sitemap.ts`    → `getDauSoSitemapEntries()`
 *
 * Server-only: file này gọi `getServerSims()` (fetch Supabase). Đừng import từ
 * component "use client" — đó là lý do nó nằm ở đây thay vì trong
 * `src/lib/simTaxonomy.ts` (taxonomy phải giữ thuần dữ liệu, không kéo theo
 * tầng fetch).
 *
 * Mọi hàm đọc dữ liệu đều xuống nhẹ nhàng khi kho lỗi: `catalogueSize === 0` →
 * trả danh sách rỗng / stat rỗng, KHÔNG throw, nên build không bao giờ vỡ vì
 * một cú fetch trượt.
 */

import { getServerSims } from "@/lib/serverSimData";
import {
  COMBO_MIN_INVENTORY,
  DAU_SO4_MIN_INVENTORY,
  DAU_SO_PREFIXES,
  LOAI,
  LOAI_KEYS,
  LOAI_KEYS_LEGACY,
  comboKey,
  type LoaiKey,
} from "@/lib/simTaxonomy";

export interface DauSoStat {
  /** Số SIM đang bán (price > 0) khớp đầu số / combo. */
  count: number;
  /** Giá thấp nhất trong nhóm (VNĐ). 0 khi nhóm rỗng. */
  minPrice: number;
  /** Giá cao nhất trong nhóm (VNĐ). 0 khi nhóm rỗng. */
  maxPrice: number;
}

const EMPTY_STAT: DauSoStat = { count: 0, minPrice: 0, maxPrice: 0 };

export interface DauSoInventory {
  /** Tổng số SIM đọc được. 0 = kho lỗi → mọi ngưỡng phải "mở" (fail-open). */
  catalogueSize: number;
  /** Khoá: "090" hoặc "0909". */
  prefixes: Map<string, DauSoStat>;
  /** Khoá: `comboKey(dauso, loai)` — "0909|than-tai". */
  combos: Map<string, DauSoStat>;
}

// ── Cache có hạn dùng ───────────────────────────────────────────────────────
// Một lần quét 49k hàng dựng đủ bảng cho 34 trang đầu số + 90 trang combo (mỗi
// trang còn gọi lại ở generateMetadata), nên phải cache. TTL 300s cho khớp
// `revalidate = 300` của các route tiêu thụ và `CACHE_TTL_MS` trong
// serverSimData — cùng một khuôn cache, không đóng băng theo tuổi tiến trình.
const CACHE_TTL_MS = 300_000;
let cached: DauSoInventory | null = null;
let cachedAt = 0;
let inFlight: Promise<DauSoInventory> | null = null;

const bump = (map: Map<string, DauSoStat>, key: string, price: number): void => {
  const cur = map.get(key);
  if (!cur) {
    map.set(key, { count: 1, minPrice: price, maxPrice: price });
    return;
  }
  cur.count++;
  if (price < cur.minPrice) cur.minPrice = price;
  if (price > cur.maxPrice) cur.maxPrice = price;
};

const build = async (): Promise<DauSoInventory> => {
  const sims = await getServerSims();
  const prefixes = new Map<string, DauSoStat>();
  const combos = new Map<string, DauSoStat>();

  // Luật khớp phải TRÙNG KHÍT với `getCategorySnapshot` (prefixes → startsWith,
  // suffixes → endsWith, chỉ tính price > 0) và với `/api/sims` mà lưới gọi.
  // Lệch một chút là con số trong meta description không khớp lưới bên dưới.
  for (const sim of sims) {
    if (sim.price <= 0) continue;
    const digits = sim.rawDigits || sim.displayNumber.replace(/\D/g, "");
    const p3 = digits.slice(0, 3);
    if (!DAU_SO_PREFIXES.includes(p3)) continue;
    const p4 = digits.slice(0, 4);

    for (const prefix of [p3, p4]) {
      bump(prefixes, prefix, sim.price);
      for (const loai of LOAI_KEYS) {
        const hit = LOAI[loai].suffixes.some((suffix) => digits.endsWith(suffix));
        if (hit) bump(combos, comboKey(prefix, loai), sim.price);
      }
    }
  }

  return { catalogueSize: sims.length, prefixes, combos };
};

/** Bảng tồn kho cho cả cụm đầu số (cache 300s). Không bao giờ throw. */
export const getDauSoInventory = async (): Promise<DauSoInventory> => {
  if (cached && Date.now() - cachedAt < CACHE_TTL_MS) return cached;
  if (inFlight) return inFlight;

  inFlight = (async () => {
    try {
      const built = await build();
      // Kho lỗi (0 hàng) thì KHÔNG cache — lần gọi sau phải thử lại ngay, y như
      // `getServerSims` không cache mảng rỗng.
      if (built.catalogueSize > 0) {
        cached = built;
        cachedAt = Date.now();
      }
      return built;
    } catch (e) {
      console.warn("[dau-so inventory] build failed:", e);
      return { catalogueSize: 0, prefixes: new Map(), combos: new Map() };
    }
  })();

  try {
    return await inFlight;
  } finally {
    inFlight = null;
  }
};

/** Tồn kho + dải giá của một đầu số ("090" hoặc "0909"). */
export const getPrefixStat = async (prefix: string): Promise<DauSoStat> => {
  const inv = await getDauSoInventory();
  return inv.prefixes.get(prefix) ?? EMPTY_STAT;
};

/** Tồn kho + dải giá của một combo đầu số × loại. */
export const getComboStat = async (prefix: string, loai: LoaiKey): Promise<DauSoStat> => {
  const inv = await getDauSoInventory();
  return inv.combos.get(comboKey(prefix, loai)) ?? EMPTY_STAT;
};

/**
 * Đầu số 4 chữ số có tồn kho ≥ `minInventory` (mặc định
 * `DAU_SO4_MIN_INVENTORY`), sắp theo tồn kho giảm dần rồi theo số.
 *
 * Đây là danh sách trang 4 chữ số được prerender VÀ được đưa vào sitemap. Kho
 * lỗi → [] (build vẫn xanh, các trang 3 chữ số cũ không bị ảnh hưởng).
 */
export const getInStockDauSo4Prefixes = async (
  minInventory = DAU_SO4_MIN_INVENTORY,
): Promise<string[]> => {
  const inv = await getDauSoInventory();
  if (inv.catalogueSize === 0) return [];

  return [...inv.prefixes.entries()]
    .filter(([prefix, stat]) => prefix.length === 4 && stat.count >= minInventory)
    .sort((a, b) => b[1].count - a[1].count || a[0].localeCompare(b[0]))
    .map(([prefix]) => prefix);
};

/** Mọi đầu số có trang được sinh: 8 đầu số 3 chữ số + các đầu số 4 chữ số đạt ngưỡng. */
export const getPromotedDauSo = async (): Promise<string[]> => {
  const four = await getInStockDauSo4Prefixes();
  return [...DAU_SO_PREFIXES, ...four];
};

export interface ComboPair {
  dauso: string;
  loai: LoaiKey;
}

/**
 * Combo đạt ngưỡng tồn kho (`COMBO_MIN_INVENTORY`) trong phạm vi các đầu số đã
 * được mở trang. Dùng cho generateStaticParams, cross-link và sitemap — nên
 * trang mỏng không bao giờ được liên kết tới hay khai trong sitemap.
 */
export const getInStockDauSoCombos = async (
  minInventory = COMBO_MIN_INVENTORY,
): Promise<ComboPair[]> => {
  const inv = await getDauSoInventory();
  if (inv.catalogueSize === 0) return [];

  const promoted = await getPromotedDauSo();
  const pairs: ComboPair[] = [];
  for (const dauso of promoted) {
    for (const loai of LOAI_KEYS) {
      const stat = inv.combos.get(comboKey(dauso, loai));
      if (stat && stat.count >= minInventory) pairs.push({ dauso, loai });
    }
  }
  return pairs;
};

export interface DauSoSitemapEntry {
  /** Đường dẫn tuyệt đối trong site, bắt đầu bằng "/". */
  path: string;
  priority: number;
}

// ── Cổng ngưỡng dùng chung cho hai route ────────────────────────────────────

export interface DauSoGate {
  stat: DauSoStat;
  /** Dưới ngưỡng tồn kho → `robots: noindex, follow`. */
  thin: boolean;
  /** Kho đã đọc được nhưng nhóm này 0 số → route trả 404 (trang trắng thì thà 404). */
  empty: boolean;
}

/**
 * Cổng cho trang đầu số.
 *
 * Fail-open: khi `catalogueSize === 0` (kho lỗi) thì KHÔNG noindex và KHÔNG 404
 * bất cứ trang nào — một cú fetch trượt không được phép rút cả cụm khỏi chỉ mục.
 * Đầu số 3 chữ số (8 URL đang được index) không bao giờ 404 và chỉ noindex nếu
 * kho rỗng hẳn; đầu số 4 chữ số áp `DAU_SO4_MIN_INVENTORY`.
 */
export const getPrefixGate = async (prefix: string): Promise<DauSoGate> => {
  const inv = await getDauSoInventory();
  const stat = inv.prefixes.get(prefix) ?? EMPTY_STAT;
  if (inv.catalogueSize === 0) return { stat, thin: false, empty: false };

  const legacy = DAU_SO_PREFIXES.includes(prefix);
  return {
    stat,
    thin: legacy ? stat.count === 0 : stat.count < DAU_SO4_MIN_INVENTORY,
    empty: !legacy && stat.count === 0,
  };
};

/**
 * Cổng cho trang combo. 24 URL cũ (8 đầu số 3 chữ số × 3 loại đuôi đầu tiên)
 * không bao giờ 404; combo mới dưới ngưỡng thì noindex, 0 số thì 404.
 */
export const getComboGate = async (prefix: string, loai: LoaiKey): Promise<DauSoGate> => {
  const inv = await getDauSoInventory();
  const stat = inv.combos.get(comboKey(prefix, loai)) ?? EMPTY_STAT;
  if (inv.catalogueSize === 0) return { stat, thin: false, empty: false };

  const legacy = DAU_SO_PREFIXES.includes(prefix) && LOAI_KEYS_LEGACY.includes(loai);
  return {
    stat,
    thin: stat.count < COMBO_MIN_INVENTORY,
    empty: !legacy && stat.count === 0,
  };
};

/**
 * Toàn bộ URL của cụm /sim-dau-so ĐƯỢC PHÉP vào sitemap.
 *
 * ⚠️ sitemap.ts KHÔNG được tự nhân `DAU_SO_PREFIXES × LOAI_KEYS` nữa: phép nhân
 * đó sinh cả combo mỏng (vd 079/tu-quy hiện 0 số → trang 404) và các combo đang
 * bị `noindex`, tức khai vào sitemap những URL mình vừa xin Google đừng index.
 *
 * Không gồm trang hub `/sim-dau-so` — hub đã nằm trong bảng ROUTES của sitemap.
 * Kho lỗi → chỉ trả 8 trang đầu số 3 chữ số (những URL đang được index), phần
 * đuôi động im lặng bỏ qua tới lần regenerate sau.
 */
export const getDauSoSitemapEntries = async (): Promise<DauSoSitemapEntry[]> => {
  const inv = await getDauSoInventory();
  const entries: DauSoSitemapEntry[] = [];

  for (const prefix of DAU_SO_PREFIXES) {
    const stat = inv.prefixes.get(prefix);
    // Kho lỗi (catalogueSize === 0) vẫn khai — 8 URL này đang được index, không
    // được rút khỏi sitemap chỉ vì một cú fetch trượt.
    if (inv.catalogueSize > 0 && (!stat || stat.count === 0)) continue;
    entries.push({ path: `/sim-dau-so/${prefix}`, priority: 0.8 });
  }

  const four = await getInStockDauSo4Prefixes();
  for (const prefix of four) {
    entries.push({ path: `/sim-dau-so/${prefix}`, priority: 0.7 });
  }

  const combos = await getInStockDauSoCombos();
  for (const { dauso, loai } of combos) {
    entries.push({ path: `/sim-dau-so/${dauso}/${loai}`, priority: dauso.length === 3 ? 0.7 : 0.6 });
  }

  return entries;
};
