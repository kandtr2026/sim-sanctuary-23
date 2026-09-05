import { describe, it, expect, vi, afterEach } from 'vitest';
import { querySimsFromDb } from '@/lib/serverSimData';
import { searchSIM, type NormalizedSIM } from '@/lib/simUtils';

/**
 * Khoá cú pháp wildcard `*` của ô tìm kiếm — cho CẢ hai nhánh (DB + in-memory).
 *
 * Bug cũ: gõ `07*555*` (đầu 07, có 555 ở giữa, đuôi bất kỳ) →
 *   - nhánh DB (querySimsFromDb) chỉ sinh `like.07*` (bỏ mất "555") → trả về mọi
 *     số 07xx.
 *   - nhánh in-memory (searchSIM) lại hiểu là startsWith('07') && endsWith('555').
 * Hai nhánh lệch nhau. Chuẩn thống nhất: '*' = wildcard khớp mọi ký tự (kể cả
 * rỗng), neo hai đầu như SQL LIKE (PostgREST LIKE dùng '*' thay cho '%').
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

const digitTerms = (url: string): string[] => new URL(url).searchParams.getAll('raw_digits');

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('querySimsFromDb — search wildcard', () => {
  it('nhiều sao `07*555*` giữ nguyên pattern (không bỏ mất 555)', async () => {
    const urls = captureUrls();
    await querySimsFromDb({ search: '07*555*' }, 20, 0);
    expect(digitTerms(urls[urls.length - 1])).toContain('like.07*555*');
  });

  it('`0909*` → bắt đầu 0909', async () => {
    const urls = captureUrls();
    await querySimsFromDb({ search: '0909*' }, 20, 0);
    expect(digitTerms(urls[urls.length - 1])).toContain('like.0909*');
  });

  it('`*6666` → kết thúc 6666', async () => {
    const urls = captureUrls();
    await querySimsFromDb({ search: '*6666' }, 20, 0);
    expect(digitTerms(urls[urls.length - 1])).toContain('like.*6666');
  });

  it('`090*6666` → đầu 090 đuôi 6666', async () => {
    const urls = captureUrls();
    await querySimsFromDb({ search: '090*6666' }, 20, 0);
    expect(digitTerms(urls[urls.length - 1])).toContain('like.090*6666');
  });

  it('`0765.668.081` (10 số, không sao) → khớp chính xác', async () => {
    const urls = captureUrls();
    await querySimsFromDb({ search: '0765.668.081' }, 20, 0);
    expect(digitTerms(urls[urls.length - 1])).toContain('eq.0765668081');
  });
});

describe('searchSIM — wildcard in-memory (khớp nhánh DB)', () => {
  const sim = (rawDigits: string) => ({ rawDigits } as NormalizedSIM);

  it('`07*555*` khớp số có đầu 07 + 555 ở giữa, không khớp số 07 thiếu 555', () => {
    expect(searchSIM(sim('0778555123'), '07*555*')).toBe(true);
    expect(searchSIM(sim('0771555999'), '07*555*')).toBe(true);
    expect(searchSIM(sim('0765668081'), '07*555*')).toBe(false); // đúng số A Khoa thấy
    expect(searchSIM(sim('0912555000'), '07*555*')).toBe(false); // có 555 nhưng không đầu 07
  });

  it('`090*6666` khớp đầu 090 đuôi 6666', () => {
    expect(searchSIM(sim('0901236666'), '090*6666')).toBe(true);
    expect(searchSIM(sim('0912346666'), '090*6666')).toBe(false);
    expect(searchSIM(sim('0901236665'), '090*6666')).toBe(false);
  });

  it('`0909*` bắt đầu 0909; `*6666` kết thúc 6666', () => {
    expect(searchSIM(sim('0909123456'), '0909*')).toBe(true);
    expect(searchSIM(sim('0908123456'), '0909*')).toBe(false);
    expect(searchSIM(sim('0912346666'), '*6666')).toBe(true);
    expect(searchSIM(sim('0912346665'), '*6666')).toBe(false);
  });
});
