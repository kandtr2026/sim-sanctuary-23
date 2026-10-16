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
      readSnapshot: async () => ({ rows: [dbRow('FROM_SNAPSHOT')], generatedAt: Date.now() }),
      writeSnapshot: vi.fn(),
    }));
    const urls = stubPostgrest();
    const { getServerSims } = await import('@/lib/serverSimData');

    const sims = await getServerSims();

    expect(sims.map((s) => s.id)).toEqual(['FROM_SNAPSHOT']);
    expect(urls.filter((u) => u.includes('/rest/v1/sims'))).toHaveLength(0);
  });

  it('snapshot không dùng được (null) → rơi về crawl PostgREST như cũ', async () => {
    vi.doMock('@/lib/simsSnapshot', () => ({ readSnapshot: async () => null, writeSnapshot: vi.fn() }));
    const urls = stubPostgrest();
    const { getServerSims } = await import('@/lib/serverSimData');

    const sims = await getServerSims();

    expect(sims.map((s) => s.id)).toEqual(['FROM_DB']);
    expect(urls.some((u) => u.includes('/rest/v1/sims') && u.includes('offset=0'))).toBe(true);
  });
});

/**
 * Snapshot chỉ được dựng lại ở cron, nhưng sync còn chạy ngoài cron (nạp bảng số
 * tháng mới). 16/10/2026 trang chủ báo "Còn 52.268 SIM" khi kho đã 73.892 vì
 * snapshot cũ còn trong hạn. Nay: lượt sync hoàn tất SAU snapshot → crawl DB tươi
 * + dựng lại snapshot.
 */
describe('getServerSims — snapshot cũ hơn lượt sync gần nhất', () => {
  const SNAP_AT = Date.parse('2026-10-16T13:17:00Z');

  const stubWithSyncState = (syncedAt: string) => {
    const calls: { url: string; init?: RequestInit }[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = String(input);
        calls.push({ url, init });
        if (url.includes('/rest/v1/sims_sync_state')) return jsonResponse([{ synced_at: syncedAt }]);
        return jsonResponse([dbRow('FROM_DB')], { 'content-range': '0-0/1' });
      }),
    );
    return calls;
  };

  beforeEach(() => vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'service-key-for-test'));
  afterEach(() => vi.unstubAllEnvs());

  it('sync xong SAU snapshot → đọc DB không qua Data Cache, dựng lại snapshot', async () => {
    const writeSnapshot = vi.fn(async (rows: unknown[]) => ({ url: 'u', rows: rows.length, bytes: 1 }));
    vi.doMock('@/lib/simsSnapshot', () => ({
      readSnapshot: async () => ({ rows: [dbRow('FROM_SNAPSHOT')], generatedAt: SNAP_AT }),
      writeSnapshot,
    }));
    const calls = stubWithSyncState('2026-10-16T14:55:00+00:00');
    const { getServerSims } = await import('@/lib/serverSimData');

    const sims = await getServerSims();

    expect(sims.map((s) => s.id)).toEqual(['FROM_DB']);
    const crawl = calls.filter((c) => c.url.includes('/rest/v1/sims?'));
    expect(crawl.length).toBeGreaterThan(0);
    expect(crawl.every((c) => c.init?.cache === 'no-store')).toBe(true);
    expect(writeSnapshot).toHaveBeenCalledTimes(1);
  });

  it('snapshot dựng SAU lượt sync → dùng snapshot, không crawl', async () => {
    const writeSnapshot = vi.fn();
    vi.doMock('@/lib/simsSnapshot', () => ({
      readSnapshot: async () => ({ rows: [dbRow('FROM_SNAPSHOT')], generatedAt: SNAP_AT }),
      writeSnapshot,
    }));
    const calls = stubWithSyncState('2026-10-16T13:16:40+00:00');
    const { getServerSims } = await import('@/lib/serverSimData');

    const sims = await getServerSims();

    expect(sims.map((s) => s.id)).toEqual(['FROM_SNAPSHOT']);
    expect(calls.filter((c) => c.url.includes('/rest/v1/sims?'))).toHaveLength(0);
    expect(writeSnapshot).not.toHaveBeenCalled();
  });
});
