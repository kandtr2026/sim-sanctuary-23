import type { Metadata } from "next";
import { Phone, Star, Sparkles } from "lucide-react";
import CategorySimGrid from "@/components/CategorySimGrid";
import TrustCommitments from "@/components/TrustCommitments";
import CustomerProof from "@/components/CustomerProof";
import LeadMagnetCta from "@/components/LeadMagnetCta";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buildBreadcrumb } from "@/lib/seo";
import { getCategorySnapshot } from "@/lib/serverSimData";

// ISR: prerender + revalidate every 300s (khớp /api/sims) so crawlers hit a
// cached page instead of forcing SSR (ƒ) on every request.
export const revalidate = 300;

const ZALO_URL = "https://zalo.me/0933356666";

const TITLE = "Sim Lộc Phát 68 86 | Kho Sim Lộc Phát Mobifone Đẹp";
const DESCRIPTION =
  "Sim lộc phát Mobifone đuôi 68, 86, 6868, 6688 cho Quý khách: giá niêm yết công khai, nhận SIM rồi mới thanh toán, sang tên chính chủ, giao tận nơi HCM.";
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
    a: "Từ vài trăm nghìn đến hàng chục triệu đồng, tùy đầu số và độ đẹp của dãy. Mỗi số có giá hiện sẵn trong kho, không phí ẩn, nên Quý khách so giá vài số rồi mới quyết.",
  },
  {
    q: "Mua sim lộc phát có sang tên chính chủ được không?",
    a: "Được. Mọi số lộc phát tại CHONSOMOBIFONE.COM đều sang tên chính chủ. Quý khách nhận SIM, kiểm tra kỹ rồi mới thanh toán; phần đăng ký chính chủ có đội ngũ hỗ trợ tại cửa hàng MobiFone hoặc trên ứng dụng My Mobifone.",
  },
  {
    q: "Giao sim lộc phát mất bao lâu?",
    a: "Nội thành TP.HCM, số về tay Quý khách trong 30 phút – 2 giờ làm việc. Các tỉnh thành khác đi chuyển phát nhanh, 1–3 ngày làm việc. Thanh toán COD lúc nhận hoặc chuyển khoản trước, tùy Quý khách chọn.",
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
              Sim Lộc Phát Mobifone — <span className="text-gold">đuôi 68, 86, 6868</span>
            </h1>
            <p className="mx-auto mb-5 max-w-xl text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              Đọc thử trước khi chọn: 68 là lộc phát, 86 là phát lộc. Giá công khai từng số, sang tên chính chủ, giao nội thành HCM trong 30 phút – 2 giờ.
            </p>
            <div className="mx-auto flex max-w-md flex-col justify-center gap-2.5 sm:flex-row">
              <a
                href="#kho-sim"
                className="flex items-center justify-center gap-2 rounded-lg bg-gold px-7 py-2.5 font-bold text-header-bg shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-xl"
              >
                <Star className="h-4 w-4" /> Xem kho sim lộc phát
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
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Sim lộc phát là gì? Đuôi 68 và 86 khác nhau ra sao
            </h2>
            <div className="space-y-4 leading-relaxed text-muted-foreground">
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
          </section>

          
          <CategorySimGrid
            title="Sim Lộc Phát Đuôi 68, 86 Mới Cập Nhật"
            searchPlaceholder="Nhập số cần tìm, hoặc *68 / *86 để xem đuôi lộc phát"
            emptyText="Chưa có số nào khớp yêu cầu này. Quý khách thử *68, *86 hoặc 6868, hoặc gọi 0938.868.868 để đội ngũ tư vấn lọc kho theo ngân sách."
            matchSuffixes={["68", "86"]}
          />

          <LeadMagnetCta />

          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Giá sim lộc phát bao nhiêu?
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Sim lộc phát có giá từ vài trăm nghìn đến vài chục triệu đồng. Đuôi 6868, 6688, số đầu 090/093 và những dãy
              dễ nhớ nằm ở nhóm cao hơn. Giá hiện sẵn cạnh từng số trong kho, nên Quý khách so được nhiều số cùng lúc rồi
              mới quyết, không phải hỏi giá từng số một.
            </p>
          </section>

          {/* Customer proof */}
          <CustomerProof />

          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Ai nên dùng sim lộc phát
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Chủ cửa hàng, người kinh doanh, người vừa mua xe hoặc mua nhà là nhóm chọn đuôi 68/86 nhiều nhất. Số đọc
              qua điện thoại rất trôi, đối tác và khách hàng ghi lại một lần là xong.
            </p>
          </section>

          {/* Trust */}
          <TrustCommitments />

          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Câu hỏi thường gặp
            </h2>
            <Accordion type="single" collapsible className="space-y-2">
              {faqItems.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  className="rounded-lg border border-border px-4 data-[state=open]:bg-secondary/30"
                >
                  <AccordionTrigger className="py-4 text-left font-medium text-foreground hover:text-primary hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Xem thêm các dòng sim khác
            </h2>
            <ul className="flex flex-wrap gap-3 text-sm">
              <li>
                <a href="/sim-than-tai" className="font-medium text-primary underline-offset-2 hover:underline">
                  Sim thần tài
                </a>
              </li>
              <li>
                <a href="/mua-sim-tu-quy" className="font-medium text-primary underline-offset-2 hover:underline">
                  Sim tứ quý
                </a>
              </li>
              <li>
                <a href="/sim-ong-dia" className="font-medium text-primary underline-offset-2 hover:underline">
                  Sim ông địa
                </a>
              </li>
              <li>
                <a href="/sim-phong-thuy-hop-menh" className="font-medium text-primary underline-offset-2 hover:underline">
                  Sim phong thủy hợp mệnh
                </a>
              </li>
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
              { name: "Sim lộc phát", path: "/sim-loc-phat" },
            ]),
          ),
        }}
      />
    </>
  );
}
