import { describe, it, expect, vi, afterEach } from 'vitest';
import { querySimsFromDb } from '@/lib/serverSimData';
import { PRICE_RANGES } from '@/lib/simUtils';

/**
 * Khoá biên khoảng giá đẩy xuống PostgREST.
 *
 * Trước đây `serverSimData.ts` giữ BẢN COPY riêng của bảng khoảng giá: 8 bậc,
 * bậc 7 kéo tới 999.999.999. Chip lọc/facet count lại dùng bản 9 bậc trong
 * `simUtils.ts` (bậc 7 = 200 – 499.999.999, bậc 8 = trên 500 triệu). Hậu quả
 * trên production: `0933.68.6666` (513tr) và `0909.686.686` (788tr) lọt vào
 * nhãn "200 - 500 triệu" (DB trả 21 hàng trong khi chip đếm 19), còn bậc 8
 * không tồn tại ở bản copy → `or=()` → PostgREST 400 → rơi âm thầm về lọc
 * in-memory 49k hàng.
 *
 * Test bắt trực tiếp chuỗi query PostgREST vì đó là chỗ duy nhất quyết định
 * biên giá thật sự áp lên khách.
 */
const jsonResponse = (body: unknown, headers: Record<string, string> = {}) =>
  ({
    ok: true,
    status: 200,
    headers: new Headers(headers),
    json: async () => body,
    text: async () => JSON.stringify(body),
  }) as unknown as Response;

const captureUrls = () => {
  const urls: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      urls.push(String(input));
      return jsonResponse([], { 'content-range': '0-0/0' });
    }),
  );
  return urls;
};

/** Giá trị của mọi param `effective_price` (URLSearchParams đã giải mã). */
const priceTerms = (url: string): string[] =>
  new URL(url).searchParams.getAll('effective_price');

/** Giá trị của mọi param `or` (đã giải mã). */
const orTerms = (url: string): string[] => new URL(url).searchParams.getAll('or');

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('PRICE_RANGES — một nguồn duy nhất', () => {
  it('giữ 9 bậc, bậc cuối mở (Infinity), nhãn hiển thị không đổi', () => {
    expect(PRICE_RANGES).toHaveLength(9);
    expect(PRICE_RANGES.map((r) => r.label)).toEqual([
      'Dưới 1 triệu',
      '1 - 3 triệu',
      '3 - 5 triệu',
      '5 - 10 triệu',
      '10 - 50 triệu',
      '50 - 100 triệu',
      '100 - 200 triệu',
      '200 - 500 triệu',
      'Trên 500 triệu',
    ]);
    expect(PRICE_RANGES[8].min).toBe(500_000_000);
    expect(PRICE_RANGES[8].max).toBe(Infinity);
  });

  it('query DB dùng đúng biên của từng bậc trong PRICE_RANGES (không có bảng thứ hai)', async () => {
    for (let idx = 0; idx < PRICE_RANGES.length; idx++) {
      const urls = captureUrls();
      await querySimsFromDb({ priceRanges: [idx] }, 20, 0);
      const terms = priceTerms(urls[urls.length - 1]);
      const r = PRICE_RANGES[idx];

      expect(terms, `bậc ${idx}`).toContain(`gte.${r.min}`);
      if (Number.isFinite(r.max)) {
        expect(terms, `bậc ${idx}`).toContain(`lte.${r.max}`);
      } else {
        expect(terms.some((t) => t.startsWith('lte.')), `bậc ${idx}`).toBe(false);
      }
      vi.unstubAllGlobals();
    }
  });
});

describe('querySimsFromDb — biên bậc 7 (200 - 500 triệu)', () => {
  it('chặn ở 499.999.999, không kéo tới 999.999.999', async () => {
    const urls = captureUrls();

    await querySimsFromDb({ priceRanges: [7] }, 50, 0);

    const url = urls[urls.length - 1];
    expect(priceTerms(url)).toContain('gte.200000000');
    expect(priceTerms(url)).toContain('lte.499999999');
    // Bản copy cũ sinh cận trên 999.999.999 → cho SIM 513tr/788tr lọt vào nhãn.
    expect(url).not.toContain('999999999');
  });
});

describe('querySimsFromDb — bậc 8 (Trên 500 triệu)', () => {
  it('chỉ sinh gte, không bao giờ có lte.Infinity', async () => {
    const urls = captureUrls();

    const res = await querySimsFromDb({ priceRanges: [8] }, 50, 0);

    // Phải chạy bằng query DB — không trả null (null = rơi về in-memory 49k hàng).
    expect(res).not.toBeNull();
    const url = urls[urls.length - 1];
    expect(priceTerms(url)).toContain('gte.500000000');
    expect(priceTerms(url).some((t) => t.startsWith('lte.'))).toBe(false);
    expect(url).not.toContain('Infinity');
    expect(orTerms(url)).toHaveLength(0);
  });

  it('chọn cả bậc 7 và 8 → or() cú pháp dấu chấm, không có lte.Infinity', async () => {
    const urls = captureUrls();

    await querySimsFromDb({ priceRanges: [7, 8] }, 50, 0);

    const url = urls[urls.length - 1];
    expect(orTerms(url)).toEqual([
      '(and(effective_price.gte.200000000,effective_price.lte.499999999),effective_price.gte.500000000)',
    ]);
    // Trong or() PostgREST chỉ nhận `col.op.value`; `col=op.value` → PGRST100.
    expect(orTerms(url)[0]).not.toContain('effective_price=');
    expect(url).not.toContain('Infinity');
  });
});

describe('querySimsFromDb — index khoảng giá không hợp lệ', () => {
  it('bỏ qua index lạ, không sinh or=() rỗng', async () => {
    for (const bad of [[99], [42, 1000], [-1], [Number.NaN]]) {
      const urls = captureUrls();

      const res = await querySimsFromDb({ priceRanges: bad }, 20, 0);

      expect(res, `priceRanges=${JSON.stringify(bad)}`).not.toBeNull();
      const url = urls[urls.length - 1];
      expect(url, `priceRanges=${JSON.stringify(bad)}`).not.toContain('or=');
      expect(url).not.toContain('%28%29');
      expect(orTerms(url)).toHaveLength(0);
      // Chỉ còn điều kiện nền effective_price > 0, không có biên bậc nào.
      expect(priceTerms(url)).toEqual(['gt.0']);
      vi.unstubAllGlobals();
    }
  });

  it('index lạ lẫn với index hợp lệ → chỉ áp bậc hợp lệ, không dùng or()', async () => {
    const urls = captureUrls();

    await querySimsFromDb({ priceRanges: [7, 99] }, 20, 0);

    const url = urls[urls.length - 1];
    expect(orTerms(url)).toHaveLength(0);
    expect(priceTerms(url)).toContain('gte.200000000');
    expect(priceTerms(url)).toContain('lte.499999999');
  });
});
