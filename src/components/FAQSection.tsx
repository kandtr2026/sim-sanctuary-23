import FaqAccordion from '@/components/FaqAccordion';
import { faqData } from '@/data/faqData';

/**
 * FAQ trang chủ. Render bằng `FaqAccordion` (`<details>`) chứ không phải Radix
 * Accordion: `AccordionContent` chỉ đưa câu trả lời vào DOM khi mục được mở, nên
 * `FAQPage` JSON-LD ở `src/app/page.tsx` khai đủ hỏi–đáp trong khi HTML thô chỉ
 * có câu hỏi. Chính `src/data/faqData.ts` đã cảnh báo đúng điều này — chính sách
 * FAQPage của Google đòi mỗi cặp hỏi–đáp trong markup phải hiển thị được trên
 * trang.
 *
 * Bỏ luôn "use client": không còn state/JS nào ở đây, nên khối này rời khỏi bundle
 * client của trang chủ.
 */
const FAQSection = () => (
  <FaqAccordion
    title="Câu Hỏi Thường Gặp"
    items={faqData.map((faq) => ({ q: faq.question, a: faq.answer }))}
  />
);

export default FAQSection;
