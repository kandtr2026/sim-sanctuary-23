/**
 * Lọc kho theo MỆNH + KHOẢNG GIÁ trên TOÀN BỘ kho, xếp theo điểm phong thủy cao
 * nhất — phục vụ hàng nút "Mức giá" của /sim-theo-menh/[hanh] và
 * /sim-hop-menh/[hanh] (qua /api/sim-menh).
 *
 * Mỗi trang giữ ĐÚNG định nghĩa "hợp mệnh" + cách chấm điểm nó đang dùng khi
 * server render, để bảng lọc giá không nói khác bảng mặc định:
 *  - "theo" (/sim-theo-menh): ngũ hành chính của dãy số (Hà Đồ, nguHanhCuaSo)
 *    bằng mệnh trang; xếp theo diemTongHop (Bát Cực + quẻ), bằng điểm thì giá
 *    thấp lên trước — y hệt `scored` trong page.tsx.
 *  - "hop" (/sim-hop-menh): engine scoreSim với hồ sơ profileForHanh (giống
 *    getRankedPool); chỉ giữ số có hành Tương sinh / Tương hòa với mệnh và điểm
 *    ≥ NGUONG_HOP_TUOI.binhHoa (ngưỡng mặc định của /sim-phong-thuy). Xếp như
 *    scoreInventoryAdvanced: điểm giảm dần → giá tăng dần → điểm quẻ.
 */
import { diemTongHop, nguHanhCuaSo } from "@/lib/phongThuy";
import { NGUONG_HOP_TUOI, scoreInventoryAdvanced, TUONG_SINH, type NguHanh } from "@/lib/simHopTuoi";
import type { NormalizedSIM } from "@/lib/simUtils";
import { giaKhop } from "@/lib/giaParam";
import { profileForHanh } from "@/app/sim-hop-menh/_lib/menhSimRanking";

export type KieuTrangMenh = "theo" | "hop";

export interface MenhGiaItem {
  sim: NormalizedSIM;
  /** Điểm dùng để xếp (thang 0–10) — đúng con số của trang tương ứng. */
  diem: number;
}

/** Số hành `simHanh` có được xem là hợp mệnh `menh` không (Tương hòa / Tương sinh). */
export const hanhHopMenh = (simHanh: NguHanh, menh: NguHanh): boolean =>
  simHanh === menh || TUONG_SINH[simHanh] === menh;

/** Toàn bộ số hợp mệnh trong khoảng giá, đã xếp (chưa phân trang). */
export const locSimMenhGia = (
  sims: readonly NormalizedSIM[],
  kieu: KieuTrangMenh,
  hanh: NguHanh,
  ranges: readonly number[],
): MenhGiaItem[] => {
  if (kieu === "theo") {
    return sims
      .filter((s) => s.price > 0 && giaKhop(s.price, ranges) && nguHanhCuaSo(s.rawDigits).chinh === hanh)
      .map((s) => ({ sim: s, diem: diemTongHop(s.rawDigits).diem }))
      .sort((a, b) => b.diem - a.diem || a.sim.price - b.sim.price);
  }

  const byId = new Map(sims.map((s) => [s.id, s]));
  const { sims: scored } = scoreInventoryAdvanced(sims as NormalizedSIM[], profileForHanh(hanh), {
    priceRange: ranges.length ? ranges.join(",") : undefined,
    limit: Number.MAX_SAFE_INTEGER,
    minScore: NGUONG_HOP_TUOI.binhHoa,
  });
  const out: MenhGiaItem[] = [];
  for (const sc of scored) {
    if (!hanhHopMenh(sc.simHanh, hanh)) continue;
    const sim = byId.get(sc.id);
    // Lọc giá lần nữa cho chắc: engine và trang phải cùng một biên giá.
    if (sim && giaKhop(sim.price, ranges)) out.push({ sim, diem: sc.score });
  }
  return out;
};
