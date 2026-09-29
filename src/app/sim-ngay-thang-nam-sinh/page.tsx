import type { Metadata } from "next";
import Link from "next/link";
import { MapPin, MessageCircle, Phone } from "lucide-react";
import FaqAccordion, { type FaqItem } from "@/components/FaqAccordion";
import TrustCommitments from "@/components/TrustCommitments";
import { buildBreadcrumb } from "@/lib/seo";
import SimNgaySinhFinder from "./SimNgaySinhFinder";
import { layMauSoNgaySinh } from "./_lib/mauSoNgaySinh";

// ISR 1 giờ: khối "số mẫu" đọc Supabase bằng service role — mỗi giờ tối đa 2
// request nhỏ. Danh sách kết quả tìm kiếm thì lấy trực tiếp /api/sims ở client.
export const revalidate = 3600;

const TITLE = "Sim Ngày Tháng Năm Sinh MobiFone | Tìm SIM Đuôi DDMMYY";
const DESCRIPTION =
  "Nhập ngày sinh để tìm SIM MobiFone có 6 số cuối trùng DDMMYY. Kho 6.646 số ngày sinh, giá niêm yết, tư vấn giữ số qua Zalo.";
const PATH = "/sim-ngay-thang-nam-sinh";
const CANONICAL = `https://www.chonsomobifone.com${PATH}`;

export const metadata: Metadata = {
  // `absolute` để layout không nối thêm "| CHONSOMOBIFONE.COM" vào sau.
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "CHONSOMOBIFONE.COM",
    title: TITLE,
    description: DESCRIPTION,
    url: CANONICAL,
    images: [
      {
        url: "https://www.chonsomobifone.com/share-banner.png?v=999",
        type: "image/png",
        width: 1200,
        height: 630,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/share-banner.png?v=999"],
  },
};

const faqItems: FaqItem[] = [
  {
    q: "Không có số trùng đúng 6 số cuối ngày sinh thì sao?",
    a: "Trang sẽ gợi ý các số chứa trọn ngày sinh ở giữa dãy, ví dụ 09.01.08.05.04 chứa 01.08.05. Nếu vẫn chưa có số phù hợp, khách hàng gửi ngày sinh qua Zalo 0933.686.666 để CHONSOMOBIFONE tìm giúp trong kho tổng.",
  },
  {
    q: "Nhập ngày sinh theo định dạng nào?",
    a: "Nhập ngày, tháng và năm sinh đủ 4 số vào 3 ô, hệ thống tự quy về dạng DDMMYY (05/07/1990 thành 050790). Ô tìm nhanh nhận 6 số DDMMYY, 8 số DDMMYYYY hoặc ngày có dấu / - . như 05/07/1990.",
  },
  {
    q: "Sim ngày sinh có được đăng ký thông tin chính chủ không?",
    a: "Có. Toàn bộ SIM tại CHONSOMOBIFONE đều hỗ trợ đăng ký thông tin chính chủ. Khách hàng kiểm tra đúng thông tin rồi mới thanh toán.",
  },
  {
    q: "Làm sao giữ số ngày sinh vừa chọn?",
    a: "Bấm “Chat Zalo giữ số” trên thẻ SIM hoặc gọi hotline bán SIM 0933.686.666. Nhân viên xác nhận số còn trong kho và giữ số cho khách hàng. Khách hàng muốn xem trực tiếp có thể ghé cửa hàng tại Quận 7, hotline 0938.868.868.",
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
  { name: "Sim ngày tháng năm sinh", path: PATH },
]);

const SEO_SECTIONS: { title: string; body: React.ReactNode }[] = [
  {
    title: "Sim ngày tháng năm sinh là gì?",
    body: (
      <p>
        Sim ngày tháng năm sinh là số điện thoại có 6 chữ số cuối trùng với ngày sinh viết theo dạng DDMMYY: ngày,
        tháng và 2 số cuối của năm. Khách hàng sinh ngày 05/07/1990 sẽ tìm số có đuôi 05.07.90, tức dạng
        09xx.05.07.90. Đây là cách cá nhân hóa số điện thoại bằng một dấu mốc riêng: ngày sinh của chính khách
        hàng, của con, của người thân hoặc một ngày kỷ niệm đáng nhớ.
      </p>
    ),
  },
  {
    title: "Vì sao dạng DDMMYY dễ nhớ?",
    body: (
      <p>
        Ngày sinh là dãy số mỗi người đã thuộc sẵn. Khi 6 số cuối trùng DDMMYY, chủ thuê bao chỉ cần nhớ thêm 4 số
        đầu như 0901 hay 0931. Người nhận cũng dễ ghi lại chính xác vì chỉ cần nghe “đuôi ngày 05 tháng 07 năm
        90”. Dạng số này phù hợp làm số liên lạc lâu dài, in danh thiếp, hoặc làm quà sinh nhật mang dấu ấn cá
        nhân.
      </p>
    ),
  },
  {
    title: "Cách chọn sim ngày sinh MobiFone",
    body: (
      <ol className="list-decimal space-y-1.5 pl-5">
        <li>
          Nhập ngày sinh vào form ở đầu trang. Các số trùng tuyệt đối 6 số cuối luôn được xếp lên trước, gắn nhãn
          “Trùng 6 số cuối ngày sinh”.
        </li>
        <li>
          Chưa có số trùng tuyệt đối thì xem nhóm số chứa ngày sinh trong dãy: vẫn giữ trọn 6 số ngày sinh, chỉ khác
          vị trí.
        </li>
        <li>Lọc theo đầu số quen dùng: 090, 093 là các đầu số lâu năm của MobiFone, ngoài ra có 089 và nhóm 07x.</li>
        <li>
          Lọc theo khoảng giá để so sánh nhanh, sau đó nhắn Zalo 0933.686.666 để giữ số. Khi nhận SIM, khách hàng
          được hỗ trợ đăng ký thông tin chính chủ.
        </li>
      </ol>
    ),
  },
  {
    title: "Giá sim ngày tháng năm sinh",
    body: (
      <p>
        Giá từng số được niêm yết ngay trên thẻ SIM và lấy trực tiếp từ kho đang bán, không phát sinh phụ phí. Giá
        phụ thuộc chủ yếu vào đầu số và độ đẹp của phần còn lại trong dãy số, nên cùng một ngày sinh, số đầu 090 và
        093 có thể chênh giá nhau. Bộ lọc giá (Dưới 1 triệu, 1 - 3 triệu, 3 - 5 triệu, 5 - 10 triệu, Trên 10 triệu)
        giúp khách hàng xem nhanh các số trong tầm ngân sách.
      </p>
    ),
  },
];

const RELATED_LINKS = [
  { href: "/sim-nam-sinh", label: "Sim năm sinh" },
  { href: "/sim-phong-thuy", label: "Sim hợp tuổi" },
  { href: "/tra-cuu-sim", label: "Tra cứu ý nghĩa số" },
  { href: "/mua-sim-gia-re", label: "Sim giá rẻ" },
  { href: "/sim-de-nho", label: "Sim dễ nhớ" },
];

export default async function SimNgayThangNamSinhPage() {
  const samples = await layMauSoNgaySinh();

  return (
    <>
      <main className="min-h-screen bg-background pb-12">
        <div className="container mx-auto max-w-5xl px-4 pt-3 sm:pt-6">
          {/* Hero gọn: trên mobile form phải lọt màn hình đầu tiên. */}
          <header className="mb-3 sm:mb-5">
            <h1 className="text-[22px] font-extrabold leading-tight tracking-tight text-foreground sm:text-3xl md:text-4xl">
              Sim Ngày Tháng Năm Sinh <span className="text-gold">MobiFone</span>
            </h1>
            <p className="mt-1.5 max-w-2xl text-[13px] leading-snug text-muted-foreground sm:text-base">
              Nhập ngày sinh, xem ngay SIM MobiFone có 6 số cuối trùng DDMMYY. Kho 6.646 số ngày sinh, giá niêm yết rõ
              ràng, hỗ trợ giữ số qua Zalo.
            </p>
          </header>

          <SimNgaySinhFinder samples={samples} />

          {/* CTA liên hệ — ngay dưới danh sách, trước nội dung SEO. */}
          <section
            aria-labelledby="ns-lien-he"
            className="mt-8 rounded-2xl border border-gold/25 bg-card p-4 shadow-card sm:p-6"
          >
            <h2 id="ns-lien-he" className="text-lg font-bold text-foreground sm:text-xl">
              Cần tìm số theo ngày sinh riêng?
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Gửi ngày sinh qua Zalo, nhân viên CHONSOMOBIFONE kiểm tra kho và báo lại các số phù hợp.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Hotline bán sim</p>
                <a href="tel:0933686666" className="mt-1 block text-2xl font-extrabold tabular-nums text-gold">
                  0933.686.666
                </a>
                <div className="mt-3 flex gap-2">
                  <a
                    href="https://zalo.me/0933686666"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-sky-500 px-3 text-sm font-bold text-white transition hover:bg-sky-600"
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden />
                    Chat Zalo
                  </a>
                  <a
                    href="tel:0933686666"
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-cta px-3 text-sm font-bold text-white transition hover:bg-cta-hover"
                  >
                    <Phone className="h-4 w-4" aria-hidden />
                    Gọi ngay
                  </a>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-background/60 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Hotline cửa hàng Quận 7
                </p>
                <a href="tel:0938868868" className="mt-1 block text-2xl font-extrabold tabular-nums text-foreground">
                  0938.868.868
                </a>
                <div className="mt-3 flex gap-2">
                  <a
                    href="tel:0938868868"
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground transition hover:border-gold/60"
                  >
                    <Phone className="h-4 w-4" aria-hidden />
                    Gọi cửa hàng
                  </a>
                  <Link
                    href="/diem-giao-dich-mobifone-quan-7"
                    className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-card px-3 text-sm font-semibold text-foreground transition hover:border-gold/60"
                  >
                    <MapPin className="h-4 w-4" aria-hidden />
                    Xem địa chỉ
                  </Link>
                </div>
              </div>
            </div>
          </section>

          {/* Nội dung SEO — nằm DƯỚI danh sách, không đẩy form/kết quả xuống. */}
          <div className="mt-8 space-y-4">
            {SEO_SECTIONS.map((s) => (
              <section key={s.title} className="rounded-xl border border-border bg-card p-5 md:p-6">
                <h2 className="mb-2 flex items-center gap-3 text-lg font-bold text-foreground md:text-xl">
                  <span aria-hidden className="h-5 w-1 rounded-full bg-gold" />
                  {s.title}
                </h2>
                <div className="text-sm leading-relaxed text-muted-foreground md:text-[15px]">{s.body}</div>
              </section>
            ))}
          </div>

          <div className="mt-6 space-y-6">
            <TrustCommitments />
            <FaqAccordion items={faqItems} />

            <section className="rounded-xl border border-border bg-card p-6 shadow-card">
              <h2 className="mb-4 flex items-center gap-3 text-lg font-bold text-primary">
                <span className="h-6 w-1 rounded-full bg-primary" />
                Xem thêm các dòng sim khác
              </h2>
              <ul className="flex flex-wrap gap-3 text-sm">
                {RELATED_LINKS.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="font-medium text-primary underline-offset-2 hover:underline">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </main>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
    </>
  );
}
