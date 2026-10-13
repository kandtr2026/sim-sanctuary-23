import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * `getServerSims` phải đọc snapshot TRƯỚC; chỉ khi snapshot không dùng được mới
 * crawl PostgREST. Khoá cả hai chiều để lần sau ai đó đổi thứ tự không âm thầm
 * đưa 82 request/lần crawl trở lại.
 */
const dbRow = (id: string) => ({
  id,
  raw_digits: '0933666666',
  display_number: '0933666666',
  original_price: 39_000_000,
  final_price: null,
  effective_price: 39_000_000,
  network: 'Mobifone',
  beauty_score: 60,
  is_vip: true,
});

const jsonResponse = (body: unknown, headers: Record<string, string> = {}) =>
  ({
    ok: true,
    status: 200,
    headers: new Headers(headers),
    json: async () => body,
    text: async () => JSON.stringify(body),
  }) as unknown as Response;

const stubPostgrest = () => {
  const urls: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      urls.push(String(input));
      return jsonResponse([dbRow('FROM_DB')], { 'content-range': '0-0/1' });
    }),
  );
  return urls;
};

beforeEach(() => vi.resetModules());
afterEach(() => {
  vi.unstubAllGlobals();
  vi.doUnmock('@/lib/simsSnapshot');
});

describe('getServerSims — thứ tự nguồn', () => {
  it('có snapshot → dùng snapshot, KHÔNG gọi PostgREST', async () => {
    vi.doMock('@/lib/simsSnapshot', () => ({
      readSnapshotRows: async () => [dbRow('FROM_SNAPSHOT')],
    }));
    const urls = stubPostgrest();
    const { getServerSims } = await import('@/lib/serverSimData');

    const sims = await getServerSims();

    expect(sims.map((s) => s.id)).toEqual(['FROM_SNAPSHOT']);
    expect(urls.filter((u) => u.includes('/rest/v1/sims'))).toHaveLength(0);
  });

  it('snapshot không dùng được (null) → rơi về crawl PostgREST như cũ', async () => {
    vi.doMock('@/lib/simsSnapshot', () => ({ readSnapshotRows: async () => null }));
    const urls = stubPostgrest();
    const { getServerSims } = await import('@/lib/serverSimData');

    const sims = await getServerSims();

    expect(sims.map((s) => s.id)).toEqual(['FROM_DB']);
    expect(urls.some((u) => u.includes('/rest/v1/sims') && u.includes('offset=0'))).toBe(true);
  });
});
