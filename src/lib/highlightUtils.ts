// Search Highlight Utilities
// Highlights matching digits in SIM numbers based on search query

import React from 'react';
import type { QuyType } from '@/lib/simUtils';

interface HighlightRange {
  start: number;
  end: number;
}

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
 * Parse search query to extract prefix and suffix parts
 */
export const parseSearchQuery = (query: string): { prefix: string; suffix: string; containsSearch: string } => {
  if (!query) return { prefix: '', suffix: '', containsSearch: '' };
  
  // Clean query - remove dots, spaces
  const cleanQuery = query.replace(/[.\s]/g, '').trim();
  
  // Exact match (=prefix) - treat as contains
  if (cleanQuery.startsWith('=')) {
    return { prefix: '', suffix: '', containsSearch: cleanQuery.slice(1) };
  }
  
  // Wildcard pattern
  if (cleanQuery.includes('*')) {
    const parts = cleanQuery.split('*').filter(Boolean);
    
    // prefix*suffix
    if (parts.length === 2 && !cleanQuery.startsWith('*') && !cleanQuery.endsWith('*')) {
      return { prefix: parts[0], suffix: parts[1], containsSearch: '' };
    }
    
    // *suffix
    if (cleanQuery.startsWith('*') && parts.length === 1) {
      return { prefix: '', suffix: parts[0], containsSearch: '' };
    }
    
    // prefix*
    if (cleanQuery.endsWith('*') && parts.length === 1) {
      return { prefix: parts[0], suffix: '', containsSearch: '' };
    }
  }
  
  // Default: contains search
  return { prefix: '', suffix: '', containsSearch: cleanQuery };
};

/**
 * Find highlight ranges in rawDigits based on search query
 */
export const findHighlightRanges = (rawDigits: string, query: string): HighlightRange[] => {
  if (!rawDigits || !query) return [];
  
  const { prefix, suffix, containsSearch } = parseSearchQuery(query);
  const ranges: HighlightRange[] = [];
  
  // Prefix highlight
  if (prefix && rawDigits.startsWith(prefix)) {
    ranges.push({ start: 0, end: prefix.length });
  }
  
  // Suffix highlight
  if (suffix && rawDigits.endsWith(suffix)) {
    const start = rawDigits.length - suffix.length;
    ranges.push({ start, end: rawDigits.length });
  }
  
  // Contains highlight (ALL occurrences, not just first)
  if (containsSearch) {
    let idx = 0;
    while ((idx = rawDigits.indexOf(containsSearch, idx)) !== -1) {
      ranges.push({ start: idx, end: idx + containsSearch.length });
      idx += containsSearch.length; // Move past current match to find next
    }
  }
  
  return ranges;
};

/**
 * Map index from rawDigits to displayNumber position
 * displayNumber may contain dots/spaces, rawDigits is digits only
 */
const mapRawIndexToDisplay = (rawIndex: number, displayNumber: string): number => {
  let rawCount = 0;
  for (let i = 0; i < displayNumber.length; i++) {
    if (/\d/.test(displayNumber[i])) {
      if (rawCount === rawIndex) return i;
      rawCount++;
    }
  }
  return displayNumber.length;
};

/** Gom một dãy chữ số thành nhóm 3 từ trái sang: "070375" → "070.375". */
const groupDigitsInThrees = (digits: string): string => {
  const out: string[] = [];
  for (let i = 0; i < digits.length; i += 3) out.push(digits.slice(i, i + 3));
  return out.join('.');
};

/**
 * Create highlighted spans for display number based on rawDigits highlight ranges
 */
export const createHighlightedNumber = (
  displayNumber: string,
  rawDigits: string,
  query: string
): React.ReactNode[] => {
  if (!query || !displayNumber) {
    return [displayNumber];
  }

  const cleanQuery = query.replace(/[.\s]/g, '');
  const starCount = (cleanQuery.match(/\*/g) || []).length;
  let processedWildcard = false;

  // Strict wildcard mode: if exactly 1 '*', handle prefix/suffix/mid and return immediately
  if (starCount === 1) {
    processedWildcard = true;
    const starIdx = cleanQuery.indexOf('*');
    const isStart = starIdx === 0;
    const isEnd = starIdx === cleanQuery.length - 1;
    const prefixDigits = cleanQuery.substring(0, starIdx).replace(/\D/g, '');
    const suffixDigits = cleanQuery.substring(starIdx + 1).replace(/\D/g, '');
    const candidateDigits = rawDigits.replace(/\D/g, '');
    const len = candidateDigits.length;

    

    const hlSet = new Set<number>();

    if (!isStart && !isEnd) {
      // prefix*suffix
      if (prefixDigits && candidateDigits.startsWith(prefixDigits)) {
        for (let i = 0; i < prefixDigits.length; i++) hlSet.add(i);
      }
      if (suffixDigits && candidateDigits.endsWith(suffixDigits)) {
        for (let i = len - suffixDigits.length; i < len; i++) hlSet.add(i);
      }
    } else if (isEnd && prefixDigits) {
      // prefix*
      if (candidateDigits.startsWith(prefixDigits)) {
        for (let i = 0; i < prefixDigits.length; i++) hlSet.add(i);
      }
    } else if (isStart && suffixDigits) {
      // *suffix
      if (candidateDigits.endsWith(suffixDigits)) {
        // Reformats to keep the matched suffix as one contiguous group at the
        // end so customers see the ending they searched for at a glance:
        //   tìm *6879 → 0703.756.879 (bị tách 6.879) → 070.375.6879 (.6879 vàng)
        const suffixLen = suffixDigits.length;
        const prefixRaw = candidateDigits.slice(0, len - suffixLen);
        const groupedPrefix = groupDigitsInThrees(prefixRaw);
        const display = groupedPrefix ? `${groupedPrefix}.${suffixDigits}` : suffixDigits;
        const hlSet = new Set<number>();
        for (let i = len - suffixLen; i < len; i++) hlSet.add(i);
        return buildSpansFromHlSet(display, hlSet);
      }
    }

    // Wildcard processed: no fallback allowed
    if (hlSet.size === 0) return [displayNumber];
    return buildSpansFromHlSet(displayNumber, hlSet);
  }

  // Non-wildcard: use existing findHighlightRanges
  const ranges = findHighlightRanges(rawDigits, query);
  if (ranges.length === 0) {
    return [displayNumber];
  }

  // Map raw ranges to display ranges
  const displayRanges: HighlightRange[] = ranges.map(range => ({
    start: mapRawIndexToDisplay(range.start, displayNumber),
    end: mapRawIndexToDisplay(range.end - 1, displayNumber) + 1
  }));

  // Merge overlapping ranges
  const mergedRanges: HighlightRange[] = [];
  const sortedRanges = [...displayRanges].sort((a, b) => a.start - b.start);

  for (const range of sortedRanges) {
    if (mergedRanges.length === 0) {
      mergedRanges.push({ ...range });
    } else {
      const last = mergedRanges[mergedRanges.length - 1];
      if (range.start <= last.end) {
        last.end = Math.max(last.end, range.end);
      } else {
        mergedRanges.push({ ...range });
      }
    }
  }

  // Build spans
  const spans: React.ReactNode[] = [];
  let lastEnd = 0;

  for (let i = 0; i < mergedRanges.length; i++) {
    const range = mergedRanges[i];
    if (range.start > lastEnd) {
      spans.push(
        React.createElement('span', { key: `normal-${i}`, className: 'opacity-80' },
          displayNumber.slice(lastEnd, range.start)
        )
      );
    }
    spans.push(
      React.createElement('span', {
        key: `highlight-${i}`,
        className: 'font-extrabold text-gold'
      }, displayNumber.slice(range.start, range.end))
    );
    lastEnd = range.end;
  }

  if (lastEnd < displayNumber.length) {
    spans.push(
      React.createElement('span', { key: 'normal-end', className: 'opacity-80' },
        displayNumber.slice(lastEnd)
      )
    );
  }

  return spans;
};

/**
 * Build React spans from a digit-index highlight set, preserving non-digit chars in display.
 * @param hlClassName class applied to highlighted spans (default: search red).
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
      // Non-digit character: flush current buffer if needed, then add dot to result or next buffer
      // We want dots to NOT be highlighted, so flush highlighted content first
      if (buf && bufHl) {
        // Current buffer is highlighted, flush it before adding the dot
        flush();
      }
      // Add the non-digit to the buffer as non-highlighted
      bufHl = false;
      buf += ch;
    }
  }
  flush();

  return result;
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
 * Tứ quý (4 tail digits) keeps the original 3-3-4 display format and just
 * highlights the tail group in gold. Returns [displayNumber] when the filter
 * doesn't apply, so the caller can fall back to normal rendering.
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
    // Tứ quý: 4 số đuôi — giữ nguyên format 3-3-4, chỉ highlight đuôi vàng
    const s = digits.length - run;
    if (s >= 0 && /^(\d)\1{3}$/.test(digits.slice(s))) start = s;
    if (start === -1) return [displayNumber];
    const hlSet = new Set<number>();
    for (let i = start; i < digits.length; i++) hlSet.add(i);
    return buildSpansFromHlSet(displayNumber, hlSet, 'font-extrabold text-gold');
  }

  // Ngũ quý / Lục quý: tìm cụm run chữ số giống nhau liền nhau ở BẤT KỲ ĐÂU
  const sameBlockRegex = new RegExp(`^(\\d)\\1{${run - 1}}$`);
  for (let i = 0; i <= digits.length - run; i++) {
    if (sameBlockRegex.test(digits.slice(i, i + run))) {
      start = i;
      break;
    }
  }
  if (start === -1) return [displayNumber];

  // Reformat thành prefix.quýblock.suffix — dấu chấm tách cụm quý ra
  // để mắt nhìn thấy ngay dạng đẹp (ví dụ 0.77777.9086).
  const prefix = digits.slice(0, start);
  const block = digits.slice(start, start + run);
  const suffix = digits.slice(start + run);

  const result: React.ReactNode[] = [];
  result.push(React.createElement('span', { key: 'pre', className: 'opacity-80' }, prefix));
  if (prefix) result.push('.');
  result.push(React.createElement('span', { key: 'quy', className: 'font-extrabold text-gold' }, block));
  if (suffix) result.push('.');
  result.push(React.createElement('span', { key: 'suf', className: 'opacity-80' }, suffix));
  return result;
};
