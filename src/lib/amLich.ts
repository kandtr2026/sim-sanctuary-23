// ============================================================================
// ÂM LỊCH VIỆT NAM — đổi Dương lịch ⇄ Âm lịch (thuần hàm, chạy server/client)
// Port thuật toán của Hồ Ngọc Đức ("Âm lịch Việt Nam", informatik.uni-leipzig.de
// /~duc/amlich), tính theo MÚI GIỜ +7 của Việt Nam.
//
// Vì sao không dùng bảng Tết Trung Quốc: lịch TQ tính theo UTC+8 nên có năm
// lệch ngày/tháng với lịch VN — ví dụ Tết Ất Sửu 1985 ở VN là 21/01/1985 còn TQ
// là 20/02/1985; Tết Đinh Hợi 2007 VN 17/02, TQ 18/02.
//
// Dùng ở /sim-phong-thuy: Can Chi, nạp âm, cung phi đều theo NĂM ÂM LỊCH. Người
// sinh tháng 1–2 dương lịch nhưng TRƯỚC Tết vẫn thuộc tuổi năm trước.
// ============================================================================

const TZ_VN = 7;
const INT = Math.floor;

/** Số ngày Julius của một ngày dương lịch. */
export const jdFromDate = (dd: number, mm: number, yy: number): number => {
  const a = INT((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  let jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - INT(y / 100) + INT(y / 400) - 32045;
  if (jd < 2299161) {
    jd = dd + INT((153 * m + 2) / 5) + 365 * y + INT(y / 4) - 32083;
  }
  return jd;
};

/** Ngày dương lịch [ngày, tháng, năm] từ số ngày Julius. */
export const jdToDate = (jd: number): [number, number, number] => {
  let b: number;
  let c: number;
  if (jd > 2299160) {
    const a = jd + 32044;
    b = INT((4 * a + 3) / 146097);
    c = a - INT((b * 146097) / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  const d = INT((4 * c + 3) / 1461);
  const e = c - INT((1461 * d) / 4);
  const m = INT((5 * e + 2) / 153);
  const day = e - INT((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * INT(m / 10);
  const year = b * 100 + d - 4800 + INT(m / 10);
  return [day, month, year];
};

/** Thời điểm (Julius, có phần lẻ) của lần sóc thứ k kể từ 1/1/1900. */
const newMoon = (k: number): number => {
  const T = k / 1236.85;
  const T2 = T * T;
  const T3 = T2 * T;
  const dr = Math.PI / 180;
  let Jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * T2 - 0.000000155 * T3;
  Jd1 = Jd1 + 0.00033 * Math.sin((166.56 + 132.87 * T - 0.009173 * T2) * dr);
  const M = 359.2242 + 29.10535608 * k - 0.0000333 * T2 - 0.00000347 * T3;
  const Mpr = 306.0253 + 385.81691806 * k + 0.0107306 * T2 + 0.00001236 * T3;
  const F = 21.2964 + 390.67050646 * k - 0.0016528 * T2 - 0.00000239 * T3;
  let C1 = (0.1734 - 0.000393 * T) * Math.sin(M * dr) + 0.0021 * Math.sin(2 * dr * M);
  C1 = C1 - 0.4068 * Math.sin(Mpr * dr) + 0.0161 * Math.sin(dr * 2 * Mpr);
  C1 = C1 - 0.0004 * Math.sin(dr * 3 * Mpr);
  C1 = C1 + 0.0104 * Math.sin(dr * 2 * F) - 0.0051 * Math.sin(dr * (M + Mpr));
  C1 = C1 - 0.0074 * Math.sin(dr * (M - Mpr)) + 0.0004 * Math.sin(dr * (2 * F + M));
  C1 = C1 - 0.0004 * Math.sin(dr * (2 * F - M)) - 0.0006 * Math.sin(dr * (2 * F + Mpr));
  C1 = C1 + 0.001 * Math.sin(dr * (2 * F - Mpr)) + 0.0005 * Math.sin(dr * (2 * Mpr + M));
  const deltat =
    T < -11
      ? 0.001 + 0.000839 * T + 0.0002261 * T2 - 0.00000845 * T3 - 0.000000081 * T * T3
      : -0.000278 + 0.000265 * T + 0.000262 * T2;
  return Jd1 + C1 - deltat;
};

/** Kinh độ mặt trời (radian, 0..2π) tại thời điểm Julius jdn. */
const sunLongitude = (jdn: number): number => {
  const T = (jdn - 2451545.0) / 36525;
  const T2 = T * T;
  const dr = Math.PI / 180;
  const M = 357.5291 + 35999.0503 * T - 0.0001559 * T2 - 0.00000048 * T * T2;
  const L0 = 280.46645 + 36000.76983 * T + 0.0003032 * T2;
  let DL = (1.9146 - 0.004817 * T - 0.000014 * T2) * Math.sin(dr * M);
  DL = DL + (0.019993 - 0.000101 * T) * Math.sin(dr * 2 * M) + 0.00029 * Math.sin(dr * 3 * M);
  let L = (L0 + DL) * dr;
  L = L - Math.PI * 2 * INT(L / (Math.PI * 2));
  return L;
};

/** Cung hoàng đạo (0..11, mỗi cung 30°) của mặt trời lúc 0h ngày dayNumber. */
const getSunLongitude = (dayNumber: number, timeZone: number): number =>
  INT((sunLongitude(dayNumber - 0.5 - timeZone / 24) / Math.PI) * 6);

/** Ngày (số Julius) bắt đầu tháng âm có lần sóc thứ k. */
const getNewMoonDay = (k: number, timeZone: number): number =>
  INT(newMoon(k) + 0.5 + timeZone / 24);

/** Ngày bắt đầu tháng 11 âm lịch (tháng chứa Đông chí) của năm yy. */
const getLunarMonth11 = (yy: number, timeZone: number): number => {
  const off = jdFromDate(31, 12, yy) - 2415021;
  const k = INT(off / 29.530588853);
  let nm = getNewMoonDay(k, timeZone);
  const sunLong = getSunLongitude(nm, timeZone);
  if (sunLong >= 9) nm = getNewMoonDay(k - 1, timeZone);
  return nm;
};

/** Vị trí tháng nhuận (tính từ tháng 11 âm) trong năm có 13 tháng. */
const getLeapMonthOffset = (a11: number, timeZone: number): number => {
  const k = INT((a11 - 2415021.076998695) / 29.530588853 + 0.5);
  let last = 0;
  let i = 1;
  let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  do {
    last = arc;
    i++;
    arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
  } while (arc !== last && i < 14);
  return i - 1;
};

export interface NgayAmLich {
  ngay: number; // 1..30
  thang: number; // 1..12
  nam: number; // năm âm lịch (năm Can Chi)
  thangNhuan: boolean;
}

/** Đổi ngày dương lịch → âm lịch Việt Nam (mặc định múi giờ +7). */
export const duongSangAm = (dd: number, mm: number, yy: number, timeZone = TZ_VN): NgayAmLich => {
  const dayNumber = jdFromDate(dd, mm, yy);
  const k = INT((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = getNewMoonDay(k + 1, timeZone);
  if (monthStart > dayNumber) monthStart = getNewMoonDay(k, timeZone);

  let a11 = getLunarMonth11(yy, timeZone);
  let b11 = a11;
  let lunarYear: number;
  if (a11 >= monthStart) {
    lunarYear = yy;
    a11 = getLunarMonth11(yy - 1, timeZone);
  } else {
    lunarYear = yy + 1;
    b11 = getLunarMonth11(yy + 1, timeZone);
  }

  const lunarDay = dayNumber - monthStart + 1;
  const diff = INT((monthStart - a11) / 29);
  let lunarLeap = false;
  let lunarMonth = diff + 11;
  if (b11 - a11 > 365) {
    const leapMonthDiff = getLeapMonthOffset(a11, timeZone);
    if (diff >= leapMonthDiff) {
      lunarMonth = diff + 10;
      if (diff === leapMonthDiff) lunarLeap = true;
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;

  return { ngay: lunarDay, thang: lunarMonth, nam: lunarYear, thangNhuan: lunarLeap };
};

/**
 * Đổi ngày âm lịch → dương lịch [ngày, tháng, năm]. Trả null nếu tháng nhuận
 * được yêu cầu không tồn tại trong năm đó.
 */
export const amSangDuong = (
  ngay: number,
  thang: number,
  nam: number,
  thangNhuan = false,
  timeZone = TZ_VN,
): [number, number, number] | null => {
  let a11: number;
  let b11: number;
  if (thang < 11) {
    a11 = getLunarMonth11(nam - 1, timeZone);
    b11 = getLunarMonth11(nam, timeZone);
  } else {
    a11 = getLunarMonth11(nam, timeZone);
    b11 = getLunarMonth11(nam + 1, timeZone);
  }
  const k = INT(0.5 + (a11 - 2415021.076998695) / 29.530588853);
  let off = thang - 11;
  if (off < 0) off += 12;
  if (b11 - a11 > 365) {
    const leapOff = getLeapMonthOffset(a11, timeZone);
    let leapMonth = leapOff - 2;
    if (leapMonth < 0) leapMonth += 12;
    if (thangNhuan && thang !== leapMonth) return null;
    if (thangNhuan || off >= leapOff) off += 1;
  } else if (thangNhuan) {
    return null;
  }
  const monthStart = getNewMoonDay(k + off, timeZone);
  return jdToDate(monthStart + ngay - 1);
};

/** Ngày Tết Nguyên Đán (mùng 1 tháng Giêng) của năm âm lịch `nam`, theo dương lịch. */
export const ngayTet = (nam: number): { ngay: number; thang: number; nam: number } => {
  const [d, m, y] = amSangDuong(1, 1, nam) as [number, number, number];
  return { ngay: d, thang: m, nam: y };
};

/**
 * Năm âm lịch (năm Can Chi) của một ngày sinh DƯƠNG LỊCH: sinh trước Tết thì
 * thuộc năm trước (vd 20/01/1990 → 1989 Kỷ Tỵ, vì Tết Canh Ngọ là 27/01/1990).
 */
export const namAmLich = (ngay: number, thang: number, nam: number): number =>
  duongSangAm(ngay, thang, nam).nam;
