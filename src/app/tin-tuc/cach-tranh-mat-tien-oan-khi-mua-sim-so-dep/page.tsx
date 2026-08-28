import type { Metadata } from "next";
import Link from "next/link";
import { buildArticle, buildBreadcrumb } from "@/lib/seo";

const TITLE = "Cách Tránh Mất Tiền Oan Khi Mua Sim Số Đẹp";
const DESCRIPTION =
  "Quy tắc vàng khi mua SIM số đẹp: không thanh toán 100% trước, kiểm tra hoạt động, cảnh giác sim giá rẻ bất ngờ, kiểm tra TTTB 1414.";
const PATH = "/tin-tuc/cach-tranh-mat-tien-oan-khi-mua-sim-so-dep";

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

export default function TinTucBai5Page() {
  return (
    <>
      <main className="container mx-auto px-4 py-8">
        <article className="max-w-4xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-primary mb-6">
            Cách Tránh Mất Tiền Oan Khi Mua Sim Số Đẹp
          </h1>

          <div className="space-y-4 text-body">
            <p>
              Một giao dịch sim số đẹp có thể từ vài triệu đến hàng tỷ đồng, phần lớn lại diễn ra từ xa và chỉ dựa vào lòng tin. Năm nguyên tắc dưới đây giúp Quý khách chủ động kiểm tra trước khi chuyển tiền, thay vì trông vào thiện chí của người bán.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-primary mt-8 mb-4">
              1. Không thanh toán 100% tiền khi chưa sang tên chính chủ
            </h2>

            <p>
              Đây là tình huống dễ mất tiền nhất. Bên bán thường đề nghị chuyển khoản toàn bộ với lý do &ldquo;giữ số&rdquo; hoặc &ldquo;làm thủ tục nhanh&rdquo;, rồi im lặng sau khi nhận tiền.
            </p>

            <p>
              <strong>Nên làm:</strong> Chỉ đặt cọc một khoản nhỏ, khoảng 10-20%, khi mua từ xa. An tâm nhất là giao dịch trực tiếp tại điểm giao dịch của nhà mạng và trả phần còn lại sau khi hồ sơ sang tên hoàn tất.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-primary mt-8 mb-4">
              2. Kiểm tra tình trạng hoạt động của Sim
            </h2>

            <p>
              Trước khi chuyển tiền, hãy thử gọi vào chính số đó:
            </p>

            <ul className="list-disc pl-6 space-y-2">
              <li>Nếu đổ chuông: đề nghị bên bán gọi lại từ chính số đang rao để xác nhận họ đang giữ SIM.</li>
              <li>Nếu báo số không tồn tại: số có thể đã bị thu hồi về kho của nhà mạng. Hãy cẩn trọng với lời hứa &ldquo;đấu nối lại&rdquo;.</li>
              <li>Nếu chỉ nhận được ảnh chụp màn hình thay vì cuộc gọi thật: đó là dấu hiệu nên dừng lại.</li>
            </ul>

            <h2 className="text-xl md:text-2xl font-bold text-primary mt-8 mb-4">
              3. Cảnh giác với Sim số đẹp giá &ldquo;rẻ bất ngờ&rdquo;
            </h2>

            <p>
              Một số Tứ Quý hay Lộc Phát có giá thị trường 50 triệu nhưng được rao 5-10 triệu kèm lý do &ldquo;cần tiền gấp&rdquo;. Mức lệch quá lớn thường đi cùng sim đang tranh chấp, sim còn nợ cam kết hoặc sim không tồn tại.
            </p>

            <p>
              <strong>Nên làm:</strong> Khảo giá ở ít nhất 3 website có niêm yết công khai để nắm khoảng giá chung của dòng số đó. Khi đã biết mặt bằng giá, Quý khách sẽ nhận ra ngay lời chào bán bất thường.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-primary mt-8 mb-4">
              4. Kiểm tra thông tin thuê bao (TTTB) ngay sau khi mua
            </h2>

            <p>
              Vừa nhận sim, việc đầu tiên là soạn tin nhắn:
            </p>

            <p className="font-semibold bg-muted p-3 rounded-md">
              TTTB gửi 1414.
            </p>

            <p>
              Hệ thống trả về tên chủ sở hữu, ngày sinh, số CMND/CCCD đang đứng tên số đó.
            </p>

            <p>
              Thông tin trả về không phải của Quý khách nghĩa là số chưa thật sự thuộc về Quý khách. Hãy đề nghị bên bán hỗ trợ sang tên ngay tại cửa hàng nhà mạng, trước khi tất toán phần tiền còn lại.
            </p>

            <h2 className="text-xl md:text-2xl font-bold text-primary mt-8 mb-4">
              5. Lưu giữ bằng chứng giao dịch
            </h2>

            <p>
              Hãy giữ lại ảnh chụp tin nhắn, biên lai chuyển khoản và hợp đồng mua bán tay. Đây là căn cứ giúp Quý khách bảo vệ quyền lợi nếu về sau phát sinh tranh chấp hoặc cần khiếu nại.
            </p>

            <p>
              Cách an tâm nhất vẫn là chọn nơi bán niêm yết giá công khai và cam kết sang tên chính chủ. Mời Quý khách tham khảo{" "}
              <Link href="/mua-sim-gia-re" className="text-gold hover:underline font-semibold">
                kho sim số đẹp giá tốt, minh bạch giá
              </Link>{" "}
              của CHONSOMOBIFONE.COM.
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
              datePublished: "2026-01-20T00:00:00+07:00",
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
