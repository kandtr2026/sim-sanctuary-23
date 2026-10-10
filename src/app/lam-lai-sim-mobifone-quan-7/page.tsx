import type { Metadata } from "next";
import { buildBreadcrumb, BASE_URL } from "@/lib/seo";
import { InternalLinkGrid, QuickAnswerBox, SeoCtaBox } from "@/components/seo/SeoBlocks";

const PATH = "/lam-lai-sim-mobifone-quan-7";
const TITLE = "Làm Lại SIM MobiFone Quận 7 — Mất SIM, Hỏng SIM, Mất Điện Thoại";
const DESCRIPTION = "Làm lại SIM MobiFone Quận 7 cho Anh/Chị tại Him Lam, Tân Hưng, Phú Mỹ Hưng: thủ tục CCCD, giữ số cũ, đổi eSIM/SIM vật lý và hotline hỗ trợ.";

export const revalidate = 3600;
export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `${BASE_URL}${PATH}` },
  openGraph: { type: "website", title: TITLE, description: DESCRIPTION, url: `${BASE_URL}${PATH}` },
};

const faqs = [
  { q: "Làm lại SIM MobiFone Quận 7 cần mang gì?", a: "Quý khách nên chuẩn bị CCCD chính chủ, số MobiFone cần cấp lại và điện thoại đang dùng nếu còn. Trường hợp mất máy, Anh/Chị nên nhắn Zalo trước để được hướng dẫn khóa/giữ số an toàn." },
  { q: "Có làm lại SIM MobiFone gần Him Lam không?", a: "Anh/Chị ở Him Lam, Tân Hưng, Phú Mỹ Hưng có thể liên hệ Chọn Số MobiFone để được hướng dẫn điểm hỗ trợ phù hợp trước khi ghé." },
  { q: "Làm lại SIM mất bao lâu?", a: "Thời gian thực tế tùy tình trạng thuê bao và xác minh chính chủ. Nếu giấy tờ đầy đủ, thủ tục thường nhanh hơn nhiều so với đi lại nhiều lần vì thiếu thông tin." },
  { q: "Có thể đổi luôn sang eSIM khi làm lại SIM không?", a: "Nếu thiết bị hỗ trợ eSIM và thuê bao đủ điều kiện, Quý khách có thể hỏi phương án cấp lại bằng eSIM thay vì SIM vật lý." },
];

const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  name: "Chọn Số MobiFone — Hỗ trợ làm lại SIM Quận 7",
  url: `${BASE_URL}${PATH}`,
  telephone: "+84933686666",
  areaServed: ["Quận 7", "Him Lam", "Tân Hưng", "Phú Mỹ Hưng", "TP.HCM"],
  address: { "@type": "PostalAddress", addressLocality: "Quận 7", addressRegion: "TP.HCM", addressCountry: "VN" },
};
const faqJsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })) };
const breadcrumbJsonLd = buildBreadcrumb([{ name: "Trang chủ", path: "/" }, { name: "Làm lại SIM MobiFone Quận 7", path: PATH }]);

export default function LamLaiSimMobifoneQuan7Page() {
  return (
    <>
      <main className="container mx-auto px-4 py-8">
        <article className="mx-auto max-w-4xl space-y-8">
          <header>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gold">MobiFone gần đây · Quận 7</p>
            <h1 className="text-2xl font-bold leading-tight text-primary md:text-4xl">Làm lại SIM MobiFone Quận 7 khi mất SIM, hỏng SIM hoặc mất điện thoại</h1>
            <p className="mt-4 text-base leading-7 text-body">Nếu Anh/Chị đang ở Quận 7, Him Lam, Tân Hưng hoặc Phú Mỹ Hưng và cần cấp lại SIM MobiFone, hãy kiểm tra giấy tờ trước khi ghé điểm hỗ trợ. Việc chuẩn bị đúng giúp giữ số cũ, khôi phục OTP và hạn chế rủi ro tài khoản cá nhân.</p>
          </header>

          <QuickAnswerBox eyebrow="Cần xử lý gấp?" primaryHref="tel:+84933686666" primaryLabel="Gọi 0933.686.666" secondaryHref="https://zalo.me/0933686666" secondaryLabel="Chat Zalo kiểm tra giấy tờ">
            <p><strong>Làm lại SIM MobiFone Quận 7</strong> áp dụng khi SIM bị mất, hỏng, mất sóng, không nhận OTP hoặc Anh/Chị vừa mất điện thoại. Nếu cần gấp, hãy gọi hoặc nhắn Zalo trước để được kiểm tra trước giấy tờ cần chuẩn bị.</p>
          </QuickAnswerBox>

          <section className="rounded-2xl border border-primary/20 bg-card p-5">
            <h2 className="text-xl font-bold text-foreground">Các khu vực hỗ trợ gần Quận 7</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {["Him Lam", "Tân Hưng", "Phú Mỹ Hưng", "Nguyễn Thị Thập", "Lotte Mart Quận 7", "Cầu Kênh Tẻ"].map((area) => (
                <div key={area} className="rounded-xl border border-border bg-background/70 p-4 text-sm font-semibold text-body">{area}</div>
              ))}
            </div>
          </section>

          <section className="space-y-3 text-body">
            <h2 className="text-xl font-bold text-foreground">Checklist trước khi ghé làm lại SIM</h2>
            <ol className="list-decimal space-y-2 pl-5 leading-7">
              <li>Chuẩn bị CCCD chính chủ của thuê bao.</li>
              <li>Ghi lại số MobiFone cần cấp lại và tình trạng đang gặp.</li>
              <li>Nếu mất điện thoại, ưu tiên hỏi cách khóa/giữ số trước.</li>
              <li>Nếu muốn đổi sang eSIM, kiểm tra máy có hỗ trợ eSIM và còn Wi-Fi khi kích hoạt.</li>
            </ol>
          </section>

          <SeoCtaBox title="Gửi Zalo để kiểm tra trước khi đi" description="Nhắn số MobiFone, khu vực đang ở Quận 7 và tình trạng mất/hỏng SIM. Chọn Số MobiFone sẽ hướng dẫn giấy tờ, giờ phù hợp và phương án SIM vật lý/eSIM." phoneHref="tel:+84933686666" />

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
            { href: "/lam-lai-sim-mobifone", label: "Hướng dẫn làm lại SIM MobiFone", desc: "Thủ tục cấp lại SIM mất, hỏng, không nhận OTP." },
            { href: "/doi-esim-mobifone-quan-7", label: "Đổi eSIM MobiFone Quận 7", desc: "Đổi máy, cấp lại QR eSIM, chuyển SIM vật lý sang eSIM." },
            { href: "/diem-giao-dich-mobifone-quan-7", label: "Điểm giao dịch MobiFone Quận 7", desc: "Thông tin khu vực và chỉ đường cho Anh/Chị gần Quận 7." },
            { href: "/tin-tuc/sim-bi-khoa-mobifone", label: "SIM MobiFone bị khóa", desc: "Nguyên nhân bị khóa và hướng xử lý." },
          ]} />
        </article>
      </main>
      {[localBusinessJsonLd, breadcrumbJsonLd, faqJsonLd].map((json, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />)}
    </>
  );
}
