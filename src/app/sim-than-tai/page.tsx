import type { Metadata } from "next";
import { Phone } from "lucide-react";
import CategorySimGrid from "@/components/CategorySimGrid";
import CategorySimPriceList from "@/components/CategorySimPriceList";
import TrustCommitments from "@/components/TrustCommitments";
import CustomerProof from "@/components/CustomerProof";
import LeadMagnetCta from "@/components/LeadMagnetCta";
import FaqAccordion from "@/components/FaqAccordion";
import { buildBreadcrumb } from "@/lib/seo";
import { getCategorySnapshot } from "@/lib/serverSimData";

export const revalidate = 300;

const ZALO_URL = "https://zalo.me/0933686666";

const TITLE = "Sim Thần Tài 39 79 | Kho Sim Thần Tài Mobifone";
const DESCRIPTION =
  "Quý khách chọn sim thần tài Mobifone đẹp: đuôi 39 thần tài nhỏ, 79 thần tài lớn, 7939. Giá niêm yết công khai, đăng ký thông tin chính chủ, giao tận nơi HCM.";
const CANONICAL = "https://www.chonsomobifone.com/sim-than-tai";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    title: TITLE,
    description: "Sim thần tài 39 (thần tài nhỏ) và 79 (thần tài lớn) Mobifone. Giá công khai, chính chủ.",
    url: CANONICAL,
    images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
  },
};

const faqItems = [
  {
    q: "Sim thần tài là gì? Đuôi 39 và 79 khác nhau ra sao?",
    a: "Sim thần tài là số có hai chữ số cuối là 39 (thần tài nhỏ) hoặc 79 (thần tài lớn). Cặp 7939 ghép “thần tài lớn – thần tài nhỏ” nên được hỏi nhiều nhất. Người kinh doanh chọn đuôi này với mong cầu tài lộc, buôn may bán đắt; dãy số cũng dễ đọc khi trao cho khách.",
  },
  {
    q: "Giá sim thần tài Mobifone bao nhiêu?",
    a: "Từ vài trăm nghìn đến hàng chục triệu đồng. Mức giá tùy đầu số (090, 093, 07x...), độ dễ nhớ của dãy số và vị trí đuôi thần tài. Giá niêm yết công khai trên kho, không phát sinh chi phí khác.",
  },
  {
    q: "Mua sim thần tài có đăng ký thông tin chính chủ được không?",
    a: "Được. Sim thần tài tại CHONSOMOBIFONE.COM đều đăng ký thông tin chính chủ. Quý khách nhận SIM, kiểm tra kỹ rồi mới thanh toán; thủ tục chính chủ thực hiện tại cửa hàng MobiFone hoặc trên ứng dụng My Mobifone.",
  },
  {
    q: "Giao sim thần tài mất bao lâu?",
    a: "30 phút giao toàn quốc kể từ lúc Quý khách chốt số. Quý khách thanh toán COD lúc nhận hoặc chuyển khoản trước.",
  },
  {
    q: "Sim thần tài đuôi 39 hợp với mệnh nào?",
    a: "Theo ngũ hành, số 3 thuộc Mộc, số 9 thuộc Hỏa — cặp 39 là Mộc sinh Hỏa, tương đối hài hòa, phù hợp người mệnh Mộc hoặc Hỏa. Cặp 79 có số 7 thuộc Kim gặp số 9 thuộc Hỏa (Hỏa khắc Kim), nên Quý khách cân nhắc kết hợp thêm các số khác cho cân bằng.",
  },
  {
    q: "Có nên mua sim thần tài giá rẻ dưới 500 nghìn không?",
    a: "Có. Đuôi 39 ở đầu số mới 07x vẫn giữ nguyên ý nghĩa tài lộc, phù hợp khi Quý khách mới khởi nghiệp hoặc cần thêm một số cho công việc. Điều đáng lưu ý là chọn dãy dễ đọc, tránh số rối khiến khách phải hỏi lại.",
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

export default async function SimThanTaiPage() {
  const snapshotSims = await getCategorySnapshot({ suffixes: ["39", "79"] }, 8);
  return (
    <>
      <main className="min-h-screen bg-background pb-12">
        <div className="container mx-auto px-4 pt-4 pb-2">
          {/* Breadcrumb & Header nhỏ gọn chuẩn Sim Thăng Long */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
            <div>
              <nav className="text-xs text-muted-foreground mb-1">
                <a href="/" className="hover:underline">Trang chủ</a> / <span className="text-foreground">Sim Thần Tài Mobifone</span>
              </nav>
              <h1 className="text-xl sm:text-2xl font-black text-foreground">
                Sim Thần Tài Mobifone — <span className="text-gold">Đuôi 39, 79, 7939</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Kho sim thần tài Mobifone chính chủ: đuôi 39 (thần tài nhỏ), 79 (thần tài lớn). Giá công khai, nhận sim 30 phút.
              </p>
            </div>
            <a
              href={ZALO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 self-start md:self-center rounded-xl bg-gold px-4 py-2 text-xs sm:text-sm font-bold text-header-bg shadow-sm hover:bg-gold-light transition-all"
            >
              <Phone className="h-4 w-4" /> Chat Zalo tư vấn số
            </a>
          </div>

          {/* Kho sim đập vào mắt ngay lập tức! */}
          <CategorySimGrid
            title="Kho Sim Thần Tài Mobifone"
            searchPlaceholder="Nhập số cần tìm, ví dụ *39, *79, 090*..."
            emptyText="Kho tạm hết số khớp bộ lọc này. Quý khách thử đổi khoảng giá hoặc đầu số, hoặc gọi 0933.686.666 để nhân viên hỗ trợ tìm nhanh."
            matchSuffixes={["39", "79"]}
          />

          {/* Khối bài viết SEO & Hướng dẫn (Gom gọn dưới chân trang cho Google Bot đọc, không làm phiền khách chọn số) */}
          <div className="mt-10 space-y-6 pt-6 border-t border-border/60">
            <details className="group rounded-2xl border border-border bg-card shadow-sm transition-all overflow-hidden">
              <summary className="cursor-pointer p-4 font-bold text-foreground flex items-center justify-between hover:bg-muted/40 transition-colors">
                <span className="flex items-center gap-2 text-sm sm:text-base">
                  📖 Xem thêm ý nghĩa phong thuỷ sim Thần Tài (39, 79) & Cách chọn số
                </span>
                <span className="text-xs text-primary group-open:rotate-180 transition-transform duration-200">
                  ▼
                </span>
              </summary>
              <div className="p-5 pt-2 space-y-8 border-t border-border/40">
                {/* ── 1. Sim Thần Tài là gì? ───────────────────────────────────── */}
                <div>
                  <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-primary">
                    <span className="h-6 w-1 rounded-full bg-primary" />
                    Sim thần tài là gì? Giải mã sức hút của đuôi 39 và 79
                  </h2>
                  <div className="space-y-3 leading-relaxed text-sm text-muted-foreground">
                    <p>
                      Một chủ quán vừa sang mặt bằng mới, một chị bán hàng online sắp in lại bảng hiệu — nhóm khách này thường
                      hỏi cùng một câu: có số nào đuôi 39 hoặc 79 không. Trong các dòng sim phong thủy, đây là hai đuôi được hỏi
                      nhiều nhất. <strong className="text-foreground">Sim thần tài</strong> chính là những số ấy: đuôi 39 gọi là
                      thần tài nhỏ, đuôi 79 là thần tài lớn, còn 7939 ghép cả hai. Với người Việt, Thần Tài là vị thần quản lộc,
                      nên gắn cặp số này vào số điện thoại là cách gửi một mong cầu buôn may bán đắt.
                    </p>
                    <p>
                      Vì sao lại là 3, 7 và 9? <strong className="text-foreground">Số 3</strong> chỉ sự sinh sôi, phát triển (Mộc).{" "}
                      <strong className="text-foreground">Số 7</strong> gắn với may mắn, sức mạnh (Kim).{" "}
                      <strong className="text-foreground">Số 9</strong> là cực dương, bền lâu (Hỏa). Ghép 3–9 hoặc 7–9, ý sinh sôi
                      và may mắn được kéo dài. Cạnh lớp ý nghĩa đó, đuôi thần tài giúp Quý khách tạo ấn tượng chuyên nghiệp mỗi
                      lần trao số cho đối tác.
                    </p>
                  </div>
                </div>

                {/* ── 2. Công thức 3 yếu tố chọn sim thần tài ─────────────────── */}
                <div>
                  <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-primary">
                    <span className="h-6 w-1 rounded-full bg-primary" />
                    Công thức 3 yếu tố chọn sim thần tài đúng chuẩn
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl border border-border bg-secondary/30 p-3.5">
                      <h3 className="mb-1 font-semibold text-foreground text-sm">1. Đuôi số — Thần Tài nhỏ hay lớn?</h3>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        Đuôi 39 (thần tài nhỏ) phổ biến, giá mềm. Đuôi 79 (thần tài lớn) giá cao hơn 20–40%. Đuôi 3979 (song thần tài) thuộc hàng hiếm.
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-secondary/30 p-3.5">
                      <h3 className="mb-1 font-semibold text-foreground text-sm">2. Đầu số — Hệ số nhân giá trị</h3>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        Đầu số cổ 090, 093 có giá trị cao nhất, giữ giá tốt. Đầu 07x, 089 mới hơn, giá tiết kiệm hơn.
                      </p>
                    </div>
                    <div className="rounded-xl border border-border bg-secondary/30 p-3.5">
                      <h3 className="mb-1 font-semibold text-foreground text-sm">3. Thân số — Dễ nhớ là lợi thế</h3>
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        Thân số lặp (68.68.39), taxi (258.258.79) hoặc tam hoa giữa giúp sim vừa dễ nhớ vừa tăng giá trị.
                      </p>
                    </div>
                  </div>
                </div>

                {/* ── 3. So sánh 39 vs 79 ──────────────────────────────────────── */}
                <div>
                  <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-primary">
                    <span className="h-6 w-1 rounded-full bg-primary" />
                    So sánh Thần Tài nhỏ (39) và Thần Tài lớn (79)
                  </h2>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-border text-left">
                          <th className="py-2 pr-4 font-semibold text-foreground">Tiêu chí</th>
                          <th className="py-2 pr-4 font-semibold text-foreground">Đuôi 39 (Thần Tài nhỏ)</th>
                          <th className="py-2 font-semibold text-foreground">Đuôi 79 (Thần Tài lớn)</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b border-border">
                          <td className="py-2 pr-4 font-medium text-foreground">Ý nghĩa</td>
                          <td className="py-2 pr-4">Khởi đầu thuận lợi, sinh sôi</td>
                          <td className="py-2">Tài lộc vững bền, khẳng định uy tín</td>
                        </tr>
                        <tr className="border-b border-border">
                          <td className="py-2 pr-4 font-medium text-foreground">Khoảng giá phổ biến</td>
                          <td className="py-2 pr-4">Từ 990.000đ – 3.000.000đ</td>
                          <td className="py-2">Từ 1.500.000đ – 10.000.000đ+</td>
                        </tr>
                        <tr>
                          <td className="py-2 pr-4 font-medium text-foreground">Đối tượng phù hợp</td>
                          <td className="py-2 pr-4">Bán hàng online, khởi nghiệp</td>
                          <td className="py-2">Doanh nhân, chủ doanh nghiệp, quản lý</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </details>

            {/* ── 7. Bảng giá thật + ItemList/Product/Offer ──────────────── */}
            <CategorySimPriceList
              title="Giá sim thần tài đang bán"
              sims={snapshotSims}
              pageUrl={CANONICAL}
              note="Bảng lấy 8 số đuôi 39 / 79 có giá thấp nhất trong kho tại thời điểm cập nhật."
            />

            <LeadMagnetCta />
            <CustomerProof />
            <TrustCommitments />

            {/* FAQ */}
            <FaqAccordion items={faqItems} />

            {/* Cross-links */}
            <section className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h2 className="mb-4 flex items-center gap-3 text-lg font-bold text-primary">
                <span className="h-6 w-1 rounded-full bg-primary" />
                Xem thêm các dòng sim khác
              </h2>
              <ul className="flex flex-wrap gap-3 text-sm">
                <li><a href="/sim-loc-phat" className="font-medium text-primary underline-offset-2 hover:underline">Sim lộc phát</a></li>
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
              { name: "Sim thần tài", path: "/sim-than-tai" },
            ]),
          ),
        }}
      />
    </>
  );
}