import type { NormalizedSIM } from "@/lib/simUtils";

/**
 * Ý nghĩa từng DẠNG SỐ dùng cho trang riêng `/sim/[digits]`. Câu chữ bám đúng
 * cách các trang danh mục đang mô tả (thần tài 39/79, lộc phát 68/86…), KHÔNG
 * thêm lời "bói" hay hứa hẹn — chỉ nêu quy ước đọc số và lý do dân trong nghề
 * chuộng. `path` trỏ về trang danh mục tương ứng để nối link nội bộ.
 */
export interface TagMeta {
  label: string;
  blurb: string;
  path?: string;
}

export const TAG_META: Record<string, TagMeta> = {
  "Lục quý": {
    label: "Lục quý",
    blurb: "sáu số giống nhau liền nhau — hàng cực hiếm, thuộc phân khúc sưu tầm.",
    path: "/sim-ngu-quy",
  },
  "Ngũ quý": {
    label: "Ngũ quý",
    blurb: "năm số giống nhau liền nhau, gây ấn tượng mạnh, nằm trong nhóm VIP.",
    path: "/sim-ngu-quy",
  },
  "Tứ quý": {
    label: "Tứ quý",
    blurb: "bốn số cuối giống nhau, đọc một nhịp là nhớ, được săn làm số phong thủy.",
    path: "/mua-sim-tu-quy",
  },
  "Tam hoa kép": {
    label: "Tam hoa kép",
    blurb: "hai bộ ba số giống nhau, dãy bề thế mà vẫn dễ đọc.",
    path: "/sim-tam-hoa-kep",
  },
  "Tam hoa": {
    label: "Tam hoa",
    blurb: "ba số cuối giống nhau, gọn gàng, dễ nhớ khi trao cho khách.",
    path: "/sim-tam-hoa",
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
  "Ông địa": {
    label: "Ông địa",
    blurb: "đuôi 38/78, vía Ông Địa, được người kinh doanh ưa chuộng.",
    path: "/sim-ong-dia",
  },
  "Tiến lên": {
    label: "Tiến lên",
    blurb: "bốn số cuối tăng dần liên tiếp, ngụ ý thăng tiến, đi lên.",
    path: "/sim-tien-len",
  },
  "Gánh đảo": {
    label: "Gánh đảo",
    blurb: "bốn số cuối đối xứng dạng ABBA, đọc xuôi hay ngược đều như nhau.",
    path: "/sim-ganh-dao",
  },
  "Lặp kép": {
    label: "Lặp kép",
    blurb: "các cặp số lặp lại tạo nhịp điệu, nghe một lần là ghi đúng.",
    path: "/sim-lap-kep",
  },
  "Dễ nhớ": {
    label: "Dễ nhớ",
    blurb: "cấu trúc lặp đơn giản, thuận cho hotline bán hàng.",
    path: "/sim-de-nho",
  },
  Taxi: {
    label: "Taxi",
    blurb: "sáu số cuối lặp thành khối, in lên thân xe vẫn đọc được khi xe chạy.",
    path: "/sim-taxi",
  },
  "Năm sinh": {
    label: "Năm sinh",
    blurb: "chứa ngày/tháng/năm sinh, mang dấu ấn cá nhân của chủ số.",
    path: "/sim-nam-sinh",
  },
};

/** Thứ tự ưu tiên khi chọn "dạng chính" của một số (đẹp/hiếm hơn xếp trước). */
const TAG_PRIORITY = [
  "Lục quý",
  "Ngũ quý",
  "Tứ quý",
  "Tam hoa kép",
  "Tam hoa",
  "Thần tài",
  "Lộc phát",
  "Ông địa",
  "Tiến lên",
  "Gánh đảo",
  "Lặp kép",
  "Taxi",
  "Dễ nhớ",
  "Năm sinh",
] as const;

/** Các dạng của số này, đã sắp theo độ hiếm/đẹp, kèm meta để dựng nội dung + link. */
export const describeSimTags = (sim: NormalizedSIM): TagMeta[] => {
  const tags = new Set(sim.tags);
  return TAG_PRIORITY.filter((t) => tags.has(t)).map((t) => TAG_META[t]);
};

/** Dạng "chính" (đẹp nhất) của số — dùng cho breadcrumb + số cùng nhóm. */
export const primaryTagMeta = (sim: NormalizedSIM): TagMeta | null =>
  describeSimTags(sim)[0] ?? null;
