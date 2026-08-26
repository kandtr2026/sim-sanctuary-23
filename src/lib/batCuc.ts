// ============================================================================
// BÁT CỰC LINH SỐ — engine phân tích năng lượng số (SIM / CCCD)
// Áp dụng flow tham khảo từ simkinhdich.com/tim-sim-phong-thuy:
//   - 8 năng lượng (4 cát + 4 hung), mỗi năng lượng 8 cặp số (64 cặp)
//   - Phân tích một dãy số thành các cặp đôi chồng lấn → đếm năng lượng
//   - Phân tích CCCD (12 số) → tìm năng lượng hung → đề xuất hóa giải
//   - Bộ lọc: NL chủ đạo, NL phải có (≤5), Loại trừ NL (≤5)
// Thuần hàm thuần túy — chạy được cả server (API) lẫn client (tool).
// ============================================================================

export type NangLuong =
  | "SinhKhí"
  | "ThiênY"
  | "DiênNiên"
  | "PhụcVị"
  | "HọaHại"
  | "LụcSát"
  | "NgũQuỷ"
  | "TuyệtMệnh";

export type NangLuongLoai = "cát" | "hung";

export interface NangLuongMeta {
  id: NangLuong;
  label: string; // Tên hiển thị
  loai: NangLuongLoai;
  yNghia: string[]; // Thẻ ý nghĩa (khớp simkinhdich)
  moTa: string;
  pairs: string[]; // 8 cặp số tương ứng
  hoaGiai?: NangLuong; // Năng lượng cát hóa giải năng lượng hung này
}

// Bảng 64 cặp → năng lượng (chuẩn Bát Cực Linh Số / Du Niên)
const PAIR_TO_NL: Record<string, NangLuong> = Object.fromEntries(
  [
    // Sinh Khí (cát)
    ["14", "SinhKhí"], ["41", "SinhKhí"],
    ["67", "SinhKhí"], ["76", "SinhKhí"],
    ["39", "SinhKhí"], ["93", "SinhKhí"],
    ["28", "SinhKhí"], ["82", "SinhKhí"],
    // Thiên Y (cát)
    ["13", "ThiênY"], ["31", "ThiênY"],
    ["68", "ThiênY"], ["86", "ThiênY"],
    ["49", "ThiênY"], ["94", "ThiênY"],
    ["27", "ThiênY"], ["72", "ThiênY"],
    // Diên Niên (cát)
    ["19", "DiênNiên"], ["91", "DiênNiên"],
    ["87", "DiênNiên"], ["78", "DiênNiên"],
    ["34", "DiênNiên"], ["43", "DiênNiên"],
    ["26", "DiênNiên"], ["62", "DiênNiên"],
    // Phục Vị (cát)
    ["11", "PhụcVị"], ["22", "PhụcVị"],
    ["88", "PhụcVị"], ["99", "PhụcVị"],
    ["66", "PhụcVị"], ["77", "PhụcVị"],
    ["33", "PhụcVị"], ["44", "PhụcVị"],
    // Họa Hại (hung)
    ["17", "HọaHại"], ["71", "HọaHại"],
    ["89", "HọaHại"], ["98", "HọaHại"],
    ["46", "HọaHại"], ["64", "HọaHại"],
    ["23", "HọaHại"], ["32", "HọaHại"],
    // Lục Sát (hung)
    ["16", "LụcSát"], ["61", "LụcSát"],
    ["47", "LụcSát"], ["74", "LụcSát"],
    ["38", "LụcSát"], ["83", "LụcSát"],
    ["29", "LụcSát"], ["92", "LụcSát"],
    // Ngũ Quỷ (hung)
    ["18", "NgũQuỷ"], ["81", "NgũQuỷ"],
    ["79", "NgũQuỷ"], ["97", "NgũQuỷ"],
    ["36", "NgũQuỷ"], ["63", "NgũQuỷ"],
    ["24", "NgũQuỷ"], ["42", "NgũQuỷ"],
    // Tuyệt Mệnh (hung)
    ["12", "TuyệtMệnh"], ["21", "TuyệtMệnh"],
    ["69", "TuyệtMệnh"], ["96", "TuyệtMệnh"],
    ["48", "TuyệtMệnh"], ["84", "TuyệtMệnh"],
    ["37", "TuyệtMệnh"], ["73", "TuyệtMệnh"],
  ] as [string, NangLuong][],
);

export const NANG_LUONG_LIST: NangLuongMeta[] = [
  {
    id: "SinhKhí",
    label: "Sinh Khí",
    loai: "cát",
    yNghia: ["Quý nhân", "Lạc quan", "Kết nối"],
    moTa: "Năng lượng cát lành, thu hút quý nhân phù trợ, gặp nhiều may mắn, mọi sự hanh thông.",
    pairs: ["14", "41", "67", "76", "39", "93", "28", "82"],
    hoaGiai: undefined,
  },
  {
    id: "ThiênY",
    label: "Thiên Y",
    loai: "cát",
    yNghia: ["Tài lộc", "Tình duyên", "Chữa lành"],
    moTa: "Năng lượng tài lộc, may mắn về tiền bạc, tình duyên thuận lợi, giúp an tâm, chữa lành.",
    pairs: ["13", "31", "68", "86", "49", "94", "27", "72"],
    hoaGiai: undefined,
  },
  {
    id: "DiênNiên",
    label: "Diên Niên",
    loai: "cát",
    yNghia: ["Lãnh đạo", "Chính trực", "Bền vững"],
    moTa: "Năng lượng lãnh đạo, bản lĩnh, kiên định, sự nghiệp bền vững, giữ vững lập trường.",
    pairs: ["19", "91", "87", "78", "34", "43", "26", "62"],
    hoaGiai: undefined,
  },
  {
    id: "PhụcVị",
    label: "Phục Vị",
    loai: "cát",
    yNghia: ["Ổn định", "Kiên nhẫn", "Tụ tài"],
    moTa: "Năng lượng ổn định, bình an, kiên trì, tích lũy và tụ tài bền bỉ.",
    pairs: ["11", "22", "88", "99", "66", "77", "33", "44"],
    hoaGiai: undefined,
  },
  {
    id: "HọaHại",
    label: "Họa Hại",
    loai: "hung",
    yNghia: ["Khẩu tài", "Phản biện", "Sắc bén"],
    moTa: "Năng lượng hung, dễ tranh cãi, lời nói dễ gây hiểu lầm, hao tổn sức khỏe tinh thần.",
    pairs: ["17", "71", "89", "98", "46", "64", "23", "32"],
    hoaGiai: "PhụcVị",
  },
  {
    id: "LụcSát",
    label: "Lục Sát",
    loai: "hung",
    yNghia: ["Quan hệ", "Thẩm mỹ", "Phục vụ"],
    moTa: "Năng lượng hung, dễ hao tán, thị phi, quan hệ tình cảm trắc trở, làm ăn kém may.",
    pairs: ["16", "61", "47", "74", "38", "83", "29", "92"],
    hoaGiai: "DiênNiên",
  },
  {
    id: "NgũQuỷ",
    label: "Ngũ Quỷ",
    loai: "hung",
    yNghia: ["Trí tuệ", "Tài hoa", "Thông minh"],
    moTa: "Năng lượng hung, dễ biến động, tai tiếng, hao tổn tài chính, khó giữ của.",
    pairs: ["18", "81", "79", "97", "36", "63", "24", "42"],
    hoaGiai: "ThiênY",
  },
  {
    id: "TuyệtMệnh",
    label: "Tuyệt Mệnh",
    loai: "hung",
    yNghia: ["Đầu tư", "Đột phá", "Mạo hiểm"],
    moTa: "Năng lượng hung mạnh nhất, dễ gặp biến cố, đổ vỡ, nóng nảy, rủi ro lớn nếu dùng lâu.",
    pairs: ["12", "21", "69", "96", "48", "84", "37", "73"],
    hoaGiai: "SinhKhí",
  },
];

export const NL_META: Record<NangLuong, NangLuongMeta> = Object.fromEntries(
  NANG_LUONG_LIST.map((m) => [m.id, m]),
) as Record<NangLuong, NangLuongMeta>;

// Thứ tự hiển thị cố định: cát trước, hung sau (khớp simkinhdich)
export const NL_ORDER: NangLuong[] = [
  "SinhKhí", "ThiênY", "DiênNiên", "PhụcVị",
  "HọaHại", "LụcSát", "NgũQuỷ", "TuyệtMệnh",
];

export const NL_CAT: NangLuong[] = ["SinhKhí", "ThiênY", "DiênNiên", "PhụcVị"];
export const NL_HUNG: NangLuong[] = ["HọaHại", "LụcSát", "NgũQuỷ", "TuyệtMệnh"];

export const nangLuongCuaCap = (pair: string): NangLuong | null =>
  PAIR_TO_NL[pair] ?? null;

/** Tách dãy số thành các cặp chồng lấn: "12345" → ["12","23","34","45"]. */
export const tachCap = (digits: string): string[] => {
  const out: string[] = [];
  for (let i = 0; i < digits.length - 1; i++) {
    out.push(digits.slice(i, i + 2));
  }
  return out;
};

export interface BatCucResult {
  total: number; // tổng số cặp phân tích được
  counts: Record<NangLuong, number>;
  ratio: Record<NangLuong, number>; // 0..1
  pairs: { cap: string; nl: NangLuong | null }[];
  chuDao: NangLuong | null; // năng lượng xuất hiện nhiều nhất
}

const emptyCounts = (): Record<NangLuong, number> => ({
  SinhKhí: 0, ThiênY: 0, DiênNiên: 0, PhụcVị: 0,
  HọaHại: 0, LụcSát: 0, NgũQuỷ: 0, TuyệtMệnh: 0,
});

/** Phân tích Bát Cực của một dãy số bất kỳ (SIM, CCCD, số đuôi...). */
export const phanTichBatCuc = (digits: string): BatCucResult => {
  const cleaned = digits.replace(/\D/g, "");
  const pairs = tachCap(cleaned).map((cap) => ({
    cap,
    nl: PAIR_TO_NL[cap] ?? null,
  }));
  const counts = emptyCounts();
  for (const p of pairs) if (p.nl) counts[p.nl]++;

  const total = pairs.length || 0;
  const ratio = emptyCounts();
  for (const k of NL_ORDER) ratio[k] = total > 0 ? counts[k] / total : 0;

  let chuDao: NangLuong | null = null;
  let max = 0;
  for (const k of NL_ORDER) {
    if (counts[k] > max) {
      max = counts[k];
      chuDao = k;
    }
  }

  return { total, counts, ratio, pairs, chuDao };
};

// ────────────────────────────────────────────────────────────────────────────
// CCCD & HÓA GIẢI
// ────────────────────────────────────────────────────────────────────────────

export interface PhanTichCCCD {
  cccd: string;
  ketQua: BatCucResult;
  nangLuongHung: NangLuong[]; // các năng lượng hung xuất hiện trong CCCD (có tỉ lệ ≥ ngưỡng)
  hoaGiai: NangLuong[]; // năng lượng cát cần có trong SIM để hóa giải
  capCuc: { cau: string; giaiThich: string }[]; // từng cặp hung → cách hóa giải
}

/** Phân tích CCCD (12 số) → năng lượng hung + đề xuất hóa giải cần bổ sung ở SIM. */
export const phanTichCCCD = (cccd: string): PhanTichCCCD | null => {
  const cleaned = cccd.replace(/\D/g, "");
  if (cleaned.length !== 12) return null;

  const ketQua = phanTichBatCuc(cleaned);
  const nangLuongHung = NL_HUNG.filter((nl) => ketQua.counts[nl] > 0);

  const hoaGiaiSet = new Set<NangLuong>();
  const capCuc: PhanTichCCCD["capCuc"] = [];
  for (const { cap, nl } of ketQua.pairs) {
    if (nl && NL_META[nl].loai === "hung") {
      const cau = NL_META[nl].hoaGiai;
      if (cau) {
        hoaGiaiSet.add(cau);
        capCuc.push({
          cau: `${cap} (${NL_META[nl].label})`,
          giaiThich: `Bổ sung ${NL_META[cau].label} trong SIM để hóa giải`,
        });
      }
    }
  }

  return {
    cccd: cleaned,
    ketQua,
    nangLuongHung,
    hoaGiai: NL_ORDER.filter((nl) => hoaGiaiSet.has(nl)),
    capCuc,
  };
};

// ────────────────────────────────────────────────────────────────────────────
// BỘ LỌC SIM THEO NĂNG LƯỢNG
// ────────────────────────────────────────────────────────────────────────────

export interface BatCucFilter {
  nlChuDao: NangLuong | null; // năng lượng chủ đạo mong muốn
  nlPhaiCo: NangLuong[]; // phải có (≤5)
  nlLoaiTru: NangLuong[]; // loại trừ (≤5)
  hoaGiaiCccd: NangLuong[]; // cần có để hóa giải CCCD (từ phanTichCCCD)
}

/** Kiểm tra một dãy số có đạt bộ lọc Bát Cực hay không. */
export const locTheoBatCuc = (digits: string, filter: BatCucFilter): boolean => {
  const r = phanTichBatCuc(digits);

  if (filter.nlChuDao && r.chuDao !== filter.nlChuDao) return false;

  for (const nl of filter.nlPhaiCo) {
    if (r.counts[nl] <= 0) return false;
  }

  for (const nl of filter.nlLoaiTru) {
    if (r.counts[nl] > 0) return false;
  }

  // Hóa giải CCCD: SIM phải chứa năng lượng cát đề xuất
  for (const nl of filter.hoaGiaiCccd) {
    if (r.counts[nl] <= 0) return false;
  }

  return true;
};

/**
 * Điểm Bát Cực của một dãy số theo "mục tiêu" (chọn sim phong thủy):
 *  - Càng nhiều năng lượng CÁT càng tốt (Sinh Khí > Thiên Y > Diên Niên > Phục Vị)
 *  - Càng ít năng lượng HUNG càng tốt
 *  - Nếu có hung thì ưu tiên sim có kèm năng lượng hóa giải tương ứng
 * Trả về 0..10.
 */
export const chamBatCuc = (digits: string): { score: number; chiTiet: Record<NangLuong, number> } => {
  const r = phanTichBatCuc(digits);
  if (r.total === 0) return { score: 5, chiTiet: r.counts };

  const DIEM_CAT: Record<NangLuong, number> = {
    SinhKhí: 2, ThiênY: 1.8, DiênNiên: 1.5, PhụcVị: 1.2,
    HọaHại: -1.2, LụcSát: -1.5, NgũQuỷ: -1.8, TuyệtMệnh: -2,
  };

  let raw = 0;
  for (const k of NL_ORDER) {
    raw += DIEM_CAT[k] * r.counts[k];
  }

  // Thưởng hóa giải: cặp hung có kèm cát tương ứng trong cùng dãy
  let bonus = 0;
  for (const k of NL_HUNG) {
    const cau = NL_META[k].hoaGiai;
    if (cau && r.counts[k] > 0 && r.counts[cau] > 0) {
      bonus += 0.5;
    }
  }

  const score = Math.min(10, Math.max(0, 5 + (raw / r.total) * 2 + bonus));
  return { score: Math.round(score * 10) / 10, chiTiet: r.counts };
};
