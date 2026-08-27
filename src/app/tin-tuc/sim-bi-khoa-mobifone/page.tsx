import Link from "next/link";
import ArticleShell, { type FaqItem } from "@/components/blog/ArticleShell";
import { DataTable, KeyPoints, Note } from "@/components/blog/ArticleBits";
import { articleMetadata } from "@/lib/articleSeo";
import { getArticle } from "@/content/tinTucArticles";

const article = getArticle("sim-bi-khoa-mobifone");
export const metadata = articleMetadata(article);

const DIAGNOSE: [string, string, string][] = [
  [
    "Gọi ra không được, nhận cuộc gọi vẫn bình thường",
    "Khoá một chiều — thường do hết hạn gọi hoặc nợ cước",
    "Nạp thẻ hoặc thanh toán cước; nếu vẫn không mở, gọi 18001090",
  ],
  [
    "Không gọi ra được và cũng không ai gọi vào được",
    "Khoá hai chiều — hết hạn nghe, nợ cước lâu, hoặc chưa xác thực thông tin",
    "Cần xử lý đúng nguyên nhân, xem từng mục bên dưới",
  ],
  [
    "Nạp thẻ báo lỗi, không nạp được nữa",
    "Bị khoá quyền nạp thẻ do nhập sai mã nhiều lần",
    "Soạn QUYENNAPTHE_Mã serial thẻ gửi 901 (miễn phí)",
  ],
  [
    "Vừa đổi điện thoại thì mất chiều gọi đi",
    "Quy định xác thực khi thay thiết bị đang dùng SIM",
    "Hoàn tất xác thực trên app My MobiFone hoặc VNeID",
  ],
  [
    "Có tin nhắn yêu cầu chuẩn hoá thông tin trước đó",
    "Chưa hoàn thành xác thực thông tin thuê bao",
    "Xác thực qua app hoặc ra cửa hàng; hệ thống mở khoá tự động",
  ],
];

const TIMELINE: [string, string, string][] = [
  [
    "Trả trước hết hạn gọi",
    "Khoá chiều gọi đi",
    "Nạp thẻ để gia hạn; hệ thống mở lại",
  ],
  [
    "Trả trước hết hạn nghe",
    "Khoá hai chiều, giữ số 30 ngày",
    "Còn trong 30 ngày thì mang giấy tờ và SIM ra cửa hàng để mở; quá hạn thì số bị thu hồi",
  ],
  [
    "Trả sau nợ cước",
    "Chặn một chiều, rồi 30 ngày sau chặn hai chiều",
    "Thanh toán cước để được mở lại",
  ],
  [
    "Chưa xác thực thông tin",
    "Khoá một chiều, sau đó khoá hai chiều, rồi khoảng 5 ngày là thanh lý hợp đồng",
    "Hoàn tất xác thực để hệ thống tự mở",
  ],
  [
    "Đổi thiết bị dùng SIM",
    "Khoá chiều đi trong thời gian ngắn, sau đó tính mốc như trên nếu không xác thực",
    "Xác thực lại trên app My MobiFone hoặc VNeID",
  ],
];

const faq: FaqItem[] = [
  {
    q: "SIM bị khoá 1 chiều là gì?",
    a: "Là trạng thái SIM không gọi ra và không gửi tin nhắn được, nhưng vẫn nhận được cuộc gọi và tin nhắn đến. Nguyên nhân thường gặp nhất với thuê bao trả trước là hết hạn gọi, còn với trả sau là chưa thanh toán cước.",
  },
  {
    q: "SIM bị khoá 2 chiều nạp tiền được không?",
    a: "Với trường hợp hết hạn sử dụng, việc nạp thẻ thường không còn tự mở được khi đã bị khoá hai chiều; bạn cần mang giấy tờ và SIM ra cửa hàng MobiFone trong thời gian số còn được giữ. Nếu nguyên nhân là chưa xác thực thông tin thì nạp tiền không giải quyết được — phải hoàn tất xác thực.",
  },
  {
    q: "SIM bị khoá 2 chiều bao lâu thì bị thu hồi số?",
    a: "Theo hướng dẫn của MobiFone, thuê bao bị khoá hai chiều do hết hạn sử dụng được giữ số khoảng 30 ngày trước khi số bị thu hồi và đưa trở lại kho số. Trường hợp bị khoá do chưa xác thực thông tin thì mốc thanh lý hợp đồng ngắn hơn, khoảng 5 ngày sau khi khoá hai chiều.",
  },
  {
    q: "Bị khoá quyền nạp thẻ thì làm sao?",
    a: "Nhập sai mã thẻ nhiều lần sẽ bị tạm khoá quyền nạp thẻ. Bạn có thể tự mở bằng cách soạn tin QUYENNAPTHE_Mã serial thẻ nạp gửi 901, tin nhắn này miễn phí. Mã serial là dãy số in trên thẻ nạp hoặc trong hoá đơn mua mã thẻ.",
  },
  {
    q: "Đang bị khoá chiều gọi đi thì gọi tổng đài bằng cách nào?",
    a: "Gọi 18001090 — đây là tổng đài miễn cước và vẫn gọi được khi thuê bao đang bị chặn chiều gọi đi. Các hotline dạng số thường có thể không gọi được trong trạng thái này.",
  },
  {
    q: "SIM số đẹp để lâu không dùng có bị mất không?",
    a: "Có. SIM trả trước không phát sinh nạp thẻ sẽ hết hạn gọi rồi hết hạn nghe, và sau thời gian giữ số thì bị thu hồi — kể cả số tứ quý hay ngũ quý giá trị cao. Đây là lý do nên đặt lịch nạp một mệnh giá nhỏ định kỳ cho những số bạn giữ mà ít dùng.",
  },
];

export default function SimBiKhoaPage() {
  return (
    <ArticleShell
      article={article}
      faq={faq}
      related={[
        "kiem-tra-sim-chinh-chu-mobifone",
        "kiem-tra-so-dien-thoai-mobifone",
        "so-tong-dai-cac-nha-mang",
      ]}
      lead={
        <p>
          SIM bị khoá có bốn nguyên nhân hoàn toàn khác nhau, và mỗi nguyên nhân có một cách mở
          riêng. Nạp thẻ trong trường hợp sai nguyên nhân thì tiền vào tài khoản nhưng SIM vẫn khoá.
          Bài này giúp bạn xác định đúng trường hợp của mình trước khi làm gì, kèm các mốc thời gian
          trước khi số bị thu hồi.
        </p>
      }
    >
      <KeyPoints
        items={[
          <>
            <strong>Khoá một chiều</strong>: không gọi ra được nhưng vẫn nhận được.{" "}
            <strong>Khoá hai chiều</strong>: mất cả hai.
          </>,
          <>
            Bốn nguyên nhân: <strong>hết hạn sử dụng</strong>, <strong>nợ cước</strong>,{" "}
            <strong>khoá quyền nạp thẻ</strong>, <strong>chưa xác thực thông tin</strong>.
          </>,
          <>
            Khoá hai chiều do hết hạn: số được giữ khoảng <strong>30 ngày</strong> trước khi bị thu
            hồi.
          </>,
          <>
            Khoá quyền nạp thẻ tự mở được: soạn{" "}
            <strong>QUYENNAPTHE_Mã serial thẻ</strong> gửi <strong>901</strong>.
          </>,
          <>
            <strong>18001090</strong> vẫn gọi được khi SIM đang bị chặn chiều gọi đi.
          </>,
        ]}
      />

      <h2 id="mot-chieu-hai-chieu">Khoá một chiều và hai chiều khác nhau thế nào</h2>
      <p>
        Đây là hai mức, không phải hai loại. Khoá một chiều là mức nhẹ: SIM không gọi ra và không
        gửi tin nhắn được, nhưng người khác vẫn gọi và nhắn cho bạn được — nghĩa là số vẫn thuộc về
        bạn và vẫn nhận được mã OTP. Khoá hai chiều là mức nặng: mất cả chiều gọi ra và chiều nhận,
        và đây là mức bắt đầu đếm ngược tới việc <strong>thu hồi số</strong>.
      </p>
      <p>
        Khoảng thời gian giữa hai mức là cửa sổ để xử lý. Với thuê bao trả sau nợ cước, khoảng này
        thường là 30 ngày kể từ khi bị chặn một chiều. Đừng để trôi qua cửa sổ này, vì mọi thủ tục
        sau đó đều phức tạp hơn.
      </p>

      <h2 id="chan-doan">Chẩn đoán đúng nguyên nhân trong một phút</h2>
      <p>Đối chiếu dấu hiệu bạn đang gặp với bảng dưới đây trước khi làm bất cứ điều gì:</p>

      <DataTable
        head={["Dấu hiệu bạn thấy", "Nguyên nhân thường gặp", "Việc cần làm"]}
        rows={DIAGNOSE.map((d) => [d[0], d[1], d[2]])}
        caption="Bảng chẩn đoán nhanh trạng thái SIM MobiFone bị khoá"
        boldFirstColumn={false}
      />

      <h2 id="het-han">Nguyên nhân 1 — Hết hạn sử dụng (thuê bao trả trước)</h2>
      <p>
        SIM trả trước có hai hạn khác nhau và đây là chỗ nhiều người nhầm:{" "}
        <strong>hạn gọi</strong> (hạn nghe gọi hai chiều) và <strong>hạn nghe</strong>. Khi hết hạn
        gọi, SIM chuyển sang khoá một chiều — vẫn nhận được cuộc gọi. Khi hết cả hạn nghe, SIM bị
        khoá hai chiều.
      </p>
      <ul>
        <li>
          <strong>Đang khoá một chiều:</strong> nạp thẻ là cách xử lý. Mỗi mệnh giá cộng thêm một số
          ngày sử dụng; nạp xong hệ thống mở lại chiều gọi đi.
        </li>
        <li>
          <strong>Đã khoá hai chiều:</strong> mang giấy tờ tuỳ thân và SIM vật lý ra cửa hàng
          MobiFone để đề nghị mở lại, hoặc gọi 18001090 để được hướng dẫn. Việc này chỉ làm được khi
          số còn trong thời gian được giữ.
        </li>
      </ul>

      <Note tone="warn" title="Số ngày sử dụng theo mệnh giá: hãy tự kiểm, đừng tin bảng trên mạng">
        Rất nhiều trang đăng bảng &ldquo;nạp mệnh giá X được Y ngày&rdquo;, nhưng đây là loại thông
        số nhà mạng điều chỉnh theo thời gian và không công bố cố định. Cách chắc chắn là kiểm tra
        hạn sử dụng hiện tại của chính SIM bạn trên app My MobiFone sau khi nạp.
      </Note>

      <h2 id="no-cuoc">Nguyên nhân 2 — Nợ cước (thuê bao trả sau)</h2>
      <p>
        Thuê bao trả sau chưa thanh toán cước sẽ bị chặn một chiều trước, và theo hướng dẫn của
        MobiFone thì khoảng 30 ngày sau đó sẽ bị chặn hai chiều. Cách mở là thanh toán khoản cước
        đang nợ; sau khi hệ thống ghi nhận, dịch vụ được mở lại.
      </p>
      <p>
        Nếu bạn đang dùng gói cam kết hoặc gói có hạn mức, hãy kiểm tra thêm phần hạn mức chi tiêu —
        vượt hạn mức cũng có thể làm dịch vụ bị hạn chế dù bạn chưa quá hạn thanh toán.
      </p>

      <h2 id="quyen-nap-the">Nguyên nhân 3 — Bị khoá quyền nạp thẻ</h2>
      <p>
        Nhập sai mã thẻ nạp nhiều lần liên tiếp sẽ khiến quyền nạp thẻ bị tạm khoá — đây là cơ chế
        chống dò mã. Triệu chứng đặc trưng: SIM vẫn dùng bình thường nhưng nạp thẻ nào cũng báo lỗi.
      </p>
      <p>Cách tự mở, không cần ra cửa hàng:</p>
      <ol>
        <li>Lấy một thẻ nạp còn chưa dùng (hoặc mã thẻ vừa mua).</li>
        <li>
          Soạn tin: <strong>QUYENNAPTHE_Mã serial thẻ nạp</strong> — thay phần sau dấu gạch dưới bằng
          dãy serial in trên thẻ.
        </li>
        <li>
          Gửi tới đầu số <strong>901</strong>. Tin nhắn miễn phí.
        </li>
      </ol>
      <p>
        Lưu ý serial thẻ khác với mã nạp: serial là dãy số dùng để định danh thẻ, còn mã nạp là dãy
        số bí mật dưới lớp tráng bạc.
      </p>

      <h2 id="chua-xac-thuc">Nguyên nhân 4 — Chưa xác thực thông tin thuê bao</h2>
      <p>
        Từ năm 2026, thuê bao chưa hoàn thành xác thực thông tin theo Thông tư 08/2026/TT-BKHCN
        thuộc diện bị khoá một chiều, rồi khoá hai chiều, và sau đó bị thanh lý hợp đồng — mốc cuối
        này ngắn hơn nhiều so với trường hợp hết hạn sử dụng.
      </p>
      <p>
        Điểm nhận biết: trước khi bị khoá, thuê bao thường đã nhận tin nhắn yêu cầu chuẩn hoá thông
        tin. Cách xử lý là hoàn tất xác thực qua app My MobiFone, qua VNeID, hoặc tại cửa hàng; sau
        khi hoàn tất, hệ thống mở khoá tự động. Toàn bộ quy trình, giấy tờ cần có và{" "}
        <strong>ngoại lệ dành cho số đặc biệt</strong> nằm ở bài{" "}
        <Link href="/tin-tuc/kiem-tra-sim-chinh-chu-mobifone">
          kiểm tra SIM chính chủ MobiFone
        </Link>
        .
      </p>

      <h2 id="bao-lau-mat-so">Bao lâu thì mất số</h2>

      <DataTable
        head={["Trường hợp", "Diễn tiến", "Cách giữ lại số"]}
        rows={TIMELINE.map((t) => [t[0], t[1], t[2]])}
        caption="Mốc thời gian từ lúc bị khoá tới khi số bị thu hồi"
      />

      <h2 id="sim-so-dep">Với SIM số đẹp, mất số là mất tiền thật</h2>
      <p>
        Một số tứ quý hay ngũ quý có thể trị giá bằng cả chiếc xe, nhưng cơ chế thu hồi số không phân
        biệt số đắt hay rẻ. Trường hợp mất số đáng tiếc nhất thường xảy ra với <em>số giữ để dành</em>
        : mua rồi để trong hộc tủ, không nạp thẻ, hết hạn gọi rồi hết hạn nghe, và sau thời gian giữ
        số thì số về lại kho.
      </p>
      <p>Ba việc nên làm nếu bạn đang giữ số giá trị mà ít dùng:</p>
      <ul>
        <li>
          <strong>Đặt lịch nhắc nạp thẻ định kỳ</strong> — một mệnh giá nhỏ cũng đủ để gia hạn.
        </li>
        <li>
          <strong>Hoàn tất chính chủ càng sớm càng tốt.</strong> Số chưa đứng tên bạn thì bạn không
          có tư cách yêu cầu mở khoá hay khôi phục.
        </li>
        <li>
          <strong>Kiểm tra hạn sử dụng mỗi vài tháng</strong> qua app, thay vì chờ tin nhắn cảnh báo.
        </li>
      </ul>
      <p>
        Nếu số cũ đã bị thu hồi và bạn cần một số mới dễ nhớ cho công việc, có thể xem{" "}
        <Link href="/mua-sim-gia-re">kho SIM MobiFone</Link> với giá niêm yết, hoặc chọn theo tuổi
        tại <Link href="/sim-phong-thuy">công cụ tìm SIM hợp tuổi</Link>.
      </p>

      <Note tone="info" title="Nguồn tham khảo">
        Các mốc giữ số, quy định chặn cước và cú pháp mở quyền nạp thẻ lấy từ mục hỏi đáp trên{" "}
        <a href="https://www.mobifone.vn/ho-tro-khach-hang/cau-hoi-thuong-gap" target="_blank" rel="noopener">
          mobifone.vn
        </a>
        . Phần khoá do chưa xác thực dựa trên Thông tư 08/2026/TT-BKHCN và các thông báo của
        MobiFone trong năm 2026. Chính sách có thể thay đổi — gọi 18001090 khi cần xác nhận trường
        hợp cụ thể.
      </Note>
    </ArticleShell>
  );
}
