import type { Metadata } from "next";
import CategorySimGrid from "@/components/CategorySimGrid";
import TrustCommitments from "@/components/TrustCommitments";
import FaqAccordion from "@/components/FaqAccordion";
import LocalServiceLinks from "@/components/LocalServiceLinks";
import { buildBreadcrumb } from "@/lib/seo";
import { KHO_229K_BAT } from "@/lib/kho229k";
import { getTagInventory, formatTrieu } from "@/lib/simDangSo";

export const revalidate = 300;

// Tên tag lấy ĐÚNG chuỗi trong ALL_SIM_TAGS (src/lib/simUtils.ts).
const TAG = "Thần tài";

const TITLE = "Sim Thần Tài 39 79 | Kho Sim Thần Tài Mobifone";
const DESCRIPTION =
  "Quý khách chọn sim thần tài Mobifone đẹp: đuôi 39 thần tài nhỏ, 79 thần tài lớn, 7939. Giá niêm yết công khai, đăng ký thông tin chính chủ, giao tận nơi HCM.";
const CANONICAL = "https://www.chonsomobifone.com/sim-than-tai";

// GSC 28 ngày tới 12/11/2026: 6 imp, pos 5.5, 0 click ("mobi thần tài") — title
// cũ không có giá, không có số lượng. Khi kho có số, title/meta lấy số lượng + giá
// thấp nhất thật từ kho (cùng cách đã làm cho /sim-tam-hoa, /sim-lap-kep, /sim-ngu-quy).
export async function generateMetadata(): Promise<Metadata> {
  const { count, min } = await getTagInventory(TAG);
  const live = count > 0 && min > 0;
  const countText = count.toLocaleString("vi-VN");
  const title = live
    ? `Sim Thần Tài MobiFone Giá Từ ${formatTrieu(min)} — ${countText} Số Đuôi 39, 79`
    : TITLE;
  const description = live
    ? `${countText} sim thần tài MobiFone đuôi 39, 79, 3979, 7939, giá từ ${formatTrieu(min)}, niêm yết cạnh từng số. Đăng ký chính chủ, nhận SIM kiểm tra rồi mới thanh toán.`
    : DESCRIPTION;
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: CANONICAL },
    openGraph: {
      title,
      description,
      url: CANONICAL,
      type: "website",
      locale: "vi_VN",
    },
  };
}

const faqItems = [
  {
    q: "Sim thần tài Mobifone là gì?",
    a: "Sim thần tài là dòng sim có đuôi kết thúc bằng số 39 (thần tài nhỏ), 79 (thần tài lớn) hoặc cặp 3979, 7939. Đây là dòng sim được giới kinh doanh, buôn bán ưa chuộng nhất nhờ ý nghĩa chiêu tài lộc.",
  },
  {
    q: "Đuôi 39 và 79 khác nhau như thế nào?",
    a: "Đuôi 39 mang ý nghĩa Thần Tài nhỏ, giá cả bình dân và dễ tiếp cận hơn. Đuôi 79 mang ý nghĩa Thần Tài lớn, có độ hiếm và đẳng cấp cao hơn nên mức giá thường chênh lệch từ 20-40% so với đuôi 39 cùng thế số.",
  },
  {
    q: "Mua sim tại Chonsomobifone.com có được đăng ký chính chủ không?",
    a: "100% sim bán ra tại Chonsomobifone.com đều được đăng ký thông tin chính chủ cho khách hàng trước khi bàn giao. Quý khách nhận sim, kiểm tra thông tin đúng tên mình qua tổng đài rồi mới thanh toán.",
  },
  {
    q: "Thời gian giao sim mất bao lâu?",
    a: "Khách hàng tại TP.HCM và các thành phố lớn nhận sim hỏa tốc trong 30-60 phút. Khách hàng ở các tỉnh thành khác nhận sim tận tay qua đường chuyển phát nhanh từ 1-2 ngày làm việc.",
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

export default function SimThanTaiPage() {
  return (
    <>
      <main className="min-h-screen bg-background pb-12">
        <div className="container mx-auto px-4 pt-3 pb-2">
          {/* Vào thẳng việc chính: Kho sim 100% + Bộ lọc */}
          <CategorySimGrid
            title="Sim Thần Tài Mobifone"
            searchPlaceholder="Nhập số cần tìm, ví dụ *39, *79, 090*..."
            emptyText="Kho tạm hết số khớp bộ lọc này. Quý khách thử đổi khoảng giá hoặc đầu số, hoặc gọi 0933.686.666 để nhân viên hỗ trợ tìm nhanh."
            matchSuffixes={["39", "79"]}
          />

          {/* Cam kết & FAQ chân trang */}
          <div className="mt-8 space-y-6 pt-6 border-t border-border/40">
            <TrustCommitments />
            <FaqAccordion items={faqItems} />
            <LocalServiceLinks />

            <section className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h2 className="mb-4 flex items-center gap-3 text-lg font-bold text-primary">
                <span className="h-6 w-1 rounded-full bg-primary" />
                Xem thêm các dòng sim khác
              </h2>
              <ul className="flex flex-wrap gap-3 text-sm">
                <li><a href="/sim-loc-phat" className="font-medium text-primary underline-offset-2 hover:underline">Sim lộc phát</a></li>
                <li><a href="/mua-sim-tu-quy" className="font-medium text-primary underline-offset-2 hover:underline">Sim tứ quý</a></li>
                <li><a href="/sim-tam-hoa" className="font-medium text-primary underline-offset-2 hover:underline">Sim tam hoa</a></li>
                <li><a href="/sim-phong-thuy-hop-menh" className="font-medium text-primary underline-offset-2 hover:underline">Sim phong thủy hợp mệnh</a></li>
                <li><a href="/sim-nam-sinh" className="font-medium text-primary underline-offset-2 hover:underline">Sim năm sinh</a></li>
                {KHO_229K_BAT && (
                  <li><a href="/mua-sim-gia-re" className="font-medium text-primary underline-offset-2 hover:underline">Sim giá rẻ</a></li>
                )}
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
              { name: "Sim thần tài", path: "/sim-than-tai" },
            ]),
          ),
        }}
      />
    </>
  );
}
