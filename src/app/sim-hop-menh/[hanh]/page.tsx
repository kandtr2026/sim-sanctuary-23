import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Phone, Sparkles, Star } from "lucide-react";
import CategorySimPriceList from "@/components/CategorySimPriceList";
import TrustCommitments from "@/components/TrustCommitments";
import FaqAccordion from "@/components/FaqAccordion";
import { BASE_URL, buildBreadcrumb } from "@/lib/seo";
import { TUONG_KHAC, TUONG_SINH, tinhCanChi, type NguHanh } from "@/lib/simHopTuoi";
import NguHanhDigitTable from "../_components/NguHanhDigitTable";
import TopScoreBreakdown from "../_components/TopScoreBreakdown";
import {
  getRankedPool,
  HANH_SLUGS,
  hanhFromSlug,
  pickRotated,
  profileForHanh,
  repYearForHanh,
  ROWS_PER_PAGE,
} from "../_lib/menhSimRanking";
import { HANH_COPY, hanhKhacNo, hanhSinhRaNo } from "../_lib/menhContent";
import { HANH_META, SAMPLE_YEARS_PER_HANH } from "../_lib/hanhMeta";
import { YEAR_FROM, YEAR_TO } from "@/app/sim-hop-tuoi/_lib/yearContent";

const ZALO_URL = "https://zalo.me/0933356666";

// ISR: 5 trang prerender + revalidate 300s (khớp /api/sims và các trang danh mục).
// dynamicParams = false: slug lạ trả 404 chứ không dựng trang rỗng.
export const revalidate = 300;
export const dynamicParams = false;

/** Dưới ngưỡng này thì noindex, follow — khuôn lấy từ /sim-nam-sinh/[year]. */
const MIN_SIMS_TO_INDEX = 8;

type Props = { params: Promise<{ hanh: string }> };

export function generateStaticParams() {
  return HANH_SLUGS.map((hanh) => ({ hanh }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { hanh: slug } = await params;
  const hanh = hanhFromSlug(slug);
  if (!hanh) return {};

  const meta = HANH_META[hanh];
  const canonical = `${BASE_URL}/sim-hop-menh/${slug}`;
  const pool = await getRankedPool(profileForHanh(hanh));
  const thin = pool.length < MIN_SIMS_TO_INDEX;

  return {
    title: { absolute: meta.title },
    description: meta.description,
    // Canonical trỏ chính nó: /sim-phong-thuy-hop-menh là hub gộp, không phải
    // bản gốc của 5 trang này (nội dung khác nhau, mỗi trang một mệnh).
    alternates: { canonical },
    ...(thin ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      type: "website",
      title: meta.title,
      description: `Sim hợp mệnh ${hanh} Mobifone — số thật trong kho, giá niêm yết công khai, sang tên chính chủ.`,
      url: canonical,
      images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
    },
  };
}

/** Các năm sinh trong khoảng cụm /sim-hop-tuoi phục vụ mà nạp âm ra mệnh này. */
const sampleYearsForHanh = (hanh: NguHanh, take: number): number[] => {
  const years: number[] = [];
  // Đi từ năm gần nhất về trước: khách tra mệnh phần lớn ở tuổi trưởng thành.
  for (let y = YEAR_TO; y >= YEAR_FROM && years.length < take; y--) {
    if (tinhCanChi(y).menh === hanh) years.push(y);
  }
  return years;
};

const buildFaq = (hanh: NguHanh) => {
  const copy = HANH_COPY[hanh];
  const sinhBoi = hanhSinhRaNo(hanh);
  const biKhac = hanhKhacNo(hanh);
  return [
    {
      q: `Sim hợp mệnh ${hanh} là sim thế nào?`,
      a: `Là số có nhiều chữ số thuộc hành tương sinh hoặc đồng hành với mệnh ${hanh}, và ít chữ số bị xem là khắc. ${copy.loiKhuyen} Đây là quan niệm dân gian dựa trên ngũ hành, dùng để so sánh giữa các số chứ không phải cơ sở khoa học.`,
    },
    {
      q: `Vì sao mệnh ${hanh} lại hợp những chữ số đó?`,
      a: `Theo ngũ hành, ${sinhBoi} sinh ${hanh} nên chữ số thuộc hành ${sinhBoi} được xem là bổ trợ; chữ số đồng hành ${hanh} giữ nguyên khí. Ngược lại ${biKhac} khắc ${hanh}, còn ${hanh} khắc ${TUONG_KHAC[hanh]} nên hai nhóm đó bị trừ điểm. Bảng phân loại đầy đủ nằm ngay trên trang.`,
    },
    {
      q: `Làm sao biết Quý khách có phải mệnh ${hanh}?`,
      a: `Bản mệnh suy từ Thiên Can – Địa Chi của năm sinh theo bảng 60 hoa giáp, nên chỉ cần năm sinh là tra được. Quý khách xem danh sách năm sinh thuộc mệnh ${hanh} ngay trong trang này, hoặc dùng công cụ xem sim hợp tuổi để tra bằng ngày sinh đầy đủ.`,
    },
    {
      q: `Mua sim hợp mệnh ${hanh} có sang tên chính chủ được không?`,
      a: `Được. Toàn bộ sim tại CHONSOMOBIFONE.COM đều hỗ trợ sang tên chính chủ. Quý khách nhận SIM, kiểm tra đúng số đã chọn rồi mới trả tiền. 30 phút giao toàn quốc.`,
    },
  ];
};

export default async function SimHopMenhPage({ params }: Props) {
  const { hanh: slug } = await params;
  const hanh = hanhFromSlug(slug);
  if (!hanh) notFound();

  const meta = HANH_META[hanh];
  const copy = HANH_COPY[hanh];
  const profile = profileForHanh(hanh);
  const pool = await getRankedPool(profile);
  // Trang mệnh lấy thẳng nhóm dẫn đầu (seed 0) — chỉ có 5 trang nên không cần
  // xoay lát như cụm 61 trang năm.
  const picked = pickRotated(pool, 0, ROWS_PER_PAGE);
  const priceSims = picked.map((p) => p.sim);

  const canonical = `${BASE_URL}/sim-hop-menh/${slug}`;
  const sampleYears = sampleYearsForHanh(hanh, SAMPLE_YEARS_PER_HANH);
  const faqItems = buildFaq(hanh);

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
              SIM hợp mệnh {hanh} — <span className="text-gold">số thật, giá niêm yết công khai</span>
            </h1>
            <p className="mx-auto mb-5 max-w-2xl text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              {meta.intro}
            </p>
            <div className="mx-auto flex max-w-lg flex-col justify-center gap-2.5 sm:flex-row">
              <a
                href="#kho-sim"
                className="flex items-center justify-center gap-2 rounded-lg bg-gold px-6 py-2.5 font-bold text-header-bg shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-xl"
              >
                <Star aria-hidden className="h-4 w-4" /> Xem số hợp mệnh {hanh}
              </a>
              <Link
                href="/sim-phong-thuy"
                className="flex items-center justify-center gap-2 rounded-lg border border-primary-foreground/25 bg-primary-foreground/10 px-6 py-2.5 font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-foreground/20"
              >
                Tra mệnh bằng ngày sinh
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
          {/* Mệnh này là gì */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span aria-hidden className="h-8 w-1 rounded-full bg-primary" />
              Mệnh {hanh} là gì và hợp số nào
            </h2>
            <p className="mb-3 leading-relaxed text-muted-foreground">{copy.tinhChat}</p>
            <p className="mb-3 leading-relaxed text-muted-foreground">{copy.loiKhuyen}</p>
            <p className="leading-relaxed text-muted-foreground">{copy.huongDung}</p>
            <dl className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
              {[
                { k: "Hành tương sinh", v: `${hanhSinhRaNo(hanh)} sinh ${hanh}` },
                { k: `${hanh} sinh ra`, v: TUONG_SINH[hanh] },
                { k: "Hành khắc mệnh", v: `${hanhKhacNo(hanh)} khắc ${hanh}` },
                { k: `${hanh} khắc`, v: TUONG_KHAC[hanh] },
              ].map((cell) => (
                <div key={cell.k} className="rounded-lg border border-border bg-secondary/20 p-3.5">
                  <dt className="mb-1 text-xs text-muted-foreground">{cell.k}</dt>
                  <dd className="text-sm font-bold text-foreground">{cell.v}</dd>
                </div>
              ))}
            </dl>
          </section>

          {/* Bảng số nên ưu tiên / nên tránh */}
          <NguHanhDigitTable menh={hanh} />

          {/* Số thật + giá + ItemList/Product/Offer JSON-LD */}
          <div id="kho-sim" className="scroll-mt-20">
            <CategorySimPriceList
              title={`Sim hợp mệnh ${hanh} đang có trong kho`}
              sims={priceSims}
              pageUrl={canonical}
              intro={`${priceSims.length} số thuộc nhóm điểm cao nhất khi chấm theo mệnh ${hanh}. Giá đã niêm yết, Quý khách xem rồi chốt.`}
              note={`${meta.bangGiaNote} Giờ sinh và giới tính lấy mặc định (giờ Tý, nam) vì trang này không hỏi ngày sinh — nhập đủ ở công cụ xem sim hợp tuổi để chấm lại. Bảng cập nhật mỗi 5 phút.`}
            />
          </div>

          {/* Chi tiết chấm điểm 3 số dẫn đầu */}
          <TopScoreBreakdown
            items={picked.slice(0, 3)}
            heading={`Ba số dẫn đầu cho mệnh ${hanh} — chi tiết chấm điểm`}
            note={`Điểm lấy từ cùng một engine với công cụ /sim-phong-thuy: ngũ hành bản mệnh ${hanh}, tổng nút và quẻ dịch của 4 số cuối. Quẻ dịch là cách luận theo Kinh Dịch dân gian, chỉ để tham khảo.`}
          />

          {priceSims.length === 0 ? (
            <section className="rounded-xl border border-border bg-card p-6 text-center shadow-card md:p-8">
              <p className="mb-4 leading-relaxed text-muted-foreground">
                Kho đang cập nhật nên chưa tải được số hợp mệnh {hanh}. Quý khách thử lại sau ít phút, hoặc
                nhắn Zalo để đội ngũ tư vấn tra trực tiếp giúp.
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

          {/* Năm sinh thuộc mệnh này — link chéo sang cụm hợp tuổi */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span aria-hidden className="h-8 w-1 rounded-full bg-primary" />
              Năm sinh nào thuộc mệnh {hanh}?
            </h2>
            <p className="mb-5 leading-relaxed text-muted-foreground">
              Dưới đây là những năm sinh gần nhất có nạp âm thuộc mệnh {hanh}. Mỗi trang năm còn cho biết can
              chi, nạp âm cụ thể và cung phi Bát Trạch của năm đó — hai năm cùng mệnh {hanh} vẫn khác nạp âm.
            </p>
            <ul className="flex flex-wrap gap-2.5 text-sm">
              {sampleYears.map((year) => (
                <li key={year}>
                  <Link
                    href={`/sim-hop-tuoi/${year}`}
                    className="inline-flex items-center rounded-lg border border-border px-4 py-2 font-semibold text-primary transition hover:bg-secondary/40"
                  >
                    Tuổi {year} · {tinhCanChi(year).thienCan} {tinhCanChi(year).diaChi}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/sim-hop-tuoi"
                  className="inline-flex items-center rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                  Xem đủ 61 năm
                </Link>
              </li>
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">
              Năm đại diện dùng để chấm điểm trang này là {repYearForHanh(hanh)} ({tinhCanChi(repYearForHanh(hanh)).thienCan}{" "}
              {tinhCanChi(repYearForHanh(hanh)).diaChi}, nạp âm {tinhCanChi(repYearForHanh(hanh)).napAm}) — cùng
              bản mệnh {hanh} với mọi năm ở trên.
            </p>
          </section>

          <TrustCommitments />

          {/* FAQ */}
          <FaqAccordion items={faqItems} title={`Câu hỏi thường gặp về sim hợp mệnh ${hanh}`} />

          {/* Sang các mệnh khác + hub gộp */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span aria-hidden className="h-8 w-1 rounded-full bg-primary" />
              Xem mệnh khác
            </h2>
            <ul className="flex flex-wrap gap-3 text-sm">
              {HANH_SLUGS.filter((s) => s !== slug).map((s) => (
                <li key={s}>
                  <Link
                    href={`/sim-hop-menh/${s}`}
                    className="inline-flex items-center rounded-lg border border-border px-5 py-2.5 font-semibold text-primary transition hover:bg-secondary/40"
                  >
                    Mệnh {hanhFromSlug(s)}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/sim-phong-thuy-hop-menh"
                  className="inline-flex items-center rounded-lg border border-border px-5 py-2.5 font-semibold text-primary transition hover:bg-secondary/40"
                >
                  So sánh cả 5 mệnh
                </Link>
              </li>
            </ul>
          </section>

          <p className="rounded-xl border border-border bg-secondary/20 p-5 text-center text-sm leading-relaxed text-muted-foreground">
            <strong className="text-foreground">Lưu ý:</strong> Nội dung phong thủy trên trang này dựa trên
            ngũ hành và Kinh Dịch theo quan niệm dân gian, được dùng để so sánh giữa các số. Đây không phải cơ
            sở khoa học và không phải lời hứa thay đổi vận may.
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
              { name: "SIM phong thủy hợp mệnh", path: "/sim-phong-thuy-hop-menh" },
              { name: `Sim hợp mệnh ${hanh}`, path: `/sim-hop-menh/${slug}` },
            ]),
          ),
        }}
      />
    </>
  );
}
