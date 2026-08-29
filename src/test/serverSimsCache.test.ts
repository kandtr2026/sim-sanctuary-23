import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

/**
 * Khoá hạn dùng của cache module trong `serverSimData`.
 *
 * Bản cũ gán `cachedResult` một lần rồi trả mãi. `export const revalidate = 300`
 * vẫn render lại trang đúng hạn, nhưng render lại trên đúng mảng đã đóng băng,
 * nên dữ liệu cũ bằng TUỔI CỦA TIẾN TRÌNH lambda — không phải 5 phút như comment
 * ngụ ý. Ảnh hưởng: trang chủ (40 thẻ + facet + Offer JSON-LD), `/api/sims`
 * nhánh chậm, 10 trang danh mục qua `getCategorySnapshot`, `sim-nam-sinh/[year]`.
 *
 * Hai tính chất phải cùng đúng:
 *   1. Trong TTL: nhiều lần gọi (nhiều trang trong một build worker) chỉ fetch 1
 *      lần — nếu mất, build 117 trang sẽ kéo kho SIM 117 lần.
 *   2. Quá TTL: fetch lại.
 */
const TTL_MS = 300_000;

const jsonResponse = (body: unknown, headers: Record<string, string> = {}) =>
  ({
    ok: true,
    status: 200,
    headers: new Headers(headers),
    json: async () => body,
    text: async () => JSON.stringify(body),
  }) as unknown as Response;

const dbRow = (id: string) => ({
  id,
  raw_digits: '0933666666',
  display_number: '0933.66.6666',
  original_price: 39_000_000,
  final_price: null,
  effective_price: 39_000_000,
  network: 'Mobifone',
  tags: ['Tứ quý'],
  beauty_score: 60,
  is_vip: true,
});

/** Stub bảng `sims`: 1 request đếm (limit=0) + 1 request trang dữ liệu. */
const stubDb = () => {
  let generation = 0;
  const urls: string[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    urls.push(url);
    if (url.includes('limit=0')) {
      generation++;
      return jsonResponse([], { 'content-range': '0-0/1' });
    }
    return jsonResponse([dbRow(`sim-gen-${generation}`)], { 'content-range': '0-0/1' });
  });
  vi.stubGlobal('fetch', fetchMock);
  return { fetchMock, urls };
};

/** Số lần thực sự đi lấy kho (đếm request đếm `limit=0`). */
const loadCount = (urls: string[]): number => urls.filter((u) => u.includes('limit=0')).length;

let now = 1_700_000_000_000;

beforeEach(() => {
  vi.resetModules();
  now = 1_700_000_000_000;
  vi.spyOn(Date, 'now').mockImplementation(() => now);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('getServerSims — cache có hạn dùng', () => {
  it('trong TTL: gọi nhiều lần chỉ fetch một lần', async () => {
    const { urls } = stubDb();
    const { getServerSims } = await import('@/lib/serverSimData');

    await getServerSims();
    now += TTL_MS - 1;
    await getServerSims();
    await getServerSims();

    expect(loadCount(urls)).toBe(1);
  });

  it('quá TTL: fetch lại và trả dữ liệu mới', async () => {
    const { urls } = stubDb();
    const { getServerSims } = await import('@/lib/serverSimData');

    const first = await getServerSims();
    expect(first[0].id).toBe('sim-gen-1');

    now += TTL_MS + 1;
    const second = await getServerSims();

    // Bản cũ: vẫn 1 → mảng đóng băng theo tuổi tiến trình.
    expect(loadCount(urls)).toBe(2);
    expect(second[0].id).toBe('sim-gen-2');
  });

  it('nhiều render song song chia sẻ đúng một lần fetch', async () => {
    const { urls } = stubDb();
    const { getServerSims } = await import('@/lib/serverSimData');

    const results = await Promise.all([getServerSims(), getServerSims(), getServerSims()]);

    expect(loadCount(urls)).toBe(1);
    expect(results[1]).toBe(results[0]);
    expect(results[2]).toBe(results[0]);
  });

  it('không cache kết quả rỗng khi nguồn lỗi — lần sau phải thử lại', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 500, headers: new Headers() }) as unknown as Response),
    );
    const { getServerSims } = await import('@/lib/serverSimData');

    expect(await getServerSims()).toEqual([]);
    const callsAfterFirst = (globalThis.fetch as unknown as { mock: { calls: unknown[] } }).mock.calls.length;

    expect(await getServerSims()).toEqual([]);
    expect(
      (globalThis.fetch as unknown as { mock: { calls: unknown[] } }).mock.calls.length,
    ).toBeGreaterThan(callsAfterFirst);
  });
});
