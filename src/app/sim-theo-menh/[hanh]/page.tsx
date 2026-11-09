import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import MenhMucSearchGrid from "@/components/MenhMucSearchGrid";
import LocalServiceLinks from "@/components/LocalServiceLinks";
import { getServerSims } from "@/lib/serverSimData";
import { BASE_URL, buildBreadcrumb } from "@/lib/seo";
import { HANH_COPY, buildHanhTable, formatDigits } from "@/app/sim-hop-menh/_lib/menhContent";
import {
  nguHanhCuaSo,
  diemTongHop,
  NGU_HANH_LIST,
  hanhTheoSlug,
  HANH_MAU,
  nguHanhSinhRa,
} from "@/lib/phongThuy";

export const revalidate = 300;
export const dynamicParams = false;

type Props = { params: Promise<{ hanh: string }> };

export function generateStaticParams() {
  return NGU_HANH_LIST.map((x) => ({ hanh: x.slug }));
}

const ZALO = "https://zalo.me/0933686666";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { hanh } = await params;
  const item = hanhTheoSlug(hanh);
  if (!item) {
    return { title: { absolute: "Không tìm thấy | CHONSOMOBIFONE.COM" }, robots: { index: false, follow: true } };
  }

  const canonical = `${BASE_URL}/sim-theo-menh/${item.slug}`;
  const t = buildHanhTable(item.hanh);
  const hop = formatDigits([...t.dong, ...t.sinh]);
  const kieng = formatDigits(t.khacMenh);
  // Cùng một công thức cho cả 5 hành (Hỏa ra đúng chuỗi cũ "9, 3, 4" / "0, 1").
  const title = `SIM Mệnh ${item.hanh} MobiFone — Chọn Số Hợp ${item.hanh} ${hop} | CHONSOMOBIFONE.COM`;
  const description = `Kho SIM MobiFone hợp mệnh ${item.hanh}: ưu tiên số ${hop}; hạn chế số ${kieng} ở đuôi. Giá niêm yết, đăng ký chính chủ, nhắn Zalo giữ số nhanh.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "website",
      locale: "vi_VN",
    },
  };
}

export default async function SimTheoMenhHanhPage({ params }: Props) {
  const { hanh } = await params;
  const item = hanhTheoSlug(hanh);
  if (!item) notFound();

  const mau = HANH_MAU[item.hanh];
  const nuoi = nguHanhSinhRa(item.hanh);
  const copy = HANH_COPY[item.hanh];
  const table = buildHanhTable(item.hanh);
  const canonical = `${BASE_URL}/sim-theo-menh/${item.slug}`;
  const isHoa = item.hanh === "Hỏa";
  const hop = formatDigits([...table.dong, ...table.sinh]);
  const kieng = formatDigits(table.khacMenh);
  const sims = (await getServerSims()).filter((s) => s.price > 0);
  const scored = sims
    .filter((s) => nguHanhCuaSo(s.rawDigits).chinh === item.hanh)
    .map((s) => ({ s, pt: diemTongHop(s.rawDigits).diem }))
    .sort((a, b) => b.pt - a.pt || a.s.price - b.s.price)
    .slice(0, 60);

  const productCollectionJsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `SIM hợp mệnh ${item.hanh} MobiFone`,
    description: `Danh sách SIM MobiFone hợp mệnh ${item.hanh}, ưu tiên số ${hop} và hạn chế số ${kieng} theo quan niệm ngũ hành.`,
    url: canonical,
    mainEntity: {
      "@type": "ItemList",
      itemListElement: scored.slice(0, 12).map(({ s }, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: `SIM ${s.displayNumber}`,
          url: `${BASE_URL}/sim/${s.rawDigits}`,
          offers: {
            "@type": "Offer",
            priceCurrency: "VND",
            price: s.price,
            availability: "https://schema.org/InStock",
          },
        },
      })),
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Mệnh ${item.hanh} hợp số nào khi chọn SIM điện thoại?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: isHoa
            ? "Theo quan niệm ngũ hành, mệnh Hỏa hợp số 9 vì cùng hành Hỏa; hợp thêm số 3 và 4 vì Mộc sinh Hỏa. Nên hạn chế số 0 và 1 vì thuộc Thủy, đặc biệt ở cụm đuôi."
            : `Theo quan niệm ngũ hành, mệnh ${item.hanh} hợp nhóm số đồng hành ${formatDigits(table.dong)} và nhóm tương sinh ${formatDigits(table.sinh)}. Nên hạn chế số ${kieng} vì được xem là khắc mệnh ${item.hanh}, đặc biệt ở cụm đuôi.`,
        },
      },
      {
        "@type": "Question",
        name: "Chọn SIM hợp mệnh có cần đúng cả ngày tháng năm sinh không?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Không bắt buộc. Trang này lọc theo ngũ hành của dãy số; nếu muốn soi kỹ theo năm sinh, Quý khách có thể mở từng số để xem thêm mục hợp tuổi hoặc nhắn Zalo để được tư vấn.",
        },
      },
    ],
  };

  return (
    <main className="min-h-screen bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productCollectionJsonLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumb([
              { name: "Trang chủ", path: "/" },
              { name: "SIM theo mệnh", path: "/sim-theo-menh" },
              { name: `SIM mệnh ${item.hanh}`, path: `/sim-theo-menh/${item.slug}` },
            ]),
          ),
        }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <section className="text-primary-foreground" style={{ background: `linear-gradient(180deg, ${mau}, ${mau}cc)` }}>
        <div className="container mx-auto px-4 py-8 md:py-10">
          <h1 className="flex items-center gap-2 text-2xl font-extrabold text-white md:text-3xl">
            <span aria-hidden className="h-4 w-4 rounded-full bg-white/90" />
            {`SIM hợp mệnh ${item.hanh} MobiFone — ưu tiên ${hop}`}
          </h1>
          <p className="mt-1 max-w-3xl text-sm text-white/90">
            {isHoa ? (
              <>
                Người mệnh Hỏa nên ưu tiên <strong>số 9</strong> (đồng hành Hỏa), <strong>số 3, 4</strong> (Mộc sinh Hỏa) và hạn chế <strong>số 0, 1</strong> ở cụm đuôi. Kho bên dưới chỉ lấy SIM MobiFone đang có giá, xếp theo điểm phong thủy cao nhất.
              </>
            ) : (
              <>
                Theo quan niệm ngũ hành, người mệnh {item.hanh} nên ưu tiên <strong>số {formatDigits(table.dong)}</strong> (đồng hành {item.hanh}), <strong>số {formatDigits(table.sinh)}</strong> (tương sinh) và hạn chế <strong>số {kieng}</strong> ở cụm đuôi. Số hành {item.hanh} cũng hợp người <strong>mệnh {nuoi}</strong>. Kho bên dưới chỉ lấy SIM MobiFone đang có giá, xếp theo điểm phong thủy cao nhất.
              </>
            )}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {NGU_HANH_LIST.map((x) => (
              <Link
                key={x.slug}
                href={`/sim-theo-menh/${x.slug}`}
                className={`rounded-full border px-3 py-1 text-sm font-medium transition ${
                  x.slug === item.slug ? "border-white bg-white text-header-bg" : "border-white/40 bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {x.hanh}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <section className="mb-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Số tương sinh</p>
            <p className="mt-1 text-2xl font-extrabold text-primary">{formatDigits(table.sinh)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isHoa ? "Mộc sinh Hỏa — nhóm số nên ưu tiên khi muốn dãy số có lực nâng." : `Nhóm số sinh vượng cho mệnh ${item.hanh}.`}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Số đồng hành</p>
            <p className="mt-1 text-2xl font-extrabold text-gold">{formatDigits(table.dong)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isHoa ? "Số 9 thuộc Hỏa — đẹp nhất khi nằm ở cụm đuôi dễ nhớ." : `Nhóm số cùng hành ${item.hanh}.`}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-4 shadow-card">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Số nên hạn chế</p>
            <p className="mt-1 text-2xl font-extrabold text-destructive">{formatDigits(table.khacMenh)}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {isHoa ? "0, 1 thuộc Thủy; nếu có thì nên tránh lặp nhiều ở 4 số cuối." : `Nhóm số được xem là khắc mệnh ${item.hanh}.`}
            </p>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-border bg-card p-5 shadow-card">
          <h2 className="text-lg font-bold text-foreground">
            {isHoa ? "Cách chọn SIM hợp mệnh Hỏa để dễ bán, dễ nhớ" : `Số nào hợp mệnh ${item.hanh}? Cách chọn SIM mệnh ${item.hanh}`}
          </h2>
          <div className="mt-3 grid gap-4 text-sm leading-7 text-muted-foreground md:grid-cols-2">
            <div>
              <p>{copy.tinhChat}</p>
              <p className="mt-2">{copy.loiKhuyen}</p>
            </div>
            <div>
              <p>{copy.huongDung}</p>
              <p className="mt-2">
                Khi chọn số, Quý khách nên ưu tiên cụm đuôi dễ đọc, giá phù hợp ngân sách và có thể đăng ký chính chủ ngay. Phần luận giải chỉ mang tính tham khảo theo quan niệm dân gian, không thay thế quyết định tài chính cá nhân.
              </p>
            </div>
          </div>
        </section>

        <MenhMucSearchGrid initial={scored.map((x) => x.s)} hanh={item.hanh} zaloHref={ZALO} />
        <p className="mt-4 text-xs text-muted-foreground">
          Ngũ hành của số tính theo Hà Đồ, điểm phong thủy theo Bát Cực + quẻ — mang tính tham khảo.
          Bấm vào số để xem phân tích đầy đủ, hoặc nhập năm sinh ở ô “Hợp tuổi” để soi theo mệnh bạn.
        </p>
        <LocalServiceLinks className="mt-6" />
      </div>
    </main>
  );
}
