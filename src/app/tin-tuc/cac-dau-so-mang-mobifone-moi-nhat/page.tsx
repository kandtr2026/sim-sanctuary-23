import type { Metadata } from "next";
import { buildArticle, buildBreadcrumb } from "@/lib/seo";

const TITLE = "Các Đầu Số Mobifone Mới Nhất – Danh Sách Đầy Đủ & Ý Nghĩa";
const DESCRIPTION =
  "Danh sách đầy đủ các đầu số Mobifone mới nhất: 089, 090, 093, 070, 076, 077, 078, 079. Lịch sử chuyển đổi đầu số và ý nghĩa từng đầu số.";
const PATH = "/tin-tuc/cac-dau-so-mang-mobifone-moi-nhat";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: {
    canonical: `https://www.chonsomobifone.com${PATH}`,
  },
  openGraph: {
    type: "article",
    title: TITLE,
    description: DESCRIPTION,
    url: `https://www.chonsomobifone.com${PATH}`,
  },
};

export default function TinTucBai6Page() {
  return (
    <>
      <main className="container mx-auto px-4 py-8">
        <article className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-6">
            Các Đầu Số Mobifone Mới Nhất – Danh Sách Đầy Đủ & Ý Nghĩa
          </h1>

          <div className="space-y-4 text-foreground">
            <p>
              Mobifone là một trong ba nhà mạng lớn nhất Việt Nam, sở hữu nhiều đầu số 10 số quen thuộc và một số đầu số mới sau đợt chuyển đổi năm 2018. Bài viết dưới đây tổng hợp <strong>đầy đủ đầu số Mobifone mới nhất</strong>, kèm lịch sử chuyển đổi và ý nghĩa của từng đầu số.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-primary mt-8 mb-4">
              1. Danh sách các đầu số Mobifone hiện hành
            </h2>

            <p>Sau khi Bộ Thông tin và Truyền thông hoàn tất chuyển đổi từ 11 số về 10 số, Mobifone hiện quản lý các đầu số sau:</p>

            <ul className="list-disc pl-6 space-y-2">
              <li><strong>089</strong> – Đầu số cấp mới, được đưa vào khai thác từ năm 2018.</li>
              <li><strong>090</strong> – Đầu số nguyên bản, xuất hiện sớm nhất của Mobifone.</li>
              <li><strong>093</strong> – Đầu số truyền thống, cùng thế hệ với 090.</li>
              <li><strong>070</strong> – Chuyển đổi từ đầu số 11 số <em>0120</em>.</li>
              <li><strong>076</strong> – Chuyển đổi từ đầu số 11 số <em>0122</em>.</li>
              <li><strong>077</strong> – Chuyển đổi từ đầu số 11 số <em>0126</em>.</li>
              <li><strong>078</strong> – Chuyển đổi từ đầu số 11 số <em>0128</em>.</li>
              <li><strong>079</strong> – Chuyển đổi từ đầu số 11 số <em>0121</em>.</li>
            </ul>

            <h2 className="text-xl md:text-2xl font-bold text-primary mt-8 mb-4">
              2. Lịch sử chuyển đổi đầu số Mobifone
            </h2>

            <p>
              Trước năm 2018, Mobifone có hai nhóm đầu số song song: nhóm 10 số (090, 093) và nhóm 11 số (0120, 0121, 0122, 0126, 0128). Ngày 15/09/2018, Bộ Thông tin và Truyền thông chính thức chuyển đổi toàn bộ SIM 11 số về 10 số nhằm chuẩn hóa kho số quốc gia và tiết kiệm tài nguyên viễn thông.
            </p>

            <p>Sau chuyển đổi, các đầu số 11 số của Mobifone được ánh xạ như sau:</p>

            <ul className="list-disc pl-6 space-y-2">
              <li>0120 → <strong>070</strong></li>
              <li>0121 → <strong>079</strong></li>
              <li>0122 → <strong>076</strong></li>
              <li>0126 → <strong>077</strong></li>
              <li>0128 → <strong>078</strong></li>
            </ul>

            <p>Đến năm 2018, Mobifone tiếp tục được cấp thêm đầu số <strong>089</strong> để mở rộng kho số.</p>

            <h2 className="text-xl md:text-2xl font-bold text-primary mt-8 mb-4">
              3. Ý nghĩa và đặc điểm từng đầu số
            </h2>

            <ul className="list-disc pl-6 space-y-2">
              <li><strong>090, 093</strong>: Là hai đầu số "kỳ cựu", được người dùng doanh nhân và khách hàng lâu năm ưa chuộng. SIM số đẹp thuộc hai đầu số này thường có giá cao nhất trên thị trường.</li>
              <li><strong>089</strong>: Đầu số trẻ, giá SIM đẹp hợp lý, phù hợp người dùng cá nhân và người mới.</li>
              <li><strong>070, 076, 077, 078, 079</strong>: Nhóm đầu số chuyển đổi, kho số dồi dào nên có nhiều SIM số đẹp giá tốt, phù hợp mua bán trung bình.</li>
            </ul>

            <h2 className="text-xl md:text-2xl font-bold text-primary mt-8 mb-4">
              4. Cách nhận biết SIM Mobifone
            </h2>

            <p>
              Để nhanh chóng biết một số điện thoại có phải của Mobifone hay không, bạn chỉ cần đối chiếu 3 chữ số đầu với danh sách phía trên: <strong>089, 090, 093, 070, 076, 077, 078, 079</strong>. Ngoài ra, bạn có thể gọi tổng đài <strong>9090</strong> (miễn phí) để kiểm tra thông tin thuê bao.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-primary mt-8 mb-4">
              5. Tổng kết
            </h2>

            <p>
              Mobifone hiện đang khai thác <strong>8 đầu số 10 số</strong> gồm 089, 090, 093, 070, 076, 077, 078, 079. Mỗi đầu số có đặc điểm và mức giá riêng khi lựa chọn SIM số đẹp. Bạn có thể tham khảo kho SIM Mobifone số đẹp tại CHONSOMOBIFONE.COM để chọn được số ưng ý, giao hàng toàn quốc và sang tên chính chủ.
            </p>
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
              datePublished: "2026-07-11T00:00:00+07:00",
              dateModified: "2026-08-04T00:00:00+07:00",
              image: "https://www.chonsomobifone.com/share-banner.png",
            }),
          ),
        }}
      />
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
