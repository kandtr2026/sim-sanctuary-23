/**
 * Chữ trang /sim-phong-thuy-hop-menh ("Sim Phong Thủy MobiFone") — chép NGUYÊN VĂN
 * từ TASK_PHONGTHUY_COPY_20261125.json (Terra viết, A Khoa duyệt 25/11/2026).
 * Không sửa chữ ở đây; muốn đổi chữ thì đổi ở nguồn rồi chép lại.
 *
 * Đường dẫn thô trong chữ (/sim-phong-thuy, /sim-theo-menh/kim…) KHÔNG in ra
 * trang: `PT_LINKS` bên dưới nói cụm chữ nào thành thẻ <a>, xem `linkedText.tsx`.
 */
import type { LinkRule } from "./linkedText";

export const PT_COPY = {
  title: "Sim Phong Thủy MobiFone Hợp Mệnh, Hợp Tuổi",
  description: "Chọn sim phong thủy MobiFone theo mệnh và năm sinh. Lọc theo mức giá, xem giá công khai cạnh từng số, đăng ký chính chủ và nhận SIM kiểm tra rồi thanh toán.",
  h1: "Sim phong thủy MobiFone hợp mệnh",
  intro: "Chọn sim phong thủy MobiFone theo mệnh, năm sinh và mức giá Quý khách mong muốn. Giá được niêm yết cạnh từng số; Quý khách nhận SIM kiểm tra rồi mới thanh toán.",
  sections: [
    {
      h2: "Sim phong thủy là gì, chọn theo đâu?",
      body: "Theo quan niệm ngũ hành, sim phong thủy được chọn dựa trên sự tương hợp giữa các chữ số và mệnh của người dùng. Quý khách xác định mệnh theo năm sinh âm lịch, rồi xem các số phù hợp; bốn số cuối và số cuối cùng được xem là quan trọng. Quý khách có thể dùng công cụ bói sim miễn phí tại /sim-phong-thuy bằng cách nhập bốn số cuối và ngày sinh để xem theo 80 quẻ.",
    },
    {
      h2: "Chọn sim phong thủy theo mệnh",
      body: "Theo ngũ hành, mệnh Kim hợp 6, 7, 2, 5, 8, hạn chế 9; Mộc hợp 3, 4, 0, 1, hạn chế 6, 7; Thủy hợp 0, 1, 6, 7, hạn chế 2, 5, 8. Hỏa hợp 9, 3, 4, hạn chế 0, 1; Thổ hợp 2, 5, 8, 9, hạn chế 3, 4; số thuộc hành sinh ra mệnh được ưu tiên trước số cùng hành. Quý khách xem trang riêng cho mệnh Kim (/sim-theo-menh/kim), Mộc (/sim-theo-menh/moc), Thủy (/sim-theo-menh/thuy), Hỏa (/sim-theo-menh/hoa) hoặc Thổ (/sim-theo-menh/tho).",
    },
    {
      h2: "Mua sim phong thủy MobiFone thế nào?",
      body: "Quý khách lọc kho SIM MobiFone theo mệnh và mức giá, rồi xem giá niêm yết cạnh từng số. SIM được đăng ký thông tin chính chủ; Quý khách nhận SIM kiểm tra rồi mới thanh toán. Để được hỗ trợ chọn mua, Quý khách liên hệ Zalo 0933.686.666.",
    },
  ],
  faqs: [
    {
      q: "Sim phong thủy là gì?",
      a: "Theo quan niệm ngũ hành, sim phong thủy là SIM được chọn dựa trên sự tương hợp giữa các chữ số và mệnh của người dùng.",
    },
    {
      q: "Chọn sim phong thủy theo năm sinh hay theo mệnh?",
      a: "Theo quan niệm ngũ hành, Quý khách xác định mệnh từ năm sinh âm lịch rồi chọn các chữ số hợp mệnh. Quý khách cũng có thể xem trang sim hợp tuổi theo năm sinh tại /sim-hop-tuoi/<năm>.",
    },
    {
      q: "Sim phong thủy giá bao nhiêu?",
      a: "Giá được niêm yết công khai cạnh từng số. Quý khách có thể lọc theo mức giá để chọn SIM phù hợp.",
    },
    {
      q: "Mua sim phong thủy có cần đúng 4 số cuối không?",
      a: "Theo quan niệm ngũ hành, bốn số cuối và số cuối cùng được xem là quan trọng khi chọn SIM. Quý khách có thể nhập bốn số cuối cùng ngày sinh vào công cụ miễn phí tại /sim-phong-thuy để tham khảo.",
    },
    {
      q: "Mua sim phong thủy MobiFone có đăng ký chính chủ không?",
      a: "Có. SIM được đăng ký thông tin chính chủ; Quý khách nhận SIM kiểm tra rồi mới thanh toán.",
    },
  ],
} as const;

/**
 * Luật biến đường dẫn thô thành link. Nhãn là chữ có sẵn ngay cạnh đường dẫn;
 * chỉ bỏ phần "tại /x" hoặc "(/x)".
 *  - /sim-hop-tuoi/<năm> → nhãn "trang sim hợp tuổi theo năm sinh", trỏ hub
 *    /sim-hop-tuoi (route có thật: src/app/sim-hop-tuoi/page.tsx).
 *  - /sim-tra-gop nằm trong câu FAQ CŨ (giữ lại), cùng cách xử lý.
 */
export const PT_LINKS: readonly LinkRule[] = [
  {
    find: "công cụ bói sim miễn phí tại /sim-phong-thuy",
    label: "công cụ bói sim miễn phí",
    href: "/sim-phong-thuy",
  },
  { find: "công cụ miễn phí tại /sim-phong-thuy", label: "công cụ miễn phí", href: "/sim-phong-thuy" },
  { find: "Kim (/sim-theo-menh/kim)", label: "Kim", href: "/sim-theo-menh/kim" },
  { find: "Mộc (/sim-theo-menh/moc)", label: "Mộc", href: "/sim-theo-menh/moc" },
  { find: "Thủy (/sim-theo-menh/thuy)", label: "Thủy", href: "/sim-theo-menh/thuy" },
  { find: "Hỏa (/sim-theo-menh/hoa)", label: "Hỏa", href: "/sim-theo-menh/hoa" },
  { find: "Thổ (/sim-theo-menh/tho)", label: "Thổ", href: "/sim-theo-menh/tho" },
  {
    find: "trang sim hợp tuổi theo năm sinh tại /sim-hop-tuoi/<năm>",
    label: "trang sim hợp tuổi theo năm sinh",
    href: "/sim-hop-tuoi",
  },
  { find: "hình thức mua sim trả góp tại /sim-tra-gop", label: "hình thức mua sim trả góp", href: "/sim-tra-gop" },
];
