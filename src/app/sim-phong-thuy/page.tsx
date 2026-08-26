import type { Metadata } from "next";
import { Suspense } from "react";
import { Sparkles } from "lucide-react";
import SimPhongThuyTool from "./SimPhongThuyTool";
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

// Panel: charcoal ấm trung tính + viền hairline (khớp couture của SimPhongThuyTool).
const cardBaseClass = "relative rounded-2xl p-6 md:p-9";
const cardStyle: React.CSSProperties = {
  background: '#161214',
  border: '1px solid rgba(255,255,255,0.08)',
};

export default function SimPhongThuyPage() {
  return (
    <>
      <main className="flex-1 flex flex-col bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
        <div className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-10 md:mb-12">
              <h1 className="mb-3 flex items-center justify-center gap-2.5 font-bold leading-tight text-[clamp(28px,5vw,44px)]" style={{ color: '#F5F5F5', letterSpacing: '-0.02em' }}>
                <Sparkles className="w-7 h-7 shrink-0" style={{ color: '#D9B778' }} />
                <span>Xem SIM Hợp Mệnh <span style={{ color: '#D9B778' }}>Theo Phong Thủy</span></span>
              </h1>
              <p style={{ color: 'rgba(237, 237, 237, 0.7)' }} className="mx-auto max-w-xl text-sm md:text-base leading-relaxed">
                Tra cứu ý nghĩa số đuôi theo 80 quẻ Kinh Dịch — luận cát hung, chọn số hợp mệnh, hợp tuổi.
              </p>
            </div>

            {/* Client island: công cụ luận số + list (state/effect/fetch). Reads
                ?sim=&len= via useSearchParams, so it is wrapped in Suspense — the
                dynamic island is client-rendered; the H1/FAQ/JSON-LD above & below
                stay in the static shell. */}
            <Suspense fallback={null}>
              <SimPhongThuyTool />
            </Suspense>

            {/* FAQ Section */}
            <div className={cardBaseClass} style={cardStyle}>
              <h2 className="text-[22px] md:text-2xl font-semibold mb-6 flex items-center gap-3" style={{ color: '#F5F5F5', letterSpacing: '-0.01em' }}>
                <span aria-hidden className="inline-block h-6 w-1 rounded-full" style={{ background: '#D9B778' }} />
                Câu hỏi thường gặp
              </h2>
              <Accordion type="single" collapsible className="w-full">
                {faqData.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`} style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
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
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)'
              }}
            >
              <p className="text-sm" style={{ color: 'rgba(237, 237, 237, 0.8)' }}>
                <strong style={{ color: '#D9B778' }}>Lưu ý:</strong> Kết quả tra cứu số đuôi SIM dựa trên 80 quẻ Kinh Dịch, chỉ mang tính chất tham khảo.
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
