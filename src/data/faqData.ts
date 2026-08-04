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
      'Bạn chỉ cần chọn số ưng ý, nhấn "MUA NGAY", điền thông tin nhận hàng và chờ nhân viên liên hệ xác nhận đơn hàng. Thanh toán COD khi nhận hàng hoặc chuyển khoản trước.',
  },
  {
    question: 'Làm sao để đăng ký chính chủ SIM?',
    answer:
      'Sau khi nhận SIM, bạn có thể đăng ký chính chủ tại cửa hàng Mobifone hoặc qua ứng dụng My Mobifone. Chúng tôi hỗ trợ tư vấn miễn phí thủ tục đăng ký.',
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
      'Liên hệ hotline 0938.868.868 hoặc Zalo để được hỗ trợ nhanh nhất. Email: hotro@chonsomobifone.com.',
  },
  {
    question: 'Địa chỉ cửa hàng ở đâu?',
    answer: '43A Đường số 9, Phường Tân Hưng, TP. Hồ Chí Minh.',
  },
  {
    question: 'Thời gian giao hàng là bao lâu?',
    answer:
      'Nội thành TP. Hồ Chí Minh: 30 phút – 2 giờ làm việc.\nNội thành Hà Nội và các thành phố lớn: 1 ngày làm việc.\nCác tỉnh thành khác: 1 – 3 ngày làm việc.\nĐơn xác nhận sau 20:00 sẽ được xử lý vào sáng ngày làm việc kế tiếp.',
  },
];
