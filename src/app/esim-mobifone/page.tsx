import type { Metadata } from "next";
import { buildArticle, buildBreadcrumb, BASE_URL } from "@/lib/seo";
import { InternalLinkGrid, QuickAnswerBox, SeoCtaBox } from "@/components/seo/SeoBlocks";

const PATH = "/esim-mobifone";
const TITLE = "eSIM MobiFone 2026 — Giá Bao Nhiêu, Kích Hoạt Bao Lâu, Có Nghe Gọi Không?";
const DESCRIPTION = "Hướng dẫn eSIM MobiFone: dùng 4G/5G, nghe gọi như SIM vật lý, đổi sang máy mới, xử lý mất sóng và điểm hỗ trợ eSIM MobiFone Quận 7.";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${BASE_URL}${PATH}` },
  openGraph: { type: "article", title: TITLE, description: DESCRIPTION, url: `${BASE_URL}${PATH}` },
};

const faqs = [
  { q: "eSIM MobiFone có nghe gọi được không?", a: "Có. eSIM MobiFone là SIM điện tử gắn trong máy, vẫn nghe gọi, nhắn tin và dùng data 4G/5G như SIM vật lý nếu thiết bị và gói cước hỗ trợ." },
  { q: "eSIM MobiFone kích hoạt bao lâu?", a: "Thông thường việc cấp mã QR và kích hoạt eSIM tại điểm hỗ trợ chỉ mất vài phút. Thời gian thực tế phụ thuộc giấy tờ chính chủ, tình trạng thuê bao và thiết bị của khách hàng." },
  { q: "eSIM MobiFone giá bao nhiêu?", a: "Chi phí đổi/cấp eSIM áp dụng theo biểu phí hiện hành của nhà mạng hoặc điểm hỗ trợ. Khách hàng nên nhắn Zalo trước để được kiểm tra thủ tục và phí tại thời điểm làm." },
  { q: "Đổi eSIM MobiFone sang máy mới làm thế nào?", a: "Khi đổi máy, khách hàng thường cần cấp lại mã QR eSIM mới. Nên sao lưu dữ liệu, chuẩn bị CCCD chính chủ và liên hệ điểm hỗ trợ MobiFone trước khi xóa eSIM ở máy cũ." },
];

const faqJsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })) };
const articleJsonLd = buildArticle({ headline: TITLE, description: DESCRIPTION, path: PATH, datePublished: "2026-10-06T11:00:00+07:00", dateModified: "2026-10-06T11:00:00+07:00", image: `${BASE_URL}/share-banner.png` });
const breadcrumbJsonLd = buildBreadcrumb([{ name: "Trang chủ", path: "/" }, { name: "eSIM MobiFone", path: PATH }]);

export default function EsimMobifonePage() {
  return (
    <>
      <main className="container mx-auto px-4 py-8">
        <article className="mx-auto max-w-4xl space-y-8">
          <header>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gold">Hướng dẫn MobiFone</p>
            <h1 className="text-2xl font-bold leading-tight text-primary md:text-4xl">eSIM MobiFone: giá bao nhiêu, kích hoạt bao lâu và khi nào nên đổi?</h1>
            <p className="mt-4 text-base leading-7 text-body">Nhu cầu tìm eSIM MobiFone tăng mạnh vì khách đổi sang iPhone/Android đời mới, cần dùng 5G hoặc muốn bỏ SIM vật lý. Trang này gom các câu hỏi người dùng đang tìm trên Google và hướng dẫn cách xử lý an toàn.</p>
          </header>

          <QuickAnswerBox primaryHref="/doi-esim-mobifone" primaryLabel="Xem cách đổi eSIM" secondaryHref="/doi-esim-mobifone-quan-7" secondaryLabel="Đổi eSIM tại Quận 7">
            <p><strong>eSIM MobiFone</strong> là SIM điện tử được kích hoạt bằng mã QR trên thiết bị hỗ trợ eSIM. Sau khi kích hoạt đúng, eSIM vẫn nghe gọi, nhắn tin, nhận OTP ngân hàng và dùng data 4G/5G như SIM vật lý.</p>
          </QuickAnswerBox>

          <section className="space-y-3 text-body">
            <h2 className="text-xl font-bold text-foreground">1. Khi nào nên dùng eSIM MobiFone?</h2>
            <ul className="list-disc space-y-2 pl-5 leading-7">
              <li>Muốn dùng 2 số trên iPhone hoặc máy Android hỗ trợ eSIM.</li>
              <li>Muốn hạn chế mất SIM vật lý khi đi công tác, du lịch.</li>
              <li>Cần chuyển SIM sang thiết bị mới nhưng vẫn giữ số MobiFone hiện tại.</li>
              <li>Muốn dùng 4G/5G MobiFone ổn định nhưng khe SIM vật lý đã dùng cho số khác.</li>
            </ul>
          </section>

          <section className="space-y-3 text-body">
            <h2 className="text-xl font-bold text-foreground">2. eSIM MobiFone 5G cần điều kiện gì?</h2>
            <p>Để dùng 5G, khách hàng cần thiết bị hỗ trợ 5G, khu vực có phủ sóng 5G, thuê bao/gói cước phù hợp và cấu hình mạng đúng. Nếu máy có eSIM nhưng chưa vào 5G, nên kiểm tra từng bước thay vì đổi SIM nhiều lần.</p>
          </section>

          <section className="space-y-3 text-body">
            <h2 className="text-xl font-bold text-foreground">3. Lỗi thường gặp khi dùng eSIM MobiFone</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {["eSIM mất sóng sau khi đổi máy", "Quét QR báo mã đã sử dụng", "Không thấy tuỳ chọn 5G", "Máy nhận eSIM nhưng không gọi được"].map((item) => (
                <div key={item} className="rounded-xl border border-border bg-card p-4 text-sm leading-6">{item}</div>
              ))}
            </div>
            <p>Với các lỗi trên, không nên xóa eSIM liên tục nếu chưa chắc. Hãy chụp màn hình tình trạng máy và gửi Zalo để được hướng dẫn trước.</p>
          </section>

          <SeoCtaBox title="Cần đổi hoặc kiểm tra eSIM MobiFone?" description="Gửi Zalo mẫu máy, số MobiFone đang dùng và tình trạng lỗi. Chọn Số MobiFone sẽ kiểm tra trước khi khách ghé điểm hỗ trợ Quận 7." />

          <section>
            <h2 className="mb-4 text-xl font-bold text-foreground">Câu hỏi thường gặp về eSIM MobiFone</h2>
            <div className="space-y-3">
              {faqs.map((item) => (
                <details key={item.q} className="rounded-xl border border-border bg-card p-4">
                  <summary className="cursor-pointer font-semibold text-foreground">{item.q}</summary>
                  <p className="mt-3 text-sm leading-6 text-body">{item.a}</p>
                </details>
              ))}
            </div>
          </section>

          <InternalLinkGrid links={[{ href: "/doi-esim-mobifone", label: "Đổi eSIM MobiFone", desc: "Thủ tục đổi eSIM, đổi máy, đổi lại SIM vật lý." }, { href: "/doi-esim-mobifone-quan-7", label: "Đổi eSIM MobiFone Quận 7", desc: "Điểm hỗ trợ gần Tân Hưng, Him Lam, Phú Mỹ Hưng." }, { href: "/5g-mobifone", label: "5G MobiFone", desc: "Kiểm tra điều kiện dùng 5G và lỗi thường gặp." }, { href: "/sim-dau-so", label: "Kho SIM đầu số MobiFone", desc: "Chọn SIM 089, 090, 093, 070 chính chủ." }]} />
        </article>
      </main>
      {[articleJsonLd, breadcrumbJsonLd, faqJsonLd].map((json, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />)}
    </>
  );
}
