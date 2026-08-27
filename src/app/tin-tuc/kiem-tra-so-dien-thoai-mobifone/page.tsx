import Link from "next/link";
import ArticleShell, { type FaqItem } from "@/components/blog/ArticleShell";
import { DataTable, KeyPoints, Note } from "@/components/blog/ArticleBits";
import { articleMetadata } from "@/lib/articleSeo";
import { getArticle } from "@/content/tinTucArticles";

const article = getArticle("kiem-tra-so-dien-thoai-mobifone");
export const metadata = articleMetadata(article);

const METHODS: [string, string, string, string][] = [
  [
    "Soạn tin TTTB gửi 1414",
    "Nhắn đúng bốn chữ TTTB tới 1414",
    "Chỉ cần SIM trong máy, không cần tiền trong tài khoản",
    "Miễn phí",
  ],
  [
    "Bấm *0# rồi gọi",
    "Máy hiện dãy số dạng 84xxxxxxxxx — đổi 84 thành 0",
    "Không cần tiền, không cần Internet",
    "Miễn phí",
  ],
  [
    "Gọi tổng đài 18001090",
    "Nghe hướng dẫn hoặc gặp nhân viên để được đọc lại số",
    "Gọi được cả khi SIM đang bị chặn chiều gọi đi",
    "Miễn phí",
  ],
  [
    "Mở app My MobiFone",
    "Số thuê bao hiện ở bước đăng nhập và trong trang cá nhân",
    "Cần điện thoại có Internet",
    "Miễn phí",
  ],
  [
    "Gọi sang một máy khác",
    "Số của bạn hiện trên màn hình máy nhận cuộc gọi",
    "Cần một máy thứ hai và tài khoản còn tiền",
    "Tính phí cuộc gọi",
  ],
];

const faq: FaqItem[] = [
  {
    q: "Làm sao xem số điện thoại của mình trên MobiFone?",
    a: "Cách chắc chắn nhất là soạn tin nhắn với nội dung TTTB gửi 1414 — tin nhắn miễn phí và hệ thống trả về số thuê bao kèm thông tin đăng ký. Ngoài ra bạn có thể bấm *0# rồi gọi, mở app My MobiFone, hoặc gọi tổng đài 18001090.",
  },
  {
    q: "Hết tiền trong tài khoản thì kiểm tra số được không?",
    a: "Được. Tin nhắn TTTB gửi 1414 và cuộc gọi tới 18001090 đều miễn phí, nên vẫn dùng được khi tài khoản bằng không. Cách gọi sang máy khác thì cần có tiền hoặc gói cước còn hiệu lực.",
  },
  {
    q: "Tổng đài MobiFone là số nào?",
    a: "Số chăm sóc khách hàng cá nhân hiện tại là 18001090, miễn cước, gọi được cả từ mạng khác. Số 9090 cũ đã được MobiFone thay bằng 18001090 từ tháng 3 năm 2025, một số tài liệu cũ vẫn còn in số này.",
  },
  {
    q: "Một chứng minh nhân dân đứng tên được mấy SIM MobiFone?",
    a: "Theo hướng dẫn của MobiFone, mỗi giấy tờ được đứng tên tối đa 3 thuê bao trả trước và 5 thuê bao trả sau cho khách hàng cá nhân. Bạn có thể soạn TTTB_Số CCCD gửi 1414 để xem những số nào đang đứng tên giấy tờ của mình.",
  },
  {
    q: "Vì sao bấm *101# không ra số của mình?",
    a: "Cú pháp *101# thường được nhắc tới cho việc kiểm tra tài khoản, không phải để xem số thuê bao, và không phải lúc nào cũng còn hiệu lực. Để xem số, hãy dùng TTTB gửi 1414 hoặc *0#.",
  },
  {
    q: "SIM mới mua chưa kích hoạt thì xem số bằng cách nào?",
    a: "Số thuê bao được in trên phôi SIM hoặc trên bao bì đi kèm. Nếu đã bỏ phôi, hãy gắn SIM vào máy rồi dùng cách TTTB gửi 1414 — cách này hoạt động ngay khi SIM vừa nhận được tín hiệu.",
  },
];

export default function KiemTraSoMobifonePage() {
  return (
    <ArticleShell
      article={article}
      faq={faq}
      related={[
        "kiem-tra-sim-chinh-chu-mobifone",
        "sim-bi-khoa-mobifone",
        "so-tong-dai-cac-nha-mang",
      ]}
      lead={
        <p>
          Quên số của chính mình là chuyện rất bình thường: SIM mới vừa lắp, SIM phụ ít dùng, hoặc
          đổi máy xong không nhớ số nào ở khe nào. Có năm cách xem lại số MobiFone, trong đó hai
          cách chạy được cả khi tài khoản đã cạn tiền.
        </p>
      }
    >
      <KeyPoints
        items={[
          <>
            Cách chắc nhất: soạn <strong>TTTB</strong> gửi <strong>1414</strong> — miễn phí, trả về
            cả số thuê bao và thông tin đăng ký.
          </>,
          <>
            Cách nhanh nhất: bấm <strong>*0#</strong> rồi gọi, máy hiện số dạng{" "}
            <strong>84xxxxxxxxx</strong>.
          </>,
          <>
            Tổng đài hiện tại là <strong>18001090</strong> (miễn cước) — số 9090 cũ đã được thay từ
            tháng 3/2025.
          </>,
          <>
            Muốn biết mình đang đứng tên bao nhiêu SIM: soạn{" "}
            <strong>TTTB_Số CCCD</strong> gửi <strong>1414</strong>.
          </>,
          <>
            Cú pháp <strong>*101#</strong> là để xem tài khoản, không phải để xem số — và không phải
            lúc nào cũng còn hiệu lực.
          </>,
        ]}
      />

      <h2 id="tong-quan">Năm cách, chọn theo tình huống</h2>

      <DataTable
        head={["Cách làm", "Kết quả nhận được", "Điều kiện", "Chi phí"]}
        rows={METHODS.map((m) => [m[0], m[1], m[2], m[3]])}
        caption="So sánh năm cách xem lại số điện thoại MobiFone"
        boldFirstColumn={false}
      />

      <h2 id="cach-1">Cách 1 — Soạn TTTB gửi 1414</h2>
      <p>
        Đây là cách MobiFone hướng dẫn chính thức, và cũng là cách cho nhiều thông tin nhất: hệ
        thống trả về <strong>số thuê bao, họ tên và số giấy tờ đang đăng ký</strong> cho SIM đó.
      </p>
      <ol>
        <li>Mở ứng dụng tin nhắn trên máy đang gắn SIM cần kiểm tra.</li>
        <li>
          Gửi tin có nội dung <strong>TTTB</strong> tới đầu số <strong>1414</strong> (không dấu,
          không thêm ký tự nào).
        </li>
        <li>Chờ tin trả lời, thường trong vài giây.</li>
      </ol>
      <p>
        Tin gửi 1414 không tính phí, nên dùng được khi tài khoản bằng không. Nếu bạn muốn biết{" "}
        <em>tất cả</em> số đang đứng tên giấy tờ của mình, soạn{" "}
        <strong>TTTB_Số CCCD</strong> (có dấu gạch dưới) gửi <strong>1414</strong>.
      </p>

      <Note tone="tip" title="Vì sao nên dùng cách này khi vừa mua SIM">
        Tin trả về cho biết SIM đang đứng tên ai. Với SIM số đẹp mới mua, đây là bước kiểm tra đầu
        tiên nên làm — nếu tên trong tin không phải tên bạn thì việc sang tên chính chủ vẫn chưa
        hoàn tất. Chi tiết ở bài{" "}
        <Link href="/tin-tuc/kiem-tra-sim-chinh-chu-mobifone">
          kiểm tra SIM chính chủ MobiFone
        </Link>
        .
      </Note>

      <h2 id="cach-2">Cách 2 — Bấm *0# rồi gọi</h2>
      <p>
        Mở bàn phím gọi, bấm <strong>*0#</strong> rồi nhấn phím gọi. Máy sẽ hiện một dòng chứa số
        thuê bao dưới dạng quốc tế, ví dụ <em>84901234567</em>; bạn đổi phần <em>84</em> ở đầu
        thành số <em>0</em> để có số quen thuộc.
      </p>
      <p>
        Đây là cách nhanh nhất và không cần Internet. Cần nói rõ: cú pháp này được hướng dẫn rộng
        rãi và hoạt động trên phần lớn máy, nhưng chưa thấy MobiFone công bố trên trang chính thức,
        nên nếu máy bạn không hiện gì thì hãy chuyển sang cách 1.
      </p>

      <h2 id="cach-3">Cách 3 — Gọi tổng đài 18001090</h2>
      <p>
        Số <strong>18001090</strong> là tổng đài chăm sóc khách hàng cá nhân của MobiFone, miễn
        cước, gọi được cả từ mạng khác. Điểm mạnh của cách này: <strong>vẫn gọi được khi SIM đang bị
        chặn chiều gọi đi</strong> — trong khi các hotline thường thì không.
      </p>
      <p>
        Từ tháng 3/2025, MobiFone đã thay số tổng đài cũ 9090 bằng 18001090. Nhiều tài liệu và bài
        viết trên mạng vẫn in số cũ; nếu gọi 9090 không được thì đó là lý do. Danh sách đầy đủ các
        đầu số hỗ trợ nằm trong bài{" "}
        <Link href="/tin-tuc/so-tong-dai-cac-nha-mang">số tổng đài các nhà mạng</Link>.
      </p>

      <h2 id="cach-4">Cách 4 — Mở app My MobiFone</h2>
      <p>
        Nếu máy có Internet, app My MobiFone là cách xem được nhiều thứ nhất trong một lần mở: số
        thuê bao, tài khoản, gói cước đang dùng và thông tin đăng ký. Khi đăng nhập bằng chính SIM
        đang gắn trong máy, số thuê bao hiện ngay ở bước xác nhận mã OTP.
      </p>
      <p>
        Ngoài app, bạn cũng có thể đăng nhập trang quản lý tài khoản trên{" "}
        <a href="https://www.mobifone.vn/tai-khoan/thong-tin-tai-khoan" target="_blank" rel="noopener">
          mobifone.vn
        </a>{" "}
        để xem thông tin tương tự.
      </p>

      <h2 id="cach-5">Cách 5 — Gọi sang một máy khác</h2>
      <p>
        Cách thủ công nhất và cũng chắc chắn nhất: gọi hoặc nhắn tin sang một máy khác, số của bạn
        sẽ hiện trên màn hình máy nhận. Nhược điểm là tốn phí cuộc gọi và cần có máy thứ hai bên
        cạnh. Dùng cách này khi bốn cách trên đều không cho kết quả.
      </p>

      <h2 id="luu-y">Ba lưu ý hay bị bỏ qua</h2>
      <ul>
        <li>
          <strong>Cú pháp kiểm tra tài khoản khác cú pháp xem số.</strong> Các mã như *101# hay
          *102# được nhắc tới cho việc xem tài khoản chính và tài khoản khuyến mãi, không phải để xem
          số thuê bao. Các mã này cũng có thể bị nhà mạng ngưng mà không thông báo rộng, nên đừng dựa
          vào chúng khi cần chắc chắn.
        </li>
        <li>
          <strong>Máy hai SIM cần chọn đúng khe.</strong> Trước khi bấm cú pháp hoặc gửi tin, hãy
          kiểm tra tin nhắn hoặc cuộc gọi sẽ đi ra từ SIM nào — nếu chọn sai khe, bạn sẽ nhận về số
          của SIM còn lại.
        </li>
        <li>
          <strong>Số in trên phôi SIM là nguồn tra nhanh.</strong> Với SIM mới mua chưa dùng, số
          thuê bao thường được in trên phôi hoặc bao bì. Giữ lại phôi cũng có ích khi cần ra cửa
          hàng làm thủ tục.
        </li>
      </ul>

      <h2 id="mua-sim">Đang tìm một số dễ nhớ hơn?</h2>
      <p>
        Lý do phổ biến nhất khiến người ta quên số của mình là dãy số quá khó nhớ. Nếu bạn đang cân
        nhắc đổi sang một số dễ thuộc — cho công việc, cho danh thiếp, hoặc để khách gọi lại đúng
        ngay lần đầu — có thể xem{" "}
        <Link href="/mua-sim-gia-re">kho SIM MobiFone</Link> với giá niêm yết công khai, hoặc lọc
        theo tuổi và mệnh tại <Link href="/sim-phong-thuy">công cụ tìm SIM hợp tuổi</Link>. Danh
        sách đầu số MobiFone hiện hành có ở bài{" "}
        <Link href="/tin-tuc/cac-dau-so-mang-mobifone-moi-nhat">các đầu số MobiFone mới nhất</Link>.
      </p>

      <Note tone="info" title="Nguồn tham khảo">
        Hướng dẫn về cú pháp TTTB gửi 1414 và số tổng đài 18001090 lấy từ trang tin và trang hỗ trợ
        khách hàng của{" "}
        <a href="https://www.mobifone.vn/ho-tro-khach-hang/cau-hoi-thuong-gap" target="_blank" rel="noopener">
          MobiFone
        </a>
        . Các cú pháp không được nhà mạng công bố chính thức đã được ghi rõ trong bài. Cú pháp và
        chính sách có thể thay đổi — khi cần chắc chắn, hãy gọi 18001090 để xác nhận.
      </Note>
    </ArticleShell>
  );
}
