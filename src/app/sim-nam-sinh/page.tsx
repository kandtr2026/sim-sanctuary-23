import type { Metadata } from "next";
import { Suspense } from "react";
import { Sparkles } from "lucide-react";
import SimNamSinhFinder from "./SimNamSinhFinder";
import FaqAccordion from "@/components/FaqAccordion";
import { buildBreadcrumb } from "@/lib/seo";

const TITLE = "Sim Năm Sinh – Tìm SIM Có Đúng Ngày Sinh, Năm Sinh";
const DESCRIPTION =
  "Tìm sim năm sinh theo ngày sinh của Quý khách: chọn ngày/tháng/năm để xem những số có năm sinh trong dãy. Giá công khai, sang tên chính chủ, giao toàn quốc.";
const CANONICAL = "https://www.chonsomobifone.com/sim-nam-sinh";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    title: TITLE,
    description: DESCRIPTION,
    url: CANONICAL,
    images: [{ url: "https://www.chonsomobifone.com/og-sim-nam-sinh.png?v=1", width: 1200, height: 630 }],
  },
};

interface FaqItem {
  question: string;
  answer: string;
}

const faqData: FaqItem[] = [
  {
    question: "Tìm sim theo năm sinh như thế nào?",
    answer: "Quý khách chọn ngày, tháng, năm sinh ở ô phía trên. Hệ thống lọc sẵn những sim có số năm sinh trong dãy số và hiển thị kèm giá để Quý khách chọn.",
  },
  {
    question: "Sim năm sinh có đắt không?",
    answer: "Sim năm sinh có giá từ vài trăm nghìn đến vài chục triệu tùy đầu số (090, 093, 07x...) và độ đẹp của dãy số. Giá niêm yết công khai, không phát sinh phí ẩn.",
  },
  {
    question: "Không có sim đúng ngày sinh của Quý khách thì sao?",
    answer: "Kho đổi hàng liên tục nên Quý khách có thể xem lại sau, hoặc chuyển sang chọn theo phong thủy: công cụ Sim hợp tuổi chấm điểm toàn bộ kho theo mệnh, ngũ hành và quẻ dịch của Quý khách, nên luôn có số phù hợp dù dãy số không chứa năm sinh.",
  },
  {
    question: "Mua sim năm sinh có sang tên chính chủ không?",
    answer: "Được. Toàn bộ sim tại CHONSOMOBIFONE.COM đều hỗ trợ sang tên chính chủ. Quý khách nhận SIM, kiểm tra kỹ rồi mới trả tiền.",
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

const PILLARS: { title: string; body: string }[] = [
  {
    title: "Sim năm sinh là gì?",
    body: "Sim năm sinh là dòng sim có số năm sinh nằm ở các số cuối — năm sinh của Quý khách hoặc của người thân. Nhiều người chọn vì dễ nhớ và mang ý nghĩa riêng. Quý khách chỉ cần chọn ngày sinh phía trên, hệ thống lọc sẵn những số có năm sinh tương ứng đang có trong kho.",
  },
  {
    title: "Lợi ích khi chọn sim năm sinh",
    body: "Số có sẵn năm sinh trong dãy thì Quý khách nhớ nhanh hơn, đọc cho đối tác cũng gọn hơn. Với nhiều người, đó còn là cách lưu giữ một dấu mốc riêng — sinh nhật của bản thân, của con, của người thân.",
  },
  {
    title: "Giá sim năm sinh có đắt không?",
    body: "Sim năm sinh Mobifone có giá từ vài trăm nghìn đến vài chục triệu đồng, tùy đầu số (090, 093, 07x...) và độ đẹp của dãy số quanh số năm sinh. Giá niêm yết công khai trên kho, không phát sinh phí ẩn — Quý khách so giá trước, quyết định sau.",
  },
  {
    title: "Số gắn với năm sinh — vì sao nhiều người chọn",
    body: "Số có năm sinh trong dãy thì Quý khách nhớ được ngay và đọc cho đối tác cũng nhanh gọn. Nhiều người còn chọn theo năm sinh của người thân để làm quà. Trang này chỉ tìm số CHỨA ĐÚNG năm sinh; nếu Quý khách muốn chọn số theo mệnh, ngũ hành và quẻ dịch thì dùng công cụ Sim hợp tuổi — nó chấm điểm toàn bộ kho nên luôn có số phù hợp.",
  },
  {
    title: "Cam kết khi mua sim tại CHONSOMOBIFONE",
    body: "Toàn bộ sim tại CHONSOMOBIFONE.COM đều hỗ trợ sang tên chính chủ. Quý khách nhận SIM, kiểm tra kỹ rồi mới trả tiền. Giao nội thành HCM 30 phút – 2h, toàn quốc 1–3 ngày. Chúng tôi hỗ trợ đăng ký qua cửa hàng MobiFone hoặc ứng dụng My Mobifone.",
  },
];

export default function SimNamSinhPage() {
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
                  Sim Năm Sinh <span style={{ color: "#D9B778" }}>Theo Ngày Sinh</span>
                </span>
              </h1>
              <p style={{ color: "rgba(237, 237, 237, 0.7)" }} className="mx-auto max-w-xl text-sm md:text-base leading-relaxed">
                Quý khách chọn ngày/tháng/năm sinh, chúng tôi lọc sẵn những số có năm sinh trong dãy. Giá niêm yết
                công khai, sang tên chính chủ, giao toàn quốc.
              </p>
            </div>

            {/* Client island: công cụ tìm sim năm sinh */}
            <Suspense fallback={null}>
              <SimNamSinhFinder />
            </Suspense>

            {/* SEO content — sim năm sinh */}
            <div className={`${cardBaseClass} mt-10 md:mt-14`} style={cardStyle}>
              <h2
                className="text-[22px] md:text-2xl font-semibold mb-3 flex items-center gap-3"
                style={{ color: "#F5F5F5", letterSpacing: "-0.01em" }}
              >
                <span aria-hidden className="inline-block h-6 w-1 rounded-full" style={{ background: "#D9B778" }} />
                Sim năm sinh — thông tin cần biết
              </h2>
              <p className="mb-6 text-sm leading-relaxed" style={{ color: "rgba(237,237,237,0.7)" }}>
                Kho sim năm sinh Mobifone của CHONSOMOBIFONE có hàng ngàn số sẵn hàng, mỗi số một mức giá niêm yết
                rõ ràng để Quý khách đối chiếu và chủ động chọn.
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
                Vì sao mua sim năm sinh tại CHONSOMOBIFONE?
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  "Giá niêm yết công khai trên từng số, trong kho SIM Mobifone thật",
                  "Tra sim theo ngày sinh chỉ trong một bước",
                  "Sang tên chính chủ; Quý khách nhận SIM, kiểm tra rồi mới trả tiền",
                  "Giao nội thành HCM 30 phút – 2h, các tỉnh thành khác 1–3 ngày",
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
              <FaqAccordion
                items={faqData.map((faq) => ({ q: faq.question, a: faq.answer }))}
                title={null}
                className="rounded-none border-0 bg-transparent p-0 shadow-none md:p-0"
              />
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
                <strong style={{ color: "#D9B778" }}>Lưu ý:</strong> Sim năm sinh là dòng sim có số năm sinh ở các số
                cuối, dễ nhớ và mang ý nghĩa riêng với người dùng. Quý khách nên cân nhắc thêm nhiều yếu tố để chọn
                được số ưng ý.
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
              { name: "Sim năm sinh", path: "/sim-nam-sinh" },
            ]),
          ),
        }}
      />
    </>
  );
}