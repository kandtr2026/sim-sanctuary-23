/**
 * Single source of truth for the homepage FAQ.
 *
 * FAQSection renders this array and Index.tsx derives its FAQPage JSON-LD from
 * it. Google's FAQPage policy requires every Q&A in the markup to be visible on
 * the page, so the two must never be maintained as separate copies — markup
 * containing answers that aren't in the DOM is grounds for a structured-data
 * manual action.
 *
 * Answers must also agree with /chinh-sach-giao-hang (src/pages/PolicyPage.tsx),
 * which is the document that actually governs a sale.
 */
export const faqData = [
  {
    question: 'Cách mua SIM số đẹp tại CHONSOMOBIFONE.COM?',
    answer:
      'Quý khách chọn số ưng ý, nhấn "MUA NGAY", điền thông tin nhận hàng rồi chờ nhân viên liên hệ xác nhận đơn. Thanh toán khi nhận SIM (COD) hoặc chuyển khoản trước.',
  },
  {
    question: 'Làm sao để đăng ký chính chủ SIM?',
    answer:
      'Sau khi nhận SIM, Quý khách đăng ký chính chủ tại cửa hàng Mobifone hoặc qua ứng dụng My Mobifone. Đội ngũ tư vấn hỗ trợ thủ tục miễn phí. Quý khách cần chuẩn bị CCCD thẻ cứng (bản gốc) của người đứng tên SIM.',
  },
  {
    question: 'Phí giao hàng là bao nhiêu?',
    answer:
      'Miễn phí giao hàng toàn quốc. Quý khách không phải trả thêm phí vận chuyển ngoài giá SIM đã xác nhận.',
  },
  {
    question: 'Có được đổi trả SIM không?',
    answer:
      'Giao sai số so với đơn đã xác nhận: đổi lại đúng số hoặc hoàn tiền 100%. SIM không kích hoạt được do lỗi kỹ thuật từ đầu: đổi SIM mới cùng số miễn phí. SIM đã kích hoạt và sử dụng bình thường thì không áp dụng đổi trả vì thay đổi ý định.',
  },
  {
    question: 'Làm sao để khiếu nại / góp ý?',
    answer:
      'Quý khách vui lòng gọi hotline 0938.868.868 (8:00 – 21:00 hàng ngày), nhắn Zalo 0933.356.666 hoặc gửi email hotro@chonsomobifone.com.',
  },
  {
    question: 'Địa chỉ cửa hàng ở đâu?',
    answer: 'Cửa hàng tại 43A Đường số 9, Phường Tân Hưng, TP. Hồ Chí Minh, mở cửa 8:00 – 21:00 hàng ngày.',
  },
  {
    question: 'Thời gian giao hàng là bao lâu?',
    answer:
      '30 phút giao toàn quốc. Quý khách nhận SIM, kiểm tra rồi mới thanh toán (COD).',
  },
];
