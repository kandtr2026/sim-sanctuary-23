import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

/**
 * Khoá lại bug "server chỉ thấy 9.800/48.964 SIM" (verify live 09/09/2026).
 *
 * Project Supabase đặt PostgREST "Max rows" = 200, nên request `limit=1000` chỉ
 * trả 200 hàng — kèm status `200 OK`, không lỗi nào. Bản cũ của `fetchSimsFromDb`
 * tin hằng số `SUPABASE_SIMS_PAGE = 1000` rồi nhảy `offset += 1000`, nên lấy hàng
 * 0–199, 1000–1199, 2000–2199… bỏ sót 800 hàng mỗi block.
 *
 * Stub dưới đây mô phỏng đúng cái trần đó: dù xin bao nhiêu, server chỉ trả tối đa
 * `MAX_ROWS` hàng. `getServerSims()` phải gom ĐỦ `TOTAL` hàng, không trùng, không
 * sót.
 */

/** Trần "Max rows" của PostgREST — nhỏ hơn hẳn kích thước trang code xin. */
const MAX_ROWS = 200;
/** Tổng số hàng trong kho giả lập (2 trang đầy + 1 trang lẻ). */
const TOTAL = 450;

const dbRow = (n: number) => ({
  id: `SIM${n}`,
  raw_digits: `09${String(n).padStart(8, '0')}`,
  display_number: `09${String(n).padStart(8, '0')}`,
  original_price: 2_000_000,
  final_price: null,
  effective_price: 2_000_000,
  network: 'Mobifone',
  tags: ['Lộc phát'],
  beauty_score: 20,
  is_vip: false,
});

const numberParam = (url: string, key: string): number => {
  const m = url.match(new RegExp(`[?&]${key}=(\\d+)`));
  return m ? Number(m[1]) : 0;
};

/**
 * Server giả: tôn trọng `offset`, nhưng CẮT `limit` xuống `MAX_ROWS` — đúng hành
 * vi PostgREST khi vượt trần.
 */
const stubCappedDb = () => {
  const urls: string[] = [];
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    urls.push(url);

    const offset = numberParam(url, 'offset');
    const limit = numberParam(url, 'limit');
    const take = Math.max(0, Math.min(limit, MAX_ROWS, TOTAL - offset));
    const rows = Array.from({ length: take }, (_, i) => dbRow(offset + i));

    return {
      ok: true,
      status: 200,
      headers: new Headers({
        'content-range': `${offset}-${offset + Math.max(0, take - 1)}/${TOTAL}`,
      }),
      json: async () => rows,
      text: async () => JSON.stringify(rows),
    } as unknown as Response;
  });
  vi.stubGlobal('fetch', fetchMock);
  return { urls };
};

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('fetchSimsFromDb — trần max-rows nhỏ hơn page size', () => {
  it('gom đủ toàn kho dù server cắt mỗi trang còn 200 hàng', async () => {
    stubCappedDb();
    const { getServerSims } = await import('@/lib/serverSimData');

    const sims = await getServerSims();

    // Bản cũ: ceil(450/1000) = 1 trang × 200 hàng = 200 SIM (mất 250).
    expect(sims).toHaveLength(TOTAL);
  });

  it('không trùng và không sót hàng nào', async () => {
    stubCappedDb();
    const { getServerSims } = await import('@/lib/serverSimData');

    const sims = await getServerSims();
    const ids = sims.map((s) => s.id);

    expect(new Set(ids).size).toBe(TOTAL);
    expect(new Set(ids)).toEqual(new Set(Array.from({ length: TOTAL }, (_, i) => `SIM${i}`)));
  });

  it('phân trang theo kích thước trang THẬT (200), không theo số đã xin (1000)', async () => {
    const { urls } = stubCappedDb();
    const { getServerSims } = await import('@/lib/serverSimData');

    await getServerSims();

    const offsets = urls.map((u) => numberParam(u, 'offset')).sort((a, b) => a - b);
    expect(offsets).toEqual([0, 200, 400]);
    // Thứ tự ổn định là điều kiện để limit/offset không trùng/sót giữa các trang.
    expect(urls.every((u) => u.includes('order=id.asc'))).toBe(true);
  });
});
