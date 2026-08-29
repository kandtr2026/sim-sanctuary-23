import type { Metadata } from "next";
import { Calculator } from "lucide-react";
import DinhGiaSimTool from "./DinhGiaSimTool";
import { buildBreadcrumb } from "@/lib/seo";

const TITLE = "Định Giá SIM Miễn Phí – Tra Giá SIM Số Đẹp";
const DESCRIPTION =
  "Công cụ định giá SIM số đẹp miễn phí: Quý khách nhập số điện thoại để nhận mức giá tham khảo theo thị trường cho SIM tứ quý, tam hoa, lộc phát.";
const CANONICAL = "https://www.chonsomobifone.com/dinh-gia-sim";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    title: TITLE,
    description: "Tra mức giá tham khảo cho SIM số đẹp, miễn phí và theo giá thị trường.",
    url: CANONICAL,
    images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
  },
};

export interface DinhGiaFaqItem {
  question: string;
  answer: string;
}

// Single source of truth for the FAQ: rendered by <DinhGiaSimTool> below AND
// serialised into the FAQPage JSON-LD, so the markup can never drift from the
// visible content (Google FAQPage policy).
const faqData: DinhGiaFaqItem[] = [
  {
    question: 'Định giá này có chính xác tuyệt đối không?',
    answer:
      'Công cụ phân tích những yếu tố phổ biến của một dãy số — đầu số, dạng số, tính phong thủy — rồi đưa ra mức giá tham khảo. Giá thực tế còn dao động theo nhu cầu thị trường và theo từng người mua. Cần con số sát hơn, Quý khách vui lòng liên hệ đội ngũ tư vấn.',
  },
  {
    question: 'Những yếu tố nào ảnh hưởng lớn nhất đến giá SIM?',
    answer:
      'Đuôi số quyết định phần lớn giá trị, khoảng 70%. Kế đó là dạng số (tứ quý, tam hoa, sảnh tiến...), đầu số và nhà mạng, độ dễ nhớ của cả dãy, cùng ý nghĩa phong thủy.',
  },
  {
    question: 'Vì sao cùng một số SIM nhưng giá thị trường có thể khác nhau?',
    answer:
      'Giá SIM phụ thuộc nhiều yếu tố chủ quan: người bán, thời điểm, tình trạng cung cầu, kênh bán hàng và nhất là nhu cầu của người mua. Một dãy số mang ý nghĩa riêng với ai đó có thể được trả cao hơn hẳn mức trung bình.',
  },
  {
    question: 'SIM 10 số và 11 số khác nhau thế nào về giá trị?',
    answer:
      'SIM 10 số hiện là tiêu chuẩn phổ biến và được ưa chuộng hơn vì dễ nhớ. SIM 11 số (đầu 01x cũ) đã chuyển về 10 số nên không còn phổ biến. Giá trị thực tế nằm ở độ đẹp của dãy số, không nằm ở số lượng chữ số.',
  },
  {
    question: 'Tôi có thể mua hoặc bán SIM theo giá định giá này không?',
    answer:
      'Đây là mức tham khảo, không phải giá cam kết mua lại. Quý khách muốn mua, vui lòng xem giá niêm yết trong kho SIM của chúng tôi. Quý khách muốn bán, đội ngũ tư vấn sẽ hỗ trợ định giá kỹ hơn và tìm người mua phù hợp.',
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqData.map((f) => ({
    "@type": "Question",
    name: f.question,
    acceptedAnswer: { "@type": "Answer", text: f.answer },
  })),
};

export default function DinhGiaSimPage() {
  return (
    <>
      <main className="container mx-auto px-4 pt-3 pb-6">
        {/* Banner */}
        <section className="mb-6">
          <div className="relative bg-gradient-to-br from-primary via-primary-dark to-primary rounded-xl overflow-hidden shadow-card">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage: `radial-gradient(circle at 20% 80%, hsl(var(--gold) / 0.3) 0%, transparent 50%),
                               radial-gradient(circle at 80% 20%, hsl(var(--gold) / 0.2) 0%, transparent 50%)`,
              }}
            ></div>

            <div className="relative px-4 md:px-6 py-8 md:py-12 text-center">
              <div className="flex justify-center mb-3">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gold/20 flex items-center justify-center">
                  <Calculator className="w-7 h-7 md:w-8 md:h-8 text-gold" />
                </div>
              </div>

              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-foreground mb-3">
                Định giá SIM số đẹp
              </h1>
              <p className="text-primary-foreground/80 text-base md:text-lg max-w-xl mx-auto">
                Nhập số để nhận mức giá tham khảo — nhanh, khách quan, không mất phí
              </p>
            </div>
          </div>
        </section>

        <DinhGiaSimTool faqData={faqData} />

        {/* Nội dung server-render. Trước đây trang này chỉ có H1 + client island
            (ô nhập số, khối kết quả, FAQ) nên phần chữ Google đọc được vỏn vẹn
            ~250 từ — mỏng nhất trong các trang money của site. Các khối dưới đây
            nằm ngoài island nên luôn có trong HTML thô, kể cả khi JS chưa chạy.

            Vì FAQ nằm BÊN TRONG `DinhGiaSimTool`, không thể chèn các khối này
            giữa ô nhập số và FAQ mà không sửa file đó — nên chúng đặt sau island.

            Mọi con số dưới đây lấy từ `src/lib/simValuation.ts` (tỉ trọng trong
            `valuateSim`) và `src/lib/simInventorySheet.ts` (cách chọn SIM tương
            tự). Sửa công thức thì sửa cả phần chữ này. */}
        <div className="mx-auto mt-10 max-w-2xl space-y-8">
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Định giá SIM dựa trên những gì?
            </h2>
            <p className="mb-5 leading-relaxed text-muted-foreground">
              Công cụ chấm dãy số theo năm nhóm yếu tố, mỗi nhóm một tỉ trọng cố định. Tỉ trọng dưới đây là con
              số thật trong công thức đang chạy, không phải mức ước lượng.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="px-3 py-3 text-left font-semibold text-foreground">Yếu tố</th>
                    <th className="px-3 py-3 text-left font-semibold text-foreground">Tỉ trọng</th>
                    <th className="px-3 py-3 text-left font-semibold text-foreground">Công cụ đọc gì</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50 align-top hover:bg-secondary/30">
                    <td className="px-3 py-3 font-bold text-foreground">Đuôi số</td>
                    <td className="px-3 py-3 font-semibold text-primary">70%</td>
                    <td className="px-3 py-3 text-muted-foreground">
                      Dạng số ở các số cuối: lục quý, ngũ quý, tứ quý, tam hoa, sảnh tiến, taxi, gánh, ABAB, AABB.
                      Cụm tài lộc trong bốn số cuối được cộng thêm: 68/86 lộc phát, 88/99 song phát, 39/79 thần tài,
                      38/78 ông địa.
                    </td>
                  </tr>
                  <tr className="border-b border-border/50 align-top hover:bg-secondary/30">
                    <td className="px-3 py-3 font-bold text-foreground">Nhà mạng</td>
                    <td className="px-3 py-3 font-semibold text-primary">10%</td>
                    <td className="px-3 py-3 text-muted-foreground">
                      Viettel, MobiFone, VinaPhone xếp trên iTel, Vietnamobile, Gmobile.
                    </td>
                  </tr>
                  <tr className="border-b border-border/50 align-top hover:bg-secondary/30">
                    <td className="px-3 py-3 font-bold text-foreground">Đầu số</td>
                    <td className="px-3 py-3 font-semibold text-primary">8%</td>
                    <td className="px-3 py-3 text-muted-foreground">
                      Đầu số cổ 090, 091, 093, 094, 096, 097, 098 xếp cao nhất; kế đến 086, 088, 089; sau đó là các
                      đầu 03, 07, 08.
                    </td>
                  </tr>
                  <tr className="border-b border-border/50 align-top hover:bg-secondary/30">
                    <td className="px-3 py-3 font-bold text-foreground">Khúc giữa</td>
                    <td className="px-3 py-3 font-semibold text-primary">7%</td>
                    <td className="px-3 py-3 text-muted-foreground">
                      Bốn số giữa có dạng ABAB, AABB, gánh, hoặc một chữ số lặp ba lần thì được cộng.
                    </td>
                  </tr>
                  <tr className="border-b border-border/50 align-top hover:bg-secondary/30">
                    <td className="px-3 py-3 font-bold text-foreground">Phong thủy</td>
                    <td className="px-3 py-3 font-semibold text-primary">5%</td>
                    <td className="px-3 py-3 text-muted-foreground">
                      Tổng nút — cộng hết các chữ số rồi lấy hàng đơn vị — từ 7 trở lên được cộng. Chẵn lẻ cân nhau
                      được cộng. Dãy nhiều số 4 hoặc số 7, hoặc đuôi 444, 777, bị trừ.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              Điểm tổng nằm trong khoảng 0–100, rồi quy về năm bậc: phổ thông, khá đẹp, đẹp, rất đẹp và VIP.
            </p>
          </section>
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Đuôi số nắm 70% giá trị: bậc nào trên bậc nào
            </h2>
            <p className="mb-4 leading-relaxed text-muted-foreground">
              Thứ tự dưới đây là thứ tự chấm điểm trong công thức, xếp từ cao xuống thấp.
            </p>
            <ol className="space-y-2.5 text-sm leading-relaxed text-muted-foreground">
              <li className="flex gap-3">
                <span className="font-bold text-primary">1.</span>
                <span>
                  <strong className="text-foreground">Lục quý, sảnh tiến 6 số, ngũ quý</strong> — bậc cao nhất,
                  hàng hiếm của kho.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary">2.</span>
                <span>
                  <strong className="text-foreground">Tam hoa kép, tứ quý, sảnh tiến 5 số, taxi ABCABC</strong> —
                  nhóm được hỏi nhiều nhất.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary">3.</span>
                <span>
                  <strong className="text-foreground">Sảnh tiến 4 số, tam hoa, đuôi ABAB</strong> — tầm giá vừa,
                  dễ chọn.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary">4.</span>
                <span>
                  <strong className="text-foreground">Số gánh ABBA, đuôi AABB, cặp hai số cuối giống nhau</strong>{" "}
                  — bậc phổ thông có điểm nhấn.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-bold text-primary">5.</span>
                <span>
                  <strong className="text-foreground">Không dạng nào</strong> — vẫn được xếp cao hơn nếu trong dãy
                  có một chữ số lặp từ 5 lần trở lên, vì dãy đó dễ nhớ.
                </span>
              </li>
            </ol>
          </section>
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Đây là mức tham khảo, không phải giá cam kết mua lại
            </h2>
            <ul className="space-y-3 leading-relaxed text-muted-foreground">
              <li className="flex gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                <span>
                  <strong className="text-foreground">Số đang có trong kho:</strong> công cụ hiện đúng giá niêm yết
                  của số đó, không tính lại theo công thức.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                <span>
                  <strong className="text-foreground">Số chưa có trong kho:</strong> công cụ không tự gán giá cho số
                  của người khác. Nó đọc dạng số và nhà mạng, rồi xếp ra những SIM cùng tầm giá đang bán để Quý khách
                  đối chiếu; dải giá được nới rộng khi kho ít số cùng tầm.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                <span>
                  <strong className="text-foreground">Quý khách muốn bán số:</strong> con số trên trang không phải
                  giá chúng tôi mua lại. Đội ngũ tư vấn sẽ xem dãy số cụ thể rồi báo mức sát hơn.
                </span>
              </li>
            </ul>
            <p className="mt-4 leading-relaxed text-muted-foreground">
              Không có bảng giá nào đúng cho mọi người mua. Một dãy số trùng năm sinh, trùng biển số hay trùng số nhà
              của ai đó thường được trả cao hơn mặt bằng chung, và ngược lại.
            </p>
          </section>

          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Xem giá niêm yết theo từng dòng SIM
            </h2>
            <ul className="flex flex-wrap gap-3 text-sm">
              {[
                { href: "/mua-sim-tu-quy", label: "Giá sim tứ quý" },
                { href: "/sim-ngu-quy", label: "Giá sim ngũ quý" },
                { href: "/sim-than-tai", label: "Giá sim thần tài" },
                { href: "/sim-loc-phat", label: "Giá sim lộc phát" },
                { href: "/sim-ong-dia", label: "Giá sim ông địa" },
                { href: "/sim-dau-so", label: "Giá sim theo đầu số" },
                { href: "/tin-tuc/gia-sim-so-dep-mobifone", label: "Bảng giá sim số đẹp MobiFone" },
                { href: "/tin-tuc/cach-tinh-diem-sim-phong-thuy", label: "Cách tính điểm sim phong thủy" },
              ].map((link) => (
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumb([
              { name: "Trang chủ", path: "/" },
              { name: "Định giá SIM", path: "/dinh-gia-sim" },
            ]),
          ),
        }}
      />
    </>
  );
}
