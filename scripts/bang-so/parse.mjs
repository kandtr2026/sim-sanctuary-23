/**
 * Đọc các dòng của file Excel bảng số (BANG SO THÁNG xx_yyyy.xlsx) thành danh
 * sách nạp vào `sims_bang_so`. Tách khỏi import.mjs để test được mà không cần
 * file Excel hay mạng (src/test/bangSoParse.test.ts).
 *
 * Bố cục file nhà cung cấp (Sheet1, kiểm 16/10/2026):
 *   dòng 1: tiêu đề "BẢNG SỐ YÊU CẦU ÚP ĐÚNG GIÁ"
 *   dòng 2: header SỐ THUÊ BAO | SỐ THUÊ BAO | GIÁ BÁN | GIÁ THU VỀ | TÌNH TRẠNG
 *   dòng 3+: 0938868868 | 0938.868.868 | 1000000000 | 900000000 | SIM TT ĐÃ KÍCH
 * Sheet2 không có header và lặp lại đúng 2.200 dòng cuối Sheet1, nên số trùng
 * giữ dòng GẶP TRƯỚC và chỉ báo lệch khi giá hai nơi khác nhau.
 */

/** Dưới ngưỡng này ô giá là lỗi nhập (cùng ngưỡng MIN_SELLABLE_PRICE của sync-sims). */
export const MIN_PRICE = 10_000;

/** Ít hơn số dòng này thì gần như chắc là đọc nhầm file/sheet — không nạp. */
export const MIN_ROWS = 1_000;

export const normalizePhone = (v) => {
  const d = String(v ?? '').replace(/\D/g, '');
  return d.length === 9 ? `0${d}` : d;
};

const isPhone = (d) => /^0\d{9}$/.test(d);

/**
 * Ô giá: số thật (Excel lưu kiểu number) thì lấy luôn; chuỗi thì CHỈ nhận số
 * nguyên có ngăn nghìn hợp lệ — "1,5 triệu" hay "4tr5" thành 0 chứ không bị vét
 * chữ số thành một giá trông như thật (xem parseVndStrict cũ của sync-sims).
 */
export const parsePrice = (v) => {
  if (typeof v === 'number') return Number.isFinite(v) && v > 0 ? Math.round(v) : 0;
  const s = String(v ?? '').trim();
  if (!/^\d{1,3}(?:[.,]\d{3})*$|^\d+$/.test(s)) return 0;
  return parseInt(s.replace(/[.,]/g, ''), 10) || 0;
};

/**
 * @param {Array<{ sheet: string, row: number, a: unknown, b: unknown, c: unknown, e: unknown }>} rows
 *   a = SỐ THUÊ BAO, b = SỐ THUÊ BAO (dạng chấm), c = GIÁ BÁN, e = TÌNH TRẠNG
 */
export const parseBangSo = (rows) => {
  const items = new Map();
  const invalidPrice = [];
  const priceConflicts = [];
  let duplicates = 0;
  let notPhone = 0;

  for (const r of rows) {
    let digits = normalizePhone(r.a);
    if (!isPhone(digits)) digits = normalizePhone(r.b);
    if (!isPhone(digits)) { notPhone++; continue; }

    const price = parsePrice(r.c);
    const where = `${r.sheet}!${r.row}`;
    if (price < MIN_PRICE) { invalidPrice.push({ digits, where, value: r.c }); continue; }

    const prev = items.get(digits);
    if (prev) {
      duplicates++;
      if (prev.gia_ban !== price) priceConflicts.push({ digits, first: prev.where, firstPrice: prev.gia_ban, other: where, otherPrice: price });
      continue;
    }
    const display = String(r.b ?? '').trim();
    const tinhTrang = String(r.e ?? '').trim();
    items.set(digits, {
      raw_digits: digits,
      display_number: display || digits,
      gia_ban: price,
      tinh_trang: tinhTrang || null,
      where,
    });
  }

  return { items: [...items.values()], invalidPrice, priceConflicts, duplicates, notPhone };
};
