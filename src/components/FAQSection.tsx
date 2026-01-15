import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqData = [
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
      'Miễn phí giao hàng toàn quốc cho đơn hàng từ 2 triệu đồng. Đơn hàng dưới 2 triệu: nội thành 20.000đ, ngoại thành 30.000đ.',
  },
  {
    question: 'Có được đổi SIM nếu không ưng ý?',
    answer:
      'Có, bạn được đổi SIM trong vòng 3 ngày kể từ khi nhận hàng nếu SIM chưa kích hoạt và còn nguyên seal. Phí đổi 50.000đ.',
  },
  {
    question: 'Làm sao để khiếu nại / góp ý?',
    answer:
      'Liên hệ hotline 0909.888.888 hoặc Zalo để được hỗ trợ nhanh nhất. Email: hotro@chonsomobifone.com',
  },
  {
    question: 'Địa chỉ cửa hàng ở đâu?',
    answer:
      'Hà Nội: 123 Cầu Giấy, Quận Cầu Giấy\nTP.HCM: 456 Nguyễn Văn Linh, Quận 7\nĐà Nẵng: 789 Nguyễn Văn Thoại, Quận Ngũ Hành Sơn',
  },
  {
    question: 'Thời gian giao hàng là bao lâu?',
    answer:
      'Nội thành HN/HCM: 2-4 tiếng. Các tỉnh thành khác: 1-2 ngày làm việc. Giao hàng từ 8h-21h hàng ngày.',
  },
];

const FAQSection = () => {
  return (
    <section className="bg-card rounded-xl shadow-card border border-border p-6 md:p-8">
      <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-3">
        <span className="w-1 h-8 bg-primary rounded-full"></span>
        Câu Hỏi Thường Gặp
      </h2>
      
      <Accordion type="single" collapsible className="space-y-2">
        {faqData.map((faq, index) => (
          <AccordionItem
            key={index}
            value={`item-${index}`}
            className="border border-border rounded-lg px-4 data-[state=open]:bg-background-secondary"
          >
            <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary hover:no-underline py-4">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground pb-4 whitespace-pre-line">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
};

export default FAQSection;
