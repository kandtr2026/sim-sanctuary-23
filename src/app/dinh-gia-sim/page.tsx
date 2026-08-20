import type { Metadata } from "next";
import { Calculator } from "lucide-react";
import DinhGiaSimTool from "./DinhGiaSimTool";
import { buildBreadcrumb } from "@/lib/seo";

const TITLE = "Định Giá SIM Miễn Phí – Tra Giá SIM Số Đẹp Chính Xác";
const DESCRIPTION =
  "Công cụ định giá SIM số đẹp miễn phí: nhập số điện thoại để tra giá thị trường, gợi ý mức bán hợp lý cho SIM tứ quý, tam hoa, lộc phát.";
const CANONICAL = "https://www.chonsomobifone.com/dinh-gia-sim";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    title: TITLE,
    description: "Tra giá SIM số đẹp miễn phí, chính xác theo thị trường.",
    url: CANONICAL,
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
      'Công cụ định giá sử dụng thuật toán phân tích các yếu tố phổ biến như đầu số, dạng số, tính phong thủy... để đưa ra mức giá tham khảo. Giá thực tế có thể dao động tùy thuộc nhu cầu thị trường và người mua cụ thể. Để được định giá chính xác hơn, vui lòng liên hệ tư vấn viên.',
  },
  {
    question: 'Những yếu tố nào ảnh hưởng lớn nhất đến giá SIM?',
    answer:
      'Các yếu tố quan trọng bao gồm: Đuôi số (chiếm ~70% giá trị), dạng số (tứ quý, tam hoa, sảnh tiến...), đầu số/nhà mạng, tính dễ nhớ, và ý nghĩa phong thủy.',
  },
  {
    question: 'Vì sao cùng một số SIM nhưng giá thị trường có thể khác nhau?',
    answer:
      'Giá SIM phụ thuộc vào nhiều yếu tố chủ quan như: người bán, thời điểm, tình trạng cung cầu, kênh bán hàng, và đặc biệt là nhu cầu của người mua. Một số SIM có thể được định giá cao hơn nếu có ý nghĩa đặc biệt với người mua.',
  },
  {
    question: 'SIM 10 số và 11 số khác nhau thế nào về giá trị?',
    answer:
      'Hiện nay SIM 10 số là tiêu chuẩn phổ biến và thường được ưa chuộng hơn do dễ nhớ. SIM 11 số (đầu 01x cũ) đã chuyển về 10 số nên không còn phổ biến. Tuy nhiên, giá trị thực tế phụ thuộc vào dãy số đẹp chứ không chỉ số lượng chữ số.',
  },
  {
    question: 'Tôi có thể mua hoặc bán SIM theo giá định giá này không?',
    answer:
      'Đây chỉ là giá tham khảo. Nếu bạn muốn mua SIM, hãy tham khảo kho SIM của chúng tôi. Nếu bạn muốn bán SIM, vui lòng liên hệ tư vấn viên để được hỗ trợ định giá chính xác và tìm người mua phù hợp.',
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
                Nhận mức giá tham khảo nhanh chóng – chính xác – khách quan
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
