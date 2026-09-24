import type { Metadata } from "next";
import CategorySimGrid from "@/components/CategorySimGrid";
import TrustCommitments from "@/components/TrustCommitments";
import FaqAccordion from "@/components/FaqAccordion";
import { buildBreadcrumb, BASE_URL } from "@/lib/seo";
import { getTagInventory, MIN_INDEXABLE_INVENTORY } from "@/lib/simDangSo";

export const revalidate = 300;

// Chuỗi tag đúng như trong ALL_SIM_TAGS (src/lib/simUtils.ts); luật ở
// CATEGORY_RULES["Tứ quý giữa"] (supabase/functions/_shared/simCategories.ts).
const TAG = "Tứ quý giữa";

const TITLE = "Sim Tứ Quý Giữa Mobifone | Cụm 1111, 8888, 9999 Giữa Dãy";
const DESCRIPTION =
  "Quý khách chọn sim tứ quý giữa Mobifone: cụm bốn số giống nhau nằm giữa dãy như 0879.1111.66, 078.9999.700. Giá niêm yết công khai, đăng ký thông tin chính chủ.";
const CANONICAL = `${BASE_URL}/sim-tu-quy-giua`;

export async function generateMetadata(): Promise<Metadata> {
  const { count } = await getTagInventory(TAG);
  const thin = count < MIN_INDEXABLE_INVENTORY;

  return {
    title: { absolute: TITLE },
    description: DESCRIPTION,
    alternates: { canonical: CANONICAL },
    ...(thin ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: "website",
      title: TITLE,
      description: "Sim tứ quý giữa Mobifone — cụm bốn số giống nhau giữa dãy, như 0879.1111.66. Giá công khai, chính chủ.",
      url: CANONICAL,
      locale: "vi_VN",
      images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
    },
  };
}

const faqItems = [
  {
    q: "Sim tứ quý giữa là gì?",
    a: "Là số có một cụm đúng bốn chữ số giống nhau đứng liền nhau nằm giữa dãy, không chạm số cuối: 0879.1111.66, 0928.0000.60, 078.9999.700 hay 0929.5.0000.2. Cụm phải bắt đầu sau ba số đầu, nên dãy dính vào đầu số như 0333.3… hay 0911.11… không tính. Cụm từ năm số giống nhau trở lên thuộc nhóm ngũ quý, lục quý.",
  },
  {
    q: "Tứ quý giữa khác tứ quý đuôi thế nào?",
    a: "Tứ quý đuôi có bốn số giống nhau nằm ở cuối dãy (…8888), Quý khách xem ở trang sim tứ quý. Tứ quý giữa đặt cụm bốn số vào giữa, sau cụm vẫn còn các số khác. Một số có thể thuộc nhiều nhóm cùng lúc: 0879.1111.66 vừa là tứ quý giữa vừa là lặp kép vì bốn số cuối là 1166.",
  },
  {
    q: "Mua sim tứ quý giữa tại Chonsomobifone.com có đăng ký thông tin chính chủ không?",
    a: "Có. 100% sim giao tới tay Quý khách đều được đăng ký thông tin chính chủ. Quý khách kiểm tra đúng thông tin qua tổng đài Mobifone rồi mới thanh toán.",
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
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function SimTuQuyGiuaPage() {
  return (
    <>
      <main className="min-h-screen bg-background pb-12">
        <div className="container mx-auto px-4 pt-3 pb-2">
          {/* Vào thẳng việc chính: Kho sim 100% + Bộ lọc. Lọc bằng TAG, KHÔNG
              dùng quyFilter (thành quyType "Tứ quý" = quý ĐUÔI → kho rỗng);
              highlightQuyRun chỉ tô cụm giữa trên thẻ. */}
          <CategorySimGrid
            title="Sim Tứ Quý Giữa Mobifone"
            searchPlaceholder="Nhập số cần tìm, ví dụ *1111*, *8888*, 090*..."
            emptyText="Chưa có số nào khớp yêu cầu này. Quý khách thử đổi khoảng giá hoặc đầu số, hoặc gọi 0933.686.666 để nhân viên hỗ trợ."
            matchTags={[TAG]}
            highlightQuyRun={4}
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
                <li><a href="/mua-sim-tu-quy" className="font-medium text-primary underline-offset-2 hover:underline">Sim tứ quý</a></li>
                <li><a href="/sim-ngu-quy" className="font-medium text-primary underline-offset-2 hover:underline">Sim ngũ quý</a></li>
                <li><a href="/sim-tam-hoa" className="font-medium text-primary underline-offset-2 hover:underline">Sim tam hoa</a></li>
                <li><a href="/sim-lap-kep" className="font-medium text-primary underline-offset-2 hover:underline">Sim lặp kép</a></li>
                <li><a href="/sim-de-nho" className="font-medium text-primary underline-offset-2 hover:underline">Sim dễ nhớ</a></li>
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
              { name: "Sim tứ quý giữa", path: "/sim-tu-quy-giua" },
            ]),
          ),
        }}
      />
    </>
  );
}
