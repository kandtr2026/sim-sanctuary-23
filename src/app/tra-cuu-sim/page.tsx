import type { Metadata } from "next";
import Link from "next/link";
import {
  Phone,
  MessageCircle,
  ShoppingCart,
  CheckCircle,
  Sparkles,
  Cake,
  Info,
} from "lucide-react";
import {
  detectNetwork,
  detectSimTags,
  analyzeDigits,
  parseBirthDate,
  formatPrice,
} from "@/lib/simUtils";
import { formatSimQuyAware } from "@/lib/simDisplay";
import { findSimByDigits } from "@/lib/serverSimData";
import { metasForTags, TAG_META } from "@/lib/simMeta";
import { BASE_URL, buildBreadcrumb } from "@/lib/seo";
import TrustCommitments from "@/components/TrustCommitments";
import SearchBox from "./SearchBox";

export const revalidate = 300;

const CANONICAL = `${BASE_URL}/tra-cuu-sim`;
const CALL_NUMBER = "0933686666";
const CALL_DISPLAY = "0933.686.666";

const TITLE = "Tra cứu sim: ý nghĩa & giá số điện thoại | CHONSOMOBIFONE.COM";
const DESCRIPTION =
  "Nhập số điện thoại để tra ngay ý nghĩa (thần tài, lộc phát, tứ quý, năm sinh…), nhà mạng và giá bán nếu số còn trong kho. Sang tên chính chủ, giao 30 phút.";

type Props = { searchParams: Promise<{ so?: string }> };

const cleanInput = (so: string | undefined): string => (so ?? "").replace(/\D/g, "");
const isValid = (d: string): boolean => /^0\d{9,10}$/.test(d);

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const sp = await searchParams;
  const digits = cleanInput(sp.so);
  const valid = isValid(digits);

  // Kết quả theo ?so là vô hạn biến thể → noindex + canonical về trang gốc để
  // không sinh trùng lặp. Bản thân từng số đã có trang index riêng /sim/[digits].
  if (valid) {
    const formatted = formatSimQuyAware(digits);
    return {
      title: { absolute: `Tra cứu sim ${formatted} | CHONSOMOBIFONE.COM` },
      description: DESCRIPTION,
      alternates: { canonical: "/tra-cuu-sim" },
      robots: { index: false, follow: true },
    };
  }

  return {
    title: { absolute: TITLE },
    description: DESCRIPTION,
    alternates: { canonical: "/tra-cuu-sim" },
    openGraph: {
      type: "website",
      title: TITLE,
      description: DESCRIPTION,
      url: CANONICAL,
      images: [{ url: `${BASE_URL}/share-banner.png?v=999`, width: 1200, height: 630 }],
    },
  };
}

const faqItems = [
  {
    q: "Tra cứu sim để làm gì?",
    a: "Trước khi mua hoặc khi được chào một số, Quý khách nhập số vào đây để biết số thuộc dạng nào (thần tài, lộc phát, tứ quý, năm sinh…), thuộc nhà mạng nào, và nếu số đang còn trong kho thì giá bao nhiêu. Không đoán vận mệnh — chỉ nêu quy ước đọc số phổ biến.",
  },
  {
    q: "Vì sao có số tra ra giá, có số lại không?",
    a: "Chỉ số đang còn trong kho của CHONSOMOBIFONE mới hiện giá niêm yết. Số không có trong kho vẫn tra được ý nghĩa; Quý khách nhắn Zalo để đội ngũ tìm số tương tự đang còn hàng.",
  },
  {
    q: "Số đẹp có giữ được không?",
    a: "Có. Quý khách nhắn Zalo hoặc gọi " + CALL_DISPLAY + " để giữ số; đội ngũ xác nhận còn hàng và báo giá chính xác. Nhận SIM kiểm tra rồi mới thanh toán, sang tên chính chủ.",
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

export default async function TraCuuSimPage({ searchParams }: Props) {
  const sp = await searchParams;
  const digits = cleanInput(sp.so);
  const valid = isValid(digits);

  const result = valid
    ? await (async () => {
        const network = detectNetwork(digits);
        const tags = detectSimTags(digits);
        const metas = metasForTags(tags);
        const formatted = formatSimQuyAware(digits);
        const { sumDigits } = analyzeDigits(digits);
        const birth = parseBirthDate(digits);
        const sim = await findSimByDigits(digits);
        return { network, metas, formatted, sumDigits, birth, sim };
      })()
    : null;

  const zaloHref = (text: string) =>
    `https://zalo.me/${CALL_NUMBER}?text=${encodeURIComponent(text)}`;

  return (
    <>
      <main className="min-h-screen bg-background">
        {/* ── Hero + ô tra cứu ─────────────────────────────────────────────── */}
        <section className="relative bg-gradient-to-b from-primary via-primary-dark to-primary text-primary-foreground">
          <div className="container mx-auto px-4 py-8 md:py-10">
            <div className="mb-2 flex items-center gap-2 text-gold">
              <Sparkles className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wide">Công cụ tra cứu</span>
            </div>
            <h1 className="mb-2 max-w-3xl text-2xl font-extrabold leading-tight sm:text-3xl md:text-4xl">
              Tra cứu sim — ý nghĩa &amp; giá số điện thoại
            </h1>
            <p className="mb-5 max-w-2xl text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              Nhập một số bất kỳ để xem số thuộc dạng nào, nhà mạng gì, và giá bán nếu số đang còn trong kho.
            </p>
            <div className="max-w-2xl">
              <SearchBox initial={valid ? digits : ""} />
            </div>
          </div>
        </section>

        <div className="container mx-auto space-y-10 px-4 py-8 md:space-y-12 md:py-10">
          {/* ── Kết quả ─────────────────────────────────────────────────────── */}
          {valid && result && (
            <section className="rounded-xl border border-gold/30 bg-card p-6 shadow-card md:p-8">
              <div className="flex flex-wrap items-center gap-2">
                {result.network !== "Khác" && (
                  <span className="inline-flex items-center rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {result.network}
                  </span>
                )}
                {result.metas.map((t) => (
                  <span
                    key={t.label}
                    className="inline-flex items-center rounded bg-gold/15 px-2 py-0.5 text-xs font-medium text-gold-dark"
                  >
                    {t.label}
                  </span>
                ))}
              </div>

              <p className="mt-3 font-mono text-3xl font-extrabold tracking-wider text-primary sm:text-4xl">
                {result.formatted}
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {/* Ý nghĩa */}
                <div className="rounded-lg border border-border bg-secondary/20 p-4">
                  <h2 className="mb-2 text-sm font-bold text-foreground">Ý nghĩa dãy số</h2>
                  {result.metas.length > 0 ? (
                    <ul className="space-y-1.5 text-sm text-muted-foreground">
                      {result.metas.map((t) => (
                        <li key={t.label} className="flex items-start gap-2">
                          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                          <span>
                            <strong className="text-foreground">{t.label}:</strong> {t.blurb}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Đây là một số phổ thông, không rơi vào các dạng số đẹp thường gặp. Vẫn có thể là số dễ nhớ với riêng Quý khách.
                    </p>
                  )}
                  <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Info className="h-3.5 w-3.5 shrink-0" />
                    Tổng các chữ số: <strong className="text-foreground">{result.sumDigits}</strong>
                    {result.birth && (
                      <>
                        {" · "}
                        <Cake className="h-3.5 w-3.5 shrink-0" /> đọc được ngày sinh {result.birth.display}
                      </>
                    )}
                  </p>
                </div>

                {/* Tồn kho + giá */}
                <div className="rounded-lg border border-border bg-secondary/20 p-4">
                  <h2 className="mb-2 text-sm font-bold text-foreground">Tình trạng &amp; giá</h2>
                  {result.sim ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Số này <strong className="text-emerald-500">đang còn trong kho</strong>.
                      </p>
                      <p className="mt-1 text-2xl font-bold text-primary">{formatPrice(result.sim.price)}</p>
                      <div className="mt-3 flex flex-col gap-2">
                        <Link
                          href={`/sim/${digits}`}
                          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gold px-4 py-2.5 text-sm font-bold text-header-bg transition hover:bg-gold-light"
                        >
                          <Sparkles className="h-4 w-4" /> Xem trang số này
                        </Link>
                        <Link
                          href={`/mua-ngay/${encodeURIComponent(result.sim.id)}`}
                          rel="nofollow"
                          className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-secondary/50"
                        >
                          <ShoppingCart className="h-4 w-4" /> Đặt mua online
                        </Link>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Số này <strong className="text-foreground">hiện không có trong kho</strong> của
                        CHONSOMOBIFONE. Quý khách nhắn Zalo để đội ngũ tìm số tương tự đang còn hàng.
                      </p>
                      <a
                        href={zaloHref(
                          `Xin chào, tôi muốn tìm số giống ${result.formatted}. Bên mình còn số tương tự không ạ?`,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-sim-number={digits}
                        className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-sky-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-sky-600"
                      >
                        <MessageCircle className="h-4 w-4" /> Nhắn Zalo tìm số tương tự
                      </a>
                    </>
                  )}
                </div>
              </div>

              {/* CTA chung */}
              <div className="mt-4 flex flex-col gap-2.5 sm:flex-row">
                <a
                  href={zaloHref(`Xin chào, tôi muốn tư vấn về số ${result.formatted}.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-sim-number={digits}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-primary-foreground transition hover:bg-primary/90"
                >
                  <MessageCircle className="h-5 w-5" /> Nhắn Zalo tư vấn
                </a>
                <a
                  href={`tel:${CALL_NUMBER}`}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-4 py-3 font-semibold text-foreground transition hover:bg-secondary/50"
                >
                  <Phone className="h-5 w-5" /> Gọi {CALL_DISPLAY}
                </a>
              </div>
            </section>
          )}

          {valid && !result && (
            <p className="rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
              Quý khách kiểm tra lại số — cần đủ 10 chữ số bắt đầu bằng 0.
            </p>
          )}

          {/* ── Các dạng số đẹp & ý nghĩa (nội dung SEO + link nội bộ) ───────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Các dạng sim số đẹp &amp; ý nghĩa
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Object.values(TAG_META).map((t) => (
                <div key={t.label} className="rounded-lg border border-border bg-secondary/20 p-4">
                  <h3 className="mb-1 font-semibold text-foreground">{t.label}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{t.blurb}</p>
                  {t.path && (
                    <Link
                      href={t.path}
                      className="mt-2 inline-block text-sm font-medium text-primary underline-offset-2 hover:underline"
                    >
                      Xem kho sim {t.label.toLowerCase()} →
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </section>

          <TrustCommitments />

          {/* ── FAQ ─────────────────────────────────────────────────────────── */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Câu hỏi thường gặp
            </h2>
            <div className="space-y-4">
              {faqItems.map((item) => (
                <div key={item.q}>
                  <h3 className="mb-1 font-semibold text-foreground">{item.q}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                </div>
              ))}
            </div>
          </section>
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
              { name: "Tra cứu sim", path: "/tra-cuu-sim" },
            ]),
          ).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}
