import type { Metadata } from "next";
import Link from "next/link";
import { buildArticle, buildBreadcrumb } from "@/lib/seo";

const TITLE = "0708 Là Mạng Gì? Đầu Số 0708 Có Phải MobiFone Không?";
const DESCRIPTION =
  "0708 là đầu số MobiFone, chuyển đổi từ 01208 sau năm 2018. Cách nhận biết số 0708, ý nghĩa đầu số và gợi ý chọn SIM 0708 đẹp, chính chủ.";
const PATH = "/tin-tuc/0708-la-mang-gi";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: `https://www.chonsomobifone.com${PATH}` },
  openGraph: {
    type: "article",
    title: TITLE,
    description: DESCRIPTION,
    url: `https://www.chonsomobifone.com${PATH}`,
  },
};

const FAQ_ITEMS = [
  {
    q: "0708 là mạng gì?",
    a: "0708 là đầu số thuộc mạng MobiFone. Đây là nhánh số 10 chữ số được chuyển đổi từ đầu số 11 số 01208 theo quy định chuyển đổi thuê bao di động năm 2018.",
  },
  {
    q: "Đầu số 0708 đổi từ đầu số cũ nào?",
    a: "Đầu số 0708 được chuyển đổi từ 01208. Ví dụ số cũ 01208 xxx xxx sau chuyển đổi thành 0708 xxx xxx, giữ nguyên 7 số cuối.",
  },
  {
    q: "Có thể mua SIM 0708 MobiFone chính chủ ở đâu?",
    a: "Quý khách có thể xem kho SIM 0708 MobiFone trên CHONSOMOBIFONE.COM, chọn số theo giá niêm yết và được hỗ trợ đăng ký thông tin chính chủ khi nhận SIM.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

export default function DauSo0708LaMangGiPage() {
  return (
    <>
      <main className="container mx-auto px-4 py-8">
        <article className="mx-auto max-w-4xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wide text-gold">Tra cứu đầu số</p>
          <h1 className="mb-5 text-2xl font-bold leading-tight text-primary md:text-3xl">
            0708 là mạng gì? Đầu số 0708 có phải MobiFone không?
          </h1>

          <div className="mb-8 rounded-xl border border-gold/35 bg-gold/10 p-5">
            <p className="text-lg font-semibold text-foreground">
              Trả lời nhanh: <strong>0708 là đầu số MobiFone</strong>, được chuyển đổi từ đầu số cũ <strong>01208</strong> sau đợt quy hoạch SIM 11 số về 10 số năm 2018.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sim-dau-so/0708"
                className="inline-flex items-center justify-center rounded-lg bg-gold px-5 py-3 font-bold text-header-bg transition-colors hover:bg-gold-light"
              >
                Xem kho SIM 0708 MobiFone
              </Link>
              <Link
                href="/tin-tuc/cac-dau-so-mang-mobifone-moi-nhat"
                className="inline-flex items-center justify-center rounded-lg border border-border bg-card px-5 py-3 font-semibold text-foreground transition-colors hover:border-gold"
              >
                Xem tất cả đầu số MobiFone
              </Link>
            </div>
          </div>

          <div className="space-y-7 text-body">
            <section>
              <h2 className="mb-3 text-xl font-bold text-foreground">1. 0708 là mạng gì?</h2>
              <p>
                Đầu số <strong>0708</strong> thuộc nhà mạng <strong>MobiFone</strong>. Khi thấy một số điện thoại bắt đầu bằng 0708, Quý khách có thể nhận biết đây là thuê bao MobiFone thuộc nhóm đầu số chuyển đổi từ 11 số sang 10 số.
              </p>
              <p className="mt-3">
                Nhóm đầu số MobiFone hiện hành gồm 089, 090, 093, 070, 076, 077, 078 và 079. Trong đó 0708 là một nhánh nhỏ của dải 070, phù hợp với nhu cầu chọn SIM giá tốt nhưng vẫn là mạng MobiFone chính hãng.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-foreground">2. Đầu số 0708 đổi từ đầu số cũ nào?</h2>
              <p>
                Sau chuyển đổi thuê bao 11 số về 10 số, <strong>01208 đổi thành 0708</strong>. Quy tắc là thay 5 số đầu cũ bằng 4 số đầu mới, còn 7 số cuối giữ nguyên.
              </p>
              <div className="mt-4 overflow-hidden rounded-xl border border-border">
                <table className="w-full text-left text-sm">
                  <thead className="bg-secondary/30 text-foreground">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Đầu số cũ</th>
                      <th className="px-4 py-3 font-semibold">Đầu số mới</th>
                      <th className="px-4 py-3 font-semibold">Nhà mạng</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border">
                      <td className="px-4 py-3">01208</td>
                      <td className="px-4 py-3 font-bold text-primary">0708</td>
                      <td className="px-4 py-3">MobiFone</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-foreground">3. Ý nghĩa đầu số 0708 khi chọn SIM</h2>
              <p>
                Theo quan niệm dân gian khi chọn SIM số đẹp, dải <strong>0708</strong> thường được thích vì có cặp 08 ở cuối đầu số — số 8 hay được liên tưởng đến phát triển, tài lộc. Đây chỉ là cách hiểu tham khảo; khi chọn SIM, Quý khách nên ưu tiên thêm cấu trúc cả dãy số, giá phù hợp và khả năng đăng ký chính chủ rõ ràng.
              </p>
            </section>

            <section>
              <h2 className="mb-3 text-xl font-bold text-foreground">4. Nên mua SIM 0708 MobiFone thế nào?</h2>
              <ul className="list-disc space-y-2 pl-6">
                <li>Chọn số có đuôi dễ nhớ: tam hoa, lặp kép, thần tài, lộc phát hoặc năm sinh.</li>
                <li>Kiểm tra giá niêm yết trước khi đặt để tránh phát sinh phí không rõ ràng.</li>
                <li>Yêu cầu hỗ trợ đăng ký thông tin chính chủ ngay khi nhận SIM.</li>
                <li>Nếu cần dùng gấp, ưu tiên shop có giao nhanh hoặc điểm giao dịch gần khu vực Quận 7 / TP.HCM.</li>
              </ul>
              <p className="mt-4">
                Tại CHONSOMOBIFONE.COM, Quý khách có thể xem trực tiếp danh sách{" "}
                <Link href="/sim-dau-so/0708" className="font-semibold text-gold hover:underline">
                  SIM 0708 MobiFone đang có trong kho
                </Link>{" "}
                và đặt giữ số trước khi nhận SIM.
              </p>
            </section>

            <section className="rounded-xl border border-border bg-card p-5">
              <h2 className="mb-4 text-xl font-bold text-foreground">Câu hỏi thường gặp</h2>
              <div className="space-y-4">
                {FAQ_ITEMS.map((item) => (
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

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildArticle({
              headline: TITLE,
              description: DESCRIPTION,
              path: PATH,
              datePublished: "2026-10-06T00:00:00+07:00",
              dateModified: "2026-10-06T00:00:00+07:00",
              image: "https://www.chonsomobifone.com/share-banner.png",
            }),
          ),
        }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumb([
              { name: "Trang chủ", path: "/" },
              { name: "Tin tức", path: "/tin-tuc" },
              { name: TITLE, path: PATH },
            ]),
          ),
        }}
      />
    </>
  );
}
