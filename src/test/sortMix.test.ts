import { describe, it, expect } from 'vitest';
import { sortSIMs, normalizeSIM } from '@/lib/simUtils';
import type { NormalizedSIM } from '@/lib/simUtils';

/**
 * Thứ tự "Đề xuất" (`mix`) — mặt tiền trang chủ.
 *
 * Trước đây trang chủ sắp theo giá tăng dần dưới nhãn "Mới nhất", nên 8 thẻ đầu
 * đều là số 800k–990k điểm đẹp 0–25: khách mới vào tưởng shop chỉ bán số thường,
 * trong khi kho có 2.250 số VIP. `mix` chia kho thành ba rổ theo phân vị giá rồi
 * rải theo chu kỳ 10 số (6 rẻ / 3 trung / 1 cao).
 *
 * Hai tính chất phải cùng đúng:
 *   1. Là một HOÁN VỊ của tập vào — không mất, không nhân đôi số nào. Nếu hỏng,
 *      `limit`/`offset` sẽ trả trang trùng lặp hoặc nuốt mất hàng của kho.
 *   2. Màn đầu phải có đủ phổ giá, chứ không lại toàn số rẻ.
 */

const sim = (digits: string, price: number): NormalizedSIM =>
  normalizeSIM(digits, digits, price, `id-${digits}`);

/** Kho giả: 100 số, giá từ 1 triệu tới 100 triệu. */
const stock = Array.from({ length: 100 }, (_, i) =>
  sim(`09${String(10000000 + i)}`, (i + 1) * 1_000_000),
);

describe('sortSIMs — "mix" (trộn phổ giá)', () => {
  it('là hoán vị của tập vào: không mất, không trùng', () => {
    const out = sortSIMs(stock, 'mix');
    expect(out).toHaveLength(stock.length);
    expect(new Set(out.map((s) => s.id)).size).toBe(stock.length);
  });

  it('10 số đầu có cả tầm trung và cao cấp, không toàn số rẻ', () => {
    const out = sortSIMs(stock, 'mix');
    const first10 = out.slice(0, 10);

    // Ngưỡng rổ khớp `mixByPriceSpectrum`: 60% đầu = rẻ, 60–90% = trung, 10% cuối = cao.
    const cheapMax = stock.length * 0.6 * 1_000_000; // 60 triệu
    const midMax = stock.length * 0.9 * 1_000_000; // 90 triệu

    expect(first10.filter((s) => s.price > cheapMax && s.price <= midMax).length).toBeGreaterThan(0);
    expect(first10.filter((s) => s.price > midMax).length).toBeGreaterThan(0);

    // Bản cũ (giá tăng dần) cho ra đúng 10 số rẻ nhất — đây là thứ phải khác đi.
    expect(first10.every((s) => s.price <= cheapMax)).toBe(false);
  });

  it('ổn định: gọi hai lần ra cùng một thứ tự', () => {
    const a = sortSIMs(stock, 'mix').map((s) => s.id);
    const b = sortSIMs(stock, 'mix').map((s) => s.id);
    expect(a).toEqual(b);
  });

  it('kho quá nhỏ thì giữ giá tăng dần, không vỡ', () => {
    const few = stock.slice(0, 4);
    const out = sortSIMs(few, 'mix');
    expect(out.map((s) => s.price)).toEqual([1_000_000, 2_000_000, 3_000_000, 4_000_000]);
  });

  it('không sửa mảng gốc', () => {
    const before = stock.map((s) => s.id);
    sortSIMs(stock, 'mix');
    expect(stock.map((s) => s.id)).toEqual(before);
  });
});
