import type { Metadata } from "next";
import CategorySimGrid from "@/components/CategorySimGrid";
import TrustCommitments from "@/components/TrustCommitments";
import FaqAccordion from "@/components/FaqAccordion";
import { buildBreadcrumb } from "@/lib/seo";

export const revalidate = 300;

const CANONICAL = "https://www.chonsomobifone.com/sim-loc-phat";

export const metadata: Metadata = {
  title: "Sim Lộc Phát 68 86 | Kho Sim Lộc Phát Mobifone",
  description:
    "Quý khách chọn sim lộc phát Mobifone đuôi 68, 86, 6868, 6688. Giá niêm yết công khai, đăng ký thông tin chính chủ, 30 phút giao toàn quốc.",
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: "Sim Lộc Phát 68 86 | Kho Sim Lộc Phát Mobifone",
    description:
      "Quý khách chọn sim lộc phát Mobifone đuôi 68, 86, 6868, 6688. Giá niêm yết công khai, đăng ký thông tin chính chủ, 30 phút giao toàn quốc.",
    url: CANONICAL,
    type: "website",
    locale: "vi_VN",
  },
};

const faqItems = [
  {
    q: "Sim lộc phát là gì? Đuôi 68 và 86 khác nhau ra sao?",
    a: "Sim lộc phát là sim có đuôi số 68 (lộc phát) hoặc 86 (phát lộc). Đây là dòng sim tượng trưng cho sự sinh sôi tài lộc, kinh doanh may mắn và rất dễ nhớ khi trao đổi liên lạc.",
  },
  {
    q: "Mua sim lộc phát tại Chonsomobifone.com có đảm bảo chính chủ không?",
    a: "100% sim giao tới tay khách hàng đều được đăng ký thông tin chính chủ. Khách hàng kiểm tra đúng thông tin qua tổng đài Mobifone rồi mới thanh toán.",
  },
  {
    q: "Giao nhận sim trong bao lâu?",
    a: "Nội thành TP.HCM nhận sim trong 30-60 phút. Các tỉnh thành khác nhận chuyển phát nhanh tận nhà từ 1-2 ngày làm việc.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqItems.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.a,
    },
  })),
};

export default function SimLocPhatPage() {
  return (
    <>
      <main className="min-h-screen bg-background pb-12">
        <div className="container mx-auto px-4 pt-3 pb-2">
          {/* Vào thẳng việc chính: Kho sim 100% + Bộ lọc */}
          <CategorySimGrid
            title="Sim Lộc Phát Mobifone"
            searchPlaceholder="Nhập số cần tìm, ví dụ *68, *86, 090*..."
            emptyText="Chưa có số nào khớp yêu cầu này. Quý khách thử đổi khoảng giá hoặc đầu số, hoặc gọi 0933.686.666 để nhân viên hỗ trợ."
            matchSuffixes={["68", "86"]}
          />

          {/* Cam kết & FAQ chân trang */}
          <div className="mt-8 space-y-6 pt-6 border-t border-border/40">
            <TrustCommitments />
            <FaqAccordion items={faqItems} />

            <section className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h2 className="mb-4 flex items-center gap-3 text-lg font-bold text-primary">
                <span className="h-6 w-1 rounded-full bg-primary" />
                Xem thêm các dòng sim khác
              </h2>
              <ul className="flex flex-wrap gap-3 text-sm">
                <li><a href="/sim-than-tai" className="font-medium text-primary underline-offset-2 hover:underline">Sim thần tài</a></li>
                <li><a href="/mua-sim-tu-quy" className="font-medium text-primary underline-offset-2 hover:underline">Sim tứ quý</a></li>
                <li><a href="/sim-phong-thuy-hop-menh" className="font-medium text-primary underline-offset-2 hover:underline">Sim phong thủy hợp mệnh</a></li>
                <li><a href="/sim-nam-sinh" className="font-medium text-primary underline-offset-2 hover:underline">Sim năm sinh</a></li>
                <li><a href="/mua-sim-gia-re" className="font-medium text-primary underline-offset-2 hover:underline">Sim giá rẻ</a></li>
              </ul>
            </section>
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
              { name: "Sim lộc phát", path: "/sim-loc-phat" },
            ]),
          ),
        }}
      />
    </>
  );
}
