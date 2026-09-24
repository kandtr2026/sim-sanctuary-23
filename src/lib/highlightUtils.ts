// Search Highlight Utilities
// Tô sáng chữ số khớp câu tìm trong dãy SIM.
//
// LUẬT CHẤM (cụm khách tìm không được bị dấu chấm cắt đôi) nằm ở
// `@/lib/simDisplay` — file này chỉ dựng span React từ kế hoạch đó. Đừng thêm
// luật format mới ở đây, sửa `simDisplay.ts` để cả site đổi theo.

import React from 'react';
import type { QuyType } from '@/lib/simUtils';
import { blocksToDigitSet, planSimDisplay, type DigitBlock } from '@/lib/simDisplay';

/**
 * Get the best highlight digits for a suggestion card.
 * Finds longest common suffix (min 2, prefer 4/3/2) or fallback to last N digits of query that appear in candidate.
 */
export const getSuggestionHighlightDigits = (
  normalizedSearchDigits: string,
  candidateDigits: string
): string => {
  if (!normalizedSearchDigits || normalizedSearchDigits.length < 2 || !candidateDigits) {
    return '';
  }

  // 1. Try longest common suffix (prefer 4, then 3, then 2)
  for (let len = Math.min(normalizedSearchDigits.length, 4); len >= 2; len--) {
    const querySuffix = normalizedSearchDigits.slice(-len);
    if (candidateDigits.endsWith(querySuffix)) {
      return querySuffix;
    }
  }

  // 2. Fallback: check if last 4/3/2 digits of query appear anywhere in candidate
  for (let len = Math.min(normalizedSearchDigits.length, 4); len >= 2; len--) {
    const queryTail = normalizedSearchDigits.slice(-len);
    if (candidateDigits.includes(queryTail)) {
      return queryTail;
    }
  }

  // 3. Try prefix match (first 3-4 digits)
  for (let len = Math.min(normalizedSearchDigits.length, 4); len >= 3; len--) {
    const queryPrefix = normalizedSearchDigits.slice(0, len);
    if (candidateDigits.startsWith(queryPrefix)) {
      return queryPrefix;
    }
  }

  // 4. Try any substring match (longest first)
  for (let len = Math.min(normalizedSearchDigits.length, 4); len >= 2; len--) {
    const queryPart = normalizedSearchDigits.slice(0, len);
    if (candidateDigits.includes(queryPart)) {
      return queryPart;
    }
  }

  return '';
};

/**
 * Dựng span React từ set index chữ số cần tô, giữ nguyên dấu chấm trong display.
 * Dấu chấm luôn thuộc phần KHÔNG tô để cụm vàng nhìn gọn.
 * @param hlClassName class cho span được tô (mặc định: vàng đậm).
 */
const buildSpansFromHlSet = (
  displayNumber: string,
  hlSet: Set<number>,
  hlClassName: string = 'font-extrabold text-gold'
): React.ReactNode[] => {
  const result: React.ReactNode[] = [];
  let digitIdx = 0;
  let buf = '';
  let bufHl = false;

  const flush = () => {
    if (buf) {
      result.push(
        React.createElement('span', {
          key: `s-${result.length}`,
          className: bufHl ? hlClassName : 'opacity-80'
        }, buf)
      );
      buf = '';
    }
  };

  for (const ch of displayNumber) {
    if (/\d/.test(ch)) {
      const isHl = hlSet.has(digitIdx);
      if (buf && bufHl !== isHl) flush();
      bufHl = isHl;
      buf += ch;
      digitIdx++;
    } else {
      // Dấu chấm: xả cụm đang tô trước rồi mới nối dấu vào cụm không tô.
      if (buf && bufHl) flush();
      bufHl = false;
      buf += ch;
    }
  }
  flush();

  return result;
};

/**
 * Tô sáng dãy số theo câu tìm của khách.
 *
 * `displayNumber` chỉ là ĐỀ NGHỊ: nếu cách chấm đó cắt đôi cụm khách tìm
 * (`*6879` mà ra `0703.75|6.879`) thì `planSimDisplay` chấm lại thành
 * `070.375.6879`. Trả về `[displayNumber]` khi không có gì để tô — caller đang
 * dựa vào việc mảng 1 phần tử string nghĩa là "không khớp".
 */
export const createHighlightedNumber = (
  displayNumber: string,
  rawDigits: string,
  query: string
): React.ReactNode[] => {
  if (!query || !displayNumber) {
    return [displayNumber];
  }

  const plan = planSimDisplay(rawDigits || displayNumber, query, displayNumber);
  if (plan.hl.length === 0) {
    return [plan.display];
  }

  return buildSpansFromHlSet(plan.display, blocksToDigitSet(plan.hl));
};

/**
 * Highlight the quý block inside a SIM number for a quý-filtered listing.
 *
 * Ngũ quý / Lục quý: the 5/6 identical consecutive digits ANYWHERE in the
 * number. The display is reformatted to separate the quý block with dots:
 *
 *   raw 0777779086  →  0.77777.9086
 *   raw 0902777775  →  0902.77777.5
 *
 * Tứ quý (4 số đuôi) cũng được chấm lại qua `planSimDisplay` để cụm đuôi liền
 * mạch (`077.867.0000`, không phải `0778.670.000`). Trả về [displayNumber] khi
 * filter không áp được, để caller render kiểu thường.
 */
export const createQuyHighlightedNumber = (
  displayNumber: string,
  rawDigits: string,
  quyType: QuyType
): React.ReactNode[] => {
  const digits = rawDigits.replace(/\D/g, '');
  if (!digits || !quyType) return [displayNumber];

  const run = quyType === 'Lục quý' ? 6 : quyType === 'Ngũ quý' ? 5 : 4;

  // Find the quý block start index
  let start = -1;

  if (quyType === 'Tứ quý') {
    // Tứ quý: 4 số đuôi phải hiện LIỀN MỘT CỤM. Format 4-3-3 cắt mất cụm
    // (`0778.67|0.000`) nên chấm lại theo rule dùng chung ở `simDisplay`.
    const s = digits.length - run;
    if (s < 0 || !/^(\d)\1{3}$/.test(digits.slice(s))) return [displayNumber];
    const plan = planSimDisplay(digits, `*${digits.slice(s)}`, displayNumber);
    return buildSpansFromHlSet(plan.display, blocksToDigitSet(plan.hl), 'font-extrabold text-gold');
  }

  // Ngũ quý / Lục quý: tìm cụm chữ số giống nhau LIỀN NHAU DÀI NHẤT ở bất kỳ đâu.
  // Dùng run THẬT của số (không phải run của filter): một sim Lục quý (6 số) vẫn
  // khớp filter Ngũ quý — nếu cắt theo run=5 sẽ thành 5+1 (0.77777.79086) sai.
  const longestRun = (d: string): { start: number; len: number } | null => {
    let best: { start: number; len: number } | null = null;
    let i = 0;
    while (i < d.length) {
      let j = i;
      while (j < d.length && d[j] === d[i]) j++;
      if (!best || j - i > best.len) best = { start: i, len: j - i };
      i = j;
    }
    return best;
  };
  const found = longestRun(digits);
  if (!found || found.len < run) return [displayNumber];
  start = found.start;
  const block = digits.slice(start, start + found.len);

  // Reformat thành prefix.quýblock.suffix — dấu chấm tách cụm quý ra
  // để mắt nhìn thấy ngay dạng đẹp (ví dụ 0.77777.9086).
  const prefix = digits.slice(0, start);
  const suffix = digits.slice(start + found.len);

  const result: React.ReactNode[] = [];
  result.push(React.createElement('span', { key: 'pre', className: 'opacity-80' }, prefix));
  if (prefix) result.push('.');
  result.push(React.createElement('span', { key: 'quy', className: 'font-extrabold text-gold' }, block));
  if (suffix) result.push('.');
  result.push(React.createElement('span', { key: 'suf', className: 'opacity-80' }, suffix));
  return result;
};

/**
 * Dạng số mà lưới quý ĐANG hiển thị, dưới dạng chuỗi phẳng.
 * Rút ra từ chính node của `createQuyHighlightedNumber` để aria-label và popup
 * đặt mua đọc đúng cái mắt khách thấy (`077.867.0000`), không phải bản 4-3-3 cũ.
 */
export const quyDisplayNumber = (
  displayNumber: string,
  rawDigits: string,
  quyType: QuyType
): string => nodesToText(createQuyHighlightedNumber(displayNumber, rawDigits, quyType));

/** Ghép node (chuỗi + span một-con-chữ) về đúng chuỗi mắt khách thấy. */
const nodesToText = (nodes: React.ReactNode[]): string =>
  nodes
    .map((node) => {
      if (typeof node === 'string') return node;
      if (React.isValidElement<{ children?: string }>(node)) return node.props.children ?? '';
      return '';
    })
    .join('');

/** Độ dài cụm quý giữa: 4 = tứ quý giữa, 5 = ngũ quý giữa, 6 = lục quý giữa (từ 6 trở lên). */
export type MidQuyRun = 4 | 5 | 6;

/**
 * Tìm cụm quý NẰM GIỮA dãy, khớp đúng luật danh mục "Tứ/Ngũ/Lục quý giữa" ở
 * `supabase/functions/_shared/simCategories.ts` (`midRuns`): cụm chữ số giống
 * nhau liền nhau, bỏ số 0 đầu, KHÔNG chạm số cuối; riêng tứ quý giữa phải bắt
 * đầu sau 3 số đầu (cụm dính đầu số như 0333.3…, 0911.11… không tính).
 * Tứ/ngũ quý giữa tính ĐÚNG 4/5 số, lục quý giữa từ 6 số trở lên.
 *
 * Không dùng lại `createQuyHighlightedNumber` được: nhánh "Tứ quý" của nó chỉ
 * nhận cụm ĐUÔI, nhánh ngũ/lục lấy cụm dài nhất ở bất kỳ đâu (kể cả dính đầu số).
 */
export const findMidQuyRun = (rawDigits: string, run: MidQuyRun): DigitBlock | null => {
  const d = (rawDigits || '').replace(/\D/g, '');
  const from = run === 4 ? 3 : 1;
  let i = 1;
  while (i < d.length) {
    let j = i;
    while (j + 1 < d.length && d[j + 1] === d[i]) j++;
    const len = j - i + 1;
    if (j < d.length - 1 && i >= from && (run === 6 ? len >= 6 : len === run)) {
      return { start: i, end: j + 1 };
    }
    i = j + 1;
  }
  return null;
};

/**
 * Tô cụm quý giữa dãy, chấm lại thành đầu.CỤM.đuôi để cụm liền một khối:
 *
 *   0879111166 → 0879.1111.66
 *   0789999700 → 078.9999.700
 *   0929500002 → 0929.5.0000.2   (đầu 5 số tách 4 số đầu mạng cho dễ đọc)
 *
 * Trả về [displayNumber] khi số không có cụm quý giữa, để caller render kiểu thường.
 */
export const createMidQuyHighlightedNumber = (
  displayNumber: string,
  rawDigits: string,
  run: MidQuyRun
): React.ReactNode[] => {
  const digits = (rawDigits || '').replace(/\D/g, '');
  const found = findMidQuyRun(digits, run);
  if (!found) return [displayNumber];

  const prefix = digits.slice(0, found.start);
  const head = prefix.length > 4 ? `${prefix.slice(0, 4)}.${prefix.slice(4)}` : prefix;
  return [
    React.createElement('span', { key: 'pre', className: 'opacity-80' }, head),
    '.',
    React.createElement('span', { key: 'quy', className: 'font-extrabold text-gold' }, digits.slice(found.start, found.end)),
    '.',
    React.createElement('span', { key: 'suf', className: 'opacity-80' }, digits.slice(found.end)),
  ];
};

/** Chuỗi phẳng của `createMidQuyHighlightedNumber` — cho aria-label và Zalo. */
export const midQuyDisplayNumber = (
  displayNumber: string,
  rawDigits: string,
  run: MidQuyRun
): string => nodesToText(createMidQuyHighlightedNumber(displayNumber, rawDigits, run));
