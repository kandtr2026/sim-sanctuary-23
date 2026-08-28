import { describe, it, expect, vi, afterEach } from 'vitest';
import { querySimsFromDb } from '@/lib/serverSimData';

/**
 * Khoá luật "chỉ bán số được phép bán".
 *
 * `sync-sims` ghi bốn giá trị vào `sims.status`: available | sold | reserved |
 * ẩn. Bản cũ lọc `status=neq.sold` nên SIM `reserved` và 302 SIM `ẩn` vẫn lên
 * lưới, vào JSON-LD và đặt mua được. Test này bắt đúng chuỗi filter trong URL
 * PostgREST vì đó là chỗ duy nhất quyết định điều đó — không có test nào khác
 * chạm tới đường này.
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
      // `querySimsFromDb` đọc tổng số từ header content-range.
      return jsonResponse([], { 'content-range': '0-0/0' });
    }),
  );
  return urls;
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('querySimsFromDb — điều kiện được phép bán', () => {
  it('chỉ lấy status=available, không dùng neq.sold', async () => {
    const urls = captureUrls();

    await querySimsFromDb({}, 20, 0);

    expect(urls.length).toBeGreaterThan(0);
    for (const url of urls) {
      expect(url).toContain('status=eq.available');
      expect(url).not.toContain('neq.sold');
    }
  });

  it('giữ điều kiện đó khi có thêm bộ lọc khác', async () => {
    const urls = captureUrls();

    await querySimsFromDb({ prefixes: ['090'], customPriceMin: 1_000_000 }, 20, 0);

    expect(urls.every((u) => u.includes('status=eq.available'))).toBe(true);
  });
});
