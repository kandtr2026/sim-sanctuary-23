import type { Metadata } from "next";
import { Phone, Star, Sparkles, Hash } from "lucide-react";
import { buildBreadcrumb } from "@/lib/seo";
import { DAU_SO_PREFIXES } from "@/lib/simTaxonomy";

const ZALO_URL = "https://zalo.me/0933356666";

const TITLE = "Sim Theo Đầu Số Mobifone | Chọn Đầu Số 090, 093, 07x, 089";
const DESCRIPTION =
  "Chọn sim Mobifone theo đầu số: 090, 093, 070, 076, 077, 078, 079, 089. Mỗi đầu số một kho số đẹp — tứ quý, thần tài, lộc phát, phong thủy. Giá công khai, sang tên chính chủ, giao toàn quốc.";
const CANONICAL = "https://www.chonsomobifone.com/sim-dau-so";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    title: TITLE,
    description:
      "Chọn sim Mobifone theo đầu số 090, 093, 07x, 089. Kho số đẹp mỗi đầu số, giá công khai.",
    url: CANONICAL,
    images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
  },
};

// Short blurb per Mobifone head number, keyed by prefix. Any prefix Back adds to
// DAU_SO_PREFIXES that isn't listed here falls back to a generic line, so the
// hub never renders a blank card.
const PREFIX_INFO: Record<string, string> = {
  "090": "Đầu số 09x kinh điển, ra đời sớm nhất của Mobifone — dễ nhớ, tạo uy tín khi giao dịch.",
  "093": "Đầu số 09x lâu đời của Mobifone, quen thuộc với người dùng, hợp cả cá nhân lẫn công việc.",
  "070": "Đầu số 07x Mobifone, kho số dồi dào với nhiều lựa chọn số đẹp giá tốt.",
  "076": "Đầu số 07x Mobifone, nhiều dãy số đẹp tầm trung, dễ chọn theo phong thủy.",
  "077": "Đầu số 07x Mobifone, kho số rộng với nhiều đuôi thần tài, lộc phát.",
  "078": "Đầu số 07x Mobifone, đa dạng mức giá, hợp người tìm số đẹp tiết kiệm.",
  "079": "Đầu số 07x Mobifone, sẵn nhiều đuôi 79 (thần tài lớn) được dân kinh doanh săn đón.",
  "089": "Đầu số 089 Mobifone mới, còn nhiều số đẹp chưa qua sử dụng.",
};

const describePrefix = (prefix: string): string =>
  PREFIX_INFO[prefix] ??
  `Kho sim đầu số ${prefix} Mobifone — số đẹp giá tốt, sang tên chính chủ, giao toàn quốc.`;

const CATEGORY_LINKS: { href: string; label: string }[] = [
  { href: "/sim-than-tai", label: "Sim thần tài" },
  { href: "/sim-loc-phat", label: "Sim lộc phát" },
  { href: "/mua-sim-tu-quy", label: "Sim tứ quý" },
  { href: "/sim-ngu-quy", label: "Sim ngũ quý" },
  { href: "/sim-ong-dia", label: "Sim ông địa" },
  { href: "/sim-phong-thuy-hop-menh", label: "Sim phong thủy hợp mệnh" },
];

export default function SimDauSoHubPage() {
  return (
    <>
      <main className="min-h-screen bg-background">
        <section
          style={{ minHeight: "clamp(280px, 34vw, 340px)" }}
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
              Sim Mobifone theo <span className="text-gold">đầu số</span>
            </h1>
            <p className="mx-auto mb-5 max-w-xl text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              Chọn đầu số Mobifone bạn thích — mỗi đầu số là một kho số đẹp riêng: tứ quý, thần tài,
              lộc phát, phong thủy. Giá niêm yết công khai, sang tên chính chủ.
            </p>
            <div className="mx-auto flex max-w-md flex-col justify-center gap-2.5 sm:flex-row">
              <a
                href="#danh-sach-dau-so"
                className="flex items-center justify-center gap-2 rounded-lg bg-gold px-7 py-2.5 font-bold text-header-bg shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-xl"
              >
                <Star className="h-4 w-4" /> Xem danh sách đầu số
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
          {/* Intro */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Chọn sim Mobifone theo đầu số
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              Đầu số là ba chữ số mở đầu của thuê bao (ví dụ 090, 093, 079). Mỗi đầu số Mobifone có
              một kho số riêng với nhiều mức giá và kiểu số. Chọn đầu số bên dưới để xem toàn bộ sim
              đẹp thuộc đầu số đó — từ tứ quý, thần tài, lộc phát đến số phong thủy hợp mệnh.
            </p>
          </section>

          {/* Danh sách đầu số */}
          <section id="danh-sach-dau-so" className="scroll-mt-[var(--nav-height)]">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Danh sách đầu số Mobifone
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {DAU_SO_PREFIXES.map((prefix) => (
                <a
                  key={prefix}
                  href={`/sim-dau-so/${prefix}`}
                  className="group flex flex-col rounded-xl border border-border bg-card p-5 shadow-card transition-colors hover:border-primary/40"
                >
                  <div className="mb-2 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                      <Hash className="h-5 w-5 text-primary" aria-hidden="true" />
                    </div>
                    <span className="text-lg font-bold text-foreground group-hover:text-primary">
                      Sim {prefix}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {describePrefix(prefix)}
                  </p>
                  <span className="mt-3 text-sm font-semibold text-primary underline-offset-2 group-hover:underline">
                    Xem kho sim {prefix} →
                  </span>
                </a>
              ))}
            </div>
          </section>
          {/* Cross-links to the main category pages */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Hoặc chọn theo dòng sim
            </h2>
            <ul className="flex flex-wrap gap-3 text-sm">
              {CATEGORY_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
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
              { name: "Sim theo đầu số", path: "/sim-dau-so" },
            ]),
          ),
        }}
      />
    </>
  );
}
