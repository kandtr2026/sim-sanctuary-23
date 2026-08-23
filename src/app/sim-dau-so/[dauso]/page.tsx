import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Phone, Star, Sparkles } from "lucide-react";
import CategorySimGrid from "@/components/CategorySimGrid";
import { buildBreadcrumb } from "@/lib/seo";

const ZALO_URL = "https://zalo.me/0933356666";
const BASE_URL = "https://www.chonsomobifone.com";

// Mobifone prefixes with a dedicated category page. Each entry drives the
// generateStaticParams pre-render, generateMetadata, H1 and sitemap. Unknown
// prefixes (e.g. a Viettel 098) 404 rather than soft-render an empty page.
const PREFIXES = ["090", "093", "070", "076", "077", "078", "079", "089"] as const;

const isValidPrefix = (dauso: string): dauso is (typeof PREFIXES)[number] =>
  (PREFIXES as readonly string[]).includes(dauso);

type Props = {
  params: Promise<{ dauso: string }>;
};

export function generateStaticParams() {
  return PREFIXES.map((dauso) => ({ dauso }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { dauso } = await params;
  if (!isValidPrefix(dauso)) return {};

  const title = `Sim ${dauso} Mobifone | Kho Sim Đầu Số ${dauso} Đẹp, Giá Tốt`;
  const description = `Kho sim đầu số ${dauso} Mobifone đẹp, giá tốt: tứ quý, thần tài, lộc phát, phong thủy. Giá niêm yết công khai, sang tên chính chủ, giao nội thành HCM 30 phút – 2 giờ.`;
  const canonical = `${BASE_URL}/sim-dau-so/${dauso}`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      title,
      description: `Kho sim đầu số ${dauso} Mobifone đẹp, giá tốt. Giá công khai, chính chủ.`,
      url: canonical,
      images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
    },
  };
}

export default async function SimDauSoPage({ params }: Props) {
  const { dauso } = await params;
  if (!isValidPrefix(dauso)) notFound();

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
              Sim {dauso} Mobifone — <span className="text-gold">kho số đẹp giá tốt</span>
            </h1>
            <p className="mx-auto mb-5 max-w-xl text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              Sim đầu số {dauso} Mobifone: tứ quý, thần tài, lộc phát, phong thủy. Giá công khai, sang tên chính chủ,
              giao tận nơi nội thành HCM.
            </p>
            <div className="mx-auto flex max-w-md flex-col justify-center gap-2.5 sm:flex-row">
              <a
                href="#kho-sim"
                className="flex items-center justify-center gap-2 rounded-lg bg-gold px-7 py-2.5 font-bold text-header-bg shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-xl"
              >
                <Star className="h-4 w-4" /> Xem kho sim {dauso}
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
              Sim đầu số {dauso} Mobifone có gì đặc biệt?
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Đầu số {dauso} thuộc Mobifone, một trong những nhà mạng có mạng lưới phủ sóng rộng tại Việt Nam. Kho
              đầu số {dauso} bao gồm sim tứ quý, thần tài, lộc phát, phong thủy và sim số thường — tùy ngân sách bạn
              chọn.
            </p>
          </section>

          <CategorySimGrid
            title={`Kho Sim ${dauso} Cập Nhật`}
            searchPlaceholder={`Nhập số cần tìm trong kho ${dauso}...`}
            emptyText={`Hiện chưa có sim đầu số ${dauso} phù hợp trong kho. Vui lòng thử lại sau.`}
            matchPrefixes={[dauso]}
          />

          {/* Cross-links to other prefixes + categories */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Các đầu số Mobifone khác
            </h2>
            <ul className="flex flex-wrap gap-3 text-sm">
              {PREFIXES.map((p) => (
                <li key={p}>
                  <a
                    href={`/sim-dau-so/${p}`}
                    className={`font-medium underline-offset-2 hover:underline ${
                      p === dauso ? "text-muted-foreground" : "text-primary"
                    }`}
                  >
                    Sim {p}
                  </a>
                </li>
              ))}
            </ul>
            <h3 className="mb-2 mt-6 text-lg font-bold text-foreground">Dòng sim nổi bật</h3>
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
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumb([
              { name: "Trang chủ", path: "/" },
              { name: "Sim theo đầu số", path: "/sim-dau-so/090" },
              { name: `Sim ${dauso}`, path: `/sim-dau-so/${dauso}` },
            ]),
          ),
        }}
      />
    </>
  );
}
