import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import * as simUtils from '@/lib/simUtils';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Khoá luật "không bịa giá".
 *
 * `estimatePriceByTags()` sinh giá bằng `Math.random()` theo tag (tứ quý →
 * 12–60 triệu) cho mọi SIM thiếu giá. Nó được gọi ở nhánh CSV của
 * `serverSimData` và ở `useSimData` — hook mà `/dinh-gia-sim` dùng, chạy lại MỖI
 * lần fetch, nên cùng một số F5 ra một giá khác, dưới nhãn "Giá niêm yết công
 * khai trong kho".
 *
 * Luật thay thế: giá không đọc được → 0 → `formatPrice(0)` = "Liên hệ".
 */
const SRC = resolve(__dirname, '..');

const DATA_LAYER = ['lib/simUtils.ts', 'lib/serverSimData.ts', 'hooks/useSimData.ts'];

/**
 * Đọc file nguồn và bỏ comment, để phần giải thích "vì sao không được bịa giá"
 * (có nhắc tên hàm cũ) không tự làm test đỏ.
 */
const codeWithoutComments = (rel: string): string =>
  readFileSync(resolve(SRC, rel), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .map((line) => line.replace(/\s\/\/.*$/, ''))
    .join('\n');

const jsonResponse = (body: unknown, headers: Record<string, string> = {}) =>
  ({
    ok: true,
    status: 200,
    headers: new Headers(headers),
    json: async () => body,
    text: async () => JSON.stringify(body),
  }) as unknown as Response;

const textResponse = (body: string) =>
  ({
    ok: true,
    status: 200,
    headers: new Headers(),
    json: async () => JSON.parse(body),
    text: async () => body,
  }) as unknown as Response;

/**
 * CSV tối thiểu theo đúng header của `fetch-sim-data`, ép `getServerSims` đi
 * nhánh CSV (bảng `sims` trả count 0 → `fetchSimsFromDb` bỏ cuộc).
 */
const CSV = [
  'SimID, SỐ THUÊ BAO CHUẨN ,SỐ THUÊ BAO, GIÁ BÁN ,Final_Price,TRẠNG THÁI',
  'SIM_OK,933356666,0933356666,"39,000,000","39,000,000",',
  // Tứ quý KHÔNG có giá — chỗ bản cũ nhét random 12–60 triệu.
  'SIM_NOPRICE,933666666,0933666666,,,',
  // Ô giá là chuỗi rác — bản cũ "vét chữ số" thành 15đ.
  'SIM_RUBBISH,933777777,0933777777,"1,5 triệu",,',
].join('\n');

const stubCsvOnlySource = () => {
  const calls: string[] = [];
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      calls.push(url);
      if (url.includes('/functions/v1/fetch-sim-data')) return textResponse(CSV);
      // Bảng `sims`: count = 0 → nhánh DB trả null → fallback CSV.
      return jsonResponse([], { 'content-range': '*/0' });
    }),
  );
  return calls;
};

beforeEach(() => {
  vi.resetModules();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('không còn hàm bịa giá', () => {
  it('simUtils không export estimatePriceByTags nữa', () => {
    expect((simUtils as Record<string, unknown>).estimatePriceByTags).toBeUndefined();
  });

  it('không file nào trong tầng đọc dữ liệu còn gọi estimatePriceByTags', () => {
    for (const rel of DATA_LAYER) {
      expect(codeWithoutComments(rel), rel).not.toMatch(/estimatePriceByTags/);
    }
  });

  it('tầng đọc giá không dùng Math.random', () => {
    for (const rel of DATA_LAYER) {
      expect(codeWithoutComments(rel), rel).not.toContain('Math.random');
    }
  });
});

describe('getServerSims (nhánh CSV) — giá thiếu/rác thành 0, không thành số bịa', () => {
  it('SIM thiếu giá → price 0 → "Liên hệ"', async () => {
    stubCsvOnlySource();
    const { getServerSims } = await import('@/lib/serverSimData');
    const { formatPrice } = await import('@/lib/simUtils');

    const sims = await getServerSims();
    const byId = new Map(sims.map((s) => [s.id, s]));

    expect(sims).toHaveLength(3);
    expect(byId.get('SIM_OK')!.price).toBe(39_000_000);
    // Bản cũ: tứ quý thiếu giá → random 12.000.000–60.000.000.
    expect(byId.get('SIM_NOPRICE')!.price).toBe(0);
    // Bản cũ: "1,5 triệu" → 15.
    expect(byId.get('SIM_RUBBISH')!.price).toBe(0);
    expect(formatPrice(byId.get('SIM_NOPRICE')!.price)).toBe('Liên hệ');
  });

  it('đọc lại cùng CSV luôn cho cùng giá (không phụ thuộc random)', async () => {
    const priceRuns: number[][] = [];
    for (let run = 0; run < 3; run++) {
      vi.resetModules();
      stubCsvOnlySource();
      const { getServerSims } = await import('@/lib/serverSimData');
      const sims = await getServerSims();
      priceRuns.push(sims.map((s) => s.price));
      vi.unstubAllGlobals();
    }
    expect(priceRuns[1]).toEqual(priceRuns[0]);
    expect(priceRuns[2]).toEqual(priceRuns[0]);
  });
});
