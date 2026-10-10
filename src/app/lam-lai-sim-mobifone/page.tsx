import type { Metadata } from "next";
import { buildArticle, buildBreadcrumb, BASE_URL } from "@/lib/seo";
import { InternalLinkGrid, QuickAnswerBox, SeoCtaBox } from "@/components/seo/SeoBlocks";

const PATH = "/lam-lai-sim-mobifone";
const TITLE = "Làm Lại SIM MobiFone Ở Đâu? Thủ Tục Cấp Lại SIM Mất, Hỏng, Mất Sóng";
const DESCRIPTION = "Hướng dẫn làm lại SIM MobiFone khi mất SIM, hỏng SIM, mất sóng, mất điện thoại: cần CCCD gì, có giữ số cũ không, làm tại Quận 7 thế nào.";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${BASE_URL}${PATH}` },
  openGraph: { type: "article", title: TITLE, description: DESCRIPTION, url: `${BASE_URL}${PATH}` },
};

const faqs = [
  { q: "Làm lại SIM MobiFone có giữ được số cũ không?", a: "Có. Nếu thuê bao đủ điều kiện xác thực chính chủ và không vướng tranh chấp, khách hàng có thể cấp lại SIM để giữ số MobiFone cũ." },
  { q: "Làm lại SIM MobiFone cần giấy tờ gì?", a: "Thông thường cần CCCD/giấy tờ chính chủ, thông tin thuê bao và một số dữ liệu xác minh theo quy định nhà mạng. Nên nhắn Zalo trước để kiểm tra trường hợp cụ thể." },
  { q: "Mất điện thoại có nên khóa SIM trước không?", a: "Nên liên hệ hỗ trợ sớm để khóa chiều hoặc cấp lại SIM, tránh rủi ro OTP ngân hàng/tài khoản cá nhân bị dùng sai mục đích." },
  { q: "Có làm lại SIM MobiFone Quận 7 được không?", a: "Khách ở Quận 7, Him Lam, Tân Hưng, Phú Mỹ Hưng có thể nhắn Zalo Chọn Số MobiFone để được kiểm tra thủ tục và hướng dẫn điểm hỗ trợ gần nhất." },
];

const faqJsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })) };
const articleJsonLd = buildArticle({ headline: TITLE, description: DESCRIPTION, path: PATH, datePublished: "2026-10-09T13:40:00+07:00", dateModified: "2026-10-09T13:40:00+07:00", image: `${BASE_URL}/share-banner.png` });
const breadcrumbJsonLd = buildBreadcrumb([{ name: "Trang chủ", path: "/" }, { name: "Làm lại SIM MobiFone", path: PATH }]);

export default function LamLaiSimMobifonePage() {
  return (
    <>
      <main className="container mx-auto px-4 py-8">
        <article className="mx-auto max-w-4xl space-y-8">
          <header>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gold">Dịch vụ MobiFone</p>
            <h1 className="text-2xl font-bold leading-tight text-primary md:text-4xl">Làm lại SIM MobiFone khi mất SIM, hỏng SIM hoặc mất điện thoại</h1>
            <p className="mt-4 text-base leading-7 text-body">Khi SIM MobiFone bị mất, hỏng, mất sóng hoặc điện thoại bị thất lạc, việc quan trọng nhất là giữ số và bảo vệ OTP. Trang này hướng dẫn nhanh thủ tục cấp lại SIM trước khi khách ghé điểm hỗ trợ.</p>
          </header>

          <QuickAnswerBox primaryHref="/lam-lai-sim-mobifone-quan-7" primaryLabel="Làm lại SIM tại Quận 7" secondaryHref="/doi-esim-mobifone" secondaryLabel="Đổi sang eSIM MobiFone">
            <p><strong>Làm lại SIM MobiFone</strong> thường cần xác minh chính chủ bằng CCCD và thông tin thuê bao. Nếu mất điện thoại hoặc nghi lộ OTP, nên xử lý sớm để tránh rủi ro tài khoản ngân hàng, Zalo, mạng xã hội.</p>
          </QuickAnswerBox>

          <section className="grid gap-3 md:grid-cols-3">
            {[
              ["01", "Mất SIM / mất máy", "Liên hệ hỗ trợ để khóa/giữ số, tránh rủi ro OTP."],
              ["02", "Chuẩn bị CCCD", "Mang giấy tờ chính chủ và thông tin số đang dùng."],
              ["03", "Cấp lại SIM", "Nhận SIM vật lý mới hoặc hỏi phương án eSIM nếu máy hỗ trợ."],
            ].map(([so, title, body]) => (
              <div key={so} className="rounded-2xl border border-border bg-card p-5">
                <p className="text-sm font-bold text-gold">{so}</p>
                <h2 className="mt-2 text-lg font-bold text-foreground">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-body">{body}</p>
              </div>
            ))}
          </section>

          <section className="space-y-3 text-body">
            <h2 className="text-xl font-bold text-foreground">Khi nào cần làm lại SIM MobiFone ngay?</h2>
            <ul className="list-disc space-y-2 pl-5 leading-7">
              <li>Mất điện thoại, mất SIM hoặc nghi người khác đang giữ SIM.</li>
              <li>SIM vật lý cũ bị gãy, oxy hóa, lúc nhận sóng lúc không.</li>
              <li>Không nhận được OTP ngân hàng dù máy vẫn hoạt động bình thường.</li>
              <li>Muốn chuyển từ SIM vật lý sang eSIM hoặc ngược lại khi đổi máy.</li>
            </ul>
          </section>

          <SeoCtaBox title="Cần kiểm tra làm lại SIM MobiFone?" description="Gửi Zalo số MobiFone đang dùng, tình trạng mất/hỏng SIM và khu vực hiện tại. Chọn Số MobiFone sẽ hướng dẫn giấy tờ trước để khách không phải đi lại nhiều lần." phoneHref="tel:+84933686666" />

          <section>
            <h2 className="mb-4 text-xl font-bold text-foreground">Câu hỏi thường gặp khi cấp lại SIM MobiFone</h2>
            <div className="space-y-3">
              {faqs.map((item) => (
                <details key={item.q} className="rounded-xl border border-border bg-card p-4">
                  <summary className="cursor-pointer font-semibold text-foreground">{item.q}</summary>
                  <p className="mt-3 text-sm leading-6 text-body">{item.a}</p>
                </details>
              ))}
            </div>
          </section>

          <InternalLinkGrid links={[
            { href: "/lam-lai-sim-mobifone-quan-7", label: "Làm lại SIM MobiFone Quận 7", desc: "Hướng dẫn cho khách Him Lam, Tân Hưng, Phú Mỹ Hưng." },
            { href: "/doi-esim-mobifone", label: "Đổi eSIM MobiFone", desc: "Chuyển SIM vật lý sang eSIM hoặc cấp lại QR eSIM." },
            { href: "/diem-giao-dich-mobifone-quan-7", label: "MobiFone gần đây Quận 7", desc: "Địa chỉ, giờ mở cửa, chỉ đường và hotline." },
            { href: "/tin-tuc/kiem-tra-sim-chinh-chu-mobifone", label: "Kiểm tra SIM chính chủ", desc: "Xác minh thuê bao trước khi cấp lại SIM." },
          ]} />
        </article>
      </main>
      {[articleJsonLd, breadcrumbJsonLd, faqJsonLd].map((json, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />)}
    </>
  );
}
