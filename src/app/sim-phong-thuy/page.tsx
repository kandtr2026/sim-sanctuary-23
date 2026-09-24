import type { Metadata } from "next";
import { Suspense } from "react";
import { Sparkles } from "lucide-react";
import SimHopTuoiTool from "./SimHopTuoiTool";
import FaqAccordion from "@/components/FaqAccordion";

const TITLE = "Xem SIM Hợp Tuổi – Tìm SIM Phong Thủy Theo Ngày Sinh | CHONSOMOBIFONE";
const DESCRIPTION =
  "Giúp Quý khách khoanh vùng SIM hợp tuổi, hợp mệnh từ ngày sinh và giờ sinh. Chấm điểm theo ngũ hành, âm dương, tổng nút, quẻ dịch trên kho Mobifone có sẵn.";
const CANONICAL = "https://www.chonsomobifone.com/sim-phong-thuy";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    title: TITLE,
    description: "Xem SIM hợp tuổi theo ngày sinh, giờ sinh và giới tính. Điểm chấm theo ngũ hành, âm dương, quẻ dịch.",
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

const faqData = [
  {
    question: "Công cụ tìm SIM hợp tuổi hoạt động như thế nào?",
    answer:
      "Quý khách nhập ngày sinh (dương lịch), giờ sinh và giới tính. Hệ thống tính mệnh theo nạp âm Can–Chi, cung phi Bát Trạch và trạng thái Âm–Dương, sau đó chấm điểm từng SIM trong kho theo ngũ hành, âm dương, tổng nút, quẻ Kinh Dịch và Bát Cực Linh Số.",
  },
  {
    question: "Mệnh được tính như thế nào?",
    answer:
      "Mệnh (Kim, Mộc, Thủy, Hỏa, Thổ) được xác định từ Thiên Can – Địa Chi của năm sinh theo nạp âm 60 hoa giáp. Ví dụ người sinh năm 1990 (Canh Ngọ) thuộc mệnh Thổ (Lộ Bàng Thổ).",
  },
  {
    question: "Tổng nút là gì và vì sao nên chọn sim nhiều nút?",
    answer:
      "Tổng nút = tổng các chữ số của SIM chia 10 lấy số dư. SIM có 7–9 nút được xem là đại cát, mang lại cảm giác vẹn toàn và may mắn cho kinh doanh.",
  },
  {
    question: "Quẻ dịch (80 quẻ Kinh Dịch) dùng để làm gì?",
    answer:
      "Lấy 4 số cuối của SIM chia cho 80, số dư tương ứng một quẻ trong bảng 80 quẻ Kinh Dịch. Quẻ Cát / Đại cát thể hiện ý nghĩa số đuôi tốt đẹp.",
  },
  {
    question: "Làm sao để đặt mua SIM sau khi xem kết quả?",
    answer:
      "Quý khách bấm ĐẶT MUA ở số đã chọn, điền thông tin nhận hàng hoặc bấm Chat Zalo để nhân viên giữ số ngay. Giao SIM toàn quốc 30 phút, đăng ký chính chủ, nhận hàng kiểm tra mới thanh toán.",
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

const PILLARS = [
  {
    title: "1. Ngũ hành bản mệnh & quan hệ sinh – khắc",
    body: "Mỗi người thuộc một mệnh Kim, Mộc, Thủy, Hỏa, Thổ theo nạp âm năm sinh. Số hợp tuổi là số có nhiều chữ số tương sinh hoặc đồng hành với bản mệnh, tránh chữ số tương khắc.",
  },
  {
    title: "2. Cân bằng Âm – Dương",
    body: "Số chẵn (Âm), số lẻ (Dương). Cung phi và giờ sinh cho biết Quý khách thiên Âm hay Dương. Số lý tưởng cần Âm – Dương bù trừ để giữ cân bằng.",
  },
  {
    title: "3. Tổng nút cao (≥ 7 nút)",
    body: "Tổng nút = tổng các chữ số chia 10 lấy dư. SIM đạt 7–9 nút được đánh giá tốt, thuận buồm xuôi gió.",
  },
  {
    title: "4. Quẻ dịch tốt (80 quẻ Kinh Dịch)",
    body: "4 số cuối chia 80 lấy quẻ. Ưu tiên SIM có quẻ Cát / Đại cát như 'Làm ăn phát đạt', 'Tên tuổi 4 phương', 'Thuận lợi xương thịnh'.",
  },
  {
    title: "5. Bát Cực Linh Số cát vượng",
    body: "Ưu tiên các cặp sao cát vượng như Sinh Khí, Diên Niên, Thiên Y, Phục Vị để trợ mệnh, hạn chế sao hung tinh.",
  },
];

export default function SimPhongThuyPage() {
  return (
    <>
      <main className="flex-1 flex flex-col bg-gradient-to-b from-neutral-950 via-neutral-900 to-neutral-950 pb-36">
        <div className="flex-1 container mx-auto px-3 sm:px-4 py-3 sm:py-6">
          <div className="max-w-6xl mx-auto">
            {/* Header tối giản để đẩy Form tra cứu lên ngay màn hình đầu tiên */}
            <div className="text-center mb-3 sm:mb-6">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 border border-gold/30 px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold text-gold mb-1">
                <Sparkles className="h-3 w-3" />
                <span>Bát Tự &amp; 80 Quẻ Kinh Dịch MobiFone</span>
              </div>
              <h1 className="text-lg sm:text-3xl font-extrabold text-foreground tracking-tight">
                Tìm SIM Hợp Tuổi <span className="text-gold">Theo Phong Thủy</span>
              </h1>
              <p className="hidden sm:block text-xs sm:text-sm text-muted-foreground/80 mt-1 max-w-lg mx-auto">
                Chấm điểm ngũ hành, âm dương, tổng nút và quẻ dịch trên kho hơn 50.000 SIM MobiFone.
              </p>
            </div>

            {/* Client Tool */}
            <Suspense fallback={<div className="h-96 rounded-2xl bg-card/50 animate-pulse" />}>
              <SimHopTuoiTool />
            </Suspense>

            {/* SEO Content: 5 Trụ Cột Thu Gọn */}
            <div className="mt-12 rounded-2xl border border-border/60 bg-card/60 p-5 sm:p-7">
              <h2 className="text-base sm:text-lg font-bold text-foreground mb-2 flex items-center gap-2">
                <span className="h-4 w-1 rounded-full bg-gold" />
                Cơ chế chấm điểm SIM: 5 trụ cột phong thủy
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {PILLARS.map((p) => (
                  <div key={p.title} className="rounded-xl border border-border/40 bg-background/50 p-3.5">
                    <h3 className="text-xs sm:text-sm font-bold text-gold">{p.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{p.body}</p>
                  </div>
                ))}
              </div>

              {/* FAQ */}
              <div className="mt-6 pt-5 border-t border-border/40">
                <h3 className="text-sm font-bold text-foreground mb-3">Câu hỏi thường gặp về SIM phong thủy</h3>
                <FaqAccordion items={faqData.map((f) => ({ q: f.question, a: f.answer }))} />
              </div>
            </div>
          </div>
        </div>
      </main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
    </>
  );
}
