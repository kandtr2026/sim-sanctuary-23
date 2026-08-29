import type { Metadata } from "next";
import Link from "next/link";
import { Phone, Sparkles, Star } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BASE_URL, buildBreadcrumb } from "@/lib/seo";
import { HANH_SLUGS, hanhFromSlug } from "@/app/sim-hop-menh/_lib/menhSimRanking";
import { ALL_YEARS, getYearInfo, YEAR_FROM, YEAR_TO } from "./_lib/yearContent";

const ZALO_URL = "https://zalo.me/0933356666";

const TITLE = "Sim Hợp Tuổi Theo Năm Sinh 1950–2010 | Mobifone";
const DESCRIPTION =
  "Chọn năm sinh để xem sim hợp tuổi: can chi, nạp âm, bản mệnh và danh sách số thật kèm giá. 61 năm từ 1950 đến 2010, kho Mobifone niêm yết giá công khai.";
const CANONICAL = `${BASE_URL}/sim-hop-tuoi`;

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    title: TITLE,
    description:
      "Sim hợp tuổi theo năm sinh 1950–2010: can chi, nạp âm, bản mệnh và số thật kèm giá trong kho Mobifone.",
    url: CANONICAL,
    images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
  },
};

// Trang hub chỉ dựng từ hằng số + hàm thuần (không đọc kho) nên để tĩnh hoàn toàn.
export const dynamic = "force-static";

/** Gom 61 năm thành từng thập kỷ để danh sách đọc được, không phải một khối 61 link. */
const DECADES: { label: string; years: number[] }[] = (() => {
  const groups = new Map<number, number[]>();
  for (const y of ALL_YEARS) {
    const decade = Math.floor(y / 10) * 10;
    const bucket = groups.get(decade);
    if (bucket) bucket.push(y);
    else groups.set(decade, [y]);
  }
  return [...groups.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([decade, years]) => ({ label: `Thập niên ${decade}`, years }));
})();

const faqItems = [
  {
    q: "Sim hợp tuổi là gì?",
    a: "Sim hợp tuổi là số điện thoại được chọn theo bản mệnh suy từ năm sinh. Mỗi năm sinh có một cặp Thiên Can – Địa Chi, từ đó ra nạp âm và bản mệnh Kim, Mộc, Thủy, Hỏa hoặc Thổ. Theo quan niệm dân gian, dãy số có nhiều chữ số tương sinh với bản mệnh được xem là thuận.",
  },
  {
    q: "Chỉ có năm sinh thì tra được không?",
    a: "Được. Bản mệnh chỉ cần năm sinh là tra ra, nên mỗi trang năm trong danh sách dưới đây đã có sẵn số hợp tuổi kèm giá. Thêm ngày, tháng và giờ sinh thì công cụ tính được cả cung phi Bát Trạch và cân bằng Âm – Dương, danh sách sẽ sát hơn.",
  },
  {
    q: "Số trong các trang này có thật không?",
    a: "Có. Toàn bộ số lấy từ kho Mobifone đang bán của CHONSOMOBIFONE.COM, giá niêm yết công khai ngay cạnh từng số, cập nhật lại mỗi 5 phút. Số đã bán được loại khỏi kho nên không hiện trong danh sách.",
  },
  {
    q: "Điểm phong thủy có chính xác tuyệt đối không?",
    a: "Không. Điểm ở đây dựa trên ngũ hành, Bát Trạch và Kinh Dịch theo quan niệm dân gian, dùng để so sánh giữa các số trong cùng một kho. Quý khách nên cân nhắc thêm các yếu tố khác như đầu số, độ dễ nhớ và ngân sách.",
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

export default function SimHopTuoiHubPage() {
  return (
    <>
      <main className="min-h-screen bg-background">
        <section
          style={{ minHeight: "clamp(280px, 34vw, 340px)" }}
          className="relative flex items-center bg-gradient-to-b from-primary via-primary-dark to-primary text-primary-foreground"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.07]"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 50%, hsl(var(--gold)) 0%, transparent 50%), radial-gradient(circle at 75% 50%, hsl(var(--gold)) 0%, transparent 50%)`,
            }}
          />
          <div className="container relative mx-auto px-4 py-6 text-center">
            <div className="mb-2 flex justify-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gold/30 bg-gold/15">
                <Sparkles aria-hidden className="h-5 w-5 text-gold" />
              </div>
            </div>
            <h1 className="mx-auto mb-3 max-w-3xl text-2xl font-extrabold leading-tight sm:text-3xl md:text-4xl">
              SIM hợp tuổi theo năm sinh — <span className="text-gold">{YEAR_FROM} đến {YEAR_TO}</span>
            </h1>
            <p className="mx-auto mb-5 max-w-2xl text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              Quý khách bấm vào năm sinh, trang năm đã có sẵn can chi, nạp âm, bản mệnh và những số hợp mệnh
              đang còn trong kho kèm giá. Không cần điền form mới xem được.
            </p>
            <div className="mx-auto flex max-w-md flex-col justify-center gap-2.5 sm:flex-row">
              <a
                href="#danh-sach-nam"
                className="flex items-center justify-center gap-2 rounded-lg bg-gold px-7 py-2.5 font-bold text-header-bg shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-xl"
              >
                <Star aria-hidden className="h-4 w-4" /> Chọn năm sinh
              </a>
              <a
                href={ZALO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg border border-primary-foreground/25 bg-primary-foreground/10 px-7 py-2.5 font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-foreground/20"
              >
                <Phone aria-hidden className="h-4 w-4" /> Tư vấn chọn sim
              </a>
            </div>
          </div>
        </section>

        <div className="container mx-auto space-y-10 px-4 py-8 md:space-y-14 md:py-12">
          {/* Danh sách năm theo thập kỷ */}
          <section id="danh-sach-nam" className="scroll-mt-20 space-y-6">
            <h2 className="flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span aria-hidden className="h-8 w-1 rounded-full bg-primary" />
              Chọn năm sinh của Quý khách
            </h2>
            {DECADES.map((group) => (
              <div key={group.label} className="rounded-xl border border-border bg-card p-4 shadow-card md:p-6">
                <h3 className="mb-3 text-base font-bold text-foreground md:text-lg">{group.label}</h3>
                <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
                  {group.years.map((year) => {
                    const info = getYearInfo(year);
                    return (
                      <li key={year}>
                        <Link
                          href={`/sim-hop-tuoi/${year}`}
                          className="block rounded-lg border border-border bg-secondary/20 px-3 py-2.5 transition hover:border-primary/40 hover:bg-secondary/40"
                        >
                          <span className="block font-bold text-foreground">Tuổi {year}</span>
                          <span className="block text-xs text-muted-foreground">
                            {info.canChi} · mệnh {info.menh}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </section>

          {/* Vào theo mệnh */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span aria-hidden className="h-8 w-1 rounded-full bg-primary" />
              Đã biết bản mệnh? Vào thẳng trang mệnh
            </h2>
            <p className="mb-5 leading-relaxed text-muted-foreground">
              Quý khách đã biết mệnh thì không cần đi qua năm sinh. Mỗi trang mệnh có bảng chữ số nên
              ưu tiên, chữ số nên tránh và số thật kèm giá.
            </p>
            <ul className="flex flex-wrap gap-3 text-sm">
              {HANH_SLUGS.map((slug) => {
                const hanh = hanhFromSlug(slug);
                return (
                  <li key={slug}>
                    <Link
                      href={`/sim-hop-menh/${slug}`}
                      className="inline-flex items-center rounded-lg border border-border px-5 py-2.5 font-semibold text-primary transition hover:bg-secondary/40"
                    >
                      Sim hợp mệnh {hanh}
                    </Link>
                  </li>
                );
              })}
              <li>
                <Link
                  href="/sim-phong-thuy"
                  className="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                  Chưa biết mệnh — tra bằng ngày sinh
                </Link>
              </li>
            </ul>
          </section>

          {/* Cách đọc một trang năm */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span aria-hidden className="h-8 w-1 rounded-full bg-primary" />
              Mỗi trang năm sinh có gì
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {[
                {
                  t: "Can chi, nạp âm, bản mệnh",
                  b: "Bốn dữ kiện gốc suy từ năm sinh theo bảng 60 hoa giáp, kèm cung phi Bát Trạch cho cả nam và nữ.",
                },
                {
                  t: "Chữ số nên ưu tiên, nên tránh",
                  b: "Bảng phân loại 10 chữ số theo quan hệ tương sinh – tương khắc với bản mệnh của năm đó.",
                },
                {
                  t: "Số thật kèm giá niêm yết",
                  b: "Những số thuộc nhóm điểm cao nhất trong kho Mobifone, giá hiện ngay cạnh, đặt mua trực tiếp.",
                },
                {
                  t: "Điểm phong thủy từng số",
                  b: "Điểm ngũ hành, tổng nút và quẻ dịch của 4 số cuối, chấm bằng cùng engine với công cụ xem sim hợp tuổi.",
                },
              ].map((item) => (
                <div key={item.t} className="rounded-lg border border-border bg-secondary/20 p-4">
                  <h3 className="mb-1.5 font-semibold text-foreground">{item.t}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.b}</p>
                </div>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span aria-hidden className="h-8 w-1 rounded-full bg-primary" />
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

          <p className="rounded-xl border border-border bg-secondary/20 p-5 text-center text-sm leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Lưu ý:</strong> Nội dung phong thủy trong cụm trang này dựa
            trên ngũ hành, Bát Trạch và Kinh Dịch theo quan niệm dân gian. Đây là căn cứ để so sánh giữa các
            số, không phải cơ sở khoa học và không phải lời hứa thay đổi vận may.
          </p>
        </div>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumb([
              { name: "Trang chủ", path: "/" },
              { name: "Sim hợp tuổi", path: "/sim-hop-tuoi" },
            ]),
          ),
        }}
      />
    </>
  );
}
