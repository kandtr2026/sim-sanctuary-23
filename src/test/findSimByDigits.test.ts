import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';

/**
 * `findSimByDigits` phải tra ĐÚNG MỘT HÀNG, không kéo cả kho về rồi `.find()`.
 *
 * Đo 09/09/2026: một lượt tra qua PostgREST là 174 B gzip, còn crawl toàn kho là
 * 49 request ≈ 890 KB. Hai chỗ gọi hàm này đều là đường người lạ đi tự do —
 * `/tra-cuu-sim` (khách gõ số bất kỳ) và `/sim/[digits]` (5.754 URL trong
 * sitemap, `dynamicParams` mở) — nên bản cũ biến mỗi lượt render nguội thành một
 * lần tải toàn kho. Test khoá cả hai chiều: có số và KHÔNG có số đều không được
 * đụng tới đường crawl.
 *
 * Chiều thứ ba quan trọng không kém: "không có hàng" chỉ được coi là 404 khi
 * bảng `sims` THẬT SỰ có dữ liệu. Nếu sync hỏng làm bảng rỗng mà vẫn trả 404 thì
 * toàn bộ `/sim/*` biến mất lặng lẽ, trong khi site vẫn chạy được bằng CSV.
 */

const DIGITS = '0938686868';

const dbRow = {
  id: 'SIM_VIP',
  raw_digits: DIGITS,
  display_number: DIGITS,
  original_price: 39_000_000,
  final_price: null,
  effective_price: 39_000_000,
  network: 'Mobifone',
  tags: ['Lặp kép'],
  beauty_score: 70,
  is_vip: true,
};

/** CSV tối thiểu theo header của `fetch-sim-data` (cột RAW có sẵn số 0 đầu). */
const CSV = [
  'SimID, SỐ THUÊ BAO CHUẨN ,SỐ THUÊ BAO, GIÁ BÁN ,Final_Price,TRẠNG THÁI',
  `SIM_CSV,${DIGITS},${DIGITS},"39,000,000","39,000,000",`,
].join('\n');

const jsonResponse = (rows: unknown[], headers: Record<string, string> = {}) =>
  ({
    ok: true,
    status: 200,
    headers: new Headers(headers),
    json: async () => rows,
    text: async () => JSON.stringify(rows),
  }) as unknown as Response;

const textResponse = (body: string) =>
  ({
    ok: true,
    status: 200,
    headers: new Headers(),
    json: async () => JSON.parse(body),
    text: async () => body,
  }) as unknown as Response;

/** Đường crawl toàn kho — nhận diện bằng `order=id.asc` mà chỉ nó dùng. */
const isCrawl = (url: string) => url.includes('order=id.asc');
const isLookup = (url: string) => url.includes('raw_digits=eq.');
/** Dò "bảng có dữ liệu không": select=id, limit=1, KHÔNG lọc theo số. */
const isProbe = (url: string) => url.includes('select=id&') && !isLookup(url);

interface StubOpts {
  /** Hàng trả về cho truy vấn tra số. */
  lookupRows?: unknown[];
  /** Bảng `sims` có dữ liệu hay không (quyết định câu trả lời của phép dò). */
  tableHasRows?: boolean;
}

const stub = ({ lookupRows = [], tableHasRows = true }: StubOpts = {}) => {
  const urls: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      urls.push(url);

      if (url.includes('/functions/v1/fetch-sim-data')) return textResponse(CSV);
      if (isLookup(url)) return jsonResponse(lookupRows);
      if (isProbe(url)) return jsonResponse(tableHasRows ? [{ id: 'bat-ky' }] : []);
      // Crawl toàn kho: bảng rỗng → `fetchSimsFromDb` bỏ cuộc, rơi về CSV.
      return jsonResponse([], { 'content-range': '*/0' });
    }),
  );
  return urls;
};

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('findSimByDigits', () => {
  it('tìm thấy số bằng 1 truy vấn, không crawl toàn kho', async () => {
    const urls = stub({ lookupRows: [dbRow] });
    const { findSimByDigits } = await import('@/lib/serverSimData');

    const sim = await findSimByDigits(DIGITS);

    expect(sim?.rawDigits).toBe(DIGITS);
    expect(sim?.price).toBe(39_000_000);
    expect(urls.filter(isCrawl)).toHaveLength(0);
    expect(urls.filter(isLookup)).toHaveLength(1);
  });

  it('số không còn trong kho → null, vẫn không crawl toàn kho', async () => {
    const urls = stub({ lookupRows: [], tableHasRows: true });
    const { findSimByDigits } = await import('@/lib/serverSimData');

    expect(await findSimByDigits(DIGITS)).toBeNull();
    expect(urls.filter(isCrawl)).toHaveLength(0);
  });

  it('tra hụt nhiều lần chỉ dò bảng đúng một lần', async () => {
    const urls = stub({ lookupRows: [], tableHasRows: true });
    const { findSimByDigits } = await import('@/lib/serverSimData');

    await findSimByDigits(DIGITS);
    await findSimByDigits('0912345678');
    await findSimByDigits('0987654321');

    expect(urls.filter(isProbe)).toHaveLength(1);
  });

  it('bảng `sims` rỗng (sync hỏng) → rơi về kho CSV chứ không 404 oan', async () => {
    stub({ lookupRows: [], tableHasRows: false });
    const { findSimByDigits } = await import('@/lib/serverSimData');

    const sim = await findSimByDigits(DIGITS);

    expect(sim?.rawDigits).toBe(DIGITS);
    expect(sim?.id).toBe('SIM_CSV');
  });

  it('dãy số sai định dạng → null, không gọi mạng', async () => {
    const urls = stub({ lookupRows: [dbRow] });
    const { findSimByDigits } = await import('@/lib/serverSimData');

    expect(await findSimByDigits('12345')).toBeNull();
    expect(await findSimByDigits('')).toBeNull();
    expect(urls).toHaveLength(0);
  });
});
