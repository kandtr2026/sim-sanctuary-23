/**
 * MỘT RULE HIỂN THỊ SỐ SIM DÙNG CHUNG TOÀN SITE.
 *
 * Khách tìm `*6879` → mọi danh sách phải hiện đuôi `.6879` NGUYÊN MỘT CỤM,
 * không để dấu chấm cắt đôi (`0703.75|6.879` là sai). Trước đây mỗi lưới tự
 * chấm theo kiểu riêng — 4-3-3 của `formatSIMNumber`, dấu chấm tuỳ hứng từ
 * sheet, dạng ngày sinh, cụm quý — nên cụm khách tìm hay bị cắt và mỗi lần chỉ
 * chữa được đúng một trường hợp. Toàn bộ luật nằm ở file này; lưới SIM gọi
 * `planSimDisplay()` chứ không tự `split('.')`.
 *
 * Luật:
 *  1. Từ câu tìm suy ra CỤM NEO — phần khách thật sự muốn thấy: `*S` → đuôi,
 *     `P*` → đầu, `P*S` → cả hai, không có `*` → đuôi nếu số kết thúc bằng nó,
 *     không thì đầu, không thì vị trí xuất hiện đầu tiên.
 *  2. Cách chấm sẵn có KHÔNG cắt cụm neo → giữ nguyên (tôn trọng dạng ngày sinh
 *     `0909.9.2.1999` và dấu chấm của sheet).
 *  3. Bị cắt → chấm lại: khoảng còn lại chia thành cụm 3–4 số (cụm 4 xếp
 *     trước, ra đúng 4-3-3 quen thuộc), cụm neo để nguyên.
 *  4. Không có câu tìm → giữ display sẵn có.
 */

export interface DigitBlock {
  /** Chỉ số bắt đầu trong chuỗi CHỮ SỐ (không tính dấu chấm). */
  start: number;
  /** Chỉ số kết thúc, KHÔNG bao gồm. */
  end: number;
}

export interface SimDisplayPlan {
  /** Chuỗi đem hiển thị, đã chấm sẵn. */
  display: string;
  /** Các khoảng cần tô sáng, theo chỉ số CHỮ SỐ (không tính dấu chấm). */
  hl: DigitBlock[];
}

/**
 * Kích thước các cụm cho một dãy dài `len`: chỉ dùng cụm 3 và 4, cụm 4 xếp
 * trước. 10 → 4-3-3 (đúng format chuẩn), 7 → 4-3, 8 → 4-4, 6 → 3-3.
 * 1, 2, 5 không ghép được từ 3/4 → để nguyên một cụm, thà dài hơn là để lẻ
 * một cụm 1 số kiểu `090.282.4.879`.
 */
const groupSizes = (len: number): number[] => {
  if (len <= 0) return [];
  if (len < 3 || len === 5) return [len];
  const rem = len % 3;
  const fours = rem === 0 ? 0 : rem === 1 ? 1 : 2;
  const threes = (len - fours * 4) / 3;
  if (threes < 0 || !Number.isInteger(threes)) return [len];
  return [...Array<number>(fours).fill(4), ...Array<number>(threes).fill(3)];
};

/** Chia dãy chữ số thành các cụm đẹp: "0703756879" → ["0703","756","879"]. */
export const groupDigitsPretty = (digits: string): string[] => {
  const out: string[] = [];
  let i = 0;
  for (const size of groupSizes(digits.length)) {
    out.push(digits.slice(i, i + size));
    i += size;
  }
  return out;
};

/** Chuẩn hoá câu tìm về đúng bộ ký tự mà ô tìm cho phép: chữ số và `*`. */
const cleanQuery = (query: string): string => (query || '').replace(/[^0-9*]/g, '');

const sortMerge = (blocks: DigitBlock[]): DigitBlock[] => {
  const sorted = blocks.filter((b) => b.end > b.start).sort((a, b) => a.start - b.start);
  const out: DigitBlock[] = [];
  for (const b of sorted) {
    const last = out[out.length - 1];
    if (last && b.start <= last.end) last.end = Math.max(last.end, b.end);
    else out.push({ ...b });
  }
  return out;
};

const occurrences = (digits: string, needle: string): DigitBlock[] => {
  if (!needle) return [];
  const out: DigitBlock[] = [];
  let i = digits.indexOf(needle);
  while (i !== -1) {
    out.push({ start: i, end: i + needle.length });
    i = digits.indexOf(needle, i + needle.length);
  }
  return out;
};

/**
 * Cụm neo — phần quyết định cách chấm. Mirror đúng luật lọc trong
 * `simFilter.ts` (`*S` = endsWith, `P*` = startsWith, `P*S` = cả hai, còn lại
 * là contains) để cái khách THẤY trùng với lý do SIM đó được lọc ra.
 */
export const resolveAnchorBlocks = (digits: string, query: string): DigitBlock[] => {
  const clean = cleanQuery(query);
  const digitsOnly = clean.replace(/\*/g, '');
  if (!digits || !digitsOnly) return [];

  const len = digits.length;
  const blocks: DigitBlock[] = [];
  const pushTail = (s: string) => {
    if (s && s.length < len && digits.endsWith(s)) blocks.push({ start: len - s.length, end: len });
  };
  const pushHead = (s: string) => {
    if (s && s.length < len && digits.startsWith(s)) blocks.push({ start: 0, end: s.length });
  };

  const parts = clean.split('*').filter(Boolean);
  const startsWithStar = clean.startsWith('*');
  const endsWithStar = clean.endsWith('*');

  if (clean.includes('*')) {
    if (startsWithStar && !endsWithStar) pushTail(parts[parts.length - 1] ?? '');
    else if (endsWithStar && !startsWithStar) pushHead(parts[0] ?? '');
    else if (!startsWithStar && !endsWithStar && parts.length === 2) {
      pushHead(parts[0]);
      pushTail(parts[1]);
    } else {
      const first = occurrences(digits, digitsOnly)[0];
      if (first) blocks.push(first);
    }
  } else if (digits.endsWith(digitsOnly)) {
    // Gõ trần "6879" mà số kết thúc bằng nó = vẫn là ý tìm ĐUÔI → chấm như `*6879`.
    pushTail(digitsOnly);
  } else if (digits.startsWith(digitsOnly)) {
    pushHead(digitsOnly);
  } else {
    const first = occurrences(digits, digitsOnly)[0];
    if (first) blocks.push(first);
  }

  return sortMerge(blocks);
};

/**
 * Khoảng cần tô sáng. Bằng cụm neo, cộng thêm MỌI vị trí xuất hiện khác khi
 * khách tìm kiểu "chứa" (giữ nguyên hành vi cũ: `88` trong `0888.888.888` sáng
 * hết) — các vị trí thêm này chỉ tô màu, không đòi hỏi chấm lại.
 */
export const resolveHighlightBlocks = (digits: string, query: string): DigitBlock[] => {
  const clean = cleanQuery(query);
  const digitsOnly = clean.replace(/\*/g, '');
  const anchors = resolveAnchorBlocks(digits, query);
  if (!digitsOnly) return anchors;
  if (clean.includes('*')) return anchors;
  // Gõ đủ 10 số đúng SIM: sáng cả dãy, giữ nguyên cách chấm.
  if (digitsOnly === digits) return [{ start: 0, end: digits.length }];
  if (digitsOnly.length >= digits.length) return anchors;
  return sortMerge([...anchors, ...occurrences(digits, digitsOnly)]);
};

/** Vị trí (index trong chuỗi display) của từng chữ số. */
const digitPositions = (display: string): number[] => {
  const pos: number[] = [];
  for (let i = 0; i < display.length; i++) {
    const c = display.charCodeAt(i);
    if (c >= 48 && c <= 57) pos.push(i);
  }
  return pos;
};

/** Cách chấm hiện tại có cắt cụm nào không? (chữ số của cụm phải liền nhau) */
export const splitsAnyBlock = (display: string, blocks: DigitBlock[]): boolean => {
  const pos = digitPositions(display);
  return blocks.some((b) => {
    if (b.end - b.start < 2) return false;
    if (b.end > pos.length) return true;
    return pos[b.end - 1] - pos[b.start] !== b.end - 1 - b.start;
  });
};

/** Chấm lại quanh cụm neo: khoảng trống chia cụm 3–4, cụm neo để nguyên. */
const buildDisplayAroundBlocks = (digits: string, blocks: DigitBlock[]): string => {
  type Seg = { text: string; isBlock: boolean };
  const segs: Seg[] = [];
  let cursor = 0;

  for (const b of blocks) {
    if (b.start > cursor) {
      for (const g of groupDigitsPretty(digits.slice(cursor, b.start))) {
        segs.push({ text: g, isBlock: false });
      }
    }
    segs.push({ text: digits.slice(b.start, b.end), isBlock: true });
    cursor = b.end;
  }
  if (cursor < digits.length) {
    for (const g of groupDigitsPretty(digits.slice(cursor))) segs.push({ text: g, isBlock: false });
  }

  // Phần dư ĐÚNG 1 số thì dán vào cụm bên cạnh, đừng đẻ cụm lẻ kiểu
  // `090.143.899.4`. Cụm neo vẫn liền mạch nên màu vàng tự làm việc tách cụm.
  // Dư 2 số vẫn để riêng (`0932.6879.53` đọc bình thường).
  for (let i = segs.length - 1; i >= 0 && segs.length > 1; i--) {
    const seg = segs[i];
    if (seg.isBlock || seg.text.length >= 2) continue;
    if (i > 0) {
      segs[i - 1].text += seg.text;
      segs.splice(i, 1);
    } else {
      segs[1].text = seg.text + segs[1].text;
      segs.splice(0, 1);
    }
  }

  return segs.map((s) => s.text).filter(Boolean).join('.');
};

/**
 * Rule chính. `preferredDisplay` là cách chấm mà trang đang muốn dùng (ngày
 * sinh, dấu chấm từ sheet, 4-3-3…) — được giữ nếu nó không cắt cụm khách tìm.
 */
export const planSimDisplay = (
  rawDigits: string,
  query: string,
  preferredDisplay?: string | null,
): SimDisplayPlan => {
  const digits = (rawDigits || '').replace(/\D/g, '');
  const preferred = preferredDisplay && preferredDisplay.replace(/\D/g, '') === digits
    ? preferredDisplay
    : null;

  if (!digits) return { display: preferred ?? preferredDisplay ?? rawDigits ?? '', hl: [] };

  const standard = groupDigitsPretty(digits).join('.');
  const anchors = resolveAnchorBlocks(digits, query);
  const hl = resolveHighlightBlocks(digits, query);

  // Không suy ra được cụm neo (không tìm gì, hoặc SIM khớp cả dãy) → giữ nguyên
  // cách chấm sẵn có, chỉ tô sáng.
  if (anchors.length === 0) return { display: preferred ?? standard, hl };

  // Cách chấm sẵn có đã để cụm neo liền mạch → tôn trọng nó.
  if (preferred && !splitsAnyBlock(preferred, anchors)) return { display: preferred, hl };

  return { display: buildDisplayAroundBlocks(digits, anchors), hl };
};

/** Đổi các khoảng chữ số thành set index để dựng span. */
export const blocksToDigitSet = (blocks: DigitBlock[]): Set<number> => {
  const set = new Set<number>();
  for (const b of blocks) for (let i = b.start; i < b.end; i++) set.add(i);
  return set;
};
