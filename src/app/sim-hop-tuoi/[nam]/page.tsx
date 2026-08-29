import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Phone, Sparkles, Star } from "lucide-react";
import CategorySimPriceList from "@/components/CategorySimPriceList";
import TrustCommitments from "@/components/TrustCommitments";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BASE_URL, buildBreadcrumb } from "@/lib/seo";
import NguHanhDigitTable from "@/app/sim-hop-menh/_components/NguHanhDigitTable";
import TopScoreBreakdown from "@/app/sim-hop-menh/_components/TopScoreBreakdown";
import {
  getRankedPool,
  pickRotated,
  profileForYear,
  ROWS_PER_PAGE,
  slugFromHanh,
} from "@/app/sim-hop-menh/_lib/menhSimRanking";
import { HANH_COPY } from "@/app/sim-hop-menh/_lib/menhContent";
import {
  ALL_YEARS,
  buildDescription,
  buildIntro,
  buildTitle,
  getYearInfo,
  isSupportedYear,
  type YearInfo,
} from "../_lib/yearContent";

const ZALO_URL = "https://zalo.me/0933356666";

// ISR: prerender cả 61 năm 1950–2010 + revalidate 300s (khớp /api/sims và các
// trang danh mục khác). generateStaticParams ở đây KHÔNG phụ thuộc dữ liệu —
// khoảng năm là hằng số — nên một lần Supabase lỗi không làm mất trang nào.
// dynamicParams = false: năm ngoài khoảng trả 404 chứ không dựng trang mỏng.
export const revalidate = 300;
export const dynamicParams = false;

/** Dưới ngưỡng này thì noindex, follow — khuôn lấy từ /sim-nam-sinh/[year]. */
const MIN_SIMS_TO_INDEX = 8;

type Props = { params: Promise<{ nam: string }> };

export function generateStaticParams() {
  return ALL_YEARS.map((nam) => ({ nam: String(nam) }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { nam } = await params;
  if (!isSupportedYear(nam)) return {};

  const info = getYearInfo(Number(nam));
  const canonical = `${BASE_URL}/sim-hop-tuoi/${nam}`;
  const title = buildTitle(info);
  const description = buildDescription(info);

  // Kho không đủ số cho mệnh này (thực tế chỉ xảy ra khi đọc kho thất bại) →
  // noindex, follow: giữ link equity mà không đẩy trang rỗng vào chỉ mục.
  const pool = await getRankedPool(profileForYear(info.nam));
  const thin = pool.length < MIN_SIMS_TO_INDEX;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    ...(thin ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: "website",
      title,
      description: `Sim hợp tuổi ${nam} — người ${info.canChi}, mệnh ${info.menh}. Số thật trong kho Mobifone, giá niêm yết công khai.`,
      url: canonical,
      images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
    },
  };
}

const buildFaq = (info: YearInfo) => {
  const { nam, canChi, conGiap, napAm, menh, soUuTien, soNenTranh, soDongHanh } = info;
  return [
    {
      q: `Người sinh năm ${nam} mệnh gì?`,
      a: `Năm ${nam} là năm ${canChi}, cầm tinh con ${conGiap}. Nạp âm của năm này là ${napAm}, tức bản mệnh ${menh} theo bảng 60 hoa giáp. Mệnh được suy từ Thiên Can – Địa Chi của năm sinh nên chỉ cần năm sinh là tra được, không cần giờ sinh.`,
    },
    {
      q: `Sim hợp tuổi ${nam} nên có những chữ số nào?`,
      a: `Theo quan niệm dân gian, người mệnh ${menh} nên ưu tiên chữ số ${soUuTien} (hành tương sinh) và ${soDongHanh} (đồng hành), hạn chế chữ số ${soNenTranh} vì bị xem là khắc bản mệnh. Cách chấm điểm trong trang này cộng trừ đúng theo quan hệ đó.`,
    },
    {
      q: `Điểm phong thủy của từng số được chấm thế nào?`,
      a: `Mỗi số trong kho được chấm trên 5 trụ cột: ngũ hành bản mệnh (40%), cân bằng Âm – Dương (20%), tổng nút (15%), quẻ dịch theo 4 số cuối (20%) và cấu trúc số (5%). Danh sách ở trang này dùng mệnh ${menh} của năm ${nam}, với giờ sinh và giới tính để mặc định.`,
    },
    {
      q: `Mua sim hợp tuổi ${nam} có sang tên chính chủ được không?`,
      a: `Được. Toàn bộ sim tại CHONSOMOBIFONE.COM đều hỗ trợ sang tên chính chủ. Quý khách nhận SIM, kiểm tra đúng số đã chọn rồi mới trả tiền. Giao nội thành TP.HCM 30 phút – 2 giờ, các tỉnh khác 1–3 ngày.`,
    },
  ];
};

export default async function SimHopTuoiYearPage({ params }: Props) {
  const { nam } = await params;
  if (!isSupportedYear(nam)) notFound();

  const info = getYearInfo(Number(nam));
  const profile = profileForYear(info.nam);
  const pool = await getRankedPool(profile);
  // Mỗi năm lấy một lát khác nhau trong nhóm điểm cao nhất: hai năm cùng mệnh và
  // cùng âm/dương cung phi (vd 1963 với 2000) vốn được engine trả về danh sách
  // giống hệt — xoay lát để 61 trang không in cùng một bảng số.
  const picked = pickRotated(pool, info.nam, ROWS_PER_PAGE);
  const priceSims = picked.map((p) => p.sim);

  const hanhCopy = HANH_COPY[info.menh];
  const hanhSlug = slugFromHanh(info.menh);
  const canonical = `${BASE_URL}/sim-hop-tuoi/${nam}`;
  const faqItems = buildFaq(info);

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
              SIM hợp tuổi {nam} — <span className="text-gold">mệnh {info.menh}, tuổi {info.canChi}</span>
            </h1>
            <p className="mx-auto mb-5 max-w-2xl text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              {buildIntro(info)}
            </p>
            <div className="mx-auto flex max-w-xl flex-col justify-center gap-2.5 sm:flex-row">
              <a
                href="#kho-sim"
                className="flex items-center justify-center gap-2 rounded-lg bg-gold px-6 py-2.5 font-bold text-header-bg shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-xl"
              >
                <Star aria-hidden className="h-4 w-4" /> Xem số hợp tuổi {nam}
              </a>
              <Link
                href={`/sim-phong-thuy?nam=${nam}`}
                className="flex items-center justify-center gap-2 rounded-lg border border-primary-foreground/25 bg-primary-foreground/10 px-6 py-2.5 font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-foreground/20"
              >
                Chấm theo giờ sinh
              </Link>
              <a
                href={ZALO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg border border-primary-foreground/25 bg-primary-foreground/10 px-6 py-2.5 font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-foreground/20"
              >
                <Phone aria-hidden className="h-4 w-4" /> Tư vấn chọn sim
              </a>
            </div>
          </div>
        </section>

        <div className="container mx-auto space-y-10 px-4 py-8 md:space-y-14 md:py-12">
          {/* Hồ sơ phong thủy của năm — dữ kiện riêng của từng trang */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span aria-hidden className="h-8 w-1 rounded-full bg-primary" />
              Người sinh năm {nam} mệnh gì?
            </h2>
            <dl className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { k: "Can Chi", v: info.canChi },
                { k: "Cầm tinh", v: `Con ${info.conGiap}` },
                { k: "Nạp âm", v: info.napAm },
                { k: "Bản mệnh", v: info.menh },
              ].map((cell) => (
                <div key={cell.k} className="rounded-lg border border-border bg-secondary/20 p-3.5">
                  <dt className="mb-1 text-xs text-muted-foreground">{cell.k}</dt>
                  <dd className="text-base font-bold text-foreground">{cell.v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Nạp âm {info.napAm}
              {info.napAmGloss ? ` — ${info.napAmGloss}` : ""}. {hanhCopy.tinhChat} {hanhCopy.loiKhuyen}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Cung phi Bát Trạch của năm {nam} khác nhau theo giới tính: nam là cung {info.cungPhiNam.cung} (
              {info.cungPhiNam.nguHanh}, {info.cungPhiNam.amDuong}), nữ là cung {info.cungPhiNu.cung} (
              {info.cungPhiNu.nguHanh}, {info.cungPhiNu.amDuong}). Cung phi ảnh hưởng phần cân bằng Âm – Dương
              khi chấm điểm, nên Quý khách nhập thêm giới tính và giờ sinh ở{" "}
              <Link href={`/sim-phong-thuy?nam=${nam}`} className="font-medium text-primary underline-offset-2 hover:underline">
                công cụ xem sim hợp tuổi
              </Link>{" "}
              để có danh sách sát hơn.
            </p>
          </section>

          {/* Bảng số nên ưu tiên / nên tránh theo mệnh của năm */}
          <NguHanhDigitTable menh={info.menh} />

          {/* Số thật + giá + ItemList/Product/Offer JSON-LD (khối dùng chung của
              các trang danh mục — không tự viết schema mới ở đây). */}
          <div id="kho-sim" className="scroll-mt-20">
            <CategorySimPriceList
              title={`Sim hợp tuổi ${nam} đang có trong kho`}
              sims={priceSims}
              pageUrl={canonical}
              intro={`${priceSims.length} số thuộc nhóm điểm cao nhất khi chấm theo mệnh ${info.menh} của người sinh năm ${nam}. Giá đã niêm yết, Quý khách xem rồi chốt.`}
              note={`Điểm chấm theo mệnh ${info.menh}, giờ sinh và giới tính lấy mặc định (giờ Tý, nam) vì trang này chỉ biết năm sinh. Kho đổi hàng liên tục nên bảng cập nhật lại mỗi 5 phút.`}
            />
          </div>

          {/* Chi tiết chấm điểm 3 số dẫn đầu — tập con của bảng trên, không phát
              thêm schema (xem chú thích trong TopScoreBreakdown). */}
          <TopScoreBreakdown
            items={picked.slice(0, 3)}
            heading={`Ba số dẫn đầu cho tuổi ${nam} — chi tiết chấm điểm`}
            note={`Điểm lấy từ cùng một engine với công cụ /sim-phong-thuy: ngũ hành bản mệnh ${info.menh}, tổng nút và quẻ dịch của 4 số cuối. Quẻ dịch là cách luận theo Kinh Dịch dân gian, chỉ để tham khảo.`}
          />

          {/* Không có số nào (kho lỗi) — nói thẳng thay vì để trang trống */}
          {priceSims.length === 0 ? (
            <section className="rounded-xl border border-border bg-card p-6 text-center shadow-card md:p-8">
              <p className="mb-4 leading-relaxed text-muted-foreground">
                Kho đang cập nhật nên chưa tải được số hợp tuổi {nam}. Quý khách thử lại sau ít phút, hoặc nhắn
                Zalo để đội ngũ tư vấn tra trực tiếp giúp.
              </p>
              <a
                href={ZALO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-2.5 font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                <Phone aria-hidden className="h-4 w-4" /> Nhắn Zalo tư vấn
              </a>
            </section>
          ) : null}

          {/* Điều hướng sang công cụ + các cụm liên quan */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span aria-hidden className="h-8 w-1 rounded-full bg-primary" />
              Muốn chấm sát hơn cho tuổi {nam}?
            </h2>
            <p className="mb-5 leading-relaxed text-muted-foreground">
              Trang này chấm theo mệnh của năm sinh. Thêm ngày, tháng và giờ sinh thì công cụ tính được cả cung
              phi và cân bằng Âm – Dương, danh sách sẽ khác đi. Anh Chị bấm vào ô đầu tiên bên dưới, form đã
              điền sẵn năm {nam}.
            </p>
            <ul className="flex flex-wrap gap-3 text-sm">
              <li>
                <Link
                  href={`/sim-phong-thuy?nam=${nam}`}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                  Xem sim hợp tuổi {nam} theo giờ sinh
                </Link>
              </li>
              <li>
                <Link
                  href={`/sim-hop-menh/${hanhSlug}`}
                  className="inline-flex items-center rounded-lg border border-border px-5 py-2.5 font-semibold text-primary transition hover:bg-secondary/40"
                >
                  Sim hợp mệnh {info.menh}
                </Link>
              </li>
              {/* /sim-nam-sinh/[year] chỉ nhận năm 1955–2025 (isPlausibleBirthYear),
                  nên năm 1950–1954 KHÔNG được link sang đó — sẽ là 404. */}
              {info.nam >= 1955 ? (
                <li>
                  <Link
                    href={`/sim-nam-sinh/${nam}`}
                    className="inline-flex items-center rounded-lg border border-border px-5 py-2.5 font-semibold text-primary transition hover:bg-secondary/40"
                  >
                    Sim có số {nam} trong dãy
                  </Link>
                </li>
              ) : null}
              <li>
                <Link
                  href="/sim-hop-tuoi"
                  className="inline-flex items-center rounded-lg border border-border px-5 py-2.5 font-semibold text-primary transition hover:bg-secondary/40"
                >
                  Xem các năm sinh khác
                </Link>
              </li>
            </ul>
          </section>

          <TrustCommitments />

          {/* FAQ */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-6 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span aria-hidden className="h-8 w-1 rounded-full bg-primary" />
              Câu hỏi thường gặp về sim hợp tuổi {nam}
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
            <strong className="text-foreground">Lưu ý:</strong> Nội dung phong thủy trên trang này dựa trên
            ngũ hành, Bát Trạch và Kinh Dịch theo quan niệm dân gian, được dùng để so sánh giữa các số. Đây
            không phải cơ sở khoa học và không phải lời hứa thay đổi vận may.
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
              { name: `Sim hợp tuổi ${nam}`, path: `/sim-hop-tuoi/${nam}` },
            ]),
          ),
        }}
      />
    </>
  );
}
