import type { Metadata } from "next";
import { buildBreadcrumb, BASE_URL } from "@/lib/seo";
import { InternalLinkGrid, QuickAnswerBox, SeoCtaBox } from "@/components/seo/SeoBlocks";

const PATH = "/doi-esim-mobifone-quan-7";
const TITLE = "Đổi eSIM MobiFone Quận 7 — Đổi Máy, Cấp Lại QR eSIM, Mất Sóng";
const DESCRIPTION = "Đổi eSIM MobiFone Quận 7 cho Anh/Chị tại Him Lam, Tân Hưng, Phú Mỹ Hưng: đổi sang máy mới, cấp lại QR eSIM, chuyển SIM vật lý sang eSIM.";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${BASE_URL}${PATH}` },
  openGraph: { type: "website", title: TITLE, description: DESCRIPTION, url: `${BASE_URL}${PATH}` },
};

const faqs = [
  { q: "Đổi eSIM MobiFone Quận 7 cần chuẩn bị gì?", a: "Quý khách nên chuẩn bị CCCD chính chủ, điện thoại hỗ trợ eSIM, Wi‑Fi khi quét QR và thông tin số MobiFone đang dùng." },
  { q: "Đổi eSIM sang máy mới dùng lại QR cũ được không?", a: "Nhiều mã QR eSIM chỉ dùng một lần. Khi đổi máy thường cần cấp lại QR mới hoặc xác minh lại thuê bao trước khi kích hoạt." },
  { q: "Có đổi từ SIM vật lý sang eSIM MobiFone được không?", a: "Có thể xử lý nếu thuê bao và thiết bị đủ điều kiện. Anh/Chị nên nhắn Zalo trước để kiểm tra dòng máy, số đang dùng và giấy tờ cần mang." },
  { q: "eSIM mất sóng sau khi đổi máy xử lý sao?", a: "Không nên xóa eSIM liên tục nếu chưa chắc. Hãy chụp màn hình lỗi, kiểm tra Wi‑Fi/cấu hình mạng và gửi Zalo để được hướng dẫn trước." },
];

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Chọn Số MobiFone — Hỗ trợ đổi eSIM Quận 7",
  url: `${BASE_URL}${PATH}`,
  telephone: "+84933686666",
  areaServed: ["Quận 7", "Him Lam", "Tân Hưng", "Phú Mỹ Hưng", "TP.HCM"],
  address: { "@type": "PostalAddress", addressLocality: "Quận 7", addressRegion: "TP.HCM", addressCountry: "VN" },
};
const faqJsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })) };
const breadcrumbJsonLd = buildBreadcrumb([{ name: "Trang chủ", path: "/" }, { name: "Đổi eSIM MobiFone Quận 7", path: PATH }]);

export default function DoiEsimMobifoneQuan7Page() {
  return (
    <>
      <main className="container mx-auto px-4 py-8">
        <article className="mx-auto max-w-4xl space-y-8">
          <header>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gold">eSIM MobiFone · Quận 7</p>
            <h1 className="text-2xl font-bold leading-tight text-primary md:text-4xl">Đổi eSIM MobiFone Quận 7: đổi máy, cấp lại QR, chuyển SIM vật lý sang eSIM</h1>
            <p className="mt-4 text-base leading-7 text-body">Anh/Chị ở Him Lam, Tân Hưng, Phú Mỹ Hưng hoặc quanh Quận 7 thường cần đổi eSIM khi mua máy mới, mất sóng hoặc muốn chuyển từ SIM vật lý sang eSIM. Nội dung dưới đây giúp Anh/Chị kiểm tra nhanh các bước cần chuẩn bị để hạn chế thao tác sai và gián đoạn nhận OTP.</p>
          </header>

          <QuickAnswerBox eyebrow="Hỗ trợ nhanh" primaryHref="tel:+84933686666" primaryLabel="Gọi 0933.686.666" secondaryHref="https://zalo.me/0933686666" secondaryLabel="Chat Zalo kiểm tra máy">
            <p><strong>Đổi eSIM MobiFone Quận 7</strong> nên kiểm tra trước dòng máy, số thuê bao và giấy tờ chính chủ. Nếu đang đổi máy mới, không nên xóa eSIM ở máy cũ trước khi có hướng dẫn rõ.</p>
          </QuickAnswerBox>

          <section className="grid gap-3 md:grid-cols-3">
            {[
              ["Đổi máy mới", "Cấp lại QR eSIM cho iPhone/Android hỗ trợ eSIM."],
              ["Mất sóng", "Kiểm tra cấu hình mạng, QR eSIM và trạng thái thuê bao."],
              ["SIM vật lý → eSIM", "Tư vấn chuyển đổi nếu thiết bị và thuê bao đủ điều kiện."],
            ].map(([title, body]) => (
              <div key={title} className="rounded-2xl border border-border bg-card p-5">
                <h2 className="text-lg font-bold text-foreground">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-body">{body}</p>
              </div>
            ))}
          </section>

          <section className="space-y-3 text-body">
            <h2 className="text-xl font-bold text-foreground">Checklist trước khi đổi eSIM</h2>
            <ol className="list-decimal space-y-2 pl-5 leading-7">
              <li>Kiểm tra máy có hỗ trợ eSIM và còn kết nối Wi‑Fi ổn định.</li>
              <li>Chuẩn bị CCCD chính chủ của số MobiFone cần đổi.</li>
              <li>Giữ máy cũ nếu còn dùng được, không xóa eSIM khi chưa có mã mới.</li>
              <li>Chụp màn hình lỗi nếu eSIM mất sóng, không nhận OTP hoặc quét QR thất bại.</li>
            </ol>
          </section>

          <SeoCtaBox title="Gửi Zalo để kiểm tra đổi eSIM trước" description="Nhắn dòng máy, số MobiFone đang dùng và nhu cầu đổi máy/cấp lại QR. Chọn Số MobiFone kiểm tra trước để Quý khách hạn chế phải đi lại nhiều lần." phoneHref="tel:+84933686666" />

          <section>
            <h2 className="mb-4 text-xl font-bold text-foreground">Câu hỏi thường gặp</h2>
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
            { href: "/doi-esim-mobifone", label: "Hướng dẫn đổi eSIM MobiFone", desc: "Thủ tục đổi eSIM, đổi máy, cấp lại mã QR." },
            { href: "/esim-mobifone", label: "eSIM MobiFone là gì?", desc: "Giải thích eSIM, 5G và lỗi thường gặp." },
            { href: "/lam-lai-sim-mobifone-quan-7", label: "Làm lại SIM MobiFone Quận 7", desc: "Mất SIM, hỏng SIM, không nhận OTP." },
            { href: "/diem-giao-dich-mobifone-quan-7", label: "Điểm giao dịch MobiFone Quận 7", desc: "Thông tin local và hotline hỗ trợ." },
          ]} />
        </article>
      </main>
      {[localBusinessJsonLd, breadcrumbJsonLd, faqJsonLd].map((json, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />)}
    </>
  );
}
