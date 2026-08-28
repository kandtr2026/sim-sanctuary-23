import Link from "next/link";
import ArticleShell, { type FaqItem } from "@/components/blog/ArticleShell";
import { DataTable, KeyPoints, Note } from "@/components/blog/ArticleBits";
import { articleMetadata } from "@/lib/articleSeo";
import { getArticle } from "@/content/tinTucArticles";

const article = getArticle("chuyen-mang-giu-so-sang-mobifone");
export const metadata = articleMetadata(article);

const CONDITIONS: [string, string][] = [
  [
    "SIM đang hoạt động cả hai chiều",
    "Số đang bị khoá một chiều hay hai chiều đều không đủ điều kiện. Phải mở khoá trước khi đăng ký.",
  ],
  [
    "Thông tin khai báo trùng khớp",
    "Thông tin khai với nhà mạng chuyển đến phải khớp thông tin đang đăng ký tại nhà mạng chuyển đi. Đây là lý do bị từ chối phổ biến nhất.",
  ],
  [
    "Đã kích hoạt tối thiểu 90 ngày",
    "Áp dụng cho lần chuyển mạng đầu tiên của số được phân bổ trực tiếp.",
  ],
  [
    "Từ lần chuyển thứ hai: tối thiểu 60 ngày",
    "Tính theo thời gian đã kích hoạt tại nhà mạng hiện tại, không phải tổng thời gian dùng số.",
  ],
  [
    "Trả sau: không nợ cước, cước trong kỳ dưới ngưỡng",
    "Phải thanh toán hết các kỳ trước, và cước phát sinh trong kỳ hiện tại không vượt 500.000 đồng.",
  ],
  [
    "Trả sau: không dùng chuyển vùng quốc tế 60 ngày trước",
    "Quý khách vừa ra nước ngoài và có phát sinh roaming thì chờ đủ 60 ngày rồi đăng ký.",
  ],
  [
    "Không đang trong thời gian cam kết",
    "Gói cam kết ràng buộc việc chuyển mạng. Muốn đi sớm phải huỷ cam kết và trả phí.",
  ],
];

const REJECTIONS: [string, string][] = [
  [
    "Thông tin không khớp",
    "Sai một chữ trong tên, sai ngày sinh, hoặc số giấy tờ đã đổi mà chưa cập nhật ở nhà mạng cũ.",
  ],
  [
    "Chưa đủ thời gian kích hoạt",
    "Chưa đủ 90 ngày với lần đầu, hoặc chưa đủ 60 ngày với các lần sau.",
  ],
  [
    "Đang nợ cước hoặc vượt ngưỡng cước trong kỳ",
    "Áp dụng với thuê bao trả sau; cần thanh toán rồi đăng ký lại.",
  ],
  [
    "Đang trong thời gian cam kết",
    "Gói cam kết chưa hết hạn. Với gói cam kết kèm số đẹp, huỷ cam kết còn dẫn tới bị thu hồi số.",
  ],
  [
    "Số đang có khiếu nại hoặc tranh chấp quyền sử dụng",
    "Nhà mạng sẽ tạm dừng cho tới khi việc tranh chấp được giải quyết.",
  ],
  [
    "Đang có một yêu cầu chuyển mạng khác",
    "Mỗi số chỉ được xử lý một giao dịch chuyển mạng tại một thời điểm.",
  ],
];

const faq: FaqItem[] = [
  {
    q: "Chuyển mạng giữ số sang MobiFone cần điều kiện gì?",
    a: "SIM phải đang hoạt động hai chiều, thông tin khai báo trùng khớp giữa hai nhà mạng, đã kích hoạt tối thiểu 90 ngày với lần chuyển đầu tiên (60 ngày từ lần thứ hai), không đang trong thời gian cam kết. Với thuê bao trả sau còn cần đã thanh toán hết cước, cước phát sinh trong kỳ không vượt 500.000 đồng và không dùng chuyển vùng quốc tế trong 60 ngày trước đó.",
  },
  {
    q: "Đăng ký chuyển mạng sang MobiFone ở đâu?",
    a: "Qua app My MobiFone hoặc tại cửa hàng MobiFone. Trang web mobifone.vn hiện chỉ hỗ trợ tra cứu trạng thái yêu cầu và tra cứu chuyển mạng đi, chưa hỗ trợ đăng ký trực tuyến.",
  },
  {
    q: "Phí chuyển mạng giữ số là bao nhiêu?",
    a: "Mức thường được nêu là khoảng 50.000 đến 60.000 đồng tuỳ loại thuê bao, gồm phí chuyển mạng và phí SIM mới. MobiFone không công bố con số này trên trang chính thức, vì vậy nên gọi 18001090 để xác nhận trước khi đăng ký.",
  },
  {
    q: "Chuyển mạng giữ số mất bao lâu?",
    a: "Theo hướng dẫn của cơ quan quản lý, thời gian xử lý tối đa là 2 ngày với khách hàng cá nhân và 3 ngày với tổ chức, thời gian gián đoạn liên lạc không quá 1 giờ. Thực tế nhiều trường hợp hoàn tất trong 1 đến 3 ngày làm việc.",
  },
  {
    q: "Đang dùng gói cam kết thì chuyển mạng được không?",
    a: "Không, trong thời gian cam kết thuê bao không được chuyển mạng giữ số. Muốn đi sớm phải huỷ cam kết và trả phí, tính theo giá gói cước nhân số tháng cam kết còn lại. Riêng gói cam kết đi kèm số đẹp, việc huỷ cam kết còn dẫn tới bị thu hồi số — cần đọc kỹ hợp đồng trước khi quyết định.",
  },
  {
    q: "Làm sao biết một số đang thuộc nhà mạng nào?",
    a: "Sau khi chuyển mạng giữ số, đầu số không còn cho biết nhà mạng. Quý khách tra cứu trên cổng thông tin của Cục Viễn thông để biết số đó hiện thuộc nhà mạng nào.",
  },
];

export default function ChuyenMangGiuSoPage() {
  return (
    <ArticleShell
      article={article}
      faq={faq}
      related={[
        "kiem-tra-sim-chinh-chu-mobifone",
        "sim-bi-khoa-mobifone",
        "cac-dau-so-mang-mobifone-moi-nhat",
      ]}
      lead={
        <p>
          Chuyển mạng giữ số là quyền của người dùng di động: đổi nhà mạng phục vụ sang MobiFone,
          dãy số cũ giữ nguyên. Quyền đó đi kèm bảy điều kiện, và phần lớn hồ sơ bị từ chối chỉ vì
          chưa soát hết bảy điều kiện ấy trước khi đăng ký. Dưới đây là toàn bộ điều kiện theo quy
          định hiện hành, sáu lý do từ chối thường gặp, cùng trình tự để hoàn tất ngay lần đầu.
        </p>
      }
    >
      <KeyPoints
        items={[
          <>
            Quy định hiện hành: <strong>Thông tư 09/2025/TT-BKHCN</strong>, hiệu lực từ 10/8/2025.
          </>,
          <>
            Điều kiện then chốt: SIM <strong>đang hoạt động hai chiều</strong>, thông tin{" "}
            <strong>trùng khớp</strong>, đã kích hoạt <strong>≥ 90 ngày</strong> (lần đầu) hoặc{" "}
            <strong>≥ 60 ngày</strong> (từ lần thứ hai).
          </>,
          <>
            Trả sau: không nợ cước, cước trong kỳ <strong>≤ 500.000 đồng</strong>, và không dùng
            roaming trong <strong>60 ngày</strong> trước đó.
          </>,
          <>
            Đăng ký qua <strong>app My MobiFone</strong> hoặc <strong>cửa hàng</strong> — website
            chưa hỗ trợ đăng ký.
          </>,
          <>
            Đang trong <strong>thời gian cam kết</strong> thì không chuyển được; huỷ cam kết gói số
            đẹp có thể bị <strong>thu hồi số</strong>.
          </>,
        ]}
      />

      <h2 id="dieu-kien">Bảy điều kiện cần kiểm tra trước khi đăng ký</h2>
      <p>
        Quy định về chuyển mạng giữ số hiện nay theo Thông tư 09/2025/TT-BKHCN, hướng dẫn Nghị định
        163/2024/NĐ-CP. Các bài hướng dẫn cũ dựa trên Thông tư 35/2017 vẫn còn lưu hành, và một số
        mốc thời gian trong đó đã khác.
      </p>

      <DataTable
        head={["Điều kiện", "Nghĩa là gì trong thực tế"]}
        rows={CONDITIONS.map(([c, m]) => [c, m])}
        caption="Điều kiện chuyển mạng giữ số theo quy định hiện hành"
        boldFirstColumn={false}
      />

      <Note tone="tip" title="Một tin nhắn miễn phí tránh được lần đi lại thứ hai">
        Trước khi đến quầy, soạn <strong>TTTB</strong> gửi <strong>1414</strong> tại nhà mạng hiện
        tại để xem chính xác thông tin đang đăng ký cho số, rồi đối chiếu với giấy tờ sẽ mang theo.
        Sai lệch thông tin là lý do từ chối phổ biến nhất, và luôn phát hiện được trước bằng một tin
        nhắn miễn phí. Cách đọc kết quả có ở bài{" "}
        <Link href="/tin-tuc/kiem-tra-sim-chinh-chu-mobifone">kiểm tra SIM chính chủ</Link>.
      </Note>

      <h2 id="trinh-tu">Trình tự thực hiện, năm bước</h2>
      <ol>
        <li>
          <strong>Chuẩn hoá thông tin ở nhà mạng cũ.</strong> Nếu tên hoặc số giấy tờ chưa đúng, cập
          nhật trước. Đăng ký khi thông tin còn lệch chắc chắn bị từ chối.
        </li>
        <li>
          <strong>Kiểm tra cam kết và cước.</strong> Trả sau thì thanh toán hết cước; đang trong cam
          kết thì tính trước phí huỷ, hoặc chờ hết cam kết.
        </li>
        <li>
          <strong>Đăng ký với MobiFone</strong> qua app My MobiFone hoặc tại cửa hàng. Quý khách
          nhận SIM trắng của MobiFone để dùng sau khi chuyển xong.
        </li>
        <li>
          <strong>Xác nhận yêu cầu chuyển mạng.</strong> Theo hướng dẫn được áp dụng nhiều năm nay,
          sau khi nhận SIM trắng cần soạn tin xác nhận yêu cầu chuyển mạng gửi đầu số 1441 trong
          vòng 24 giờ. Bước này hiện không có trên trang chính thức của MobiFone, vì vậy hãy làm
          theo hướng dẫn cụ thể mà nhân viên cung cấp lúc đăng ký.
        </li>
        <li>
          <strong>Chờ xử lý và gắn SIM mới.</strong> Khi có thông báo thành công, gắn SIM MobiFone
          vào máy. Thời gian mất liên lạc trong quá trình chuyển thường rất ngắn.
        </li>
      </ol>

      <h2 id="ly-do-tu-choi">Sáu lý do hồ sơ bị từ chối</h2>
      <p>
        Theo quy định, nhà mạng chuyển đi phải thông báo lý do từ chối cho khách hàng. Dưới đây là
        các lý do thường gặp nhất và cách xử lý từng trường hợp:
      </p>

      <DataTable
        head={["Lý do", "Chi tiết và cách xử lý"]}
        rows={REJECTIONS.map(([r, d]) => [r, d])}
        caption="Các lý do bị từ chối chuyển mạng giữ số"
        boldFirstColumn={false}
      />

      <h2 id="thoi-gian-phi">Thời gian và chi phí</h2>
      <p>
        <strong>Thời gian:</strong> theo hướng dẫn của cơ quan quản lý, tối đa 2 ngày với khách hàng
        cá nhân và 3 ngày với tổ chức; thời gian gián đoạn liên lạc không quá 1 giờ. Thực tế thường
        rơi vào 1 đến 3 ngày làm việc.
      </p>
      <p>
        <strong>Chi phí:</strong> mức thường được nêu là khoảng 50.000 – 60.000 đồng tuỳ loại thuê
        bao, gồm phí chuyển mạng và phí SIM mới. Cần nói rõ: MobiFone không công bố con số này trên
        trang chính thức và các nguồn bên ngoài không thống nhất cách tách khoản. Vì vậy nên hỏi
        18001090 hoặc nhân viên cửa hàng để có mức phí chính xác tại thời điểm đăng ký.
      </p>

      <Note tone="warn" title="Cam kết đi kèm số đẹp: đọc kỹ trước khi huỷ">
        Phí huỷ cam kết chỉ là một phần của câu chuyện. Với gói cam kết được bán kèm số đẹp, huỷ
        trước hạn còn có thể dẫn tới <strong>bị thu hồi số</strong>. Phí huỷ được tính theo giá gói
        cước nhân với số tháng cam kết còn lại. Số đang giữ có giá trị thì nên cân đo kỹ giữa việc
        chờ hết cam kết và việc huỷ sớm.
      </Note>

      <h2 id="sau-khi-chuyen">Sau khi chuyển mạng, đầu số không còn nói lên nhà mạng</h2>
      <p>
        Một hệ quả ít người để ý: khi chuyển mạng giữ số phổ biến, việc nhìn đầu số để đoán nhà mạng
        không còn đáng tin. Một số đầu 098 có thể đang thuộc MobiFone, và một số đầu 090 có thể đã
        chuyển sang nhà mạng khác. Muốn biết chắc, hãy tra cứu trên cổng thông tin của Cục Viễn
        thông thay vì tra bảng đầu số.
      </p>
      <p>
        Danh sách đầu số MobiFone đang phát hành — 070, 076, 077, 078, 079, 089, 090, 093 — vẫn hữu
        ích khi <em>mua số mới</em>, và có đầy đủ trong bài{" "}
        <Link href="/tin-tuc/cac-dau-so-mang-mobifone-moi-nhat">các đầu số MobiFone mới nhất</Link>.
      </p>

      <h2 id="hay-doi-so">Khi nào nên giữ số cũ, khi nào nên chọn số mới</h2>
      <p>
        Giữ số hợp lý khi dãy số hiện tại đã gắn với khách hàng, danh thiếp và tài khoản ngân hàng.
        Trường hợp còn lại cũng đáng cân nhắc: lý do đổi sang MobiFone là chất lượng dịch vụ, còn
        dãy số đang dùng vốn khó nhớ. Lúc đó, lấy một số MobiFone dễ nhớ rồi chuyển dần liên hệ sang
        là hướng chủ động hơn.
      </p>
      <ul>
        <li>
          Xem giá từng dòng số trước khi quyết:{" "}
          <Link href="/tin-tuc/gia-sim-so-dep-mobifone">giá SIM số đẹp MobiFone</Link>.
        </li>
        <li>
          Chọn số theo tuổi và mệnh:{" "}
          <Link href="/sim-phong-thuy">công cụ tìm SIM hợp tuổi</Link>.
        </li>
        <li>
          Xem kho số còn hàng kèm giá niêm yết:{" "}
          <Link href="/mua-sim-gia-re">kho SIM MobiFone</Link>.
        </li>
      </ul>

      <Note tone="info" title="Nguồn tham khảo">
        Điều kiện và lý do từ chối lấy từ Thông tư 09/2025/TT-BKHCN quy định về chuyển mạng viễn
        thông di động mặt đất giữ nguyên số thuê bao, hướng dẫn Nghị định 163/2024/NĐ-CP. Thông tin
        về đăng ký và cam kết lấy từ{" "}
        <a href="https://www.mobifone.vn/ho-tro-khach-hang/chuyen-mang-giu-so" target="_blank" rel="noopener">
          trang chuyển mạng giữ số của MobiFone
        </a>
        . Mức phí và bước xác nhận qua đầu số 1441 chưa được nhà mạng công bố chính thức nên bài viết
        ghi rõ mức độ chắc chắn; gọi 18001090 để xác nhận.
      </Note>
    </ArticleShell>
  );
}
