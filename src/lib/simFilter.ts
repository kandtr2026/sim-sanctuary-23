/**
 * Bộ lọc + tìm kiếm SIM DÙNG CHUNG (server route handler + client).
 *
 * Trích từ logic cũ trong `useSimData.ts` (khối `filteredSims` + rule tìm
 * A/B/C) và `serverSimData.ts` thành hàm THUẦN — không phụ thuộc browser/react,
 * chạy được cả ở Route Handler `/api/sims`. MỘT nguồn sự thật để server và
 * client (khi Phase 2 chuyển sang) không lệch kết quả.
 */

import { matchesQuyFilter } from '@/lib/simUtils';
import type { NormalizedSIM, QuyType } from '@/lib/simUtils';

export interface SimFilterCriteria {
  /** Chuỗi tìm kiếm — hỗ trợ: 10 số chính xác, `*đuôi`, `đầu*`, chứa. */
  search?: string;
  /** SIM phải bắt đầu bằng một trong các prefix. */
  prefixes?: string[];
  /** SIM phải kết thúc bằng một trong các suffix. */
  suffixes?: string[];
  /** SIM phải có ít nhất một trong các tag. */
  tags?: string[];
  /** Chữ số cuối cùng phải nằm trong danh sách. */
  lastDigits?: string[];
  /** Bỏ mọi filter (chỉ giữ giá > 0). */
  matchAll?: boolean;
  quyType?: QuyType | null;
  quyPosition?: string | null;
}

const getDigits = (s: NormalizedSIM): string =>
  s.rawDigits || s.displayNumber.replace(/\D/g, '') || '';

/**
 * Lọc theo criteria, sort giá tăng (giữ đúng hành vi `CategorySimGrid` cũ).
 * KHÔNG phân trang ở đây — route handler tự slice bằng limit/offset.
 */
export function filterSims(sims: NormalizedSIM[], criteria: SimFilterCriteria): NormalizedSIM[] {
  let result = sims.filter((s) => s.price > 0);

  if (!criteria.matchAll) {
    if (criteria.prefixes?.length) {
      result = result.filter((s) => criteria.prefixes!.some((p) => getDigits(s).startsWith(p)));
    }
    if (criteria.suffixes?.length) {
      result = result.filter((s) => criteria.suffixes!.some((suf) => getDigits(s).endsWith(suf)));
    }
    if (criteria.tags?.length) {
      result = result.filter((s) => criteria.tags!.some((t) => s.tags?.includes(t)));
    }
    if (criteria.lastDigits?.length) {
      result = result.filter((s) => criteria.lastDigits!.includes(getDigits(s).slice(-1)));
    }
  }

  // ── Rule tìm kiếm (mirror `useSimData.ts` RULE A/B/C) ─────────────────────
  const search = (criteria.search ?? '').trim().replace(/[^0-9*]/g, '');
  const digitsOnly = search.replace(/\*/g, '');

  if (search.length > 0 && digitsOnly.length > 0) {
    if (digitsOnly.length === 10 && !search.includes('*')) {
      // RULE A: 10 số chính xác — bỏ qua mọi filter, trả đúng số đó (hoặc rỗng).
      const exact = result.filter((s) => getDigits(s) === digitsOnly);
      return exact.length > 0 ? exact : [];
    }

    if (search.includes('*')) {
      // RULE B: wildcard
      const startsWithStar = search.startsWith('*');
      const endsWithStar = search.endsWith('*');
      const parts = search.split('*').filter(Boolean);

      if (endsWithStar && !startsWithStar && parts.length >= 1) {
        // "0903*" -> bắt đầu bằng prefix
        const prefix = parts[0];
        result = result.filter((s) => getDigits(s).startsWith(prefix));
      } else if (startsWithStar && !endsWithStar && parts.length >= 1) {
        // "*8888" -> kết thúc bằng suffix
        const suffix = parts[parts.length - 1];
        result = result.filter((s) => getDigits(s).endsWith(suffix));
      } else if (!startsWithStar && !endsWithStar && parts.length === 2) {
        // "090*6789" -> bắt đầu VÀ kết thúc
        const prefix = parts[0];
        const suffix = parts[1];
        result = result.filter((s) => {
          const d = getDigits(s);
          return d.startsWith(prefix) && d.endsWith(suffix);
        });
      } else if (digitsOnly.length >= 2) {
        result = result.filter((s) => getDigits(s).includes(digitsOnly));
      }
    } else {
      // RULE C: chứa
      result = result.filter((s) => getDigits(s).includes(digitsOnly));
    }
  }

  if (criteria.quyType) {
    result = result.filter((s) =>
      matchesQuyFilter(getDigits(s), criteria.quyType!, null),
    );
  }

  // Sort giá tăng (rồi đẹp hơn đứng trước — giữ hành vi cũ của CategorySimGrid).
  result = [...result].sort((a, b) => a.price - b.price || b.beautyScore - a.beautyScore);

  return result;
}

/** Lấy một trang `limit` phần tử từ `offset`. */
export function paginateSims<T>(items: T[], limit: number, offset: number): T[] {
  return items.slice(offset, offset + limit);
}
