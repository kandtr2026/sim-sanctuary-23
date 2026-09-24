import type { NormalizedSIM } from "@/lib/simUtils";
import { CATEGORY_PRIORITY } from "@/lib/simCategories";

/**
 * Ý nghĩa từng DẠNG SỐ, dùng chung cho trang riêng `/sim/[digits]` và trang
 * `/tra-cuu-sim`. Câu chữ bám đúng cách các trang danh mục đang mô tả (thần tài
 * 39/79, lộc phát 68/86…), KHÔNG thêm lời "bói" hay hứa hẹn — chỉ nêu quy ước
 * đọc số và lý do dân trong nghề chuộng. `path` trỏ về trang danh mục để nối
 * link nội bộ.
 */
export interface TagMeta {
  label: string;
  blurb: string;
  path?: string;
}

export const TAG_META: Record<string, TagMeta> = {
  "Lục quý": {
    label: "Lục quý",
    blurb: "sáu số cuối giống nhau — hàng cực hiếm, thuộc phân khúc sưu tầm.",
    path: "/sim-ngu-quy",
  },
  "Ngũ quý": {
    label: "Ngũ quý",
    blurb: "năm số cuối giống nhau, gây ấn tượng mạnh, nằm trong nhóm VIP.",
    path: "/sim-ngu-quy",
  },
  "Tứ quý": {
    label: "Tứ quý",
    blurb: "bốn số cuối giống nhau, đọc một nhịp là nhớ, được săn làm số phong thủy.",
    path: "/mua-sim-tu-quy",
  },
  "Lục quý giữa": {
    label: "Lục quý giữa",
    blurb: "sáu số giống nhau liền nhau nằm giữa dãy, nhìn qua là thấy cả khối.",
    path: "/sim-ngu-quy",
  },
  "Tam hoa kép": {
    label: "Tam hoa kép",
    blurb: "sáu số cuối là hai bộ ba giống nhau (000.111), dãy bề thế mà vẫn dễ đọc.",
    path: "/sim-tam-hoa-kep",
  },
  "Tam hoa": {
    label: "Tam hoa",
    blurb: "đúng ba số cuối giống nhau, gọn gàng, dễ nhớ khi trao cho khách.",
    path: "/sim-tam-hoa",
  },
  "Lặp kép": {
    label: "Lặp kép",
    blurb: "bốn số cuối là hai cặp lặp lại (2288 hoặc 2929), nghe một lần là ghi đúng.",
    path: "/sim-lap-kep",
  },
  "Ngũ quý giữa": {
    label: "Ngũ quý giữa",
    blurb: "năm số giống nhau liền nhau nằm giữa dãy, tách hẳn thành một khối.",
    path: "/sim-ngu-quy",
  },
  "Tứ quý giữa": {
    label: "Tứ quý giữa",
    blurb: "bốn số giống nhau liền nhau nằm giữa dãy, đọc lên có một nhịp chắc.",
  },
  Taxi: {
    label: "Taxi",
    blurb: "đuôi lặp nguyên khối (07.07.07, 417.417, 3560.3560), in lên thân xe vẫn đọc được khi xe chạy.",
    path: "/sim-taxi",
  },
  "Thần tài": {
    label: "Thần tài",
    blurb: "đuôi 39 (thần tài nhỏ) hoặc 79 (thần tài lớn), gắn với mong cầu tài lộc.",
    path: "/sim-than-tai",
  },
  "Lộc phát": {
    label: "Lộc phát",
    blurb: "đuôi 68/86, đọc chệch thành “lộc phát”, ý nghĩa thịnh vượng.",
    path: "/sim-loc-phat",
  },
  "Tiến lên": {
    label: "Tiến lên",
    blurb: "các số cuối tăng dần đều (789, 1357, 05.06.07), ngụ ý thăng tiến, đi lên.",
    path: "/sim-tien-len",
  },
  "Dễ nhớ": {
    label: "Dễ nhớ",
    blurb: "cấu trúc lặp đơn giản, thuận cho hotline bán hàng.",
    path: "/sim-de-nho",
  },
  "Gánh đảo": {
    label: "Gánh đảo",
    blurb: "đuôi đối xứng, đọc xuôi hay ngược đều như nhau (1221, 860.068).",
    path: "/sim-ganh-dao",
  },
  "Số độc": {
    label: "Số độc",
    blurb: "đuôi thuộc nhóm số hiếm dân chơi sim săn riêng (1102, 4953, 6688…).",
  },
  "Đầu số cổ": {
    label: "Đầu số cổ",
    blurb: "đầu số đời đầu của nhà mạng (0902–0909…), dùng lâu năm nên tạo cảm giác uy tín.",
  },
  "Năm sinh": {
    label: "Năm sinh",
    blurb: "chứa ngày/tháng/năm sinh, mang dấu ấn cá nhân của chủ số.",
    path: "/sim-nam-sinh",
  },
};

/**
 * Thứ tự "dạng chính" của một số = đúng thứ tự nhãn của detector
 * (CATEGORY_PRIORITY, bóc theo nhãn simthanglong). Chỉ giữ dạng có meta.
 */
const TAG_PRIORITY = CATEGORY_PRIORITY.filter((t) => t in TAG_META);

/** Map danh sách tag thô → meta, đã sắp theo độ hiếm/đẹp. Dùng chung cho trang
 *  số (từ sim.tags) lẫn trang tra cứu (từ detectSimTags trên digits bất kỳ). */
export const metasForTags = (tags: string[]): TagMeta[] => {
  const set = new Set(tags);
  return TAG_PRIORITY.filter((t) => set.has(t)).map((t) => TAG_META[t]);
};

/** Các dạng của số này, đã sắp theo độ hiếm/đẹp, kèm meta để dựng nội dung + link. */
export const describeSimTags = (sim: NormalizedSIM): TagMeta[] => metasForTags(sim.tags);

/** Dạng "chính" (đẹp nhất) của số — dùng cho breadcrumb + số cùng nhóm. */
export const primaryTagMeta = (sim: NormalizedSIM): TagMeta | null =>
  describeSimTags(sim)[0] ?? null;
