import type { Metadata } from "next";
import { Suspense } from "react";
import { Sparkles } from "lucide-react";
import SimHopTuoiTool from "./SimHopTuoiTool";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buildBreadcrumb } from "@/lib/seo";

const TITLE = "Xem SIM Hợp Tuổi – Tìm SIM Phong Thủy Theo Ngày Sinh";
const DESCRIPTION =
  "Nhập ngày sinh, giờ sinh, giới tính để tìm SIM hợp tuổi, hợp mệnh. Công cụ chấm điểm theo ngũ hành, âm dương, tổng nút, quẻ dịch trên kho SIM Mobifone thật.";
const CANONICAL = "https://www.chonsomobifone.com/sim-phong-thuy";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    title: TITLE,
    description: "Tìm SIM hợp tuổi theo ngày sinh, giờ sinh, giới tính. Chấm điểm SIM theo ngũ hành, âm dương, quẻ dịch.",
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

const faqData: FaqItem[] = [
  {
    question: "Công cụ tìm SIM hợp tuổi hoạt động như thế nào?",
    answer:
      "Bạn nhập ngày sinh (dương lịch), giờ sinh (âm lịch) và giới tính. Hệ thống tự tính mệnh theo nạp âm Can–Chi, cung phi Bát Trạch và trạng thái Âm–Dương, sau đó chấm điểm từng SIM trong kho theo 5 trụ cột: ngũ hành, âm dương, tổng nút, quẻ dịch và cấu trúc số.",
  },
  {
    question: "Mệnh được tính như thế nào?",
    answer:
      "Mệnh (Kim, Mộc, Thủy, Hỏa, Thổ) được xác định từ Thiên Can – Địa Chi của năm sinh theo nạp âm 60 hoa giáp. Ví dụ người sinh năm 1990 (Canh Ngọ) thuộc mệnh Thổ (Lộ Bàng Thổ).",
  },
  {
    question: "Tổng nút là gì và vì sao nên chọn sim nhiều nút?",
    answer:
      "Tổng nút = tổng các chữ số của SIM chia 10 lấy số dư, từ 0 đến 9. SIM có 7–9 nút được xem là tốt, mang lại cảm giác vẹn toàn, thuận lợi khi giao dịch, kinh doanh.",
  },
  {
    question: "Quẻ dịch (80 quẻ Kinh Dịch) dùng để làm gì?",
    answer:
      "Lấy 4 số cuối của SIM chia cho 80, số dư (1–80) tương ứng với một quẻ trong bảng 80 quẻ Kinh Dịch. Quẻ Cát / Đại cát thể hiện ý nghĩa số đuôi tốt đẹp; quẻ Hung cần cân nhắc.",
  },
  {
    question: "Kết quả tra cứu có chính xác 100% không?",
    answer:
      "Đây là công cụ tham khảo dựa trên phong thủy dân gian (ngũ hành, bát trạch, Kinh Dịch), không phải khoa học chính xác. Bạn nên kết hợp nhiều yếu tố và liên hệ tư vấn viên để chọn được số ưng ý nhất.",
  },
  {
    question: "Làm sao để đặt mua SIM sau khi xem kết quả?",
    answer:
      "Bấm nút ĐẶT NGAY trên SIM bạn chọn, điền thông tin nhận hàng. Hỗ trợ giao SIM toàn quốc, sang tên chính chủ, nhận SIM rồi mới trả tiền (COD).",
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

const cardBaseClass = "relative rounded-2xl p-6 md:p-9";
const cardStyle: React.CSSProperties = {
  background: "#161214",
  border: "1px solid rgba(255,255,255,0.08)",
};

// 5 trụ cột "vàng" — nội dung SEO, viết lại theo phong cách CHONSOMOBIFONE
const PILLARS: { title: string; body: string }[] = [
  {
    title: "1. Ngũ hành bản mệnh & quan hệ sinh – khắc",
    body: "Mỗi người sinh ra thuộc một mệnh Kim, Mộc, Thủy, Hỏa, Thổ theo nạp âm năm sinh. Mỗi con số 0–9 cũng mang một hành riêng (0,1 Thủy · 2,5,8 Thổ · 3,4 Mộc · 6,7 Kim · 9 Hỏa). SIM hợp tuổi cần có nhiều con số tương sinh hoặc đồng hành với bản mệnh, tránh số tương khắc.",
  },
  {
    title: "2. Cân bằng Âm – Dương",
    body: "Số chẵn (0, 2, 4, 6, 8) thuộc Âm, số lẻ (1, 3, 5, 7, 9) thuộc Dương. Cung phi và giờ sinh quyết định bạn thiên Âm hay Dương — SIM lý tưởng cần có số Âm – Dương bù trừ để đạt cân bằng, tránh vượng khí lệch một chiều.",
  },
  {
    title: "3. Tổng nút cao (≥ 7 nút)",
    body: "Tổng nút = tổng các chữ số chia 10 lấy dư. SIM đạt 7–9 nút được đánh giá tốt, phù hợp người kinh doanh, làm ăn, giao dịch nhiều — dễ nhớ và tạo cảm giác thuận buồm xuôi gió.",
  },
  {
    title: "4. Quẻ dịch tốt (80 quẻ Kinh Dịch)",
    body: "4 số cuối chia cho 80, số dư tương ứng một quẻ cát – hung. Công cụ ưu tiên SIM có quẻ Cát / Đại cát như 'Làm ăn phát đạt', 'Tên tuổi 4 phương', 'Vạn sự thuận toàn'… để số đuôi mang ý nghĩa tốt đẹp.",
  },
  {
    title: "5. Cấu trúc số nổi bật & cặp số đẹp",
    body: "Các cặp số tài lộc (68, 86 – Lộc Phát; 39, 79 – Thần Tài), đuôi Tam hoa, Tứ quý hay sảnh tiến giúp SIM vừa đẹp về hình thức vừa thuận về mặt phong thủy và dễ định giá lại sau này.",
  },
];

export default function SimPhongThuyPage() {
  return (
    <>
      <main className="flex-1 flex flex-col bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950">
        <div className="flex-1 container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-10 md:mb-12">
              <h1 className="mb-3 flex items-center justify-center gap-2.5 font-bold leading-tight text-[clamp(28px,5vw,44px)]" style={{ color: "#F5F5F5", letterSpacing: "-0.02em" }}>
                <Sparkles className="w-7 h-7 shrink-0" style={{ color: "#D9B778" }} />
                <span>
                  Tìm SIM Hợp Tuổi <span style={{ color: "#D9B778" }}>Theo Phong Thủy</span>
                </span>
              </h1>
              <p style={{ color: "rgba(237, 237, 237, 0.7)" }} className="mx-auto max-w-xl text-sm md:text-base leading-relaxed">
                Nhập ngày sinh, giờ sinh, giới tính — chấm điểm SIM hợp mệnh theo ngũ hành, âm dương,
                tổng nút và 80 quẻ Kinh Dịch. Gợi ý số từ kho SIM Mobifone thật.
              </p>
            </div>

            {/* Client island: công cụ tìm sim hợp tuổi (state/effect/fetch). */}
            <Suspense fallback={null}>
              <SimHopTuoiTool />
            </Suspense>

            {/* SEO content — 5 trụ cột "vàng" */}
            <div className={`${cardBaseClass} mt-10 md:mt-14`} style={cardStyle}>
              <h2
                className="text-[22px] md:text-2xl font-semibold mb-3 flex items-center gap-3"
                style={{ color: "#F5F5F5", letterSpacing: "-0.01em" }}
              >
                <span aria-hidden className="inline-block h-6 w-1 rounded-full" style={{ background: "#D9B778" }} />
                Cơ chế chấm điểm SIM: 5 trụ cột phong thủy
              </h2>
              <p className="mb-6 text-sm leading-relaxed" style={{ color: "rgba(237,237,237,0.7)" }}>
                Công cụ tìm SIM hợp tuổi của CHONSOMOBIFONE đánh giá mỗi số theo 5 tiêu chí, chấm điểm
                trực tiếp trên kho SIM thật để bạn dễ so sánh và chốt số nhanh.
              </p>
              <div className="space-y-4">
                {PILLARS.map((pillar) => (
                  <div
                    key={pillar.title}
                    className="rounded-xl p-4"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <h3 className="mb-1.5 text-base font-semibold" style={{ color: "#D9B778" }}>
                      {pillar.title}
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(237,237,237,0.75)" }}>
                      {pillar.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Vì sao chọn CHONSOMOBIFONE */}
            <div className={`${cardBaseClass} mt-10 md:mt-14`} style={cardStyle}>
              <h2
                className="text-[22px] md:text-2xl font-semibold mb-3 flex items-center gap-3"
                style={{ color: "#F5F5F5", letterSpacing: "-0.01em" }}
              >
                <span aria-hidden className="inline-block h-6 w-1 rounded-full" style={{ background: "#D9B778" }} />
                Vì sao chọn mua SIM phong thủy tại CHONSOMOBIFONE?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  "Kho SIM Mobifone thật, giá niêm yết công khai",
                  "Chấm điểm phong thủy minh bạch theo 5 trụ cột",
                  "Sang tên chính chủ, nhận SIM rồi mới trả tiền",
                  "Giao nội thành HCM 30 phút – 2h, toàn quốc 1–3 ngày",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-xl p-4"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}
                  >
                    <span aria-hidden className="mt-0.5 inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ background: "#D9B778" }} />
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(237,237,237,0.8)" }}>{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ Section */}
            <div className={`${cardBaseClass} mt-10 md:mt-14`} style={cardStyle}>
              <h2
                className="text-[22px] md:text-2xl font-semibold mb-6 flex items-center gap-3"
                style={{ color: "#F5F5F5", letterSpacing: "-0.01em" }}
              >
                <span aria-hidden className="inline-block h-6 w-1 rounded-full" style={{ background: "#D9B778" }} />
                Câu hỏi thường gặp
              </h2>
              <Accordion type="single" collapsible className="w-full">
                {faqData.map((faq, index) => (
                  <AccordionItem key={index} value={`faq-${index}`} style={{ borderColor: "rgba(255,255,255,0.08)" }}>
                    <AccordionTrigger className="text-left hover:no-underline" style={{ color: "#EDEDED" }}>
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent style={{ color: "rgba(237, 237, 237, 0.7)" }}>
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
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <p className="text-sm" style={{ color: "rgba(237, 237, 237, 0.8)" }}>
                <strong style={{ color: "#D9B778" }}>Lưu ý:</strong> Kết quả chấm điểm phong thủy chỉ mang tính
                chất tham khảo, dựa trên ngũ hành, bát trạch và Kinh Dịch dân gian. Việc chọn SIM nên kết hợp
                nhiều yếu tố để được số ưng ý nhất.
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
