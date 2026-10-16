import { describe, expect, it } from 'vitest';
import { parseBangSo, parsePrice } from '../../scripts/bang-so/parse.mjs';

const r = (row: number, a: unknown, b: unknown, c: unknown, e: unknown = 'SIM TTNK', sheet = 'Sheet1') => ({ sheet, row, a, b, c, e });

describe('parseBangSo (file Excel bảng số nhà cung cấp)', () => {
  it('bỏ dòng tiêu đề + header, nạp dòng số với giá kiểu number', () => {
    const out = parseBangSo([
      r(1, 'BẢNG SỐ YÊU CẦU ÚP ĐÚNG GIÁ ', null, null, null),
      r(2, 'SỐ THUÊ BAO', 'SỐ THUÊ BAO', 'GIÁ BÁN', 'TÌNH TRẠNG'),
      r(3, '0938868868', '0938.868.868', 1_000_000_000, 'SIM TT ĐÃ KÍCH'),
    ]);
    expect(out.notPhone).toBe(2);
    expect(out.items).toEqual([
      { raw_digits: '0938868868', display_number: '0938.868.868', gia_ban: 1_000_000_000, tinh_trang: 'SIM TT ĐÃ KÍCH', where: 'Sheet1!3' },
    ]);
  });

  it('số 9 chữ số (Excel mất số 0 đầu) được thêm 0; cột A hỏng thì lấy cột B', () => {
    const out = parseBangSo([r(3, 938868868, '0938.868.868', 5_000_000), r(4, '', '0909.686.686', 2_000_000)]);
    expect(out.items.map((i: { raw_digits: string }) => i.raw_digits)).toEqual(['0938868868', '0909686686']);
  });

  it('số trùng (Sheet2 lặp cuối Sheet1) giữ dòng gặp trước, báo khi giá lệch', () => {
    const out = parseBangSo([
      r(72546, '0932726286', '0932.726.286', 4_400_000),
      r(1657, '0932726286', '0932.726.286', 1_700_000, undefined, 'Sheet2'),
      r(70891, '0703539939', '0703.539.939', 3_000_000),
      r(2, '0703539939', '0703.539.939', 3_000_000, undefined, 'Sheet2'),
    ]);
    expect(out.items).toHaveLength(2);
    expect(out.items[0].gia_ban).toBe(4_400_000);
    expect(out.duplicates).toBe(2);
    expect(out.priceConflicts).toEqual([
      { digits: '0932726286', first: 'Sheet1!72546', firstPrice: 4_400_000, other: 'Sheet2!1657', otherPrice: 1_700_000 },
    ]);
  });

  it('giá thiếu / dưới 10.000 / chữ lẫn số thì KHÔNG nạp mà báo lại', () => {
    const out = parseBangSo([r(3, '0901111111', '', null), r(4, '0902222222', '', 10), r(5, '0903333333', '', '4tr5')]);
    expect(out.items).toHaveLength(0);
    expect(out.invalidPrice.map((x: { digits: string }) => x.digits)).toEqual(['0901111111', '0902222222', '0903333333']);
  });
});

describe('parsePrice', () => {
  it('nhận number và chuỗi có ngăn nghìn hợp lệ, từ chối chuỗi lẫn chữ', () => {
    expect(parsePrice(3_000_000)).toBe(3_000_000);
    expect(parsePrice('39,000,000')).toBe(39_000_000);
    expect(parsePrice('2.250.000')).toBe(2_250_000);
    expect(parsePrice('1,5 triệu')).toBe(0);
    expect(parsePrice('229.000 - LH 0933356666')).toBe(0);
  });
});
