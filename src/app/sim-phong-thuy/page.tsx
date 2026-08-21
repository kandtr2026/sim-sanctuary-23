import type { Metadata } from "next";
import { Suspense } from "react";
import { Sparkles } from "lucide-react";
import SimPhongThuyTool from "./SimPhongThuyTool";
import ZaloChatCard from "@/components/ZaloChatCard";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buildBreadcrumb } from "@/lib/seo";

const TITLE = "Sim Phong Thủy – Bói SIM Hậu Thiên, Xem SIM Hợp Mệnh";
const DESCRIPTION =
  "Bói SIM phong thủy theo hậu thiên bát quái: nhập 4–6 số đuôi để xem cát hung, quẻ chủ, hợp mệnh, hợp tuổi. Gợi ý SIM đẹp phong thủy.";
const CANONICAL = "https://www.chonsomobifone.com/sim-phong-thuy";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    title: TITLE,
    description: "Bói SIM phong thủy, xem quẻ chủ, hợp mệnh hợp tuổi.",
    url: CANONICAL,
    images: [
      {
        url: "https://www.chonsomobifone.com/og-sim-phong-thuy.png?v=1",
        width: 1200,
        height: 630,
      },
    ],
  },
};

interface FaqItem {
  question: string;
  answer: string;
}

// Single source of truth for the FAQ: rendered by the accordion below AND
// serialised into the FAQPage JSON-LD.
const faqData: FaqItem[] = [
  {
    question: "Bói số đuôi SIM hoạt động như thế nào?",
    answer: "Công thức dựa trên phép chia 80 quẻ Kinh Dịch: lấy 4 hoặc 6 số cuối của SIM, chia cho 80, số dư (1-80) tương ứng với 1 quẻ. Mỗi quẻ có luận giải và đánh giá riêng."
  },
  {
    question: "Nên chọn 4 số cuối hay 6 số cuối?",
    answer: "4 số cuối phổ biến và dễ nhớ hơn, phù hợp tra cứu nhanh. 6 số cuối cho kết quả chi tiết hơn, thường dùng khi cần phân tích sâu."
  },
  {
    question: "Kết quả bói có chính xác 100% không?",
    answer: "Đây là công cụ tham khảo dựa trên Kinh Dịch và phong thủy dân gian, không phải khoa học chính xác. Kết quả chỉ mang tính giải trí và tham khảo."
  },
  {
    question: "Tại sao cùng một số có thể ra quẻ khác nhau?",
    answer: "Nếu bạn chọn 4 số cuối hoặc 6 số cuối, phép tính sẽ khác nhau nên quẻ cũng khác. Hãy chọn đúng độ dài bạn muốn tra cứu."
  },
  {
    question: "Làm sao để chọn SIM hợp phong thủy?",
    answer: "Ngoài bói số đuôi, bạn nên xem xét thêm ngũ hành bản mệnh, tổng số nút, cân bằng âm dương. Liên hệ tư vấn viên để được hỗ trợ chi tiết."
  }
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

// Card style classes - Ruby red gradient with radial highlight and golden glow border
const cardBaseClass = "relative rounded-2xl p-6 md:p-8";
const cardStyle: React.CSSProperties = {
  background: 'radial-gradient(ellipse at 50% 30%, rgba(180, 40, 50, 0.5) 0%, transparent 60%), linear-gradient(135deg, #5a0a0e 0%, #8b1a1a 40%, #6d1515 70%, #4a0d0d 100%)',
  border: '1px solid rgba(245, 194, 107, 0.45)',
  boxShadow: '0 0 25px rgba(245, 194, 107, 0.25), inset 0 1px 0 rgba(245, 194, 107, 0.1)',
};

export default function SimPhongThuyPage() {
  return (
    <>
      <main className="flex-1 flex flex-col bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
        <div className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold mb-3 flex items-center justify-center gap-2" style={{ color: '#F7C55A', textShadow: '0 0 12px rgba(247, 197, 90, 0.6)' }}>
                <Sparkles className="w-7 h-7" style={{ color: '#F7C55A' }} />
                Bói 4 Số Đuôi / 6 Số Đuôi SIM
              </h1>
              <p style={{ color: 'rgba(237, 237, 237, 0.65)' }} className="text-sm md:text-base">
                Tra cứu ý nghĩa số đuôi SIM theo 80 quẻ Kinh Dịch
              </p>
            </div>

            {/* Client island: công cụ luận số + list (state/effect/fetch). Reads
                ?sim=&len= via useSearchParams, so it is wrapped in Suspense — the
                dynamic island is client-rendered; the H1/FAQ/JSON-LD above & below
                stay in the static shell. */}
            <Suspense fallback={null}>
              <SimPhongThuyTool />
            </Suspense>

            {/* Zalo Contact */}
            <div className="my-8 max-w-sm mx-auto">
              <ZaloChatCard />
            </div>

            {/* FAQ Section */}
            <div className={cardBaseClass} style={cardStyle}>
              <h2 className="text-lg font-semibold mb-5" style={{ color: '#F7C55A', textShadow: '0 0 8px rgba(247, 197, 90, 0.4)' }}>Câu hỏi thường gặp</h2>
              <Accordion type="single" collapsible className="w-full">
                {faqData.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`} style={{ borderColor: 'rgba(245, 194, 107, 0.2)' }}>
                    <AccordionTrigger className="text-left hover:no-underline" style={{ color: '#EDEDED' }}>
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent style={{ color: 'rgba(237, 237, 237, 0.7)' }}>
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>

            {/* Disclaimer */}
            <div
              className="rounded-xl p-5 text-center mt-8"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(6px)',
                border: '1px solid rgba(245, 194, 107, 0.25)'
              }}
            >
              <p className="text-sm" style={{ color: 'rgba(237, 237, 237, 0.8)' }}>
                <strong style={{ color: '#F7C55A' }}>Lưu ý:</strong> Kết quả bói số đuôi SIM dựa trên 80 quẻ Kinh Dịch, chỉ mang tính chất tham khảo và giải trí.
                Việc lựa chọn SIM nên kết hợp nhiều yếu tố phong thủy khác như ngũ hành, bát tự, tổng số nút...
              </p>
            </div>
          </div>
        </div>
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
              { name: "SIM phong thủy", path: "/sim-phong-thuy" },
            ]),
          ),
        }}
      />
    </>
  );
}
