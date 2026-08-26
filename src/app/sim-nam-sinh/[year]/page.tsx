import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Phone, Star, Sparkles } from "lucide-react";
import SimSnapshot from "@/components/SimSnapshot";
import TrustCommitments from "@/components/TrustCommitments";
import CustomerProof from "@/components/CustomerProof";
import LeadMagnetCta from "@/components/LeadMagnetCta";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buildBreadcrumb, BASE_URL } from "@/lib/seo";
import {
  getCategorySnapshot,
  getInStockBirthYears,
  countBirthYearSims,
  isPlausibleBirthYear,
  BIRTH_YEAR_MIN_INVENTORY,
} from "@/lib/serverSimData";

const ZALO_URL = "https://zalo.me/0933356666";

// ISR: prerender các năm có tồn kho + revalidate 300s (khớp /api/sims).
// dynamicParams = true: năm nằm trong khoảng hợp lệ nhưng CHƯA prerender (vd
// URL cũ /sim-nam-sinh-YYYY được 308 về đây) vẫn render on-demand để giữ link
// equity; năm ngoài khoảng → notFound(). Trang dưới ngưỡng tồn kho sẽ noindex
// (xem generateMetadata) nên không tạo trang mỏng trong index.
export const revalidate = 300;
export const dynamicParams = true;

// ── Can Chi + mệnh (nạp âm ngũ hành) suy ra từ năm ───────────────────────────
// Deterministic, không gọi dữ liệu — chỉ để mỗi trang năm có nội dung RIÊNG
// (tránh N trang giống hệt). Trình bày như quan niệm dân gian, không tuyệt đối.
const THIEN_CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const DIA_CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
const CON_GIAP = ["Chuột", "Trâu", "Hổ", "Mèo", "Rồng", "Rắn", "Ngựa", "Dê", "Khỉ", "Gà", "Chó", "Lợn"];
const MENH = ["", "Kim", "Thủy", "Hỏa", "Thổ", "Mộc"] as const; // index 1..5

interface YearInfo {
  canChi: string; // "Canh Ngọ"
  conGiap: string; // "Ngựa"
  menh: string; // "Thổ"
}

const getYearInfo = (year: string): YearInfo => {
  const y = Number(year);
  const canIdx = (((y - 4) % 10) + 10) % 10;
  const chiIdx = (((y - 4) % 12) + 12) % 12;
  // Nạp âm: canValue 1..5 (Giáp/Ất=1…Nhâm/Quý=5), chiValue 0..2, tổng rút gọn.
  const canValue = Math.floor(canIdx / 2) + 1;
  const chiValue = Math.floor((chiIdx % 6) / 2);
  let sum = canValue + chiValue;
  if (sum > 5) sum -= 5;
  return {
    canChi: `${THIEN_CAN[canIdx]} ${DIA_CHI[chiIdx]}`,
    conGiap: CON_GIAP[chiIdx],
    menh: MENH[sum],
  };
};

type Props = {
  params: Promise<{ year: string }>;
};

export async function generateStaticParams() {
  // Chỉ prerender năm có tồn kho THẬT ≥ ngưỡng (dùng chung helper với sitemap).
  const years = await getInStockBirthYears();
  return years.map((year) => ({ year }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { year } = await params;
  if (!isPlausibleBirthYear(year)) return {};

  const info = getYearInfo(year);
  const canonical = `${BASE_URL}/sim-nam-sinh/${year}`;
  const title = `Sim Năm Sinh ${year} Mobifone | Chọn Số Hợp Tuổi ${year}`;
  const description = `Kho sim năm sinh ${year} Mobifone: sim có số ${year} cho người tuổi ${info.canChi} (${info.conGiap}), mệnh ${info.menh}. Giá niêm yết công khai, sang tên chính chủ, giao nội thành HCM.`;

  // Năm hợp lệ nhưng tồn kho dưới ngưỡng (thường chỉ tới từ URL cũ redirect) →
  // noindex, follow: giữ link equity mà không đẩy trang mỏng vào chỉ mục.
  const count = await countBirthYearSims(year);
  const thin = count < BIRTH_YEAR_MIN_INVENTORY;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    ...(thin ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: "website",
      title,
      description: `Sim năm sinh ${year} Mobifone — có số ${year} hợp tuổi ${info.conGiap}. Giá công khai, chính chủ.`,
      url: canonical,
      images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
    },
  };
}

export default async function SimNamSinhPage({ params }: Props) {
  const { year } = await params;
  if (!isPlausibleBirthYear(year)) notFound();

  const info = getYearInfo(year);
  // Sim năm sinh = 4 số của năm trong 6 số cuối (dùng chung helper với
  // generateStaticParams + sitemap). Lấy tới 12 số thật để render server-side.
  const snapshotSims = await getCategorySnapshot({ birthYear: year }, 12);
  const otherYears = (await getInStockBirthYears())
    .filter((y) => y !== year)
    .slice(0, 12);

  const faqItems = [
    {
      q: `Sim năm sinh ${year} là gì?`,
      a: `Sim năm sinh ${year} là sim có số ${year} ở các số cuối — năm ${info.canChi}, cầm tinh con ${info.conGiap}, theo quan niệm phong thủy dân gian thuộc mệnh ${info.menh}. Nhiều người chọn số gắn với năm sinh của mình hoặc người thân cho dễ nhớ và mang ý nghĩa cá nhân.`,
    },
    {
      q: `Sim năm sinh ${year} giá bao nhiêu?`,
      a: `Sim năm sinh ${year} Mobifone có giá từ vài trăm nghìn đến vài chục triệu đồng, tùy đầu số (090, 093, 07x...) và độ đẹp của dãy số quanh số ${year}. Giá niêm yết công khai trên kho, không phát sinh phí ẩn.`,
    },
    {
      q: `Chọn sim hợp tuổi ${year} như thế nào?`,
      a: `Theo quan niệm phong thủy dân gian, người sinh năm ${year} (mệnh ${info.menh}) thường được cho là hợp với những con số mình yêu thích, dễ nhớ — đây là niềm tin để tham khảo, không phải khẳng định tuyệt đối. Nếu muốn lọc sim theo mệnh, bạn có thể dùng công cụ Sim phong thủy hợp mệnh.`,
    },
    {
      q: `Mua sim năm sinh ${year} có sang tên chính chủ được không?`,
      a: `Được. Toàn bộ sim tại CHONSOMOBIFONE.COM đều hỗ trợ sang tên chính chủ. Bạn nhận SIM trước, kiểm tra kỹ rồi mới trả tiền; hỗ trợ đăng ký qua cửa hàng MobiFone hoặc ứng dụng My Mobifone.`,
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
              SIM năm sinh {year} — <span className="text-gold">chọn số hợp tuổi {year} theo phong thủy</span>
            </h1>
            <p className="mx-auto mb-5 max-w-xl text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              Sim có số {year} cho người tuổi {info.canChi} ({info.conGiap}), mệnh {info.menh}. Giá niêm yết công khai,
              sang tên chính chủ, giao tận nơi nội thành HCM.
            </p>
            <div className="mx-auto flex max-w-md flex-col justify-center gap-2.5 sm:flex-row">
              <a
                href="#kho-sim"
                className="flex items-center justify-center gap-2 rounded-lg bg-gold px-7 py-2.5 font-bold text-header-bg shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-xl"
              >
                <Star className="h-4 w-4" /> Xem kho sim năm sinh {year}
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
          {/* Intro — nội dung RIÊNG theo năm (can chi + mệnh) */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Sim năm sinh {year} là gì?
            </h2>
            <div className="space-y-4 leading-relaxed text-muted-foreground">
              <p>
                Sim năm sinh {year} là dòng sim có <strong className="text-foreground">số {year} ở các số cuối</strong> —
                gắn với năm sinh. Năm {year} là năm <strong className="text-foreground">{info.canChi}</strong>, cầm
                tinh con {info.conGiap}; theo quan niệm phong thủy dân gian thuộc mệnh{" "}
                <strong className="text-foreground">{info.menh}</strong>.
              </p>
              <p>
                Nhiều người chọn sim gắn với năm sinh của mình hoặc người thân vì dễ nhớ và mang ý nghĩa cá nhân. Đây là
                lựa chọn theo sở thích và niềm tin tham khảo, không phải khẳng định tuyệt đối về may rủi.
              </p>
            </div>
          </section>

          {/* Server-rendered snapshot: số thật + ItemList/Product schema */}
          <div id="kho-sim">
            <SimSnapshot
              title={`Sim Năm Sinh ${year} Nổi Bật Trong Kho`}
              sims={snapshotSims}
              pageUrl={`${BASE_URL}/sim-nam-sinh/${year}`}
            />
          </div>

          {/* Cố ý KHÔNG dùng client grid (CategorySimGrid) ở trang năm sinh: bộ
              lọc /api/sims chỉ hỗ trợ đuôi/đầu/tag, KHÔNG có "năm trong 6 số
              cuối"; nếu seed bằng suffix sẽ lệch (nhiều năm grid trống trong khi
              bảng số thật ở trên vẫn có hàng). Snapshot đã render tối đa 12 số
              thật server-side (tốt cho SEO) — khách xem thêm qua nút dưới. */}
          <section className="rounded-xl border border-border bg-card p-6 text-center shadow-card md:p-8">
            <p className="mb-4 leading-relaxed text-muted-foreground">
              Muốn xem thêm sim năm sinh {year} hoặc lọc theo giá, đầu số? Xem toàn bộ kho sim hoặc nhắn Zalo để được
              tư vấn chọn số nhanh.
            </p>
            <div className="flex flex-col justify-center gap-2.5 sm:flex-row">
              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                <Star className="h-4 w-4" /> Xem toàn bộ kho sim
              </a>
              <a
                href={ZALO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-6 py-2.5 font-semibold text-primary transition hover:bg-secondary/40"
              >
                <Phone className="h-4 w-4" /> Nhắn Zalo tư vấn
              </a>
            </div>
          </section>

          <LeadMagnetCta />

          {/* Phong thủy — trình bày như niềm tin dân gian */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Chọn sim hợp tuổi {year} theo phong thủy
            </h2>
            <div className="space-y-4 leading-relaxed text-muted-foreground">
              <p>
                Theo quan niệm phong thủy dân gian, người sinh năm {year} (tuổi {info.conGiap}, mệnh {info.menh}) thường
                được cho là hợp với những con số mình yêu thích và dễ nhớ. Đây là niềm tin để tham khảo, không phải lời
                khẳng định về tài lộc hay vận may.
              </p>
              <p>
                Nếu bạn muốn lọc sim theo mệnh Kim, Mộc, Thủy, Hỏa, Thổ, hãy thử{" "}
                <a href="/sim-phong-thuy-hop-menh" className="font-medium text-primary underline-offset-2 hover:underline">
                  công cụ Sim phong thủy hợp mệnh
                </a>{" "}
                để xem gợi ý chi tiết hơn.
              </p>
            </div>
          </section>

          <CustomerProof />
          <TrustCommitments />

          {/* FAQ */}
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

          {/* Cross-links */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Xem thêm
            </h2>
            {otherYears.length > 0 && (
              <>
                <h3 className="mb-2 text-lg font-bold text-foreground">Sim năm sinh các năm khác</h3>
                <ul className="mb-6 flex flex-wrap gap-3 text-sm">
                  {otherYears.map((y) => (
                    <li key={y}>
                      <a
                        href={`/sim-nam-sinh/${y}`}
                        className="font-medium text-primary underline-offset-2 hover:underline"
                      >
                        Sim năm sinh {y}
                      </a>
                    </li>
                  ))}
                </ul>
              </>
            )}
            <h3 className="mb-2 text-lg font-bold text-foreground">Dòng sim nổi bật</h3>
            <ul className="flex flex-wrap gap-3 text-sm">
              <li>
                <a href="/sim-than-tai" className="font-medium text-primary underline-offset-2 hover:underline">
                  Sim thần tài
                </a>
              </li>
              <li>
                <a href="/sim-loc-phat" className="font-medium text-primary underline-offset-2 hover:underline">
                  Sim lộc phát
                </a>
              </li>
              <li>
                <a href="/sim-phong-thuy-hop-menh" className="font-medium text-primary underline-offset-2 hover:underline">
                  Sim phong thủy hợp mệnh
                </a>
              </li>
              <li>
                <a href="/mua-sim-tu-quy" className="font-medium text-primary underline-offset-2 hover:underline">
                  Sim tứ quý
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
              { name: `Sim năm sinh ${year}`, path: `/sim-nam-sinh/${year}` },
            ]),
          ),
        }}
      />
    </>
  );
}

