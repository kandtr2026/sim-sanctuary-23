import { describe, it, expect, vi, afterEach } from 'vitest';
import { querySimsFromDb } from '@/lib/serverSimData';

/**
 * Khoá cú pháp `or=(...)` của bộ lọc đầu số / đuôi số.
 *
 * Bản cũ sinh `or=(raw_digits=like.090*,raw_digits=like.093*)`. Trong `or()`
 * PostgREST chỉ nhận cú pháp DẤU CHẤM (`col.op.value`), nên dạng `=` trả
 * 400 PGRST100 "failed to parse logic tree" — đã xác minh trên PostgREST
 * production:
 *
 *   or=(raw_digits=like.090*,raw_digits=like.093*)  → HTTP 400 PGRST100
 *   or=(raw_digits.like.090*,raw_digits.like.093*)  → HTTP 206, total 35.404
 *                                                     (= 22.016 của 090 + 13.388 của 093)
 *
 * 400 làm `querySimsFromDb` trả null → `/api/sims` rơi âm thầm về lọc in-memory
 * quét cả 49k hàng. Kết quả vẫn đúng nên không ai thấy, chỉ đắt. Test bắt trực
 * tiếp chuỗi query vì đó là chỗ duy nhất quyết định chuyện này.
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

/** Giá trị của mọi param `raw_digits` (URLSearchParams đã giải mã). */
const digitTerms = (url: string): string[] => new URL(url).searchParams.getAll('raw_digits');

/** Giá trị của mọi param `or` (đã giải mã). */
const orTerms = (url: string): string[] => new URL(url).searchParams.getAll('or');

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('querySimsFromDb — đầu số', () => {
  it('một đầu số → mệnh đề AND thường, không dùng or()', async () => {
    const urls = captureUrls();

    const res = await querySimsFromDb({ prefixes: ['090'] }, 20, 0);

    expect(res).not.toBeNull();
    const url = urls[urls.length - 1];
    expect(digitTerms(url)).toEqual(['like.090*']);
    expect(orTerms(url)).toHaveLength(0);
  });

  it('nhiều đầu số → or() cú pháp dấu chấm, không có dấu "="', async () => {
    const urls = captureUrls();

    const res = await querySimsFromDb({ prefixes: ['090', '093'] }, 20, 0);

    // null = rơi về lọc in-memory 49k hàng.
    expect(res).not.toBeNull();
    const url = urls[urls.length - 1];
    expect(orTerms(url)).toEqual(['(raw_digits.like.090*,raw_digits.like.093*)']);
    // Đây chính là lỗi cũ: `raw_digits=like.` trong or() → PGRST100.
    expect(orTerms(url)[0]).not.toContain('raw_digits=');
    expect(url).not.toContain('raw_digits%3Dlike');
  });

  it('ba đầu số → cả ba đều vào or()', async () => {
    const urls = captureUrls();

    await querySimsFromDb({ prefixes: ['090', '093', '070'] }, 20, 0);

    expect(orTerms(urls[urls.length - 1])).toEqual([
      '(raw_digits.like.090*,raw_digits.like.093*,raw_digits.like.070*)',
    ]);
  });
});

describe('querySimsFromDb — đuôi số', () => {
  it('một đuôi số → mệnh đề AND thường', async () => {
    const urls = captureUrls();

    const res = await querySimsFromDb({ suffixes: ['68'] }, 20, 0);

    expect(res).not.toBeNull();
    expect(digitTerms(urls[urls.length - 1])).toEqual(['like.*68']);
    expect(orTerms(urls[urls.length - 1])).toHaveLength(0);
  });

  it('nhiều đuôi số → or() cú pháp dấu chấm', async () => {
    const urls = captureUrls();

    const res = await querySimsFromDb({ suffixes: ['68', '86'] }, 20, 0);

    expect(res).not.toBeNull();
    const url = urls[urls.length - 1];
    expect(orTerms(url)).toEqual(['(raw_digits.like.*68,raw_digits.like.*86)']);
    expect(orTerms(url)[0]).not.toContain('raw_digits=');
  });
});

describe('querySimsFromDb — đầu số + đuôi số cùng lúc', () => {
  it('sinh hai param or= riêng (PostgREST AND chúng lại)', async () => {
    const urls = captureUrls();

    const res = await querySimsFromDb(
      { prefixes: ['090', '093'], suffixes: ['68', '86'] },
      20,
      0,
    );

    expect(res).not.toBeNull();
    // Live: hai param or= này trả 5.067 hàng = 3.390 (…68) + 1.677 (…86).
    expect(orTerms(urls[urls.length - 1])).toEqual([
      '(raw_digits.like.090*,raw_digits.like.093*)',
      '(raw_digits.like.*68,raw_digits.like.*86)',
    ]);
  });
});

describe('querySimsFromDb — giá trị đầu/đuôi không phải chữ số', () => {
  it('loại thành viên rác khỏi or(), giữ thành viên hợp lệ', async () => {
    const urls = captureUrls();

    await querySimsFromDb({ prefixes: ['090', 'abc', '093)'] }, 20, 0);

    const url = urls[urls.length - 1];
    // Còn đúng một đầu số hợp lệ → không cần or().
    expect(digitTerms(url)).toEqual(['like.090*']);
    expect(orTerms(url)).toHaveLength(0);
    expect(url).not.toContain('abc');
  });

  it('rác hết thì trả 0 hàng, KHÔNG bỏ mệnh đề (bỏ = âm thầm lấy tất cả)', async () => {
    const urls = captureUrls();

    const res = await querySimsFromDb({ prefixes: ['abc'] }, 20, 0);

    expect(res).toEqual({ items: [], total: 0 });
    expect(urls).toHaveLength(0);
  });

  it('không cho chèn mệnh đề vào logic tree qua giá trị đuôi số', async () => {
    const urls = captureUrls();

    await querySimsFromDb({ suffixes: ['68', '86),is_vip.is.true,or=('] }, 20, 0);

    const url = urls[urls.length - 1];
    const params = new URL(url).searchParams;
    expect(params.getAll('raw_digits')).toEqual(['like.*68']);
    // `is_vip` vẫn xuất hiện trong `select=` (nó là một cột) — điều phải chặn là
    // nó trở thành MỘT MỆNH ĐỀ LỌC do khách tự chèn.
    expect(params.getAll('is_vip')).toHaveLength(0);
    expect(params.getAll('or')).toHaveLength(0);
    expect(params.get('select')).toBe(
      'id,raw_digits,display_number,original_price,final_price,effective_price,network,tags,beauty_score,is_vip',
    );
  });
});
