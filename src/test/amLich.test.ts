import { describe, it, expect } from "vitest";
import { amSangDuong, duongSangAm, namAmLich, ngayTet } from "@/lib/amLich";

/**
 * Khoá bộ đổi Dương ⇄ Âm lịch (thuật toán Hồ Ngọc Đức, múi giờ +7) mà
 * /sim-phong-thuy dùng để quy ngày sinh về NĂM Can Chi.
 *
 * Mốc đối chiếu: ngày Tết Nguyên Đán Việt Nam đã biết — gồm các năm lịch VN lệch
 * lịch Trung Quốc (1968: VN 29/01, TQ 30/01; 1985: VN 21/01, TQ 20/02;
 * 2007: VN 17/02, TQ 18/02) để chắc không lỡ dùng bảng TQ.
 */
const TET_VN: [number, number, number][] = [
  // [năm, ngày, tháng] dương lịch của mùng 1 tháng Giêng
  [1968, 29, 1],
  [1975, 11, 2],
  [1985, 21, 1],
  [1989, 6, 2],
  [1990, 27, 1],
  [2000, 5, 2],
  [2007, 17, 2],
  [2020, 25, 1],
  [2023, 22, 1],
  [2024, 10, 2],
  [2025, 29, 1],
  [2026, 17, 2],
];

describe("amLich — ngày Tết Việt Nam", () => {
  it.each(TET_VN)("Tết năm %i là %i/%i dương lịch", (nam, ngay, thang) => {
    expect(ngayTet(nam)).toEqual({ ngay, thang, nam });
    expect(duongSangAm(ngay, thang, nam)).toMatchObject({ ngay: 1, thang: 1, nam });
  });

  it.each(TET_VN)("ngày trước Tết %i còn thuộc tháng Chạp năm trước", (nam, ngay, thang) => {
    const truoc = new Date(Date.UTC(nam, thang - 1, ngay - 1));
    const am = duongSangAm(truoc.getUTCDate(), truoc.getUTCMonth() + 1, truoc.getUTCFullYear());
    expect(am.thang).toBe(12);
    expect(am.nam).toBe(nam - 1);
  });
});

describe("amLich — năm âm lịch của ngày sinh dương lịch", () => {
  it("sinh trước Tết Canh Ngọ (27/01/1990) vẫn là năm 1989", () => {
    expect(namAmLich(15, 1, 1990)).toBe(1989);
    expect(namAmLich(20, 1, 1990)).toBe(1989);
    expect(namAmLich(26, 1, 1990)).toBe(1989);
  });

  it("từ ngày Tết trở đi là năm mới", () => {
    expect(namAmLich(27, 1, 1990)).toBe(1990);
    expect(namAmLich(15, 2, 1990)).toBe(1990);
    expect(namAmLich(15, 8, 1990)).toBe(1990);
  });

  it("15/01/1990 = 19 tháng Chạp năm Kỷ Tỵ", () => {
    expect(duongSangAm(15, 1, 1990)).toEqual({ ngay: 19, thang: 12, nam: 1989, thangNhuan: false });
  });

  it("Trung thu 2026 (15/8 âm) rơi vào 25/09/2026", () => {
    expect(duongSangAm(25, 9, 2026)).toMatchObject({ ngay: 15, thang: 8, nam: 2026 });
  });

  it("đổi đi đổi lại khớp nhau cho 1940–2030", () => {
    const lech: string[] = [];
    for (let y = 1940; y <= 2030; y++) {
      for (let m = 1; m <= 12; m++) {
        for (const d of [1, 9, 17, 25, 28]) {
          const am = duongSangAm(d, m, y);
          const dl = amSangDuong(am.ngay, am.thang, am.nam, am.thangNhuan);
          if (!dl || dl[0] !== d || dl[1] !== m || dl[2] !== y) lech.push(`${d}/${m}/${y}`);
        }
      }
    }
    expect(lech).toEqual([]);
  });
});
