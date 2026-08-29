/**
 * NỘI DUNG THEO NĂM SINH cho cụm /sim-hop-tuoi/[nam].
 *
 * Mọi dữ kiện phong thủy (can chi, nạp âm, mệnh, cung phi) lấy từ
 * `src/lib/simHopTuoi.ts` — KHÔNG tính lại ở đây. File này chỉ lo phần chữ:
 * xoay khuôn tiêu đề / mô tả / mở bài theo `nam % 4` để 61 trang không dùng
 * chung một câu chỉ khác con số (lỗi meta gần trùng đang có ở cụm khác).
 *
 * Xoay theo `nam % 4` là DETERMINISTIC — SSR và ISR luôn dựng ra cùng một chuỗi,
 * nên không có hydration mismatch. Tuyệt đối không dùng Math.random ở đây.
 */

import { tinhCanChi, tinhCungPhi, type CungPhi, type NguHanh } from "@/lib/simHopTuoi";
import { buildHanhTable, formatDigits, NAP_AM_GLOSS } from "@/app/sim-hop-menh/_lib/menhContent";

/** Khoảng năm cụm này phục vụ (theo yêu cầu của HaDT). */
export const YEAR_FROM = 1950;
export const YEAR_TO = 2010;

export const ALL_YEARS: number[] = Array.from(
  { length: YEAR_TO - YEAR_FROM + 1 },
  (_, i) => YEAR_FROM + i,
);

export const isSupportedYear = (raw: string): boolean => {
  if (!/^\d{4}$/.test(raw)) return false;
  const y = Number(raw);
  return y >= YEAR_FROM && y <= YEAR_TO;
};

// 12 con giáp theo địa chi — chỉ dùng để gọi tên dân dã ("cầm tinh con Ngựa").
const CON_GIAP_BY_CHI: Record<string, string> = {
  Tý: "Chuột",
  Sửu: "Trâu",
  Dần: "Hổ",
  Mão: "Mèo",
  Thìn: "Rồng",
  Tỵ: "Rắn",
  Ngọ: "Ngựa",
  Mùi: "Dê",
  Thân: "Khỉ",
  Dậu: "Gà",
  Tuất: "Chó",
  Hợi: "Lợn",
};

export interface YearInfo {
  nam: number;
  canChi: string;
  conGiap: string;
  napAm: string;
  napAmGloss: string;
  menh: NguHanh;
  cungPhiNam: CungPhi;
  cungPhiNu: CungPhi;
  /** Chữ số nên ưu tiên, đã format "2, 5, 8". */
  soUuTien: string;
  /** Chữ số nên tránh (khắc bản mệnh). */
  soNenTranh: string;
  /** Chữ số đồng hành. */
  soDongHanh: string;
}

export const getYearInfo = (nam: number): YearInfo => {
  const cc = tinhCanChi(nam);
  const table = buildHanhTable(cc.menh);
  return {
    nam,
    canChi: `${cc.thienCan} ${cc.diaChi}`,
    conGiap: CON_GIAP_BY_CHI[cc.diaChi] ?? cc.diaChi,
    napAm: cc.napAm,
    napAmGloss: NAP_AM_GLOSS[cc.napAm] ?? "",
    menh: cc.menh,
    cungPhiNam: tinhCungPhi(nam, "nam"),
    cungPhiNu: tinhCungPhi(nam, "nu"),
    soUuTien: formatDigits(table.sinh),
    soNenTranh: formatDigits(table.khacMenh),
    soDongHanh: formatDigits(table.dong),
  };
};

// ── Tiêu đề & mô tả: 4 khuôn, xoay theo nam % 4 ──────────────────────────────
// Ràng buộc: title ≤ 60 ký tự, description 140–165 ký tự. Đã đo cho cả 61 năm
// bằng src/app/sim-hop-tuoi/_lib/meta.test.ts (chạy `npx vitest run`).

export const buildTitle = (info: YearInfo): string => {
  const { nam, canChi, menh } = info;
  // Đo lại 29/08: mệnh dài nhất ("Thủy"/"Thổ" chỉ 3–4 ký tự nhưng can chi dài như
  // "Canh Ngọ" cộng vào) làm khuôn 0 và 2 vượt 60 → cắt phần dư, giữ cụm khoá
  // "sim hợp tuổi <năm>" ở đầu câu vì đó là cụm khách gõ.
  switch (nam % 4) {
    case 0:
      return `Sim Hợp Tuổi ${nam} – Số Hợp Mệnh ${menh}, Giá Rõ`;
    case 1:
      return `Sim Hợp Tuổi ${nam} (${canChi}) – Hợp Mệnh ${menh}`;
    case 2:
      return `Sim Hợp Tuổi ${nam} ${canChi} – Mệnh ${menh}, Giá Rõ`;
    default:
      return `Sim Hợp Tuổi ${nam} Mobifone – Chọn Theo Mệnh ${menh}`;
  }
};

export const buildDescription = (info: YearInfo): string => {
  const { nam, canChi, conGiap, napAm, menh, soUuTien, soNenTranh } = info;
  switch (nam % 4) {
    case 0:
      return `Sim hợp tuổi ${nam} (${canChi}), nạp âm ${napAm}, mệnh ${menh}. Nên ưu tiên số ${soUuTien}, tránh ${soNenTranh} theo quan niệm dân gian. Kho Mobifone thật, giá công khai.`;
    case 1:
      return `Sim hợp tuổi ${nam} còn trong kho Mobifone: người ${canChi} mệnh ${menh} được cho là hợp số ${soUuTien}. Mỗi số kèm điểm phong thủy và giá bán, sang tên chính chủ.`;
    case 2:
      return `Quý khách sinh năm ${nam}, cầm tinh con ${conGiap}, mệnh ${menh} (${napAm}) xem số hợp tuổi có sẵn: điểm ngũ hành, tổng nút và quẻ dịch cạnh từng số, giá rõ.`;
    default:
      return `Chọn sim hợp tuổi ${nam} theo mệnh ${menh} của người ${canChi}: ưu tiên chữ số ${soUuTien}, hạn chế ${soNenTranh}. Số thật trong kho Mobifone, nhận sim rồi mới trả tiền.`;
  }
};

// ── Mở bài: 4 khuôn, xoay theo nam % 4 ──────────────────────────────────────

export const buildIntro = (info: YearInfo): string => {
  const { nam, canChi, conGiap, napAm, menh, soUuTien } = info;
  switch (nam % 4) {
    case 0:
      return `Số hợp tuổi ${nam} đã lọc sẵn, mỗi số kèm giá và điểm phong thủy. Năm ${canChi}, nạp âm ${napAm}, bản mệnh ${menh} — theo quan niệm dân gian thì dãy nhiều chữ số ${soUuTien} được xem là thuận.`;
    case 1:
      return `Quý khách tuổi ${canChi} không phải dò cả kho. Danh sách dưới đây chấm điểm theo mệnh ${menh} của người sinh năm ${nam}, ưu tiên chữ số ${soUuTien}, và hiện giá ngay cạnh từng số.`;
    case 2:
      return `Người sinh năm ${nam} cầm tinh con ${conGiap}, nạp âm ${napAm}, thuộc mệnh ${menh}. Engine chấm toàn bộ kho Mobifone theo mệnh đó rồi giữ lại nhóm điểm cao nhất — Quý khách xem giá và chốt ngay.`;
    default:
      return `Chọn số cho tuổi ${canChi} (${nam}) gọn hơn khi đã biết bản mệnh: mệnh ${menh}, nạp âm ${napAm}. Anh Chị xem nhóm số điểm cao nhất trong kho, kèm quẻ dịch và tổng nút của từng số.`;
  }
};
