/**
 * NỘI DUNG THEO MỆNH cho /sim-hop-menh/[hanh] — 4 khuôn tiêu đề/mô tả nhưng ở
 * đây chỉ có 5 trang nên mỗi mệnh viết riêng một bộ, không xoay khuôn: 5 câu
 * khác nhau hoàn toàn vẫn dễ kiểm hơn 5 câu sinh từ một template.
 *
 * Độ dài đã đo bằng src/app/sim-hop-menh/_lib/__meta.test.ts (title ≤ 60,
 * description 140–165).
 */

import type { NguHanh } from "@/lib/simHopTuoi";
import type { HanhSlug } from "./menhSimRanking";

export interface HanhMeta {
  slug: HanhSlug;
  title: string;
  description: string;
  intro: string;
  /** Một câu về cách chọn số, dùng làm chú thích dưới bảng giá. */
  bangGiaNote: string;
}

export const HANH_META: Record<NguHanh, HanhMeta> = {
  Kim: {
    slug: "kim",
    title: "Sim Hợp Mệnh Kim – Số 2, 5, 8 Và 6, 7 Mobifone",
    description:
      "Sim hợp mệnh Kim Mobifone: ưu tiên chữ số 2, 5, 8 (Thổ sinh Kim) và 6, 7 đồng hành, hạn chế số 9. Số thật kèm giá niêm yết, sang tên chính chủ, giao toàn quốc.",
    intro:
      "Người mệnh Kim chọn số nhanh hơn khi đã biết nhóm chữ số phù hợp: 2, 5, 8 và 6, 7. Danh sách dưới đây lấy từ kho Mobifone thật, mỗi số kèm giá và điểm chấm theo mệnh Kim.",
    bangGiaNote:
      "Số trong bảng thuộc nhóm điểm cao nhất khi chấm theo mệnh Kim, tức dãy có nhiều chữ số 2, 5, 8, 6, 7 và ít số 9.",
  },
  Mộc: {
    slug: "moc",
    title: "Sim Hợp Mệnh Mộc – Số 0, 1 Và 3, 4 Mobifone",
    description:
      "Sim hợp mệnh Mộc Mobifone: ưu tiên chữ số 0, 1 (Thủy sinh Mộc) và 3, 4 đồng hành, hạn chế 6, 7. Số thật kèm giá niêm yết, sang tên chính chủ, giao toàn quốc.",
    intro:
      "Người mệnh Mộc thường tìm dãy nhiều số 0, 1 và 3, 4. Danh sách dưới đây đã chấm theo mệnh Mộc trên kho Mobifone thật, giá hiện ngay cạnh từng số.",
    bangGiaNote:
      "Số trong bảng thuộc nhóm điểm cao nhất khi chấm theo mệnh Mộc, tức dãy có nhiều chữ số 0, 1, 3, 4 và ít số 6, 7.",
  },
  Thủy: {
    slug: "thuy",
    title: "Sim Hợp Mệnh Thủy – Số 6, 7 Và 0, 1 Mobifone",
    description:
      "Sim hợp mệnh Thủy Mobifone: ưu tiên chữ số 6, 7 (Kim sinh Thủy) và 0, 1 đồng hành, hạn chế 2, 5, 8. Số thật kèm giá niêm yết, sang tên chính chủ, giao toàn quốc.",
    intro:
      "Người mệnh Thủy hợp nhóm số 6, 7 và 0, 1 theo quan niệm dân gian. Danh sách dưới đây chấm theo mệnh Thủy trên kho Mobifone thật, kèm giá và quẻ dịch của từng số.",
    bangGiaNote:
      "Số trong bảng thuộc nhóm điểm cao nhất khi chấm theo mệnh Thủy, tức dãy có nhiều chữ số 6, 7, 0, 1 và ít số 2, 5, 8.",
  },
  Hỏa: {
    slug: "hoa",
    title: "Sim Hợp Mệnh Hỏa – Số 3, 4 Và Số 9 Mobifone",
    description:
      "Sim hợp mệnh Hỏa Mobifone: ưu tiên chữ số 3, 4 (Mộc sinh Hỏa) và số 9 đồng hành, hạn chế 0, 1. Số thật kèm giá niêm yết, sang tên chính chủ, giao toàn quốc.",
    intro:
      "Người mệnh Hỏa hợp nhóm số 3, 4 và số 9. Danh sách dưới đây chấm theo mệnh Hỏa trên kho Mobifone thật, mỗi số kèm giá niêm yết và điểm ngũ hành.",
    bangGiaNote:
      "Số trong bảng thuộc nhóm điểm cao nhất khi chấm theo mệnh Hỏa, tức dãy có nhiều chữ số 3, 4, 9 và ít số 0, 1.",
  },
  Thổ: {
    slug: "tho",
    title: "Sim Hợp Mệnh Thổ – Số 9 Và 2, 5, 8 Mobifone",
    description:
      "Sim hợp mệnh Thổ Mobifone: ưu tiên số 9 (Hỏa sinh Thổ) và 2, 5, 8 đồng hành, hạn chế 3, 4. Số thật kèm giá niêm yết công khai, sang tên chính chủ, giao toàn quốc.",
    intro:
      "Người mệnh Thổ hợp số 9 và nhóm 2, 5, 8. Danh sách dưới đây chấm theo mệnh Thổ trên kho Mobifone thật, giá niêm yết công khai ngay cạnh từng số.",
    bangGiaNote:
      "Số trong bảng thuộc nhóm điểm cao nhất khi chấm theo mệnh Thổ, tức dãy có nhiều chữ số 9, 2, 5, 8 và ít số 3, 4.",
  },
};

/** Các năm sinh tiêu biểu thuộc mệnh này — link chéo sang cụm /sim-hop-tuoi. */
export const SAMPLE_YEARS_PER_HANH = 8;
