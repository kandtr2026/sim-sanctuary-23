import type { Metadata } from "next";
import { Phone } from "lucide-react";
import CategorySimGrid from "@/components/CategorySimGrid";
import CategorySimPriceList from "@/components/CategorySimPriceList";
import LeadMagnetCta from "@/components/LeadMagnetCta";
import CustomerProof from "@/components/CustomerProof";
import TrustCommitments from "@/components/TrustCommitments";
import FaqAccordion from "@/components/FaqAccordion";
import { buildBreadcrumb } from "@/lib/seo";
import { getCategorySnapshot } from "@/lib/serverSimData";

// ISR: prerender + revalidate every 300s (khớp /api/sims) so crawlers hit a
// cached page instead of forcing SSR (ƒ) on every request.
export const revalidate = 300;

const ZALO_URL = "https://zalo.me/0933686666";

const TITLE = "Sim Lộc Phát 68 86 | Kho Sim Lộc Phát Mobifone Đẹp";
const DESCRIPTION =
  "Sim lộc phát Mobifone đuôi 68, 86, 6868, 6688 cho Quý khách: giá niêm yết công khai, nhận SIM rồi mới thanh toán, đăng ký thông tin chính chủ, giao tận nơi HCM.";
const CANONICAL = "https://www.chonsomobifone.com/sim-loc-phat";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    title: TITLE,
    description: "Sim lộc phát đuôi 68 (lộc phát) và 86 (phát lộc) Mobifone. Giá công khai, chính chủ.",
    url: CANONICAL,
    images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
  },
};

const faqItems = [
  {
    q: "Sim lộc phát là gì? Đuôi 68 và 86 khác nhau ra sao?",
    a: "Đọc nhanh sẽ thấy: 68 nghe ra “lộc phát”, 86 nghe ra “phát lộc”. Hai đuôi cùng chỉ một ý — tài lộc sinh sôi, làm ăn phát đạt. Các đuôi lặp 6868, 6688, 8686 được ưa chuộng hơn vì dễ nhớ và nhấn ý nghĩa hai lần. Quý khách nên ưu tiên dãy đọc lên thấy trôi.",
  },
  {
    q: "Giá sim lộc phát bao nhiêu?",
    a: "Từ vài trăm nghìn đến hàng chục triệu đồng, tùy đầu số và độ đẹp của dãy. Mỗi số có giá hiện sẵn trong kho, không chi phí khác, nên Quý khách so giá vài số rồi mới quyết.",
  },
  {
    q: "Mua sim lộc phát có đăng ký thông tin chính chủ được không?",
    a: "Được. Mọi số lộc phát tại CHONSOMOBIFONE.COM đều đăng ký thông tin chính chủ. Quý khách nhận SIM, kiểm tra kỹ rồi mới thanh toán; phần đăng ký chính chủ có đội ngũ hỗ trợ tại cửa hàng MobiFone hoặc trên ứng dụng My Mobifone.",
  },
  {
    q: "Giao sim lộc phát mất bao lâu?",
    a: "30 phút giao toàn quốc. Quý khách nhận SIM, kiểm tra rồi mới thanh toán (COD).",
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

export default async function SimLocPhatPage() {
  const snapshotSims = await getCategorySnapshot({ suffixes: ["68", "86"] }, 8);
  return (
    <>
      <main className="min-h-screen bg-background pb-12">
        <div className="container mx-auto px-4 pt-3 pb-2">
          {/* Vào thẳng việc chính: Kho sim + Bộ lọc */}
          <CategorySimGrid
            title="Sim Lộc Phát Mobifone"
            searchPlaceholder="Nhập số cần tìm, ví dụ *68, *86, 090*..."
            emptyText="Chưa có số nào khớp yêu cầu này. Quý khách thử đổi khoảng giá hoặc đầu số, hoặc gọi 0933.686.666 để nhân viên hỗ trợ."
            matchSuffixes={["68", "86"]}
          />

          {/* Khối bài viết SEO & Hướng dẫn (Gom gọn dưới chân trang cho Google Bot đọc, không làm phiền khách chọn số) */}
          <div className="mt-10 space-y-6 pt-6 border-t border-border/60">
            <details className="group rounded-2xl border border-border bg-card shadow-sm transition-all overflow-hidden">
              <summary className="cursor-pointer p-4 font-bold text-foreground flex items-center justify-between hover:bg-muted/40 transition-colors">
                <span className="flex items-center gap-2 text-sm sm:text-base">
                  📖 Xem thêm ý nghĩa phong thuỷ sim Lộc Phát (68, 86) & Cách chọn số
                </span>
                <span className="text-xs text-primary group-open:rotate-180 transition-transform duration-200">
                  ▼
                </span>
              </summary>
              <div className="p-5 pt-2 space-y-6 border-t border-border/40">
                <div>
                  <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-primary">
                    <span className="h-6 w-1 rounded-full bg-primary" />
                    Sim lộc phát là gì? Đuôi 68 và 86 khác nhau ra sao
                  </h2>
                  <div className="space-y-3 leading-relaxed text-sm text-muted-foreground">
                    <p>
                      Đọc thành tiếng là thấy ngay: “sáu tám” nghe ra lộc phát, “tám sáu” nghe ra phát lộc. Mỗi lần Quý khách
                      xướng số cho đối tác, dãy số nói thay một lời chúc — và người nghe nhớ được ngay từ lần đầu. Đó là chỗ
                      đứng của đuôi 68 và 86 trong giới làm ăn. Về nghĩa, hai đuôi quy về cùng một mong muốn: tài lộc sinh sôi,
                      buôn bán thuận đường.
                    </p>
                    <p>
                      Khác biệt nằm ở nhịp đọc và độ hiếm. Các đuôi lặp như <strong className="text-foreground">6868</strong>{" "}
                      (lộc phát lộc phát), <strong className="text-foreground">6688</strong>,{" "}
                      <strong className="text-foreground">8686</strong> vừa dễ nhớ vừa nhấn ý nghĩa hai lần nên được săn nhiều
                      hơn. Riêng giá thì do đầu số quyết định trước tiên, sau đó tới độ đẹp của dãy: cùng đuôi 68, số đầu 090 hay
                      093 nằm ở mặt bằng khác hẳn đầu 07x.
                    </p>
                  </div>
                </div>

                <div>
                  <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-primary">
                    <span className="h-6 w-1 rounded-full bg-primary" />
                    Cách chọn sim lộc phát hợp túi tiền
                  </h2>
                  <div className="space-y-3 leading-relaxed text-sm text-muted-foreground">
                    <p>
                      Sim lộc phát đuôi 68 hoặc 86 có phổ giá rất rộng: từ dưới 1 triệu (ở đầu 07x) cho đến vài chục triệu
                      (ở đầu cổ 090, 093 có thế số tam hoa, gánh đảo). Tuỳ mục đích sử dụng làm sim liên lạc cá nhân hay làm
                      hotline kinh doanh lâu dài, Quý khách có thể chọn đầu số và dải giá phù hợp.
                    </p>
                  </div>
                </div>
              </div>
            </details>

            {/* Bảng giá thật + ItemList/Product/Offer trong HTML thô */}
            <CategorySimPriceList
              title="Giá sim lộc phát đang bán"
              sims={snapshotSims}
              pageUrl={CANONICAL}
              note="Bảng lấy 8 số đuôi 68 / 86 có giá thấp nhất trong kho tại thời điểm cập nhật."
            />

            <LeadMagnetCta />
            <CustomerProof />
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
