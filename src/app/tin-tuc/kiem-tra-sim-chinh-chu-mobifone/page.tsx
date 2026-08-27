import Link from "next/link";
import ArticleShell, { type FaqItem } from "@/components/blog/ArticleShell";
import { DataTable, KeyPoints, Note } from "@/components/blog/ArticleBits";
import { articleMetadata } from "@/lib/articleSeo";
import { getArticle } from "@/content/tinTucArticles";

const article = getArticle("kiem-tra-sim-chinh-chu-mobifone");
export const metadata = articleMetadata(article);

const CHECK_WAYS: [string, string, string][] = [
  [
    "Soạn TTTB gửi 1414",
    "Trả về số thuê bao, họ tên và số giấy tờ đang đăng ký cho SIM đó",
    "Miễn phí, dùng được khi tài khoản hết tiền",
  ],
  [
    "Soạn TTTB_Số CCCD gửi 1414",
    "Liệt kê những số đang đứng tên giấy tờ đó",
    "Miễn phí; dùng để phát hiện SIM lạ đứng tên mình",
  ],
  [
    "App My MobiFone",
    "Xem thông tin thuê bao trong mục thông tin sử dụng",
    "Cần Internet; xem được cả gói cước và trạng thái xác thực",
  ],
  [
    "Cửa hàng MobiFone",
    "Nhân viên tra cứu và in xác nhận nếu cần",
    "Cần mang theo giấy tờ gốc; áp dụng cho mọi trường hợp",
  ],
];

const TIMELINE: [string, string][] = [
  [
    "15/4/2026",
    "Thông tư 08/2026/TT-BKHCN về xác thực thông tin thuê bao có hiệu lực; yêu cầu xác thực bốn trường gồm cả ảnh khuôn mặt",
  ],
  [
    "15/6/2026",
    "Điều 8 của Thông tư có hiệu lực — bổ sung quy định liên quan tới việc đổi thiết bị đang dùng SIM",
  ],
  [
    "22/5/2026",
    "MobiFone bắt đầu chặn chiều gọi đi với các thuê bao bị xác nhận trạng thái không sử dụng trên VNeID",
  ],
  [
    "15/8/2026",
    "Mốc hạn MobiFone thông báo để hoàn thành xác thực; quá hạn thì thuê bao bị khoá hai chiều",
  ],
  [
    "Sau khi khoá hai chiều",
    "Thêm khoảng 5 ngày trước khi hợp đồng bị thanh lý và số bị thu hồi",
  ],
];

const faq: FaqItem[] = [
  {
    q: "Cách kiểm tra SIM MobiFone có chính chủ hay không?",
    a: "Soạn tin nhắn với nội dung TTTB gửi 1414. Hệ thống trả về số thuê bao, họ tên và số giấy tờ đang đăng ký cho SIM đó. Nếu tên trả về không phải tên bạn thì SIM chưa đứng tên bạn. Tin nhắn này miễn phí.",
  },
  {
    q: "Làm sao biết có SIM lạ nào đang đứng tên mình?",
    a: "Soạn TTTB_Số CCCD gửi 1414 (có dấu gạch dưới, thay Số CCCD bằng số căn cước của bạn). Hệ thống liệt kê các thuê bao đang đăng ký bằng giấy tờ đó. Mỗi giấy tờ được đứng tên tối đa 3 thuê bao trả trước và 5 thuê bao trả sau với khách hàng cá nhân.",
  },
  {
    q: "Cập nhật thông tin chính chủ MobiFone tại nhà được không?",
    a: "Được, qua app My MobiFone hoặc qua VNeID, và hoàn toàn miễn phí. Bạn cần CCCD gắn chip và chụp thêm ảnh chân dung để xác thực sinh trắc học. Tuy nhiên kênh trực tuyến không áp dụng cho các số đặc biệt như tam hoa, tứ quý, số lặp hay số dễ nhớ — những số này phải làm tại cửa hàng.",
  },
  {
    q: "Mua SIM số đẹp thì sang tên ở đâu, phí bao nhiêu?",
    a: "Sang tên đổi chủ được làm tại cửa hàng MobiFone, thường cần cả người bán và người mua có mặt cùng giấy tờ gốc. MobiFone công bố phí chuyển chủ quyền thuê bao trả sau là 50.000 đồng, chưa gồm phí SIM nếu phải đổi SIM mới; với thuê bao trả trước nhà mạng không công bố mức phí cụ thể nên hãy gọi 18001090 xác nhận trước khi đi.",
  },
  {
    q: "SIM không chính chủ có bị khoá không?",
    a: "Thuê bao có thông tin không đúng quy định thuộc diện phải chuẩn hoá; nếu không hoàn thành trong thời hạn nhà mạng thông báo thì bị khoá một chiều, sau đó khoá hai chiều và cuối cùng bị thu hồi số. Ngoài ra SIM không chính chủ không dùng được để xác thực tài khoản ngân hàng hay ví điện tử.",
  },
  {
    q: "Đã đăng ký bằng CCCD gắn chip rồi có phải làm lại không?",
    a: "Theo hướng dẫn của MobiFone, thuê bao đã đăng ký bằng VNeID mức 2 hoặc CCCD gắn chip thì không phải xác thực lại, trừ trường hợp thay đổi thiết bị đang dùng SIM. Cách chắc chắn nhất là soạn TTTB gửi 1414 để xem trạng thái hiện tại của mình.",
  },
];

export default function KiemTraSimChinhChuPage() {
  return (
    <ArticleShell
      article={article}
      faq={faq}
      related={[
        "kiem-tra-so-dien-thoai-mobifone",
        "sim-bi-khoa-mobifone",
        "mua-sim-so-dep-o-dau-uy-tin",
      ]}
      lead={
        <p>
          SIM chính chủ không còn là chuyện thủ tục cho vui. Một SIM đứng tên người khác thì không
          dùng được để xác thực ngân hàng, không lấy lại được khi mất, và nằm trong diện có thể bị
          khoá theo quy định chuẩn hoá thông tin thuê bao. Việc kiểm tra chỉ mất ba mươi giây — và
          nếu SIM của bạn là số đẹp, có một ngoại lệ quan trọng cần biết trước khi làm.
        </p>
      }
    >
      <KeyPoints
        items={[
          <>
            Kiểm tra nhanh: soạn <strong>TTTB</strong> gửi <strong>1414</strong> (miễn phí) để xem
            SIM đang đứng tên ai.
          </>,
          <>
            Soạn <strong>TTTB_Số CCCD</strong> gửi <strong>1414</strong> để xem toàn bộ số đang đứng
            tên giấy tờ của bạn.
          </>,
          <>
            Cập nhật thông tin làm được tại nhà qua <strong>app My MobiFone</strong> hoặc{" "}
            <strong>VNeID</strong>, và <strong>miễn phí</strong>.
          </>,
          <>
            <strong>Ngoại lệ:</strong> số đặc biệt (tam hoa, tứ quý, số lặp, số dễ nhớ) không làm
            được trực tuyến — phải ra cửa hàng.
          </>,
          <>
            Quy định hiện hành là <strong>Thông tư 08/2026/TT-BKHCN</strong>, yêu cầu xác thực cả ảnh
            khuôn mặt. Đừng dẫn Nghị định 49/2017 đã hết vai trò.
          </>,
        ]}
      />

      <h2 id="chinh-chu-la-gi">&ldquo;Chính chủ&rdquo; theo quy định hiện hành gồm những gì</h2>
      <p>
        Khung pháp lý đang áp dụng đi từ Luật Viễn thông 2023, qua Nghị định 163/2024/NĐ-CP, đến
        Thông tư 08/2026/TT-BKHCN hướng dẫn xác thực thông tin thuê bao di động — có hiệu lực từ
        15/4/2026. Theo đó, một thuê bao được coi là đã xác thực khi khớp <strong>bốn trường thông
        tin</strong>:
      </p>
      <ul>
        <li>Số định danh cá nhân;</li>
        <li>Họ, chữ đệm và tên;</li>
        <li>Ngày, tháng, năm sinh;</li>
        <li>Sinh trắc học — ảnh khuôn mặt.</li>
      </ul>
      <p>
        Trường thứ tư là điểm mới so với các đợt chuẩn hoá trước: chỉ có ảnh chụp căn cước là chưa
        đủ, hệ thống còn cần ảnh chân dung để so khớp. Đây cũng là lý do việc cập nhật giờ làm được
        qua app điện thoại thay vì bắt buộc ra quầy.
      </p>

      <h2 id="ba-cach-kiem-tra">Bốn cách kiểm tra SIM đang đứng tên ai</h2>

      <DataTable
        head={["Cách làm", "Kết quả nhận được", "Ghi chú"]}
        rows={CHECK_WAYS.map((w) => [w[0], w[1], w[2]])}
        caption="Các cách tra cứu thông tin thuê bao MobiFone"
        boldFirstColumn={false}
      />

      <p>
        Cách đầu tiên là cách nên dùng: nhắn <strong>TTTB</strong> tới <strong>1414</strong>, tin
        không tính phí và trả lời trong vài giây. Nếu bạn vừa mua SIM số đẹp, hãy làm bước này{" "}
        <em>ngay khi nhận SIM, trước khi thanh toán</em> — tin trả về cho biết SIM đang đứng tên ai
        và có đúng như người bán nói hay không.
      </p>

      <Note tone="warn" title="Kết quả thế nào là chưa ổn">
        Ba trường hợp cần xử lý: tên trả về không phải tên bạn; thông tin trả về là số chứng minh
        nhân dân cũ 9 số trong khi bạn đã đổi sang căn cước gắn chip; hoặc hệ thống báo thuê bao
        chưa hoàn thành xác thực. Cả ba đều dẫn tới cùng một việc phải làm ở mục dưới.
      </Note>

      <h2 id="cach-cap-nhat">Cách cập nhật thông tin chính chủ</h2>
      <p>
        Có ba kênh chính thức, tất cả đều không thu phí: <strong>app My MobiFone</strong>,{" "}
        <strong>app VNeID</strong>, và <strong>cửa hàng MobiFone</strong>.
      </p>
      <p>Trên app My MobiFone, trình tự như sau:</p>
      <ol>
        <li>Đăng nhập bằng chính số thuê bao cần cập nhật.</li>
        <li>Bấm vào ảnh đại diện, chọn hồ sơ cá nhân, rồi chọn mục cập nhật thông tin.</li>
        <li>Nhập mã OTP hệ thống gửi về.</li>
        <li>Chụp mặt trước và mặt sau căn cước công dân gắn chip.</li>
        <li>Chụp ảnh chân dung để xác thực sinh trắc học.</li>
        <li>Ký xác nhận và gửi. Hệ thống xử lý và phản hồi trạng thái.</li>
      </ol>
      <p>
        Giấy tờ cần có là căn cước công dân gắn chip; người nước ngoài dùng hộ chiếu. Nếu chọn kênh
        VNeID, bạn cần đã cài và kích hoạt tài khoản VNeID trên điện thoại.
      </p>

      <h2 id="ngoai-le-so-dep">Ngoại lệ dành riêng cho SIM số đẹp</h2>
      <p>
        Đây là chi tiết mà người mua SIM số đẹp cần biết và hiếm khi được nhắc: theo hướng dẫn của
        MobiFone, <strong>kênh cập nhật trực tuyến không áp dụng cho các số đặc biệt</strong> — tam
        hoa, tứ quý, số lặp, số dễ nhớ và các dạng số giá trị cao. Những số này phải làm thủ tục{" "}
        <strong>tại cửa hàng</strong>.
      </p>
      <p>
        Lý do dễ hiểu: số giá trị cao là đích ngắm của chiếm đoạt số, nên nhà mạng đặt thêm một lớp
        kiểm tra trực tiếp. Hệ quả thực tế với bạn:
      </p>
      <ul>
        <li>
          Đừng lên kế hoạch &ldquo;mua số đẹp rồi tự làm chính chủ qua app&rdquo; — hãy tính trước
          một chuyến ra cửa hàng.
        </li>
        <li>
          Khi mua, nên thống nhất với người bán về việc <strong>cùng ra cửa hàng làm sang tên</strong>{" "}
          thay vì chỉ nhận SIM rồi tự xoay.
        </li>
        <li>
          Ngược lại, đây cũng là một lớp bảo vệ: người khác không thể chuyển số của bạn đi chỉ bằng
          thao tác trực tuyến.
        </li>
      </ul>

      <h2 id="moc-thoi-gian">Mốc thời gian và hậu quả nếu chưa xác thực</h2>

      <DataTable
        head={["Mốc", "Nội dung"]}
        rows={TIMELINE.map(([when, what]) => [when, what])}
        caption="Các mốc trong đợt xác thực thông tin thuê bao năm 2026"
      />

      <Note tone="warn" title="Nếu SIM của bạn đã bị khoá">
        Mốc 15/8/2026 đã qua, nên nếu SIM đang không gọi ra được hoặc không nhận được cuộc gọi, rất
        có thể nguyên nhân là chưa hoàn thành xác thực. Sau khi bạn hoàn tất xác thực trên app hoặc
        tại cửa hàng, hệ thống mở khoá tự động. Các nguyên nhân bị khoá khác — hết hạn sử dụng, nợ
        cước, khoá quyền nạp thẻ — được phân biệt trong bài{" "}
        <Link href="/tin-tuc/sim-bi-khoa-mobifone">
          SIM MobiFone bị khoá 1 chiều, 2 chiều
        </Link>
        .
      </Note>

      <h2 id="sang-ten">Sang tên đổi chủ khi mua SIM số đẹp</h2>
      <p>
        Kiểm tra chính chủ và sang tên là hai việc khác nhau. Kiểm tra thì tự làm được bằng tin nhắn;
        sang tên thì phải làm thủ tục:
      </p>
      <ul>
        <li>
          <strong>Làm ở đâu:</strong> cửa hàng MobiFone. Theo các hướng dẫn phổ biến, cả chủ cũ và
          chủ mới cần có mặt cùng giấy tờ gốc để ký biên bản chuyển chủ quyền. MobiFone không công bố
          quy trình này trên trang chính thức, nên hãy gọi 18001090 hỏi trước khi đi để khỏi mất
          chuyến.
        </li>
        <li>
          <strong>Phí:</strong> MobiFone công bố phí chuyển chủ quyền thuê bao trả sau là 50.000
          đồng, chưa gồm phí SIM nếu phải cấp SIM mới. Với thuê bao trả trước, nhà mạng không công bố
          mức phí cụ thể.
        </li>
        <li>
          <strong>Nên làm ngay,</strong> đừng để dành. Số chưa sang tên là số bạn chưa thực sự nắm
          quyền, dù đã trả tiền.
        </li>
      </ul>
      <p>
        Nếu bạn đang cân nhắc mua và muốn biết cách chọn nơi bán chịu trách nhiệm tới bước sang tên,
        xem <Link href="/tin-tuc/mua-sim-so-dep-o-dau-uy-tin">8 điều cần kiểm tra trước khi trả tiền</Link>.
      </p>

      <h2 id="lua-dao">Cảnh giác với chiêu mạo danh nhà mạng</h2>
      <p>
        Mỗi đợt chuẩn hoá thông tin là một đợt lừa đảo mạo danh. MobiFone đã cảnh báo công khai:
        không cung cấp ảnh giấy tờ, ảnh chân dung hay mã OTP cho bất kỳ cuộc gọi, tin nhắn hoặc
        đường link lạ nào. Ba nguyên tắc an toàn:
      </p>
      <ul>
        <li>
          Chỉ cập nhật qua <strong>app My MobiFone</strong>, <strong>VNeID</strong> hoặc{" "}
          <strong>cửa hàng</strong> — không qua link nhận được từ tin nhắn.
        </li>
        <li>
          Nhà mạng <strong>không thu phí</strong> việc chuẩn hoá thông tin. Ai đòi tiền để
          &ldquo;giữ số&rdquo; hoặc &ldquo;mở khoá nhanh&rdquo; đều là dấu hiệu lừa.
        </li>
        <li>
          Không đọc mã OTP cho ai, kể cả người tự nhận là nhân viên nhà mạng.
        </li>
      </ul>

      <Note tone="info" title="Nguồn tham khảo">
        Nội dung dựa trên hướng dẫn xác thực thông tin thuê bao và mục hỏi đáp trên{" "}
        <a href="https://www.mobifone.vn/ho-tro-khach-hang/cau-hoi-thuong-gap" target="_blank" rel="noopener">
          mobifone.vn
        </a>
        , cùng Thông tư 08/2026/TT-BKHCN hướng dẫn xác thực thông tin thuê bao di động mặt đất. Các
        mốc thời gian do nhà mạng thông báo có thể được điều chỉnh — khi cần chắc chắn, gọi 18001090.
      </Note>
    </ArticleShell>
  );
}
