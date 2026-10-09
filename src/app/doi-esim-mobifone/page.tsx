import type { Metadata } from "next";
import { buildArticle, buildBreadcrumb, BASE_URL } from "@/lib/seo";
import { InternalLinkGrid, QuickAnswerBox, SeoCtaBox } from "@/components/seo/SeoBlocks";

const PATH = "/doi-esim-mobifone";
const TITLE = "Đổi eSIM MobiFone Ở Đâu? Thủ Tục, Đổi Sang Máy Mới, Phí 2026";
const DESCRIPTION = "Đổi eSIM MobiFone ở đâu, cần giấy tờ gì, đổi sang máy mới ra sao, có đổi eSIM sang SIM vật lý được không. Hướng dẫn trước khi ghé điểm hỗ trợ.";

export const revalidate = 3600;
export const metadata: Metadata = { title: { absolute: TITLE }, description: DESCRIPTION, alternates: { canonical: `${BASE_URL}${PATH}` }, openGraph: { type: "article", title: TITLE, description: DESCRIPTION, url: `${BASE_URL}${PATH}` } };

const faqs = [
  { q: "Đổi eSIM MobiFone ở đâu?", a: "Khách hàng có thể đổi eSIM MobiFone tại điểm giao dịch/điểm hỗ trợ MobiFone gần nhất. Khu vực Quận 7 có thể liên hệ Chọn Số MobiFone để kiểm tra giấy tờ và thời gian trước khi ghé." },
  { q: "Đổi eSIM MobiFone sang máy mới có dùng lại QR cũ được không?", a: "Nhiều trường hợp mã QR eSIM chỉ dùng một lần. Khi đổi sang máy mới, khách hàng thường cần cấp lại eSIM hoặc xác nhận lại thông tin chính chủ trước khi kích hoạt." },
  { q: "Đổi eSIM MobiFone online được không?", a: "Một số thao tác có thể kiểm tra trước qua online, nhưng việc cấp/đổi eSIM có thể yêu cầu xác thực chính chủ. Khách hàng nên nhắn Zalo để được kiểm tra tình trạng thuê bao trước." },
  { q: "Đổi eSIM sang SIM vật lý MobiFone được không?", a: "Có thể xử lý theo tình trạng thuê bao và quy định hiện hành. Cần chuẩn bị CCCD chính chủ và kiểm tra số trước khi làm thủ tục." },
];
const faqJsonLd = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })) };
const articleJsonLd = buildArticle({ headline: TITLE, description: DESCRIPTION, path: PATH, datePublished: "2026-10-06T11:10:00+07:00", dateModified: "2026-10-06T11:10:00+07:00", image: `${BASE_URL}/share-banner.png` });
const breadcrumbJsonLd = buildBreadcrumb([{ name: "Trang chủ", path: "/" }, { name: "Đổi eSIM MobiFone", path: PATH }]);

export default function DoiEsimMobifonePage() {
  return (
    <>
      <main className="container mx-auto px-4 py-8">
        <article className="mx-auto max-w-4xl space-y-8">
          <header>
            <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gold">Dịch vụ eSIM</p>
            <h1 className="text-2xl font-bold leading-tight text-primary md:text-4xl">Đổi eSIM MobiFone ở đâu? Cần chuẩn bị gì trước khi đổi?</h1>
            <p className="mt-4 text-base leading-7 text-body">Người dùng thường tìm “đổi eSIM MobiFone ở đâu”, “đổi eSIM sang máy mới”, “đổi eSIM online” khi vừa mua máy mới hoặc eSIM bị lỗi. Dưới đây là checklist thực tế để tránh mất sóng, mất OTP.</p>
          </header>
          <QuickAnswerBox primaryHref="/doi-esim-mobifone-quan-7" primaryLabel="Đổi eSIM tại Quận 7" secondaryHref="/esim-mobifone" secondaryLabel="Tìm hiểu eSIM MobiFone">
            <p><strong>Đổi eSIM MobiFone</strong> nên thực hiện tại điểm hỗ trợ có xác thực thông tin chính chủ. Trước khi đổi, khách hàng cần chuẩn bị CCCD, giữ máy cũ nếu còn dùng được và không xóa eSIM hiện tại nếu chưa có mã mới.</p>
          </QuickAnswerBox>
          <section className="space-y-3 text-body">
            <h2 className="text-xl font-bold text-foreground">1. Checklist trước khi đổi eSIM</h2>
            <ol className="list-decimal space-y-2 pl-5 leading-7">
              <li>Kiểm tra số MobiFone đang đứng tên ai, còn hoạt động hai chiều không.</li>
              <li>Chuẩn bị CCCD bản gốc trùng thông tin thuê bao.</li>
              <li>Đảm bảo điện thoại mới có hỗ trợ eSIM và còn kết nối Wi-Fi khi quét QR.</li>
              <li>Sao lưu dữ liệu, không xóa eSIM cũ trước khi được hướng dẫn.</li>
            </ol>
          </section>
          <section className="space-y-3 text-body">
            <h2 className="text-xl font-bold text-foreground">2. Các trường hợp cần đổi/cấp lại eSIM</h2>
            <div className="grid gap-3 md:grid-cols-2">
              {["Đổi iPhone/Android sang máy mới", "eSIM mất sóng hoặc lỗi cấu hình", "Muốn chuyển eSIM về SIM vật lý", "Mất điện thoại cần bảo toàn số"].map((item) => <div key={item} className="rounded-xl border border-border bg-card p-4 text-sm leading-6">{item}</div>)}
            </div>
          </section>
          <SeoCtaBox title="Nhắn Zalo kiểm tra thủ tục đổi eSIM" description="Gửi số MobiFone, dòng máy đang dùng và nhu cầu đổi sang máy mới/cấp lại. Đội Chọn Số MobiFone kiểm tra trước để khách không phải đi lại nhiều lần." />
          <section>
            <h2 className="mb-4 text-xl font-bold text-foreground">Câu hỏi thường gặp khi đổi eSIM MobiFone</h2>
            <div className="space-y-3">{faqs.map((item) => <details key={item.q} className="rounded-xl border border-border bg-card p-4"><summary className="cursor-pointer font-semibold text-foreground">{item.q}</summary><p className="mt-3 text-sm leading-6 text-body">{item.a}</p></details>)}</div>
          </section>
          <InternalLinkGrid links={[{ href: "/doi-esim-mobifone-quan-7", label: "Đổi eSIM MobiFone Quận 7", desc: "Điểm hỗ trợ gần Tân Hưng, Him Lam, Phú Mỹ Hưng." }, { href: "/esim-mobifone", label: "eSIM MobiFone", desc: "Giải thích eSIM, 5G, lỗi thường gặp." }, { href: "/diem-giao-dich-mobifone-quan-7", label: "MobiFone gần đây Quận 7", desc: "Địa chỉ, giờ mở cửa, chỉ đường Google Maps." }, { href: "/tin-tuc/kiem-tra-sim-chinh-chu-mobifone", label: "Kiểm tra SIM chính chủ", desc: "Xác nhận thông tin thuê bao trước khi đổi eSIM." }]} />
        </article>
      </main>
      {[articleJsonLd, breadcrumbJsonLd, faqJsonLd].map((json, i) => <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />)}
    </>
  );
}
