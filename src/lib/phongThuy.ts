// ============================================================================
// phongThuy.ts — Lớp luận giải phong thủy DÙNG CHUNG (thuần hàm, chạy cả
// server lẫn client). Ghép trên engine Bát Cực (batCuc) + quẻ (hexagrams):
//   - diemTongHop: điểm tổng = Bát Cực + thưởng/phạt theo quẻ 4 số cuối
//   - mucTieuCuaSo: số này HỢP mục tiêu nào (Tài lộc / Công danh / Tình duyên / Quý nhân)
//   - nguHanhCuaSo: ngũ hành của dãy số (Hà Đồ: 0,1 Thủy · 2,5,8 Thổ · 3,4 Mộc · 6,7 Kim · 9 Hỏa)
//     — HANH_CUA_CHU_SO là bảng chữ số → hành DUY NHẤT của toàn site (simHopTuoi dùng lại)
//   - menhTheoNam / hopTuoiSo: hợp tuổi NHẸ — chỉ cần NĂM SINH (nạp âm ngũ hành), KHÔNG cần CCCD
// ============================================================================
import { chamBatCuc, phanTichBatCuc, type NangLuong } from "./batCuc";
import { getHexagramFromSuffix, type HexagramLevel } from "./hexagrams";

const digitsOnly = (s: string) => s.replace(/\D/g, "");

// ── ĐIỂM TỔNG (Bát Cực + Quẻ) ───────────────────────────────────────────────
// A Khoa 14/09: điểm headline chỉ tính Bát Cực nên có số "quẻ Đại cát" mà điểm
// thấp → khó hiểu. Gộp thưởng/phạt theo cấp quẻ vào điểm tổng cho nhất quán.
const QUE_BONUS: Record<HexagramLevel, number> = {
  "Đại cát": 0.7,
  Cát: 0.35,
  "Bình thường": 0,
  Hung: -0.35,
  "Đại hung": -0.7,
};

export interface DiemTongHop {
  diem: number; // 0..10 (đã gộp quẻ)
  batCuc: number; // 0..10 (thuần Bát Cực)
  queLevel: HexagramLevel | null;
}

export function diemTongHop(digits: string): DiemTongHop {
  const clean = digitsOnly(digits);
  const batCuc = chamBatCuc(clean).score;
  const hex = getHexagramFromSuffix(clean.slice(-4));
  const bonus = hex ? QUE_BONUS[hex.level] : 0;
  const diem = Math.round(Math.min(10, Math.max(0, batCuc + bonus)) * 10) / 10;
  return { diem, batCuc, queLevel: hex?.level ?? null };
}

// ── MỤC TIÊU (số hợp Tài lộc / Công danh / Tình duyên / Quý nhân) ────────────
export type MucTieu = "TaiLoc" | "CongDanh" | "TinhDuyen" | "QuyNhan";

export interface MucTieuMeta {
  id: MucTieu;
  slug: string; // dùng cho trang /sim-hop/[muc]
  label: string;
  icon: string;
  // Năng lượng Bát Cực (cát) nâng đỡ mục tiêu này — theo yNghia trong NL_META.
  nangLuong: NangLuong[];
}

export const MUC_TIEU: MucTieuMeta[] = [
  { id: "TaiLoc", slug: "tai-loc", label: "Tài lộc", icon: "💰", nangLuong: ["ThiênY", "PhụcVị"] },
  { id: "CongDanh", slug: "cong-danh", label: "Công danh", icon: "🏆", nangLuong: ["DiênNiên", "SinhKhí"] },
  { id: "TinhDuyen", slug: "tinh-duyen", label: "Tình duyên", icon: "💗", nangLuong: ["ThiênY", "LụcSát"] },
  { id: "QuyNhan", slug: "quy-nhan", label: "Quý nhân", icon: "🤝", nangLuong: ["SinhKhí", "ThiênY"] },
];

export const mucTieuTheoSlug = (slug: string): MucTieuMeta | undefined =>
  MUC_TIEU.find((m) => m.slug === slug);

export interface MucTieuDiem {
  id: MucTieu;
  slug: string;
  label: string;
  icon: string;
  diem: number; // tổng số cặp năng lượng nâng đỡ mục tiêu
}

/** Xếp các mục tiêu số này hỗ trợ, mạnh → yếu; chỉ giữ mục tiêu có điểm > 0. */
export function mucTieuCuaSo(digits: string): MucTieuDiem[] {
  const r = phanTichBatCuc(digitsOnly(digits));
  return MUC_TIEU.map((m) => ({
    id: m.id,
    slug: m.slug,
    label: m.label,
    icon: m.icon,
    diem: m.nangLuong.reduce((s, nl) => s + r.counts[nl], 0),
  }))
    .filter((x) => x.diem > 0)
    .sort((a, b) => b.diem - a.diem);
}

/** Điểm của MỘT mục tiêu cho một số (0 nếu không hỗ trợ) — cho trang lọc. */
export function diemMucTieu(digits: string, id: MucTieu): number {
  const m = MUC_TIEU.find((x) => x.id === id);
  if (!m) return 0;
  const r = phanTichBatCuc(digitsOnly(digits));
  return m.nangLuong.reduce((s, nl) => s + r.counts[nl], 0);
}

// ── NGŨ HÀNH của dãy số (Hà Đồ) ─────────────────────────────────────────────
// A Khoa chốt 24/09/2026: đây là bảng chữ số → hành CHUẨN, MỘT NGUỒN DUY NHẤT cho
// toàn site (chip hành, lọc/đếm theo mệnh, hợp tuổi nhẹ, engine chấm điểm
// simHopTuoi, trang hợp mệnh…). Site gọi bảng này là "Hà Đồ".
//   0, 1 → Thủy · 2, 5, 8 → Thổ · 3, 4 → Mộc · 6, 7 → Kim · 9 → Hỏa
// Đừng chép lại bảng ở nơi khác — import HANH_CUA_CHU_SO / chuSoCuaHanh.
export type NguHanh = "Kim" | "Mộc" | "Thủy" | "Hỏa" | "Thổ";

export const HANH_CUA_CHU_SO: Readonly<Record<string, NguHanh>> = Object.freeze({
  "0": "Thủy", "1": "Thủy",
  "2": "Thổ", "5": "Thổ", "8": "Thổ",
  "3": "Mộc", "4": "Mộc",
  "6": "Kim", "7": "Kim",
  "9": "Hỏa",
});

/** Các chữ số (0–9, tăng dần) thuộc hành `h` theo bảng chuẩn — VD Thổ → ["2","5","8"]. */
export const chuSoCuaHanh = (h: NguHanh): string[] =>
  "0123456789".split("").filter((d) => HANH_CUA_CHU_SO[d] === h);

export const HANH_MAU: Record<NguHanh, string> = {
  Kim: "#eab308", // vàng ánh kim
  Mộc: "#22c55e",
  Thủy: "#0ea5e9",
  Hỏa: "#ef4444",
  Thổ: "#a16207",
};

export interface NguHanhSo {
  phanBo: Record<NguHanh, number>;
  chinh: NguHanh; // hành nhiều nhất
}

/**
 * Ngũ hành của cả dãy số: đếm MỌI chữ số theo HANH_CUA_CHU_SO (kể cả số 0 đầu,
 * y như engine simHopTuoi.hanhChinhCuaSo đếm) → `chinh` = hành nhiều chữ số nhất.
 * Hòa số lượng → lấy theo thứ tự cố định Kim → Mộc → Thủy → Hỏa → Thổ (không phụ
 * thuộc mệnh người xem, để chip hành / lọc / đếm kho luôn ra một kết quả).
 * Khi KHÔNG hòa, kết quả trùng hanhChinhCuaSo(digits, menh) với mọi mệnh.
 */
export function nguHanhCuaSo(digits: string): NguHanhSo {
  const clean = digitsOnly(digits);
  const phanBo: Record<NguHanh, number> = { Kim: 0, Mộc: 0, Thủy: 0, Hỏa: 0, Thổ: 0 };
  for (const ch of clean) {
    const h = HANH_CUA_CHU_SO[ch];
    if (h) phanBo[h]++;
  }
  let chinh: NguHanh = "Thổ";
  let max = -1;
  for (const h of ["Kim", "Mộc", "Thủy", "Hỏa", "Thổ"] as NguHanh[]) {
    if (phanBo[h] > max) {
      max = phanBo[h];
      chinh = h;
    }
  }
  return { phanBo, chinh };
}

// ── VIEW "SIM THEO MỆNH" — 5 hành để khách chọn số theo mệnh ─────────────────
export const NGU_HANH_LIST: { hanh: NguHanh; slug: string; moTa: string }[] = [
  { hanh: "Kim", slug: "kim", moTa: "cứng cỏi, quyết đoán — hợp tài chính, kim khí, cơ khí" },
  { hanh: "Mộc", slug: "moc", moTa: "sinh sôi, phát triển — hợp khởi nghiệp, sáng tạo, giáo dục" },
  { hanh: "Thủy", slug: "thuy", moTa: "linh hoạt, giao tiếp — hợp thương mại, vận tải, dịch vụ" },
  { hanh: "Hỏa", slug: "hoa", moTa: "nhiệt huyết, danh tiếng — hợp lãnh đạo, truyền thông, F&B" },
  { hanh: "Thổ", slug: "tho", moTa: "vững vàng, tích lũy — hợp bất động sản, xây dựng, nông sản" },
];
export const hanhTheoSlug = (slug: string) => NGU_HANH_LIST.find((x) => x.slug === slug);

// ── HỢP TUỔI NHẸ — chỉ cần NĂM SINH (nạp âm ngũ hành), không cần CCCD ────────
// Nạp âm ngũ hành theo vòng 60 Giáp Tý; index = (năm - 4) mod 60 (Giáp Tý = 1984).
const NAP_AM_HANH: NguHanh[] = [
  "Kim", "Kim", "Hỏa", "Hỏa", "Mộc", "Mộc", "Thổ", "Thổ", "Kim", "Kim",
  "Hỏa", "Hỏa", "Thủy", "Thủy", "Thổ", "Thổ", "Kim", "Kim", "Mộc", "Mộc",
  "Thủy", "Thủy", "Thổ", "Thổ", "Hỏa", "Hỏa", "Mộc", "Mộc", "Thủy", "Thủy",
  "Kim", "Kim", "Hỏa", "Hỏa", "Mộc", "Mộc", "Thổ", "Thổ", "Kim", "Kim",
  "Hỏa", "Hỏa", "Thủy", "Thủy", "Thổ", "Thổ", "Kim", "Kim", "Mộc", "Mộc",
  "Thủy", "Thủy", "Thổ", "Thổ", "Hỏa", "Hỏa", "Mộc", "Mộc", "Thủy", "Thủy",
];

/** Mệnh ngũ hành (nạp âm) theo năm sinh dương lịch. null nếu năm không hợp lệ. */
export function menhTheoNam(nam: number): NguHanh | null {
  if (!Number.isInteger(nam) || nam < 1920 || nam > 2030) return null;
  const idx = (((nam - 4) % 60) + 60) % 60;
  return NAP_AM_HANH[idx];
}

// Vòng tương sinh / tương khắc.
const SINH: Record<NguHanh, NguHanh> = { Mộc: "Hỏa", Hỏa: "Thổ", Thổ: "Kim", Kim: "Thủy", Thủy: "Mộc" };
const KHAC: Record<NguHanh, NguHanh> = { Mộc: "Thổ", Thổ: "Thủy", Thủy: "Hỏa", Hỏa: "Kim", Kim: "Mộc" };

/** Số hành `h` sinh vượng cho mệnh nào (h → SINH[h]); dùng ở trang SIM theo mệnh. */
export const nguHanhSinhRa = (h: NguHanh): NguHanh => SINH[h];

/** Hành SINH cho mệnh `m` (ngược vòng tương sinh) — VD hanhSinhCho("Kim") = "Thổ". */
export const hanhSinhCho = (m: NguHanh): NguHanh =>
  (Object.keys(SINH) as NguHanh[]).find((h) => SINH[h] === m) ?? m;

/**
 * "Số hợp" của một mệnh, suy từ bảng chuẩn + tương sinh (không gõ tay):
 * chữ số hành SINH cho mệnh, rồi chữ số ĐỒNG hành mệnh.
 * VD Kim → 2, 5, 8 (Thổ sinh Kim) + 6, 7 · Thổ → 9 (Hỏa sinh Thổ) + 2, 5, 8.
 */
export const chuSoHopMenh = (m: NguHanh): string[] => [
  ...chuSoCuaHanh(hanhSinhCho(m)),
  ...chuSoCuaHanh(m),
];

export type HopTuoiTone = "tot" | "trungtinh" | "xau";

export interface HopTuoiKetQua {
  menh: NguHanh;
  hanhSo: NguHanh;
  muc: string; // nhãn ngắn
  tone: HopTuoiTone;
  giaiThich: string;
}

/** Luận hợp tuổi giữa ngũ hành SỐ và mệnh (nạp âm) của năm sinh. */
export function hopTuoiSo(digits: string, nam: number): HopTuoiKetQua | null {
  const menh = menhTheoNam(nam);
  if (!menh) return null;
  const hanhSo = nguHanhCuaSo(digits).chinh;

  if (SINH[hanhSo] === menh)
    return { menh, hanhSo, muc: "Tương sinh — rất hợp", tone: "tot", giaiThich: `Số hành ${hanhSo} sinh cho mệnh ${menh}, nâng đỡ chủ nhân.` };
  if (hanhSo === menh)
    return { menh, hanhSo, muc: "Tương hòa — hợp", tone: "tot", giaiThich: `Số cùng hành ${menh} với mệnh, tương hòa, vượng khí.` };
  if (SINH[menh] === hanhSo)
    return { menh, hanhSo, muc: "Bình hòa", tone: "trungtinh", giaiThich: `Mệnh ${menh} sinh cho số hành ${hanhSo} — dùng được, hơi hao lực.` };
  if (KHAC[hanhSo] === menh)
    return { menh, hanhSo, muc: "Tương khắc — cân nhắc", tone: "xau", giaiThich: `Số hành ${hanhSo} khắc mệnh ${menh} — nên cân nhắc hoặc nhờ tư vấn thêm.` };
  // mệnh khắc số
  return { menh, hanhSo, muc: "Bình thường", tone: "trungtinh", giaiThich: `Mệnh ${menh} chế ngự số hành ${hanhSo} — dùng ổn, không kỵ.` };
}
