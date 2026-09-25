import type { Metadata } from "next";
import CategorySimGrid from "@/components/CategorySimGrid";
import TrustCommitments from "@/components/TrustCommitments";
import FaqAccordion from "@/components/FaqAccordion";
import { buildBreadcrumb } from "@/lib/seo";

export const revalidate = 300;

const TITLE = "Sim Năm Sinh Mobifone | Kho 100% Sim Năm Sinh Đẹp, Giá Gốc";
const DESCRIPTION =
  "Kho Sim Năm Sinh Mobifone đầy đủ 100% các năm từ 1960 đến 2025. Tìm sim theo ngày tháng năm sinh hoặc tự tìm số theo yêu cầu. Đăng ký chính chủ, giao sim toàn quốc.";
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

const QUICK_YEARS = [
  { label: "1988", value: "1988" },
  { label: "1989", value: "1989" },
  { label: "1990", value: "1990" },
  { label: "1991", value: "1991" },
  { label: "1992", value: "1992" },
  { label: "1993", value: "1993" },
  { label: "1994", value: "1994" },
  { label: "1995", value: "1995" },
  { label: "1996", value: "1996" },
  { label: "1997", value: "1997" },
  { label: "1998", value: "1998" },
  { label: "1999", value: "1999" },
  { label: "2000", value: "2000" },
  { label: "2001", value: "2001" },
  { label: "2002", value: "2002" },
  { label: "2003", value: "2003" },
  { label: "2004", value: "2004" },
  { label: "2005", value: "2005" },
];

interface FaqItem {
  question: string;
  answer: string;
}

const faqData: FaqItem[] = [
  {
    question: "Tìm sim theo năm sinh như thế nào?",
    answer: "Quý khách có thể nhập năm sinh (ví dụ 1990, 1995, 2000) hoặc đuôi năm sinh (*95, *88) vào ô tìm kiếm ở trên. Hệ thống sẽ hiển thị toàn bộ những số sim có chứa năm sinh trong dãy số để Quý khách thoải mái lựa chọn.",
  },
  {
    question: "Sim năm sinh có đắt không?",
    answer: "Sim năm sinh có giá từ vài trăm nghìn đến vài chục triệu tùy đầu số (090, 093, 07x...) và độ đẹp của dãy số. Giá niêm yết công khai, không phát sinh chi phí khác.",
  },
  {
    question: "Không có sim đúng 4 số năm sinh của Quý khách thì sao?",
    answer: "Quý khách có thể chọn dạng sim 2 số đuôi năm sinh (ví dụ sinh năm 1995 chọn đuôi *95), hoặc kết hợp ngày tháng năm sinh (ví dụ 20.01.95). Ngoài ra, công cụ Sim Hợp Tuổi / Hợp Mệnh sẽ giúp Quý khách tìm số mang vượng khí ngũ hành chuẩn nhất theo năm sinh của mình.",
  },
  {
    question: "Mua sim năm sinh có đăng ký thông tin chính chủ không?",
    answer: "Có. Toàn bộ sim tại CHONSOMOBIFONE.COM đều hỗ trợ đăng ký thông tin chính chủ. Quý khách nhận SIM, kiểm tra kỹ rồi mới trả tiền.",
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

const cardBaseClass = "relative rounded-2xl p-6 md:p-8";
const cardStyle: React.CSSProperties = {
  background: "#161214",
  border: "1px solid rgba(255,255,255,0.08)",
};

const PILLARS: { title: string; body: string }[] = [
  {
    title: "Sim năm sinh là gì?",
    body: "Sim năm sinh là dòng sim có số năm sinh nằm ở đuôi hoặc trong dãy số — gắn liền với dấu mốc năm sinh của Quý khách hoặc người thân. Dòng sim này vừa tạo phong cách riêng, vừa giúp đối tác và bạn bè nhớ số điện thoại cực kỳ nhanh.",
  },
  {
    title: "Các dạng sim năm sinh phổ biến",
    body: "Có 3 dạng sim năm sinh được ưa chuộng nhất: (1) Sim chứa trọn vẹn 4 số năm sinh ở đuôi (ví dụ: *1990, *1995, *2000); (2) Sim rút gọn 2 số cuối năm sinh (ví dụ: *90, *95); (3) Sim ngày tháng năm sinh đầy đủ dạng ddmmyy hoặc d.m.yyyy.",
  },
  {
    title: "Giá sim năm sinh Mobifone",
    body: "Kho sim năm sinh Mobifone có phổ giá rất rộng: từ 500k – 2 triệu cho các đầu số mới 07x/089; từ 2 – 5 triệu cho các đầu số cổ 090, 093 có thế số đẹp. Giá niêm yết minh bạch trên từng số, không phát sinh phụ phí.",
  },
  {
    title: "Cam kết khi mua sim tại CHONSOMOBIFONE",
    body: "100% sim bán ra đều hỗ trợ đăng ký chính chủ trước khi kích hoạt. Giao hàng hỏa tốc trong 30-60 phút tại TP.HCM và 1-2 ngày toàn quốc. Quý khách nhận sim, gọi kiểm tra thông tin chính chủ đúng tên mình rồi mới thanh toán.",
  },
];

export default function SimNamSinhPage() {
  return (
    <>
      <main className="min-h-screen bg-background pb-12">
        <div className="container mx-auto px-4 pt-3 pb-2">
          {/* Vào thẳng việc chính: Kho sim 100% + Bộ lọc + Tìm kiếm tự do */}
          <CategorySimGrid
            title="Sim Năm Sinh Mobifone"
            searchPlaceholder="Nhập năm sinh (VD: 1990, 1995, 2000, *88), ngày sinh hoặc số cần tìm..."
            emptyText="Kho tạm hết số khớp với tìm kiếm này. Quý khách thử tìm năm sinh khác hoặc gọi 0933.686.666 để nhân viên kiểm tra kho tổng."
            matchTags={["Năm sinh"]}
            searchAllOnQuery={true}
            quickKeywords={QUICK_YEARS}
            searchHelpText={
              <>
                💡 <strong>Mẹo tìm nhanh:</strong> Nhập 4 số năm sinh (VD: <code className="bg-muted px-1.5 py-0.5 rounded font-mono font-semibold text-foreground">1995</code>, <code className="bg-muted px-1.5 py-0.5 rounded font-mono font-semibold text-foreground">2000</code>) · Nhập đuôi năm sinh <code className="bg-muted px-1.5 py-0.5 rounded font-mono font-semibold text-foreground">*95</code>, <code className="bg-muted px-1.5 py-0.5 rounded font-mono font-semibold text-foreground">*88</code> · Hoặc tìm đầu số kết hợp năm sinh <code className="bg-muted px-1.5 py-0.5 rounded font-mono font-semibold text-foreground">090*1995</code>
              </>
            }
          />
        </div>

        <div className="container mx-auto px-4 mt-6">
          <div className="max-w-4xl mx-auto space-y-8">
            <TrustCommitments />

            {/* SEO Content — Giới thiệu sim năm sinh */}
            <div className={cardBaseClass} style={cardStyle}>
              <h2
                className="text-[20px] md:text-2xl font-semibold mb-3 flex items-center gap-3"
                style={{ color: "#F5F5F5", letterSpacing: "-0.01em" }}
              >
                <span aria-hidden className="inline-block h-6 w-1 rounded-full" style={{ background: "#D9B778" }} />
                Ý nghĩa & Cách chọn Sim Năm Sinh Mobifone
              </h2>
              <p className="mb-6 text-sm leading-relaxed" style={{ color: "rgba(237,237,237,0.7)" }}>
                Kho sim năm sinh Mobifone của CHONSOMOBIFONE tập hợp hàng ngàn số sẵn hàng, giá niêm yết rõ ràng để Quý khách đối chiếu và chủ động lựa chọn số điện thoại gắn liền với ngày sinh của mình.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PILLARS.map((pillar) => (
                  <div
                    key={pillar.title}
                    className="rounded-xl p-4.5"
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

            {/* FAQ Section */}
            <div className={cardBaseClass} style={cardStyle}>
              <h2
                className="text-[20px] md:text-2xl font-semibold mb-6 flex items-center gap-3"
                style={{ color: "#F5F5F5", letterSpacing: "-0.01em" }}
              >
                <span aria-hidden className="inline-block h-6 w-1 rounded-full" style={{ background: "#D9B778" }} />
                Câu hỏi thường gặp về Sim Năm Sinh
              </h2>
              <FaqAccordion
                items={faqData.map((faq) => ({ q: faq.question, a: faq.answer }))}
                title={null}
                className="rounded-none border-0 bg-transparent p-0 shadow-none md:p-0"
              />
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