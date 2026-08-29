// ==============================
// KHO SIM TỪ GOOGLE SHEET
// Dùng cho công cụ định giá /dinh-gia-sim: khối "SIM tương tự" + hiệu chỉnh giá
// ==============================

import { detectCarrier, normalizePhone, type Carrier } from './simValuation';
import { fetchSheetCsv, normalizeHeader, padLeadingZero, parseCSVLine } from './cheapSimSheet';

/**
 * Kho chính — cùng spreadsheet mà edge function `fetch-sim-data` đọc.
 *
 * Layout tab kho. Chữ cái cột trong gviz là theo VỊ TRÍ chứ không theo tên, nên
 * bảng này là hợp đồng giữa code và sheet (đếm từ `select *`, không phải đoán):
 *
 *   A SimID                F Discount_Value   K TRẠNG THÁI
 *   B SỐ THUÊ BAO CHUẨN    G Final_Price      L Giá Thu Điều Chỉnh  ← GIÁ VỐN
 *   C SỐ THUÊ BAO          H GIÁ THU VỀ ← GIÁ VỐN    M Lo Ori
 *   D GIÁ BÁN              I TÌNH TRẠNG       N Check
 *   E Discount_Type        J KHO              O Status_Post
 *
 * H và L là biên lợi nhuận của shop. File này trước đây tải bản
 * `export?format=csv` của CẢ tab (51.639 dòng × 15 cột, 5.630 KB) xuống trình
 * duyệt mọi khách, nên "GIÁ THU VỀ" và "Giá Thu Điều Chỉnh" của từng SIM đọc
 * được bằng DevTools (SIM128989: bán 39.000.000 / thu về 31.200.000). Projection
 * `select A, C, D` giữ hai cột đó KHÔNG BAO GIỜ rời Google, đồng thời payload
 * xuống 2.098 KB.
 */
const INVENTORY_SHEET_ID = '1QRO-BroqUQWccWjOkRT7iICdTbQu3Y_NC1NWCeG0M0Y';

/** gid của tab kho: bền hơn tên tab, vì tên tab đổi lúc nào không ai báo. */
const INVENTORY_TARGET = 'gid=139400129';

/** Sổ SIM đã bán. Cột B (`SoThueBao`) chứa SimID, không phải số thuê bao. */
const SOLD_TARGET = 'sheet=SIM_SOLD';

/**
 * Dưới ngưỡng này giá là lỗi nhập hoặc lệch đơn vị, không phải giá thật — cùng
 * lý do với `CHEAP_MIN_PRICE` ở `cheapSimSheet.ts`. Trong 51.639 dòng kho có
 * đúng 1 dòng như vậy (SIM135790, ô GIÁ BÁN = "  10 ") và 3 dòng bỏ trống giá;
 * cả 4 đều từng lọt vào khối "SIM tương tự" dưới dạng thẻ "Liên hệ" bấm không
 * được. Lọc ngay trong query nên chúng không xuống tới trình duyệt.
 */
export const INVENTORY_MIN_PRICE = 10_000;

/** `TRẠNG THÁI` của dòng bị ẩn khỏi kho (305/51.639 dòng), so sánh sau `lower()`. */
const HIDDEN_STATUS = 'ẩn';

const gvizUrl = (target: string, query: string) =>
  `https://docs.google.com/spreadsheets/d/${INVENTORY_SHEET_ID}/gviz/tq?tqx=out:csv&${target}&tq=${encodeURIComponent(query)}`;

/**
 * Ba tầng lọc chạy ở Google, không ở trình duyệt:
 *
 *   - `select A, C, D`  — SimID, số thuê bao, GIÁ BÁN. Không cột giá vốn nào.
 *   - `D >= 10.000`     — bỏ dòng giá typo và 3 dòng trống giá.
 *   - `K is null or …`  — bỏ 305 dòng TRẠNG THÁI = ẨN. Phải có nhánh `is null`:
 *                          gviz coi ô trống là null và `null != 'ẩn'` KHÔNG đúng,
 *                          thiếu nhánh này là rơi sạch 51.334 dòng đang bán.
 */
const INVENTORY_QUERY =
  `select A, C, D where D >= ${INVENTORY_MIN_PRICE} and (K is null or lower(K) != '${HIDDEN_STATUS}')`;

/** Chỉ cột SimID của sổ đã bán: 27 KB cho 2.273 dòng. */
const SOLD_QUERY = 'select B';

/** Header kỳ vọng của `select A, C, D`, đã chuẩn hoá. */
const INVENTORY_HEADER_GUARD = ['simid', 'sothuebao', 'giaban'];

/** Header kỳ vọng của `select B` trên tab SIM_SOLD. */
const SOLD_HEADER_GUARD = ['sothuebao'];

export interface SimItem {
  /** SimID thật trong sheet (SIM128989…) — dùng để link sang /mua-ngay. */
  simId: string;
  /** Luôn 10 chữ số, đã bù số 0 đầu. */
  phone: string;
  /** GIÁ BÁN, luôn > 0: dòng không có giá dùng được đã bị query loại. */
  price: number;
  carrier: Carrier;
  tags: string[];
}

/**
 * Parse ô giá của sheet.
 *
 * Cột GIÁ BÁN là cột SỐ, gviz trả về bản ĐÃ ĐỊNH DẠNG ("  39,000,000 "), nên chỉ
 * số nguyên có dấu ngăn nghìn là hợp lệ. Bất cứ thứ gì khác bị trả 0 để gọi
 * bỏ dòng — bỏ một dòng thì SIM đó không hiện, còn parse sai thì khách đọc giá sai.
 */
export function parsePriceToNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const s = String(value ?? '').trim();
  if (!s) return 0;
  if (!/^\d{1,3}(?:[.,]\d{3})*$|^\d+$/.test(s)) return 0;
  const n = parseInt(s.replace(/[.,]/g, ''), 10);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Trích tags từ chính dãy số. Projection không lấy cột nhãn của sheet (và cột đó
 * cũng trống với phần lớn dòng), nên đây là nguồn nhãn duy nhất.
 */
export function extractTagsFromPhone(phone: string): string[] {
  const digits = normalizePhone(phone);
  const tags: string[] = [];

  const last6 = digits.slice(-6);
  const last5 = digits.slice(-5);
  const last4 = digits.slice(-4);
  const last3 = digits.slice(-3);

  // Lục quý
  if (/^(\d)\1{5}$/.test(last6)) {
    tags.push('Lục quý');
  }
  // Ngũ quý
  else if (/^(\d)\1{4}$/.test(last5)) {
    tags.push('Ngũ quý');
  }
  // Tứ quý
  else if (/^(\d)\1{3}$/.test(last4)) {
    tags.push('Tứ quý');
  }
  // Tam hoa kép
  else if (/^(\d)\1{2}(\d)\2{2}$/.test(last6) && last6[0] !== last6[3]) {
    tags.push('Tam hoa kép');
  }
  // Tam hoa
  else if (/^(\d)\1{2}$/.test(last3)) {
    tags.push('Tam hoa');
  }

  // Sảnh tiến
  const checkSequence = (str: string, len: number): boolean => {
    for (let i = 0; i <= str.length - len; i++) {
      const sub = str.slice(i, i + len);
      let isAsc = true, isDesc = true;
      for (let j = 0; j < sub.length - 1; j++) {
        if (parseInt(sub[j + 1]) !== parseInt(sub[j]) + 1) isAsc = false;
        if (parseInt(sub[j + 1]) !== parseInt(sub[j]) - 1) isDesc = false;
      }
      if (isAsc || isDesc) return true;
    }
    return false;
  };

  if (checkSequence(digits, 6)) tags.push('Sảnh 6');
  else if (checkSequence(digits, 5)) tags.push('Sảnh 5');
  else if (checkSequence(digits, 4)) tags.push('Sảnh 4');

  // ABAB
  if (/^(\d)(\d)\1\2$/.test(last4) && last4[0] !== last4[1]) {
    tags.push('ABAB');
  }

  // Gánh ABBA
  if (last4[0] === last4[3] && last4[1] === last4[2] && last4[0] !== last4[1]) {
    tags.push('Gánh');
  }

  // AABB
  if (/^(\d)\1(\d)\2$/.test(last4) && last4[0] !== last4[2]) {
    tags.push('AABB');
  }

  // Taxi ABCABC
  if (last6.length === 6 && last6.slice(0, 3) === last6.slice(3, 6)) {
    tags.push('Taxi');
  }

  // Cụm tài lộc
  if (last4.includes('68') || last4.includes('86')) tags.push('Lộc phát');
  if (last4.includes('39') || last4.includes('79')) tags.push('Thần tài');

  return tags;
}

/**
 * Dựng một `SimItem` từ 3 ô đã projection, hoặc null nếu dòng không dùng được.
 *
 * 69/51.639 dòng về dạng 9 chữ số vì ô số thuê bao được format kiểu số và Google
 * rụng số 0 đầu trước khi ta thấy. Không bù lại thì `detectCarrier('937749068')`
 * đọc tiền tố "937" và trả 'Unknown', đúng như thẻ rác 937749068 trong khối
 * "SIM tương tự".
 *
 * Sau khi bù, nhà mạng phải nhận diện được mới nhận dòng. Ràng buộc này loại 2
 * dòng số chỉ có 9 chữ số nhưng đã sẵn số 0 đầu (SIM067443 "090111553" →
 * "0090111553", SIM117472) — bù thêm một số 0 nữa thì ra dãy không tồn tại. Cả
 * 49.076 dòng còn lại đều rơi vào đầu số 070/076–079/089/090/093 (và vài số
 * Vina), nên không có SIM thật nào bị luật này gạt oan.
 */
const buildSimItem = (simId: string, phoneRaw: string, priceRaw: string): SimItem | null => {
  if (!simId || !phoneRaw) return null;

  const phone = padLeadingZero(normalizePhone(phoneRaw));
  if (phone.length !== 10) return null;

  const carrier = detectCarrier(phone);
  if (carrier === 'Unknown') return null;

  const price = parsePriceToNumber(priceRaw);
  if (price < INVENTORY_MIN_PRICE) return null;

  return {
    simId,
    phone,
    price,
    carrier,
    tags: extractTagsFromPhone(phone),
  };
};

const csvRows = (csv: string): string[] => csv.trim().split('\n').filter((l) => l.trim());

/**
 * Hỏng to tiếng khi sheet đổi thứ tự cột. Vì chữ cái cột là theo vị trí, một lần
 * chèn cột ở giữa là `select A, C, D` lấy sang cột khác — và cột kế bên D chính
 * là nhóm giá vốn. Ném lỗi thì khối "SIM tương tự" hiện thông báo lỗi; parse im
 * lặng thì trang vẫn "chạy" trong lúc rò dữ liệu.
 */
const assertHeaders = (line: string, guard: string[], what: string): void => {
  const headers = parseCSVLine(line).map(normalizeHeader);
  if (guard.some((expected, i) => headers[i] !== expected)) {
    throw new Error(
      `[simInventorySheet] ${what}: cột đã đổi thứ tự — nhận ${JSON.stringify(headers.slice(0, guard.length))}, cần ${JSON.stringify(guard)}`,
    );
  }
};

const parseInventoryCsv = (csv: string): SimItem[] => {
  const lines = csvRows(csv);
  if (lines.length < 2) throw new Error('[simInventorySheet] gviz trả về không có dòng dữ liệu');

  assertHeaders(lines[0], INVENTORY_HEADER_GUARD, 'tab kho');

  const items: SimItem[] = [];
  for (let i = 1; i < lines.length; i++) {
    const [simId, phoneRaw, priceRaw] = parseCSVLine(lines[i]);
    const item = buildSimItem(simId ?? '', phoneRaw ?? '', priceRaw ?? '');
    if (item) items.push(item);
  }
  return items;
};

/**
 * SimID đã bán. Fail-safe giống `fetch-sim-data`: sổ này lỗi thì trả về set rỗng
 * và kho vẫn hiện, thà gợi ý một SIM đã bán còn hơn trắng cả khối.
 */
const loadSoldSimIds = async (): Promise<Set<string>> => {
  try {
    const csv = await fetchSheetCsv(gvizUrl(SOLD_TARGET, SOLD_QUERY));
    const lines = csvRows(csv);
    if (lines.length < 2) return new Set();
    assertHeaders(lines[0], SOLD_HEADER_GUARD, 'tab SIM_SOLD');
    const ids = new Set<string>();
    for (let i = 1; i < lines.length; i++) {
      const id = (parseCSVLine(lines[i])[0] ?? '').trim().toUpperCase();
      if (id) ids.add(id);
    }
    return ids;
  } catch (err) {
    console.warn('[simInventorySheet] Không đọc được sổ SIM_SOLD, bỏ qua bước lọc SIM đã bán:', err);
    return new Set();
  }
};

let cachedInventory: SimItem[] | null = null;
let cacheTimestamp = 0;
/** Gộp các lần gọi trùng nhau: nếu không, mỗi lần bấm "Định giá" là thêm 2 MB. */
let inFlight: Promise<SimItem[]> | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 phút

const fetchInventory = async (): Promise<SimItem[]> => {
  // Google chặn request trực tiếp từ trình duyệt tới gviz, nên mọi thứ đi qua
  // sheet-proxy — cùng đường mà `cheapSimSheet` dùng.
  const [inventoryCsv, soldIds] = await Promise.all([
    fetchSheetCsv(gvizUrl(INVENTORY_TARGET, INVENTORY_QUERY)),
    loadSoldSimIds(),
  ]);

  const parsed = parseInventoryCsv(inventoryCsv);
  const inventory = soldIds.size === 0
    ? parsed
    : parsed.filter((item) => !soldIds.has(item.simId.toUpperCase()));

  if (process.env.NODE_ENV !== 'production') {
    console.log(
      `[simInventorySheet] ${inventory.length} SIM đang bán (${parsed.length} dòng hợp lệ, loại ${parsed.length - inventory.length} SIM đã bán)`,
    );
  }

  return inventory;
};

/**
 * Nạp kho cho công cụ định giá. Ném lỗi khi proxy chết hoặc sheet đổi cột — nơi
 * gọi tự quyết định hiện thông báo gì.
 */
export async function loadSimInventory(): Promise<SimItem[]> {
  if (cachedInventory && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return cachedInventory;
  }
  if (inFlight) return inFlight;

  inFlight = fetchInventory()
    .then((inventory) => {
      cachedInventory = inventory;
      cacheTimestamp = Date.now();
      return inventory;
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/**
 * Tìm SIM tương tự từ kho
 */
export interface SimilarSimsParams {
  phone: string;
  carrier: Carrier;
  tags: string[];
  range: [number, number];
}

export async function getSimilarSims(params: SimilarSimsParams): Promise<SimItem[]> {
  const inventory = await loadSimInventory();

  const { phone, carrier, tags, range } = params;
  const [rangeMin, rangeMax] = range;

  // Loại SIM trùng số
  const target = padLeadingZero(normalizePhone(phone));
  const candidates = inventory.filter((item) => item.phone !== target);

  // Filter giá trong khoảng [rangeMin*0.7, rangeMax*1.3]
  const priceMin = rangeMin * 0.7;
  const priceMax = rangeMax * 1.3;

  const inRange = candidates.filter((item) => item.price >= priceMin && item.price <= priceMax);

  // Nếu quá ít, nới lỏng filter
  let pool = inRange;
  if (pool.length < 5) {
    pool = candidates.filter((item) => item.price >= rangeMin * 0.5 && item.price <= rangeMax * 2);
  }
  if (pool.length < 5) {
    pool = candidates;
  }

  // Chấm điểm
  const mainTag = tags[0] || '';
  const secondaryTags = tags.slice(1);

  const scored = pool.map((item) => {
    let score = 0;

    // +4 trùng tag chính
    if (mainTag && item.tags.includes(mainTag)) {
      score += 4;
    }

    // +2 trùng tag phụ
    for (const t of secondaryTags) {
      if (item.tags.includes(t)) {
        score += 2;
        break;
      }
    }

    // +2 cùng nhà mạng
    if (item.carrier === carrier) {
      score += 2;
    }

    // +2 giá trong range gốc
    if (item.price >= rangeMin && item.price <= rangeMax) {
      score += 2;
    }

    // +1 cùng cụm tài lộc
    const luckTags = ['Lộc phát', 'Thần tài', 'Ông địa', 'Song phát'];
    const hasLuck = luckTags.some((lt) => tags.includes(lt) && item.tags.includes(lt));
    if (hasLuck) {
      score += 1;
    }

    return { item, score };
  });

  // Sort giảm dần, lấy top 12
  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 12).map((s) => s.item);
}

/**
 * Lấy mẫu trong kho để hiệu chỉnh giá (dùng bởi `simValuation.valuateSim`)
 */
export async function getCalibrationData(tags: string[], carrier: Carrier): Promise<{
  samples: SimItem[];
  median: number | null;
  p25: number | null;
  p75: number | null;
}> {
  const inventory = await loadSimInventory();

  const mainTag = tags[0] || '';

  // Lọc mẫu tham chiếu theo tag chính
  let samples = inventory.filter((item) => Boolean(mainTag) && item.tags.includes(mainTag));

  // Ưu tiên cùng nhà mạng nếu có đủ
  const sameCarrier = samples.filter((item) => item.carrier === carrier);
  if (sameCarrier.length >= 5) {
    samples = sameCarrier;
  }

  if (samples.length < 8) {
    return { samples, median: null, p25: null, p75: null };
  }

  // Tính median, p25, p75
  const prices = samples.map((s) => s.price).sort((a, b) => a - b);

  const getPercentile = (arr: number[], p: number): number => {
    const idx = (p / 100) * (arr.length - 1);
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    if (lower === upper) return arr[lower];
    return arr[lower] * (upper - idx) + arr[upper] * (idx - lower);
  };

  return {
    samples,
    median: getPercentile(prices, 50),
    p25: getPercentile(prices, 25),
    p75: getPercentile(prices, 75),
  };
}
