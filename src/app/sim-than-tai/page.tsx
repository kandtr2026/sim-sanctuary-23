import type { Metadata } from "next";
import { Phone, Star, Sparkles, Search } from "lucide-react";
import CategorySimGrid from "@/components/CategorySimGrid";
import CategorySimPriceList from "@/components/CategorySimPriceList";
import TrustCommitments from "@/components/TrustCommitments";
import CustomerProof from "@/components/CustomerProof";
import LeadMagnetCta from "@/components/LeadMagnetCta";
import FaqAccordion from "@/components/FaqAccordion";
import { buildBreadcrumb } from "@/lib/seo";
import { getCategorySnapshot } from "@/lib/serverSimData";

export const revalidate = 300;

const ZALO_URL = "https://zalo.me/0933356666";

const TITLE = "Sim Thần Tài 39 79 | Kho Sim Thần Tài Mobifone";
const DESCRIPTION =
  "Quý khách chọn sim thần tài Mobifone đẹp: đuôi 39 thần tài nhỏ, 79 thần tài lớn, 7939. Giá niêm yết công khai, sang tên chính chủ, giao tận nơi HCM.";
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
    a: "Từ vài trăm nghìn đến hàng chục triệu đồng. Mức giá tùy đầu số (090, 093, 07x...), độ dễ nhớ của dãy số và vị trí đuôi thần tài. Giá niêm yết công khai trên kho, không phát sinh phí ẩn.",
  },
  {
    q: "Mua sim thần tài có sang tên chính chủ được không?",
    a: "Được. Sim thần tài tại CHONSOMOBIFONE.COM đều sang tên chính chủ. Quý khách nhận SIM, kiểm tra kỹ rồi mới thanh toán; thủ tục chính chủ thực hiện tại cửa hàng MobiFone hoặc trên ứng dụng My Mobifone.",
  },
  {
    q: "Giao sim thần tài mất bao lâu?",
    a: "Nội thành TP.HCM: 30 phút – 2 giờ làm việc kể từ lúc Quý khách chốt số. Tỉnh thành khác: 1–3 ngày làm việc qua chuyển phát nhanh. Quý khách thanh toán COD lúc nhận hoặc chuyển khoản trước.",
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
      <main className="min-h-screen bg-background">
        <section
          style={{ minHeight: "clamp(300px, 38vw, 380px)" }}
          className="relative flex items-center bg-gradient-to-b from-primary via-primary-dark to-primary text-primary-foreground"
        >
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.07]"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 50%, hsl(var(--gold)) 0%, transparent 50%), radial-gradient(circle at 75% 50%, hsl(var(--gold)) 0%, transparent 50%)`,
            }}
          />
          <div className="container relative mx-auto px-4 py-6 text-center">
            <div className="mb-2 flex justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 bg-gold/15">
                <Sparkles className="h-5 w-5 text-gold" />
              </div>
            </div>
            <h1 className="mx-auto mb-3 max-w-3xl text-2xl font-extrabold leading-tight sm:text-3xl md:text-4xl">
              Sim Thần Tài Mobifone — <span className="text-gold">đuôi 39, 79, 7939</span>
            </h1>
            <p className="mx-auto mb-5 max-w-xl text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              Quý khách chọn đuôi 39 (thần tài nhỏ) hay 79 (thần tài lớn), giá hiện sẵn cạnh từng số. Sang tên chính chủ, giao tận nơi nội thành HCM.
            </p>
            <div className="mx-auto flex max-w-md flex-col justify-center gap-2.5 sm:flex-row">
              <a
                href="#kho-sim"
                className="flex items-center justify-center gap-2 rounded-lg bg-gold px-7 py-2.5 font-bold text-header-bg shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-xl"
              >
                <Star className="h-4 w-4" /> Xem kho sim thần tài
              </a>
              <a
                href={ZALO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg border border-primary-foreground/25 bg-primary-foreground/10 px-7 py-2.5 font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-foreground/20"
              >
                <Phone className="h-4 w-4" /> Tư vấn chọn sim
              </a>
            </div>
          </div>
        </section>

        <div className="container mx-auto space-y-10 px-4 py-8 md:space-y-14 md:py-12">
          {/* ── 1. Sim Thần Tài là gì? ───────────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Sim thần tài là gì? Giải mã sức hút của đuôi 39 và 79
            </h2>
            <div className="space-y-4 leading-relaxed text-muted-foreground">
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
          </section>

          {/* ── 2. Công thức 3 yếu tố chọn sim thần tài ─────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Công thức 3 yếu tố chọn sim thần tài đúng chuẩn
            </h2>
            <p className="mb-4 leading-relaxed text-muted-foreground">
              Ba yếu tố dưới đây quyết định giá một số thần tài. Nắm được cả ba, Quý khách chủ động chọn số vừa ý nghĩa
              vừa đúng ngân sách.
            </p>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <h3 className="mb-1.5 font-semibold text-foreground">1. Đuôi số — Thần Tài nhỏ hay lớn?</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Đuôi 39 (thần tài nhỏ) phổ biến, giá mềm, phù hợp người mới khởi nghiệp. Đuôi 79 (thần tài lớn) giá cao hơn
                  20–40%, được doanh nhân thành đạt ưa chuộng. Đuôi 3979 (song thần tài) thuộc hàng hiếm, giá cao nhất.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <h3 className="mb-1.5 font-semibold text-foreground">2. Đầu số — Hệ số nhân của giá trị</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Đầu số cổ 090, 093 (Mobifone) có hệ số nhân cao nhất, giữ giá tốt. Đầu 07x, 08x mới hơn, giá rẻ hơn.
                  Cùng một cấu trúc sim, thay đầu 07x lên 090 có thể tăng giá gấp 2–3 lần.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <h3 className="mb-1.5 font-semibold text-foreground">3. Thân số — Dễ nhớ là lợi thế kinh doanh</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Thân số lặp (68.68.39), taxi (258.258.79) hoặc tam hoa giữa (777.39) làm sim vừa dễ nhớ vừa tăng giá trị
                  20–40%. Nếu dùng làm hotline kinh doanh, ưu tiên cấu trúc đơn giản, lặp lại — dễ nhớ quan trọng hơn ý nghĩa.
                </p>
              </div>
            </div>
          </section>

          {/* ── 3. So sánh 39 vs 79 ──────────────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              So sánh Thần Tài nhỏ (39) và Thần Tài lớn (79) — chọn loại nào?
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
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
                    <td className="py-2">Phát tài bền vững, đỉnh cao</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2 pr-4 font-medium text-foreground">Ngũ hành</td>
                    <td className="py-2 pr-4">Mộc (3) + Hỏa (9) — Mộc sinh Hỏa</td>
                    <td className="py-2">Kim (7) + Hỏa (9) — Hỏa khắc Kim</td>
                  </tr>
                  <tr className="border-b border-border">
                    <td className="py-2 pr-4 font-medium text-foreground">Giá trung bình</td>
                    <td className="py-2 pr-4">Thấp hơn — phù hợp ngân sách hạn chế</td>
                    <td className="py-2">Cao hơn 20–40%</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-4 font-medium text-foreground">Phù hợp</td>
                    <td className="py-2 pr-4">Người mới khởi nghiệp, chủ shop nhỏ</td>
                    <td className="py-2">Doanh nhân thành đạt, muốn khẳng định vị thế</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Theo khảo sát từ CHONSOMOBIFONE, khoảng 62% khách chọn đuôi 39 (thần tài nhỏ) vì giá hợp lý và đủ ý nghĩa
              tâm lý. Số còn lại chọn 79 hoặc 3979 khi doanh thu đã ổn định và muốn đầu tư cho hình ảnh cá nhân. Nếu Quý
              khách còn cân giữa hai đuôi: 39 cho giai đoạn khởi đầu, 79 khi cần một dãy số đứng vững trước đối tác.
            </p>
          </section>

          {/* ── 4. Hướng dẫn chọn theo ngân sách ────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Hướng dẫn chọn sim thần tài theo ngân sách
            </h2>
            <div className="grid gap-5 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <h3 className="mb-1 text-lg font-bold text-gold">Dưới 1 triệu</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <strong className="text-foreground">Công thức:</strong> Đầu số mới (07x, 08x) + thân số đơn giản + đuôi 39.
                  Phù hợp freelancer, chủ shop online mới mở. Chiếm ~55% doanh số sim thần tài vì giá mềm, đủ ý nghĩa tâm lý.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">Ví dụ: 07x.xxx.39, 08x.xx.839</p>
              </div>
              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <h3 className="mb-1 text-lg font-bold text-gold">2–10 triệu</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <strong className="text-foreground">Công thức:</strong> Đầu 076/077/078 + thân số lặp có cấu trúc + đuôi 79
                  hoặc 3979. Nhóm này có tỷ lệ mua để dùng lâu dài cao nhất — số điện thoại trở thành một phần nhận diện
                  của Quý khách.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">Ví dụ: 076.68.68.79, 077.888.79</p>
              </div>
              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <h3 className="mb-1 text-lg font-bold text-gold">Trên 10 triệu</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  <strong className="text-foreground">Công thức:</strong> Đầu số cổ (090, 093) + thân số taxi/tam hoa + đuôi 3979
                  hoặc 7979. Đây là tài sản số có tính thanh khoản, giữ giá tốt theo thời gian.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">Ví dụ: 090.xxx.3979, 093.777.79</p>
              </div>
            </div>
          </section>

          {/* ── 5. Tránh 3 sai lầm phổ biến ─────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Tránh 3 sai lầm phổ biến khi mua sim thần tài
            </h2>
            <div className="space-y-4">
              <div className="rounded-lg border border-red-800/30 bg-red-950/20 p-4">
                <h3 className="mb-1 font-semibold text-foreground">Sai lầm 1: Chỉ chú ý đuôi số, quên đầu số</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Sim đuôi 79 giá rẻ nhưng đầu số 03x, 08x khó tạo ấn tượng chuyên nghiệp.
                  <strong className="text-foreground"> Giải pháp:</strong> Cân bằng ngân sách — thà chọn đầu 09x đuôi 39 còn hơn đầu 03x đuôi 79.
                </p>
              </div>
              <div className="rounded-lg border border-red-800/30 bg-red-950/20 p-4">
                <h3 className="mb-1 font-semibold text-foreground">Sai lầm 2: Chọn số quá phức tạp, khó đọc</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Nhiều số may mắn nhưng dãy số rối, đối tác phải hỏi lại nhiều lần.
                  <strong className="text-foreground"> Giải pháp:</strong> Ưu tiên cấu trúc lặp, đơn giản (VD: 076.68.68.79).
                  Trong kinh doanh, dễ nhớ thắng ý nghĩa.
                </p>
              </div>
              <div className="rounded-lg border border-red-800/30 bg-red-950/20 p-4">
                <h3 className="mb-1 font-semibold text-foreground">Sai lầm 3: Không tính đến nhà mạng phù hợp</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  Chọn sai nhà mạng dẫn đến chi phí cao hoặc sóng yếu.
                  <strong className="text-foreground"> Giải pháp:</strong> Mobifone — cân bằng giữa giá và chất lượng, phù hợp nội thành.
                  Viettel phủ sóng rộng hơn nhưng giá cao hơn 10–15%.
                </p>
              </div>
            </div>
          </section>

          {/* ── 6. Xu hướng 2026 ──────────────────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Xu hướng 2026: Kết hợp sim thần tài với dạng taxi
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Năm nay, nhiều khách hàng chọn số ghép hai lớp: đuôi thần tài đi cùng cấu trúc taxi dễ đọc. Ví dụ:{" "}
              <strong className="text-foreground">09x.39.39.39</strong> (tam hoa 39, đọc một lần là nhớ) hoặc{' '}
              <strong className="text-foreground">09x.68.68.79</strong> (lộc phát 68 đi cùng thần tài 79). Số dạng này giữ
              nguyên lớp ý nghĩa, đồng thời dễ truyền miệng khi Quý khách phát danh thiếp hay in lên bảng hiệu.
            </p>
          </section>

          {/* ── 7. Bảng giá thật + ItemList/Product/Offer ──────────────── */}
          <CategorySimPriceList
            title="Giá sim thần tài đang bán"
            sims={snapshotSims}
            pageUrl={CANONICAL}
            note="Bảng lấy 8 số đuôi 39 / 79 có giá thấp nhất trong kho tại thời điểm cập nhật."
          />

          {/* ── 8. Kho sim thần tài ─────────────────────────────────────── */}
          <CategorySimGrid
            title="Sim Thần Tài Đuôi 39, 79 Mới Cập Nhật"
            searchPlaceholder="Nhập số cần tìm, hoặc *39 / *79 để xem đuôi thần tài"
            emptyText="Kho tạm hết số khớp yêu cầu này. Quý khách thử tìm *39 hoặc *79, hoặc gọi 0938.868.868 để đội ngũ tư vấn lọc số theo đúng ngân sách."
            matchSuffixes={["39", "79"]}
          />

          <LeadMagnetCta />
          <CustomerProof />
          <TrustCommitments />

          {/* FAQ */}
          <FaqAccordion items={faqItems} />

          {/* Cross-links */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Xem thêm các dòng sim khác
            </h2>
            <ul className="flex flex-wrap gap-3 text-sm">
              <li><a href="/sim-loc-phat" className="font-medium text-primary underline-offset-2 hover:underline">Sim lộc phát</a></li>
              <li><a href="/mua-sim-tu-quy" className="font-medium text-primary underline-offset-2 hover:underline">Sim tứ quý</a></li>
              <li><a href="/sim-ong-dia" className="font-medium text-primary underline-offset-2 hover:underline">Sim ông địa</a></li>
              <li><a href="/sim-phong-thuy-hop-menh" className="font-medium text-primary underline-offset-2 hover:underline">Sim phong thủy hợp mệnh</a></li>
              <li><a href="/sim-nam-sinh" className="font-medium text-primary underline-offset-2 hover:underline">Sim năm sinh</a></li>
              <li><a href="/mua-sim-gia-re" className="font-medium text-primary underline-offset-2 hover:underline">Sim giá rẻ</a></li>
            </ul>
          </section>
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