/**
 * Bộ lọc + tìm kiếm SIM DÙNG CHUNG (server route handler + client).
 *
 * Trích từ logic cũ trong `useSimData.ts` (khối `filteredSims` + rule tìm
 * A/B/C) và `serverSimData.ts` thành hàm THUẦN — không phụ thuộc browser/react,
 * chạy được cả ở Route Handler `/api/sims`. MỘT nguồn sự thật để server và
 * client (khi Phase 2 chuyển sang) không lệch kết quả.
 */

import { matchesQuyFilter, parseBirthDate, sortSIMs, PRICE_RANGES } from '@/lib/simUtils';
import type { NormalizedSIM, QuyType, SortOption } from '@/lib/simUtils';

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
  /** Chỉ số vào PRICE_RANGES */
  priceRanges?: number[];
  customPriceMin?: number | null;
  customPriceMax?: number | null;
  /** Mạng di động (Mobifone / Vinaphone / Gmobile) */
  networks?: string[];
  vipFilter?: 'all' | 'only' | 'hide';
  sortBy?: SortOption;
  mobifoneFirst?: boolean;
  /** Chỉ giữ SIM có ngày sinh THẬT (parseBirthDate hợp lệ) — lọc "Năm sinh" chặt. */
  birthDateOnly?: boolean;
}

const getDigits = (s: NormalizedSIM): string =>
  s.rawDigits || s.displayNumber.replace(/\D/g, '') || '';

/**
 * Lọc theo criteria.
 * Nếu `criteria.sortBy` được cung cấp → dùng sortSIMs; nếu không → sort giá tăng
 * (giữ hành vi CategorySimGrid cũ). KHÔNG phân trang — route handler tự slice.
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
      const exact = result.filter((s) => getDigits(s) === digitsOnly);
      return exact.length > 0 ? exact : [];
    }

    if (search.includes('*')) {
      const startsWithStar = search.startsWith('*');
      const endsWithStar = search.endsWith('*');
      const parts = search.split('*').filter(Boolean);

      if (endsWithStar && !startsWithStar && parts.length >= 1) {
        const prefix = parts[0];
        result = result.filter((s) => getDigits(s).startsWith(prefix));
      } else if (startsWithStar && !endsWithStar && parts.length >= 1) {
        const suffix = parts[parts.length - 1];
        result = result.filter((s) => getDigits(s).endsWith(suffix));
      } else if (!startsWithStar && !endsWithStar && parts.length === 2) {
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
      result = result.filter((s) => getDigits(s).includes(digitsOnly));
    }
  }

  // ── Price ranges ──────────────────────────────────────────────────────────
  if (criteria.priceRanges?.length) {
    result = result.filter((s) =>
      criteria.priceRanges!.some((idx) => {
        const range = PRICE_RANGES[idx];
        if (!range) return false;
        return s.price >= range.min && s.price <= range.max;
      }),
    );
  }

  if (criteria.customPriceMin !== null && criteria.customPriceMin !== undefined) {
    result = result.filter((s) => s.price >= criteria.customPriceMin!);
  }
  if (criteria.customPriceMax !== null && criteria.customPriceMax !== undefined) {
    result = result.filter((s) => s.price <= criteria.customPriceMax!);
  }

  // ── Networks ──────────────────────────────────────────────────────────────
  if (criteria.networks?.length) {
    result = result.filter((s) => criteria.networks!.includes(s.network));
  }

  // ── VIP filter ────────────────────────────────────────────────────────────
  if (criteria.vipFilter === 'only') {
    result = result.filter((s) => s.isVIP);
  } else if (criteria.vipFilter === 'hide') {
    result = result.filter((s) => !s.isVIP);
  }

  if (criteria.quyType) {
    result = result.filter((s) => matchesQuyFilter(getDigits(s), criteria.quyType!, null));
  }

  // Lọc "Năm sinh" chặt: chỉ giữ sim đọc được ngày sinh thật từ 6 số cuối.
  if (criteria.birthDateOnly) {
    result = result.filter((s) => parseBirthDate(getDigits(s)) !== null);
  }

  // ── Sort ──────────────────────────────────────────────────────────────────
  if (criteria.sortBy) {
    result = sortSIMs(result, criteria.sortBy);
    if (criteria.sortBy === 'default' && criteria.mobifoneFirst) {
      result = [...result].sort((a, b) => {
        if (a.network === 'Mobifone' && b.network !== 'Mobifone') return -1;
        if (a.network !== 'Mobifone' && b.network === 'Mobifone') return 1;
        return 0;
      });
    }
  } else {
    // CategorySimGrid: sort giá tăng (mặc định nếu không có sortBy).
    result = [...result].sort((a, b) => a.price - b.price || b.beautyScore - a.beautyScore);
  }

  return result;
}

/** Lấy một trang `limit` phần tử từ `offset`. */
export function paginateSims<T>(items: T[], limit: number, offset: number): T[] {
  return items.slice(offset, offset + limit);
}