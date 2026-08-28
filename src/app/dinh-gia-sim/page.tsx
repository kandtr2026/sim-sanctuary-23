import type { Metadata } from "next";
import { Calculator } from "lucide-react";
import DinhGiaSimTool from "./DinhGiaSimTool";
import { buildBreadcrumb } from "@/lib/seo";

const TITLE = "Định Giá SIM Miễn Phí – Tra Giá SIM Số Đẹp Chính Xác";
const DESCRIPTION =
  "Công cụ định giá SIM số đẹp miễn phí: Quý khách nhập số điện thoại để nhận mức giá tham khảo theo thị trường cho SIM tứ quý, tam hoa, lộc phát.";
const CANONICAL = "https://www.chonsomobifone.com/dinh-gia-sim";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    title: TITLE,
    description: "Tra mức giá tham khảo cho SIM số đẹp, miễn phí và theo giá thị trường.",
    url: CANONICAL,
    images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
  },
};

export interface DinhGiaFaqItem {
  question: string;
  answer: string;
}

// Single source of truth for the FAQ: rendered by <DinhGiaSimTool> below AND
// serialised into the FAQPage JSON-LD, so the markup can never drift from the
// visible content (Google FAQPage policy).
const faqData: DinhGiaFaqItem[] = [
  {
    question: 'Định giá này có chính xác tuyệt đối không?',
    answer:
      'Công cụ phân tích những yếu tố phổ biến của một dãy số — đầu số, dạng số, tính phong thủy — rồi đưa ra mức giá tham khảo. Giá thực tế còn dao động theo nhu cầu thị trường và theo từng người mua. Cần con số sát hơn, Quý khách vui lòng liên hệ đội ngũ tư vấn.',
  },
  {
    question: 'Những yếu tố nào ảnh hưởng lớn nhất đến giá SIM?',
    answer:
      'Đuôi số quyết định phần lớn giá trị, khoảng 70%. Kế đó là dạng số (tứ quý, tam hoa, sảnh tiến...), đầu số và nhà mạng, độ dễ nhớ của cả dãy, cùng ý nghĩa phong thủy.',
  },
  {
    question: 'Vì sao cùng một số SIM nhưng giá thị trường có thể khác nhau?',
    answer:
      'Giá SIM phụ thuộc nhiều yếu tố chủ quan: người bán, thời điểm, tình trạng cung cầu, kênh bán hàng và nhất là nhu cầu của người mua. Một dãy số mang ý nghĩa riêng với ai đó có thể được trả cao hơn hẳn mức trung bình.',
  },
  {
    question: 'SIM 10 số và 11 số khác nhau thế nào về giá trị?',
    answer:
      'SIM 10 số hiện là tiêu chuẩn phổ biến và được ưa chuộng hơn vì dễ nhớ. SIM 11 số (đầu 01x cũ) đã chuyển về 10 số nên không còn phổ biến. Giá trị thực tế nằm ở độ đẹp của dãy số, không nằm ở số lượng chữ số.',
  },
  {
    question: 'Tôi có thể mua hoặc bán SIM theo giá định giá này không?',
    answer:
      'Đây là mức tham khảo, không phải giá cam kết mua lại. Quý khách muốn mua, vui lòng xem giá niêm yết trong kho SIM của chúng tôi. Quý khách muốn bán, đội ngũ tư vấn sẽ hỗ trợ định giá kỹ hơn và tìm người mua phù hợp.',
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqData.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
};

export default function DinhGiaSimPage() {
  return (
    <>
      <main className="container mx-auto px-4 pt-3 pb-6">
        {/* Banner */}
        <section className="mb-6">
          <div className="relative bg-gradient-to-br from-primary via-primary-dark to-primary rounded-xl overflow-hidden shadow-card">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `radial-gradient(circle at 20% 80%, hsl(var(--gold) / 0.3) 0%, transparent 50%),
                               radial-gradient(circle at 80% 20%, hsl(var(--gold) / 0.2) 0%, transparent 50%)`,
              }}
            ></div>

            <div className="relative px-4 md:px-6 py-8 md:py-12 text-center">
              <div className="flex justify-center mb-3">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gold/20 flex items-center justify-center">
                  <Calculator className="w-7 h-7 md:w-8 md:h-8 text-gold" />
                </div>
              </div>

              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-foreground mb-3">
                Định giá SIM số đẹp
              </h1>
              <p className="text-primary-foreground/80 text-base md:text-lg max-w-xl mx-auto">
                Nhập số để nhận mức giá tham khảo — nhanh, khách quan, không mất phí
              </p>
            </div>
          </div>
        </section>

        <DinhGiaSimTool faqData={faqData} />
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumb([
              { name: "Trang chủ", path: "/" },
              { name: "Định giá SIM", path: "/dinh-gia-sim" },
            ]),
          ),
        }}
      />
    </>
  );
}
