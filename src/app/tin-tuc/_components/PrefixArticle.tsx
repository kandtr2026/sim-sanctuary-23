import Link from "next/link";
import { buildArticle, buildBreadcrumb } from "@/lib/seo";

export interface PrefixArticleConfig {
  prefix: string;
  oldPrefix?: string;
  network: "MobiFone" | "VinaPhone" | "Viettel";
  simPath?: string;
  datePublished?: string;
  dateModified?: string;
  meaningNote?: string;
}

const MOBIFONE_PREFIXES = "089, 090, 093, 070, 076, 077, 078 và 079";

export function prefixTitle(config: PrefixArticleConfig) {
  return `${config.prefix} Là Mạng Gì? ${config.prefix} Là ${config.network}${config.oldPrefix ? ` — Đổi Từ ${config.oldPrefix}` : ""}`;
}

export function prefixDescription(config: PrefixArticleConfig) {
  const old = config.oldPrefix ? `, đổi từ ${config.oldPrefix} sau năm 2018` : "";
  return `Trả lời nhanh: ${config.prefix} là đầu số ${config.network}${old}. Xem ý nghĩa ${config.prefix}, cách nhận biết nhà mạng và kho SIM ${config.prefix} chính chủ.`;
}

export function PrefixArticle({ config }: { config: PrefixArticleConfig }) {
  const title = prefixTitle(config);
  const description = prefixDescription(config);
  const path = `/tin-tuc/${config.prefix}-la-mang-gi`;
  const simPath = config.simPath ?? `/sim-dau-so/${config.prefix}`;
  const datePublished = config.datePublished ?? "2026-10-09T00:00:00+07:00";
  const dateModified = config.dateModified ?? datePublished;
  const oldPrefixText = config.oldPrefix
    ? `Đầu số ${config.prefix} được chuyển đổi từ đầu số cũ ${config.oldPrefix}.`
    : `Đầu số ${config.prefix} là một dải số hiện hành của ${config.network}.`;

  const faqItems = [
    {
      q: `${config.prefix} là mạng gì?`,
      a: `${config.prefix} là đầu số thuộc mạng ${config.network}.${config.oldPrefix ? ` Đây là nhánh số 10 chữ số được chuyển đổi từ đầu số 11 số ${config.oldPrefix} theo quy định chuyển đổi thuê bao di động năm 2018.` : ""}`,
    },
    {
      q: `Đầu số ${config.prefix} đổi từ đầu số cũ nào?`,
      a: config.oldPrefix
        ? `Đầu số ${config.prefix} được chuyển đổi từ ${config.oldPrefix}. Khi chuyển từ 11 số về 10 số, phần đầu số đổi sang ${config.prefix} và 7 số cuối giữ nguyên.`
        : `Đầu số ${config.prefix} hiện là đầu số 10 chữ số. Nếu cần kiểm tra lịch sử chuyển đổi cụ thể, khách hàng nên đối chiếu với bảng đầu số nhà mạng hoặc liên hệ điểm hỗ trợ ${config.network}.`,
    },
    {
      q: `Có thể mua SIM ${config.prefix} ${config.network} chính chủ ở đâu?`,
      a: `Khách hàng có thể xem kho SIM ${config.prefix} trên CHONSOMOBIFONE.COM, chọn số theo giá niêm yết và được hỗ trợ đăng ký thông tin chính chủ khi nhận SIM.`,
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

  const breadcrumbJsonLd = buildBreadcrumb([
    { name: "Trang chủ", path: "/" },
    { name: "Tin tức", path: "/tin-tuc" },
    { name: title, path },
  ]);

  return (
    <>
      <main className="container mx-auto px-4 py-8">
        <article className="mx-auto max-w-4xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gold">Tra cứu đầu số</p>
          <h1 className="mb-5 text-2xl font-bold leading-tight text-primary md:text-3xl">
            {config.prefix} là mạng gì? {config.prefix} là đầu số {config.network}
            {config.oldPrefix ? ` đổi từ ${config.oldPrefix}` : ""}
          </h1>

          <div className="mb-8 rounded-xl border border-gold/35 bg-gold/10 p-5">
            <p className="text-lg font-semibold text-foreground">
              Trả lời nhanh: <strong>{config.prefix} là mạng {config.network}</strong>
              {config.oldPrefix ? (
                <>. Đầu số {config.prefix} được chuyển đổi từ đầu số cũ <strong>{config.oldPrefix}</strong> sau đợt quy hoạch SIM 11 số về 10 số năm 2018.</>
              ) : (
                <>. Đây là một đầu số 10 chữ số đang được dùng trên thị trường.</>
              )}
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Nếu cần mua số {config.prefix} dễ nhớ, Chọn Số MobiFone hỗ trợ xem kho số, giữ số online, giao SIM toàn quốc và đăng ký chính chủ khi nhận SIM.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link href={simPath} className="inline-flex items-center justify-center rounded-lg bg-gold px-5 py-3 font-bold text-header-bg transition-colors hover:bg-gold-light">
                Xem kho SIM {config.prefix}
              </Link>
              <a href="https://zalo.me/0933686666" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 font-bold text-primary-foreground transition-colors hover:bg-primary/90">
                Nhờ tư vấn chọn số {config.prefix}
              </a>
              <Link href="/tin-tuc/cac-dau-so-mang-mobifone-moi-nhat" className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-5 py-3 font-semibold text-foreground transition-colors hover:border-gold">
                Xem tất cả đầu số MobiFone
              </Link>
            </div>
          </div>

          <div className="space-y-7 text-body">
            <section>
              <h2 className="mb-3 text-xl font-bold text-foreground">1. {config.prefix} là mạng gì?</h2>
              <p>
                Đầu số <strong>{config.prefix}</strong> thuộc nhà mạng <strong>{config.network}</strong>. Khi thấy một số điện thoại bắt đầu bằng {config.prefix}, khách hàng có thể nhận biết đây là thuê bao {config.network}.
              </p>
              {config.network === "MobiFone" ? (
                <p className="mt-3">Nhóm đầu số MobiFone hiện hành gồm {MOBIFONE_PREFIXES}. Các đầu số như 0706, 0707, 0708 thường phù hợp với khách cần số MobiFone giá tốt nhưng vẫn muốn giữ mạng chính hãng.</p>
              ) : null}
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-foreground">2. Đầu số {config.prefix} đổi từ đầu số cũ nào?</h2>
              <p>{oldPrefixText}</p>
              {config.oldPrefix ? (
                <div className="mt-4 overflow-hidden rounded-xl border border-border">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-secondary/30 text-foreground"><tr><th className="px-4 py-3 font-semibold">Đầu số cũ</th><th className="px-4 py-3 font-semibold">Đầu số mới</th><th className="px-4 py-3 font-semibold">Nhà mạng</th></tr></thead>
                    <tbody><tr className="border-t border-border"><td className="px-4 py-3">{config.oldPrefix}</td><td className="px-4 py-3 font-bold text-primary">{config.prefix}</td><td className="px-4 py-3">{config.network}</td></tr></tbody>
                  </table>
                </div>
              ) : null}
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-foreground">3. Ý nghĩa đầu số {config.prefix} khi chọn SIM</h2>
              <p>
                Theo quan niệm dân gian khi chọn SIM số đẹp, ý nghĩa của đầu số chỉ là một phần tham khảo. Khách hàng nên xem thêm cả dãy số, đuôi số, giá, độ dễ nhớ và khả năng đăng ký chính chủ rõ ràng.
              </p>
              {config.meaningNote ? <p className="mt-3">{config.meaningNote}</p> : null}
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-foreground">4. Nên mua SIM {config.prefix} thế nào?</h2>
              <ul className="list-disc space-y-2 pl-6">
                <li>Ưu tiên số có đuôi dễ nhớ: tam hoa, lặp kép, thần tài, lộc phát hoặc năm sinh.</li>
                <li>Kiểm tra giá niêm yết trước khi đặt để tránh phát sinh phí không rõ ràng.</li>
                <li>Yêu cầu hỗ trợ đăng ký thông tin chính chủ ngay khi nhận SIM.</li>
                <li>Nếu dùng gấp, ưu tiên shop có giao nhanh hoặc điểm hỗ trợ tại TP.HCM.</li>
              </ul>
              <p className="mt-4">
                Có thể xem nhanh danh sách <Link href={simPath} className="font-semibold text-gold hover:underline">SIM {config.prefix} đang có trong kho</Link> và đặt giữ số trước khi nhận SIM.
              </p>
            </section>

            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-4 text-xl font-bold text-foreground">Câu hỏi thường gặp</h2>
              <div className="space-y-4">
                {faqItems.map((item) => (
                  <div key={item.q}>
                    <h3 className="font-semibold text-foreground">{item.q}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </article>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildArticle({ headline: title, description, path, datePublished, dateModified, image: "https://www.chonsomobifone.com/share-banner.png" })) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
    </>
  );
}
