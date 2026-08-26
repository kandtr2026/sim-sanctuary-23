// ============================================================================
// ENGINE TÌM SIM HỢP TUỔI — /sim-phong-thuy
// Clone lại mô hình "tìm sim hợp tuổi" của Sim Thăng Long (nhập giờ sinh + ngày
// sinh + giới tính → gợi ý SIM hợp phong thủy kèm điểm) trên kho SIM thật của
// CHONSOMOBIFONE.
//
// 5 trụ cột chấm điểm (mỗi trụ 0–10):
//   1. Ngũ hành bản mệnh (nạp âm từ Can–Chi năm sinh) + quan hệ sinh/khắc với
//      ngũ hành của từng con số trong SIM
//   2. Cân bằng Âm–Dương theo Cung Phi (Bát Trạch) + giờ sinh
//   3. Tổng nút (tổng các chữ số % 10, ≥7 là tốt)
//   4. Quẻ dịch (80 quẻ Kinh Dịch từ số đuôi)
//   5. (Phụ) Cửu tinh / Du Niên — được cộng nhẹ qua cặp số đẹp 68/86/39/79...
//      và cấu trúc số nổi bật
//
// Tất cả thuần hàm thuần túy — có thể chạy server (API route) lẫn client.
// ============================================================================

import { getHexagramFromSuffix, HexagramLevel } from "./hexagrams";
import type { NormalizedSIM } from "./simUtils";
import {
  chamBatCuc,
  locTheoBatCuc,
  phanTichBatCuc,
  type BatCucFilter,
  type NangLuong,
} from "./batCuc";

export type NguHanh = "Kim" | "Mộc" | "Thủy" | "Hỏa" | "Thổ";
export type GioiTinh = "nam" | "nu";
export type AmDuong = "Âm" | "Dương";

// ────────────────────────────────────────────────────────────────────────────
// THIÊN CAN – ĐỊA CHI – NẠP ÂM
// ────────────────────────────────────────────────────────────────────────────

export const THIEN_CAN = [
  "Giáp", "Ất", "Bính", "Đinh", "Mậu",
  "Kỷ", "Canh", "Tân", "Nhâm", "Quý",
] as const;

export const DIA_CHI = [
  "Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ",
  "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi",
] as const;

// 12 con giáp giờ sinh (Tý 23–1h → Hợi 21–23h)
export const GIO_SINH: { label: string; range: string; index: number; nguHanh: NguHanh; amDuong: AmDuong }[] = [
  { label: "Tý (23h–1h)", range: "23:00 – 00:59", index: 0, nguHanh: "Thủy", amDuong: "Dương" },
  { label: "Sửu (1h–3h)", range: "01:00 – 02:59", index: 1, nguHanh: "Thổ", amDuong: "Âm" },
  { label: "Dần (3h–5h)", range: "03:00 – 04:59", index: 2, nguHanh: "Mộc", amDuong: "Dương" },
  { label: "Mão (5h–7h)", range: "05:00 – 06:59", index: 3, nguHanh: "Mộc", amDuong: "Âm" },
  { label: "Thìn (7h–9h)", range: "07:00 – 08:59", index: 4, nguHanh: "Thổ", amDuong: "Dương" },
  { label: "Tỵ (9h–11h)", range: "09:00 – 10:59", index: 5, nguHanh: "Hỏa", amDuong: "Âm" },
  { label: "Ngọ (11h–13h)", range: "11:00 – 12:59", index: 6, nguHanh: "Hỏa", amDuong: "Dương" },
  { label: "Mùi (13h–15h)", range: "13:00 – 14:59", index: 7, nguHanh: "Thổ", amDuong: "Âm" },
  { label: "Thân (15h–17h)", range: "15:00 – 16:59", index: 8, nguHanh: "Kim", amDuong: "Dương" },
  { label: "Dậu (17h–19h)", range: "17:00 – 18:59", index: 9, nguHanh: "Kim", amDuong: "Âm" },
  { label: "Tuất (19h–21h)", range: "19:00 – 20:59", index: 10, nguHanh: "Thổ", amDuong: "Dương" },
  { label: "Hợi (21h–23h)", range: "21:00 – 22:59", index: 11, nguHanh: "Thủy", amDuong: "Âm" },
];

// 60 hoa giáp nạp âm → ngũ hành mệnh. Index = (năm - 4) % 60, mỗi cặp (2k, 2k+1)
// cùng một mệnh. Trình tự 30 mệnh của 60 hoa giáp (bắt đầu Giáp Tý).
const NAP_AM_NGU_HANH_60: NguHanh[] = [
  "Kim", "Kim", "Hỏa", "Hỏa", "Mộc", "Mộc", "Thổ", "Thổ", "Kim", "Kim",
  "Hỏa", "Hỏa", "Thủy", "Thủy", "Thổ", "Thổ", "Kim", "Kim", "Mộc", "Mộc",
  "Thủy", "Thủy", "Thổ", "Thổ", "Hỏa", "Hỏa", "Mộc", "Mộc", "Thủy", "Thủy",
  "Kim", "Kim", "Hỏa", "Hỏa", "Mộc", "Mộc", "Thổ", "Thổ", "Kim", "Kim",
  "Hỏa", "Hỏa", "Thủy", "Thủy", "Thổ", "Thổ", "Kim", "Kim", "Mộc", "Mộc",
  "Thủy", "Thủy", "Thổ", "Thổ", "Hỏa", "Hỏa", "Mộc", "Mộc", "Thủy", "Thủy",
];

// Tên nạp âm đầy đủ cho 60 hoa giáp (dùng hiển thị "mệnh Hải Trung Kim").
const NAP_AM_TEN_60: string[] = [
  "Hải Trung Kim", "Hải Trung Kim", "Lô Trung Hỏa", "Lô Trung Hỏa", "Đại Lâm Mộc", "Đại Lâm Mộc",
  "Lộ Bàng Thổ", "Lộ Bàng Thổ", "Kiếm Phong Kim", "Kiếm Phong Kim", "Sơn Đầu Hỏa", "Sơn Đầu Hỏa",
  "Giản Hạ Thủy", "Giản Hạ Thủy", "Thành Đầu Thổ", "Thành Đầu Thổ", "Bạch Lạp Kim", "Bạch Lạp Kim",
  "Dương Liễu Mộc", "Dương Liễu Mộc", "Tỉnh Tuyền Thủy", "Tỉnh Tuyền Thủy", "Ốc Thượng Thổ", "Ốc Thượng Thổ",
  "Tích Lịch Hỏa", "Tích Lịch Hỏa", "Tùng Bách Mộc", "Tùng Bách Mộc", "Trường Lưu Thủy", "Trường Lưu Thủy",
  "Sa Trung Kim", "Sa Trung Kim", "Sơn Hạ Hỏa", "Sơn Hạ Hỏa", "Bình Địa Mộc", "Bình Địa Mộc",
  "Bích Thượng Thổ", "Bích Thượng Thổ", "Kim Bạch Kim", "Kim Bạch Kim", "Phú Đăng Hỏa", "Phú Đăng Hỏa",
  "Thiên Hà Thủy", "Thiên Hà Thủy", "Đại Trạch Thổ", "Đại Trạch Thổ", "Thoa Xuyến Kim", "Thoa Xuyến Kim",
  "Tang Đố Mộc", "Tang Đố Mộc", "Đại Khê Thủy", "Đại Khê Thủy", "Sa Trung Thổ", "Sa Trung Thổ",
  "Thiên Thượng Hỏa", "Thiên Thượng Hỏa", "Thạch Lựu Mộc", "Thạch Lựu Mộc", "Đại Hải Thủy", "Đại Hải Thủy",
];

export interface CanChi {
  thienCan: string;
  diaChi: string;
  namTrong60: number; // 0–59
  menh: NguHanh; // ngũ hành nạp âm
  napAm: string; // tên nạp âm
}

/** Tính Thiên Can – Địa Chi – nạp âm từ năm sinh (dương lịch). */
export const tinhCanChi = (year: number): CanChi => {
  const idx = ((year - 4) % 60 + 60) % 60;
  return {
    thienCan: THIEN_CAN[((year - 4) % 10 + 10) % 10],
    diaChi: DIA_CHI[((year - 4) % 12 + 12) % 12],
    namTrong60: idx,
    menh: NAP_AM_NGU_HANH_60[idx],
    napAm: NAP_AM_TEN_60[idx],
  };
};

// ────────────────────────────────────────────────────────────────────────────
// CUNG PHI BÁT TRẠCH (quái số)
// ────────────────────────────────────────────────────────────────────────────

export interface CungPhi {
  so: number; // 1–9
  cung: string; // Khảm, Khôn, Chấn...
  nguHanh: NguHanh;
  amDuong: AmDuong;
}

const CUNG_PHI_BY_SO: Record<number, Omit<CungPhi, "so">> = {
  1: { cung: "Khảm", nguHanh: "Thủy", amDuong: "Dương" },
  2: { cung: "Khôn", nguHanh: "Thổ", amDuong: "Âm" },
  3: { cung: "Chấn", nguHanh: "Mộc", amDuong: "Dương" },
  4: { cung: "Tốn", nguHanh: "Mộc", amDuong: "Âm" },
  6: { cung: "Càn", nguHanh: "Kim", amDuong: "Dương" },
  7: { cung: "Đoài", nguHanh: "Kim", amDuong: "Âm" },
  8: { cung: "Cấn", nguHanh: "Thổ", amDuong: "Dương" },
  9: { cung: "Ly", nguHanh: "Hỏa", amDuong: "Âm" },
};

const reduceToSingle = (n: number): number => {
  let s = n;
  while (s > 9) {
    s = String(s).split("").reduce((a, d) => a + Number(d), 0);
  }
  return s;
};

/**
 * Tính quái số (Cung Phi Bát Trạch) từ năm sinh + giới tính.
 *  - S = rút gọn 2 số cuối năm sinh về 1 chữ số
 *  - Nam: quái = 10 − S   (nếu 10 → 1)
 *  - Nữ : quái = 5 + S    (nếu > 9 → trừ 9 cho tới khi ≤ 9)
 *  - Quái 5: Nam → Khôn (Thổ), Nữ → Cấn (Thổ)
 */
export const tinhCungPhi = (year: number, gender: GioiTinh): CungPhi => {
  const yy = year % 100;
  const s = reduceToSingle(Math.floor(yy / 10) + (yy % 10));
  let so: number;
  if (gender === "nam") {
    so = 10 - s;
    if (so === 10) so = 1;
  } else {
    so = 5 + s;
    while (so > 9) so -= 9;
  }

  if (so === 5) {
    return gender === "nam"
      ? { so: 5, cung: "Khôn", nguHanh: "Thổ", amDuong: "Âm" }
      : { so: 5, cung: "Cấn", nguHanh: "Thổ", amDuong: "Dương" };
  }
  const base = CUNG_PHI_BY_SO[so];
  return base ? { so, ...base } : { so: 9, ...CUNG_PHI_BY_SO[9] };
};

// ────────────────────────────────────────────────────────────────────────────
// NGŨ HÀNH CỦA CON SỐ & QUAN HỆ SINH KHẮC
// ────────────────────────────────────────────────────────────────────────────

// Quy ước Hà Đồ khớp với nội dung blog + trang hợp mệnh của CHONSOMOBIFONE:
// 0,1 → Thủy · 2,5,8 → Thổ · 3,4 → Mộc · 6,7 → Kim · 9 → Hỏa
const DIGIT_NGU_HANH: Record<string, NguHanh> = {
  "0": "Thủy", "1": "Thủy",
  "2": "Thổ", "5": "Thổ", "8": "Thổ",
  "3": "Mộc", "4": "Mộc",
  "6": "Kim", "7": "Kim",
  "9": "Hỏa",
};

/** Ngũ hành của một con số (theo Hà Đồ). */
export const nguHanhCuaSo = (digit: string | number): NguHanh | null =>
  DIGIT_NGU_HANH[String(digit)] ?? null;

// Tương sinh: X sinh Y
export const TUONG_SINH: Record<NguHanh, NguHanh> = {
  Kim: "Thủy",
  Thủy: "Mộc",
  Mộc: "Hỏa",
  Hỏa: "Thổ",
  Thổ: "Kim",
};

// Tương khắc: X khắc Y
export const TUONG_KHAC: Record<NguHanh, NguHanh> = {
  Kim: "Mộc",
  Mộc: "Thổ",
  Thổ: "Thủy",
  Thủy: "Hỏa",
  Hỏa: "Kim",
};

export const quanHeNguHanh = (a: NguHanh, b: NguHanh): "sinh" | "khac" | "dung" | "trung" => {
  if (a === b) return "dung"; // đồng hành
  if (TUONG_SINH[a] === b) return "sinh"; // a sinh b
  if (TUONG_KHAC[a] === b) return "khac"; // a khắc b
  return "trung"; // không quan hệ trực tiếp
};

// ────────────────────────────────────────────────────────────────────────────
// PROFILE & CHẤM ĐIỂM
// ────────────────────────────────────────────────────────────────────────────

export interface HopTuoiProfile {
  nam: number;
  gioIndex: number; // 0–11 (12 con giáp giờ)
  gioiTinh: GioiTinh;
  thienCan: string;
  diaChi: string;
  napAm: string;
  menh: NguHanh;
  cungPhi: CungPhi;
  gioLabel: string;
  gioNguHanh: NguHanh;
  gioAmDuong: AmDuong;
}

/** Xây dựng hồ sơ phong thủy của người dùng từ thông tin nhập vào. */
export const buildProfile = (nam: number, gioIndex: number, gioiTinh: GioiTinh): HopTuoiProfile => {
  const cc = tinhCanChi(nam);
  const cungPhi = tinhCungPhi(nam, gioiTinh);
  const gio = GIO_SINH[gioIndex] ?? GIO_SINH[0];
  return {
    nam,
    gioIndex,
    gioiTinh,
    thienCan: cc.thienCan,
    diaChi: cc.diaChi,
    napAm: cc.napAm,
    menh: cc.menh,
    cungPhi,
    gioLabel: gio.label,
    gioNguHanh: gio.nguHanh,
    gioAmDuong: gio.amDuong,
  };
};

// Điểm mỗi con số trong quan hệ với mệnh người dùng
//   +2: hành số SINH mệnh người (Thổ sinh Kim → số Thổ tốt cho người Kim)
// +1.5: hành số ĐỒNG mệnh người
//    0: hành số TRUNG tính
//   -1: mệnh người khắc hành số (Kim khắc Mộc → số Mộc cho người Kim)
//   -2: hành số khắc mệnh người (Hỏa khắc Kim → số Hỏa xấu cho người Kim)
const DIGIT_POINT = (menh: NguHanh, digitHanh: NguHanh): number => {
  const rel = quanHeNguHanh(digitHanh, menh); // digitHanh → menh
  if (rel === "sinh") return 2; // số sinh mệnh
  if (rel === "dung") return 1.5; // đồng hành
  if (rel === "khac") return -2; // số khắc mệnh
  return -1; // mệnh khắc số
};

export interface ScoredSim {
  id: string;
  digits: string;
  formattedNumber: string;
  price: number;
  score: number; // tổng 0–10
  nguHanhScore: number; // 0–10
  amDuongScore: number; // 0–10
  nutScore: number; // 0–10
  queScore: number; // 0–10
  phuScore: number; // 0–10 (cấu trúc / cặp đẹp)
  nut: number;
  que: number;
  hexagram: string;
  hexagramLevel: HexagramLevel;
  batCucScore: number; // 0–10 (Bát Cực Linh Số)
  nlChuDao: NangLuong | null; // năng lượng chủ đạo của SIM
  nlCounts: Record<NangLuong, number>; // chi tiết đếm năng lượng
}

const clamp = (n: number, min = 0, max = 10): number => Math.min(Math.max(n, min), max);

/**
 * Chấm điểm Âm–Dương cho một SIM theo cung phi + giờ sinh.
 *  - Cung phi Dương (Khảm/Chấn/Càn/Cấn) → người thiên Dương → SIM nên nghiêng
 *    Âm (nhiều số chẵn) để cân bằng; ngược lại.
 *  - Giờ sinh Dương → tăng thêm xu hướng chọn số Âm (giờ Âm thì ngược lại).
 * Điểm cao khi số chẵn/lẻ nghiêng đúng hướng bù trừ cho năng lượng của người dùng.
 */
const tinhAmDuongScore = (digits: string, profile: HopTuoiProfile): number => {
  const total = digits.length;
  if (total === 0) return 5;
  const even = digits.split("").filter((d) => Number(d) % 2 === 0).length;
  const evenRatio = even / total; // 0..1 (Âm phần)

  // Xu hướng cần số ÂM (chẵn): +1 nếu cung phi Dương, +1 nếu giờ Dương, +0.5 lẻ.
  const wantYin = profile.cungPhi.amDuong === "Dương" ? 1 : 0;
  const wantYinHour = profile.gioAmDuong === "Dương" ? 1 : 0;
  const target = 0.4 + 0.2 * wantYin + 0.2 * wantYinHour; // 0.4..0.8

  const diff = Math.abs(evenRatio - target);
  // diff 0 → 10 điểm; diff ~0.5 → gần 0
  return clamp(10 - diff * 18);
};

/** Chấm điểm tổng nút: nút = tổng các chữ số % 10 (>=7 là tốt). */
const tinhNutScore = (sumDigits: number): { nut: number; score: number } => {
  const nut = sumDigits % 10;
  let score: number;
  if (nut >= 9) score = 10;
  else if (nut === 8) score = 9;
  else if (nut === 7) score = 8;
  else if (nut === 6) score = 6;
  else if (nut === 5) score = 5;
  else score = Math.max(2, nut * 0.6);
  return { nut, score };
};

// Điểm quẻ dịch theo mức
const QUE_LEVEL_SCORE: Record<HexagramLevel, number> = {
  "Đại cát": 10,
  Cát: 8,
  "Bình thường": 5,
  Hung: 3,
  "Đại hung": 1,
};

// Điểm phụ: cấu trúc số nổi bật + cặp đẹp (Du Niên/Cửu tinh + thị trường VN)
const tinhPhuScore = (digits: string): number => {
  let s = 5;
  const last4 = digits.slice(-4);
  const last3 = digits.slice(-3);
  // Cặp số cát (thị trường + Du Niên phổ biến): 68/86 (Lộc Phát), 39/79 (Thần Tài)
  if (/68$|86$/.test(digits)) s += 1.5;
  if (/39$|79$/.test(digits)) s += 1.5;
  if (/38$|78$/.test(digits)) s += 1;
  // Lặp số (Tam hoa / Tứ quý đuôi) — Cửu tinh cục mạnh
  if (/(\d)\1{2}$/.test(last3)) s += 1.5;
  if (/(\d)\1{3}$/.test(last4)) s += 2;
  // Sảnh tiến cuối
  if (/0123$|1234$|2345$|3456$|4567$|5678$|6789$/.test(digits)) s += 1.5;
  return clamp(s);
};

/**
 * Chấm điểm một SIM (đã normalize) theo hồ sơ phong thủy.
 * Tổng = 40% ngũ hành + 20% âm dương + 15% tổng nút + 20% quẻ dịch + 5% phụ.
 */
export const scoreSim = (sim: NormalizedSIM, profile: HopTuoiProfile): ScoredSim => {
  const digits = sim.rawDigits || "";
  const sumDigits = sim.sumDigits ?? digits.split("").reduce((a, d) => a + Number(d), 0);

  // 1. Ngũ hành: trung bình điểm từng chữ số quy về 0–10
  const points = digits.split("").map((d) => {
    const dh = nguHanhCuaSo(d);
    return dh ? DIGIT_POINT(profile.menh, dh) : 0;
  });
  const avg = points.length ? points.reduce((a, b) => a + b, 0) / points.length : 0;
  // avg nằm trong [-2, 2] → scale về 0..10
  const nguHanhScore = clamp((avg + 2) * 2.5);

  // 2. Âm dương
  const amDuongScore = tinhAmDuongScore(digits, profile);

  // 3. Tổng nút
  const { nut, score: nutScore } = tinhNutScore(sumDigits);

  // 4. Quẻ dịch (4 số cuối, mod 80)
  const suffix = digits.slice(-4);
  const hex = suffix.length >= 4 ? getHexagramFromSuffix(suffix) : null;
  const queScore = hex ? QUE_LEVEL_SCORE[hex.level] : 5;
  const que = hex?.index ?? 0;

  // 5. Phụ (cấu trúc)
  const phuScore = tinhPhuScore(digits);

  const score =
    0.4 * nguHanhScore +
    0.2 * amDuongScore +
    0.15 * nutScore +
    0.2 * queScore +
    0.05 * phuScore;

  // 6. Bát Cực Linh Số — tính riêng (không đổi trọng số tổng) để dùng làm lớp lọc
  const batCuc = chamBatCuc(digits);
  const phanTich = phanTichBatCuc(digits);

  return {
    id: sim.id,
    digits,
    formattedNumber: sim.formattedNumber,
    price: sim.price,
    score: Math.round(score * 10) / 10,
    nguHanhScore: Math.round(nguHanhScore * 10) / 10,
    amDuongScore: Math.round(amDuongScore * 10) / 10,
    nutScore: Math.round(nutScore * 10) / 10,
    queScore: Math.round(queScore * 10) / 10,
    phuScore: Math.round(phuScore * 10) / 10,
    nut,
    que,
    hexagram: hex?.title ?? "",
    hexagramLevel: hex?.level ?? "Bình thường",
    batCucScore: batCuc.score,
    nlChuDao: phanTich.chuDao,
    nlCounts: batCuc.chiTiet,
  };
};

/**
 * Chấm điểm toàn kho, trả về top `limit` SIM hợp nhất.
 * Ưu tiên: điểm cao → giá rẻ hơn lên trước (khách dễ chốt), sau đó mới tới độ đẹp.
 * Nếu truyền `batCucFilter` → lọc SIM theo năng lượng Bát Cực (NL chủ đạo / phải có / loại trừ / hóa giải CCCD).
 */
export const scoreInventory = (
  sims: NormalizedSIM[],
  profile: HopTuoiProfile,
  limit = 12,
  batCucFilter?: BatCucFilter,
): ScoredSim[] => {
  const scored: ScoredSim[] = [];
  for (const sim of sims) {
    if (sim.price <= 0) continue;
    if (!sim.rawDigits || sim.rawDigits.length < 10) continue;
    const s = scoreSim(sim, profile);
    if (batCucFilter && !locTheoBatCuc(sim.rawDigits, batCucFilter)) continue;
    scored.push(s);
  }
  scored.sort(
    (a, b) =>
      b.score - a.score ||
      a.price - b.price ||
      b.queScore - a.queScore,
  );
  return scored.slice(0, limit);
};
