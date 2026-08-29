import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Phone, Star, Sparkles } from "lucide-react";
import BirthYearSimGrid from "@/components/BirthYearSimGrid";
import CategorySimPriceList from "@/components/CategorySimPriceList";
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
import type { NormalizedSIM } from "@/lib/simUtils";
import {
  getCategorySnapshot,
  getBirthDateSims,
  getBirthDateFallbackSims,
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

// ── Mở bài luân phiên ────────────────────────────────────────────────────────
// 4 cách mở bài, chọn theo `year % 4`: deterministic nên SSR/ISR luôn ra cùng
// một chuỗi (không hydration mismatch), mà hàng chục trang năm sinh không đọc
// như một khuôn chữ duy nhất. Dữ kiện can chi / con giáp / mệnh giữ nguyên.
const buildIntro = (year: string, info: YearInfo): string => {
  const variants = [
    `Quý khách sinh năm ${year} sẽ tìm thấy ở đây những số có ${year} trong dãy — năm ${info.canChi}, cầm tinh con ${info.conGiap}, mệnh ${info.menh}. Giá niêm yết công khai, sang tên chính chủ.`,
    `Một dãy số mang sẵn năm ${year} thì Quý khách không phải nhớ nhiều. Kho dưới đây gom những số có ${year} cho người tuổi ${info.canChi} (${info.conGiap}), mệnh ${info.menh}. Nhận SIM, kiểm tra rồi mới thanh toán.`,
    `Chọn số gắn với năm ${year} cho Quý khách hoặc cho người thân tuổi ${info.conGiap} — năm ${info.canChi}, mệnh ${info.menh}. Mỗi số đều hiện giá ngay cạnh, không cần hỏi giá từng số.`,
    `Đội ngũ tư vấn đã lọc sẵn những số có ${year} trong dãy để Quý khách khỏi tìm giữa cả kho: năm ${info.canChi}, cầm tinh con ${info.conGiap}, mệnh ${info.menh}. Giao nội thành HCM trong 30 phút – 2 giờ.`,
  ];
  return variants[Number(year) % 4];
};

type Props = {
  params: Promise<{ year: string }>;
  searchParams: Promise<{ d?: string; m?: string }>;
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
  const description = `Kho sim năm sinh ${year} Mobifone: số có ${year} trong dãy cho người tuổi ${info.canChi} (${info.conGiap}), mệnh ${info.menh}. Giá công khai, sang tên chính chủ, giao nội thành HCM.`;

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

export default async function SimNamSinhPage({ params, searchParams }: Props) {
  const { year } = await params;
  if (!isPlausibleBirthYear(year)) notFound();

  const info = getYearInfo(year);
  // Nếu khách vào qua form (có ?d=&m=) → lọc ưu tiên theo ngày sinh đầy đủ:
  // đuôi năm (1987/87) → yymmdd/ddmmyy → năm trong 6 số cuối. Ngược lại dùng
  // snapshot theo năm như trước.
  const sp = await searchParams;
  const hasBirthDate = !!sp.d && !!sp.m && /^\d{1,2}$/.test(sp.d) && /^\d{1,2}$/.test(sp.m);
  const birthResult = hasBirthDate
    ? await getBirthDateSims(year, String(Number(sp.d)), String(Number(sp.m)), 12)
    : null;

  let snapshotSims: NormalizedSIM[];
  let birthTotal: number;
  let fallbackSims: NormalizedSIM[] | undefined;

  if (birthResult) {
    snapshotSims = birthResult.sims;
    birthTotal = birthResult.total;
    if (birthResult.total === 0) {
      fallbackSims = await getBirthDateFallbackSims(year, sp.m!, 8);
    }
  } else {
    snapshotSims = await getCategorySnapshot({ birthYear: year }, 12);
    birthTotal = await countBirthYearSims(year);
  }

  const faqItems = [
    {
      q: `Sim năm sinh ${year} là gì?`,
      a: `Sim năm sinh ${year} là sim có số ${year} ở các số cuối — năm ${info.canChi}, cầm tinh con ${info.conGiap}, theo quan niệm phong thủy dân gian thuộc mệnh ${info.menh}. Nhiều người chọn số gắn với năm sinh của bản thân hoặc người thân cho dễ nhớ và mang ý nghĩa riêng.`,
    },
    {
      q: `Sim năm sinh ${year} giá bao nhiêu?`,
      a: `Sim năm sinh ${year} Mobifone trải rộng từ vài trăm nghìn đến vài chục triệu đồng, tùy đầu số (090, 093, 07x...) và độ đẹp của dãy số quanh số ${year}. Từng số đều hiện giá ngay trong kho, không phát sinh phí ẩn — Quý khách chủ động so giá trước khi hỏi tư vấn.`,
    },
    {
      q: `Chọn sim hợp tuổi ${year} như thế nào?`,
      a: `Theo quan niệm phong thủy dân gian, người sinh năm ${year} (mệnh ${info.menh}) thường được cho là hợp với những con số bản thân yêu thích, dễ nhớ — đây là niềm tin để tham khảo, không phải khẳng định tuyệt đối. Nếu muốn lọc theo mệnh, Quý khách dùng thêm công cụ Sim phong thủy hợp mệnh.`,
    },
    {
      q: `Mua sim năm sinh ${year} có sang tên chính chủ được không?`,
      a: `Được. Toàn bộ sim tại CHONSOMOBIFONE.COM đều hỗ trợ sang tên chính chủ. Quý khách nhận SIM, kiểm tra kỹ rồi mới trả tiền; chúng tôi hỗ trợ đăng ký qua cửa hàng MobiFone hoặc ứng dụng My Mobifone.`,
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
              {buildIntro(year, info)}
            </p>
            <div className="mx-auto flex max-w-md flex-col justify-center gap-2.5 sm:flex-row">
              <a
                href="/sim-nam-sinh"
                className="flex items-center justify-center gap-2 rounded-lg border border-primary-foreground/25 bg-primary-foreground/10 px-7 py-2.5 font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-foreground/20"
              >
                ← Tìm số khác
              </a>
              <a
                href="#kho-sim"
                className="flex items-center justify-center gap-2 rounded-lg bg-gold px-7 py-2.5 font-bold text-header-bg shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-xl"
              >
                <Star className="h-4 w-4" /> Xem kho sim
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
          {/* Grid sim thật — snapshot server-side, không cần fetch client */}
          <BirthYearSimGrid
            year={year}
            sims={snapshotSims}
            totalCount={birthTotal}
            day={hasBirthDate ? sp.d : undefined}
            month={hasBirthDate ? sp.m : undefined}
            fallbackSims={fallbackSims}
          />

          {/* Bảng giá thật + ItemList/Product/Offer trong HTML thô. 38 trang này
              vốn render số thật qua BirthYearSimGrid nhưng KHÔNG phát Product nào,
              trong khi mọi trang danh mục khác đều có — nên giá của chúng vô hình
              với Google. Dùng chung khối của trang danh mục để không lệch cách làm. */}
          <CategorySimPriceList
            title={`Giá sim năm sinh ${year} đang bán`}
            sims={snapshotSims}
            pageUrl={`${BASE_URL}/sim-nam-sinh/${year}`}
            note={`Bảng lấy 8 số có ${year} trong dãy, giá thấp nhất trong kho tại thời điểm cập nhật.`}
          />

          {/* Cố ý KHÔNG dùng client grid (CategorySimGrid) ở trang năm sinh: bộ
              lọc /api/sims chỉ hỗ trợ đuôi/đầu/tag, KHÔNG có "năm trong 6 số
              cuối"; nếu seed bằng suffix sẽ lệch (nhiều năm grid trống trong khi
              bảng số thật ở trên vẫn có hàng). Snapshot đã render tối đa 12 số
              thật server-side (tốt cho SEO) — khách xem thêm qua nút dưới. */}
          <section className="rounded-xl border border-border bg-card p-6 text-center shadow-card md:p-8">
            <p className="mb-4 leading-relaxed text-muted-foreground">
              Cần thêm số có {year}, hoặc muốn lọc theo giá và đầu số? Quý khách xem toàn bộ kho, hoặc nhắn Zalo để
              đội ngũ tư vấn khoanh vùng giúp trong vài phút.
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

