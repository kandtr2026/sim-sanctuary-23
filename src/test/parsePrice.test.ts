import { describe, it, expect } from 'vitest';
import { parsePrice, formatPrice } from '@/lib/simUtils';
import { parseCheapPrice } from '@/lib/cheapSimSheet';

/**
 * Khoá luật đọc ô giá.
 *
 * `parsePrice` (và hai bản `safeParseVnd` copy trong serverSimData/useSimData mà
 * nó thay thế) từng là kiểu "vét chữ số" — `replace(/[^\d]/g, '')` — nên chuỗi rác
 * biến thành giá thật, đã chạy thử trên code cũ:
 *
 *   "1,5 triệu"                → 15
 *   "4tr5"                     → 45
 *   "229.000 - LH 0933356666"  → 2.290.000.933.356.666
 *
 * Luật đúng (mượn từ `parseCheapPrice`): không khớp dạng số nguyên có dấu ngăn
 * nghìn thì trả 0 để caller coi như "chưa có giá" → `formatPrice` in "Liên hệ".
 * Bỏ một dòng thì khách không thấy số đó; parse sai thì đặt một giá sai trước
 * mặt khách.
 */
describe('parsePrice — nhận dạng giá hợp lệ', () => {
  it('nhận số nguyên có dấu phẩy ngăn nghìn (đúng dạng sheet trả về)', () => {
    // 49.378/49.378 dòng của `fetch-sim-data` hiện ở dạng này.
    expect(parsePrice('39,000,000')).toBe(39_000_000);
    expect(parsePrice('800,000')).toBe(800_000);
    expect(parsePrice('1,700,000')).toBe(1_700_000);
  });

  it('nhận cả dấu chấm ngăn nghìn và số trần', () => {
    expect(parsePrice('39.000.000')).toBe(39_000_000);
    expect(parsePrice('229.000')).toBe(229_000);
    expect(parsePrice('800000')).toBe(800_000);
    expect(parsePrice('0')).toBe(0);
  });

  it('nhận số truyền vào dạng number, chặn NaN/Infinity', () => {
    expect(parsePrice(4_400_000)).toBe(4_400_000);
    expect(parsePrice(Number.NaN)).toBe(0);
    expect(parsePrice(Number.POSITIVE_INFINITY)).toBe(0);
  });

  it('bỏ khoảng trắng hai đầu (ô sheet có padding)', () => {
    expect(parsePrice('  39,000,000 ')).toBe(39_000_000);
  });
});

describe('parsePrice — từ chối chuỗi rác thay vì bịa số', () => {
  const rubbish: [string, number][] = [
    ['1,5 triệu', 15],
    ['4tr5', 45],
    ['229.000 - LH 0933356666', 2_290_000_933_356_666],
    ['39,000,000đ', 39_000_000],
    ['Liên hệ', 0],
    ['LH', 0],
    ['thương lượng', 0],
    ['1 200 000', 1_200_000],
    ['1,20', 120],
    ['3.5tr', 35],
    ['12,000,000 - 15,000,000', 1_200_000_015_000_000],
  ];

  it.each(rubbish)('"%s" → 0 (bản cũ "vét chữ số" trả %i)', (input, legacy) => {
    // Con số `legacy` là kết quả THẬT của `replace(/[^\d]/g, '')` — ghi lại để
    // thấy rõ mức sai, không phải để dùng.
    expect(Number(String(input).replace(/[^\d]/g, ''))).toBe(legacy);
    expect(parsePrice(input)).toBe(0);
  });

  it('giá 0 hiện "Liên hệ", không phải "0đ" và không phải số bịa', () => {
    expect(formatPrice(parsePrice('1,5 triệu'))).toBe('Liên hệ');
    expect(formatPrice(parsePrice(''))).toBe('Liên hệ');
    expect(formatPrice(parsePrice('39,000,000'))).toBe('39.000.000đ');
  });
});

describe('parsePrice — cùng luật với hàm parse của kho 229k', () => {
  const cases = ['39,000,000', '229.000', '800000', '0', '1,5 triệu', '4tr5', 'Liên hệ', '1,20'];

  // Trước đây khối này đối chiếu BA hàm; `parsePriceToNumber` đã bị xoá cùng
  // `simInventorySheet.ts` khi bỏ trang định giá. Hai hàm còn lại vẫn phải cùng
  // luật: chuỗi không đúng dạng số nguyên có ngăn nghìn thì trả 0, KHÔNG vét chữ số.
  it.each(cases)('"%s" cho cùng kết quả với parseCheapPrice', (input) => {
    expect(parsePrice(input)).toBe(parseCheapPrice(input));
  });
});
