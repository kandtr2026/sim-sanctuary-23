import Link from "next/link";
import ArticleShell, { type FaqItem } from "@/components/blog/ArticleShell";
import { DataTable, KeyPoints, Note } from "@/components/blog/ArticleBits";
import ArticleSimTable from "@/components/blog/ArticleSimTable";
import { articleMetadata } from "@/lib/articleSeo";
import { getArticle } from "@/content/tinTucArticles";
import { tinhCanChi, type NguHanh } from "@/lib/simHopTuoi";

const article = getArticle("sim-hop-menh-ngu-hanh");
export const metadata = articleMetadata(article);

// Bài có bảng SIM thật đọc từ kho → ISR mỗi giờ.
export const revalidate = 3600;

/** Số nào thuộc hành nào — theo Hà Đồ, khớp `DIGIT_NGU_HANH` trong src/lib/simHopTuoi.ts. */
const DIGITS_BY_HANH: Record<NguHanh, string> = {
  Thủy: "0, 1",
  Thổ: "2, 5, 8",
  Mộc: "3, 4",
  Kim: "6, 7",
  Hỏa: "9",
};

/** Hành nào sinh ra mệnh này (nghịch của tương sinh) và hành nào khắc nó. */
const MENH_RULES: {
  menh: NguHanh;
  hanhSinh: NguHanh;
  hanhKhac: NguHanh;
  ghiChu: string;
}[] = [
  { menh: "Kim", hanhSinh: "Thổ", hanhKhac: "Hỏa", ghiChu: "Thổ sinh Kim; Hỏa khắc Kim" },
  { menh: "Mộc", hanhSinh: "Thủy", hanhKhac: "Kim", ghiChu: "Thủy sinh Mộc; Kim khắc Mộc" },
  { menh: "Thủy", hanhSinh: "Kim", hanhKhac: "Thổ", ghiChu: "Kim sinh Thủy; Thổ khắc Thủy" },
  { menh: "Hỏa", hanhSinh: "Mộc", hanhKhac: "Thủy", ghiChu: "Mộc sinh Hỏa; Thủy khắc Hỏa" },
  { menh: "Thổ", hanhSinh: "Hỏa", hanhKhac: "Mộc", ghiChu: "Hỏa sinh Thổ; Mộc khắc Thổ" },
];

/** Bảng năm sinh → can chi → nạp âm → mệnh, sinh từ chính engine của site nên
 *  không bao giờ lệch với kết quả công cụ /sim-phong-thuy. */
const YEARS = Array.from({ length: 51 }, (_, i) => 1960 + i);
const yearRows = YEARS.map((year) => {
  const cc = tinhCanChi(year);
  return [String(year), `${cc.thienCan} ${cc.diaChi}`, cc.napAm, cc.menh];
});

const faq: FaqItem[] = [
  {
    q: "Số nào thuộc hành nào trong ngũ hành?",
    a: "Theo Hà Đồ: số 0 và 1 thuộc Thủy; số 2, 5, 8 thuộc Thổ; số 3, 4 thuộc Mộc; số 6, 7 thuộc Kim; số 9 thuộc Hỏa. Cần lưu ý còn một hệ quy số khác cũng đang được dùng rộng rãi, xếp cặp liền nhau 1–2 Mộc, 3–4 Hỏa, 5–6 Thổ, 7–8 Kim, 9–0 Thủy. Hai hệ chỉ trùng nhau ở số 0, 5 và 7, nên hãy chọn một hệ và dùng nhất quán, đừng trộn lẫn.",
  },
  {
    q: "Làm sao biết mệnh ngũ hành theo năm sinh?",
    a: "Mệnh (ngũ hành nạp âm) tính từ năm sinh âm lịch theo bảng 60 hoa giáp. Ví dụ người sinh năm 1990 là Canh Ngọ, nạp âm Lộ Bàng Thổ, tức mệnh Thổ. Bảng tra năm sinh 1960–2010 có ngay trong bài. Lưu ý người sinh đầu năm dương lịch (trước Tết) thì tính theo năm âm lịch trước đó.",
  },
  {
    q: "Người mệnh Kim nên chọn SIM có số nào?",
    a: "Mệnh Kim được Thổ sinh, nên nhóm số 2, 5, 8 thường được ưu tiên; các số cùng hành Kim là 6 và 7 cũng được xem là tốt. Số 9 thuộc Hỏa, mà Hỏa khắc Kim, nên thường được khuyên hạn chế ở vị trí đuôi số.",
  },
  {
    q: "Có phải cứ tránh hết số khắc mệnh là tốt nhất?",
    a: "Không. Một dãy 10 số hầu như luôn chứa vài số không thuận, và việc cố tránh sạch thường khiến Quý khách bỏ qua những số dễ nhớ, dễ đọc. Cách làm thực tế là ưu tiên bốn số cuối cho nhóm tương sinh và đồng hành, còn phần đầu dãy thì linh động.",
  },
  {
    q: "Ngũ hành hay Bát Cực Linh Số quan trọng hơn?",
    a: "Hai cách xét hai thứ khác nhau: ngũ hành xét từng con số so với mệnh người dùng, còn Bát Cực Linh Số xét quan hệ giữa hai số đứng cạnh nhau. Người xem kỹ thường dùng cả hai, cộng thêm tổng nút và quẻ Kinh Dịch, rồi chọn số nào được nhiều lớp đồng thuận nhất.",
  },
  {
    q: "Chọn SIM theo mệnh có làm giá SIM đắt hơn không?",
    a: "Giá SIM trên thị trường phụ thuộc vào dạng số, đầu số và độ dễ nhớ, không phụ thuộc mệnh của người mua. Cùng một khoảng giá luôn có nhiều số khác nhau, nên yếu tố mệnh thường chỉ dùng để chọn giữa các số đã cùng tầm giá.",
  },
];

export default function SimHopMenhNguHanhPage() {
  return (
    <ArticleShell
      article={article}
      faq={faq}
      related={[
        "cach-tinh-diem-sim-phong-thuy",
        "bat-cuc-linh-so-la-gi",
        "80-que-kinh-dich-trong-sim",
      ]}
      lead={
        <p>
          Hai dữ kiện là đủ để chọn SIM hợp mệnh: mệnh của người dùng số, và hành của từng con số.
          Phần còn lại chỉ là ghép đúng nhóm tương sinh và tránh nhóm tương khắc. Bài này có sẵn
          bảng tra năm sinh 1960–2010, bảng ngũ hành của từng con số, và nguyên tắc chọn số cho từng
          mệnh.
        </p>
      }
    >
      <KeyPoints
        items={[
          <>
            Ngũ hành của số theo Hà Đồ: <strong>0–1 Thủy</strong>, <strong>2–5–8 Thổ</strong>,{" "}
            <strong>3–4 Mộc</strong>, <strong>6–7 Kim</strong>, <strong>9 Hỏa</strong>.
          </>,
          <>
            Nguyên tắc: ưu tiên số thuộc hành <strong>sinh ra mệnh</strong> của Quý khách, kế đến là
            số <strong>đồng hành</strong>, hạn chế số thuộc hành <strong>khắc mệnh</strong>.
          </>,
          <>
            Chỉ cần siết chặt ở <strong>bốn số cuối</strong> — phần được đọc và nhớ nhiều nhất;
            phần đầu dãy nên linh động để không bỏ mất số dễ nhớ.
          </>,
          <>
            Mệnh tính theo <strong>năm âm lịch</strong>. Sinh trước Tết thì lấy năm âm lịch liền
            trước, không lấy năm dương lịch trên giấy tờ.
          </>,
          <>
            Muốn khỏi tra tay:{" "}
            <Link href="/sim-phong-thuy-hop-menh">chọn SIM theo mệnh</Link> lọc sẵn theo từng hành.
          </>,
        ]}
      />

      <h2 id="ngu-hanh-cua-so">Ngũ hành của từng con số</h2>
      <p>
        Cách quy số về ngũ hành được dùng phổ biến nhất ở Việt Nam dựa trên Hà Đồ. Đây là bảng
        gốc mà mọi phép tính phía sau đều dựa vào:
      </p>

      <DataTable
        head={["Hành", "Các con số", "Tính chất thường được gán"]}
        rows={[
          ["Thủy", DIGITS_BY_HANH.Thủy, "Linh hoạt, giao tiếp, lan toả; gắn với nghề dịch vụ, truyền thông"],
          ["Mộc", DIGITS_BY_HANH.Mộc, "Sinh trưởng, học hỏi, mở rộng; gắn với giáo dục, sáng tạo"],
          ["Hỏa", DIGITS_BY_HANH.Hỏa, "Bùng nổ, danh tiếng, thu hút; gắn với bán hàng, biểu diễn"],
          ["Thổ", DIGITS_BY_HANH.Thổ, "Ổn định, tích luỹ, tin cậy; gắn với bất động sản, sản xuất"],
          ["Kim", DIGITS_BY_HANH.Kim, "Quyết đoán, kỷ luật, tài chính; gắn với quản trị, đầu tư"],
        ]}
        caption="Ngũ hành của các con số 0–9 theo Hà Đồ"
      />

      <Note tone="tip" title="Vì sao số 5 và số 8 cùng thuộc Thổ">
        Trong Hà Đồ, các số được xếp thành từng cặp sinh – thành theo phương vị, chứ không theo
        thứ tự tăng dần. Vì vậy 2, 5, 8 cùng về Thổ, còn Hỏa chỉ có một số 9. Đó cũng là lý do
        người mệnh Thổ có nhiều lựa chọn số hơn người mệnh Hỏa.
      </Note>

      <h2 id="hai-bang-quy-so">Hai bảng quy số khác nhau — biết để không rối</h2>
      <p>
        Đây là chi tiết hầu như không trang nào nói rõ, và là nguyên nhân khiến cùng một dãy số tra ở
        hai nơi lại ra hai kết quả trái ngược: <strong>tồn tại hai cách quy số về ngũ hành</strong>{" "}
        đang được dùng song song ở Việt Nam.
      </p>

      <DataTable
        head={["Con số", "Theo Hà Đồ (bảng dùng trong bài này)", "Theo cách xếp cặp liền 1–2, 3–4…"]}
        rows={[
          ["0", "Thủy", "Thủy"],
          ["1", "Thủy", "Mộc"],
          ["2", "Thổ", "Mộc"],
          ["3", "Mộc", "Hỏa"],
          ["4", "Mộc", "Hỏa"],
          ["5", "Thổ", "Thổ"],
          ["6", "Kim", "Thổ"],
          ["7", "Kim", "Kim"],
          ["8", "Thổ", "Kim"],
          ["9", "Hỏa", "Thủy"],
        ]}
        caption="Hai hệ quy số cùng tồn tại — chỉ số 0, 5, 7 là trùng nhau ở cả hai"
      />

      <p>
        Cách thứ hai xếp các số thành từng cặp liền nhau theo thứ tự ngũ hành (1–2 Mộc, 3–4 Hỏa,
        5–6 Thổ, 7–8 Kim, 9–0 Thủy). Nó dễ nhớ hơn nên được dùng khá rộng. Cách thứ nhất dựa trên
        phương vị Hà Đồ, gắn với hệ thống Bát Trạch và{" "}
        <Link href="/tin-tuc/bat-cuc-linh-so-la-gi">Bát Cực Linh Số</Link> — đây là hệ mà công cụ
        trên chonsomobifone.com đang dùng, nên toàn bộ bài này và điểm số hiển thị trên site nhất
        quán với nhau.
      </p>
      <p>
        Điều quan trọng không phải hệ nào &ldquo;đúng&rdquo; — cả hai đều là quy ước lưu truyền —
        mà là <strong>đừng trộn hai hệ trong cùng một lần chọn số</strong>. Trộn vào thì con số nào
        cũng có thể vừa tốt vừa xấu, và phép xem mất hết ý nghĩa.
      </p>

      <h2 id="quy-tac-chon">Quy tắc chọn số cho từng mệnh</h2>
      <p>
        Trong ngũ hành có hai vòng quan hệ. Vòng tương sinh: Kim sinh Thủy, Thủy sinh Mộc, Mộc
        sinh Hỏa, Hỏa sinh Thổ, Thổ sinh Kim. Vòng tương khắc: Kim khắc Mộc, Mộc khắc Thổ, Thổ
        khắc Thủy, Thủy khắc Hỏa, Hỏa khắc Kim. Khi chọn số, điều được quan tâm là{" "}
        <strong>hành của con số tác động lên mệnh của người dùng số</strong> — chứ không phải chiều
        ngược lại.
      </p>

      <DataTable
        head={["Mệnh", "Số nên ưu tiên (hành sinh mệnh)", "Số đồng hành", "Số nên hạn chế (khắc mệnh)"]}
        rows={MENH_RULES.map((r) => [
          `Mệnh ${r.menh}`,
          `${DIGITS_BY_HANH[r.hanhSinh]} (${r.hanhSinh})`,
          `${DIGITS_BY_HANH[r.menh]} (${r.menh})`,
          `${DIGITS_BY_HANH[r.hanhKhac]} (${r.hanhKhac})`,
        ])}
        caption="Nhóm số tương sinh, đồng hành và tương khắc theo từng mệnh"
      />

      <p>
        Nhiều bảng tra trên mạng chỉ chia hai cột &ldquo;số tốt&rdquo; và &ldquo;số xấu&rdquo;.
        Thực tế còn một trường hợp thứ ba ít được nói: <strong>mệnh khắc hành của số</strong>
        {" "}(ví dụ người mệnh Kim gặp số Mộc). Trường hợp này thường được xem là nhẹ hơn hẳn so
        với việc số khắc lại mệnh, vì người vẫn ở thế chủ động. Cách chấm điểm trong công cụ trên
        site cũng phản ánh đúng thứ tự đó: số sinh mệnh được cộng nhiều nhất, số đồng hành cộng
        vừa, số bị mệnh khắc trừ nhẹ, và số khắc mệnh bị trừ nặng nhất.
      </p>

      <h2 id="tra-menh">Bảng tra mệnh theo năm sinh (1960–2010)</h2>
      <p>
        Mệnh của một người là ngũ hành <em>nạp âm</em> của năm sinh trong vòng 60 hoa giáp — không
        phải con giáp. Hai người cùng con giáp nhưng cách nhau 12 năm có thể khác mệnh hoàn toàn.
      </p>

      <DataTable
        head={["Năm sinh", "Can – Chi", "Nạp âm", "Mệnh"]}
        rows={yearRows}
        caption="Tra can chi, nạp âm và mệnh theo năm sinh dương lịch"
      />

      <Note tone="warn" title="Người sinh đầu năm cần lưu ý">
        Bảng trên tính theo năm âm lịch. Người sinh trong khoảng tháng 1 đến trước Tết Nguyên đán có
        năm âm lịch là năm liền trước năm dương lịch ghi trên giấy tờ, nên mệnh cũng đổi theo.
        Trường hợp này nên tra theo ngày sinh âm lịch để chắc.
      </Note>

      <h2 id="ap-dung">Áp dụng vào một dãy SIM cụ thể</h2>
      <p>
        Giả sử Quý khách mệnh Thổ. Theo bảng trên, số nên ưu tiên là 9 (Hỏa sinh Thổ), số đồng hành
        là 2, 5, 8, và số nên hạn chế là 3, 4 (Mộc khắc Thổ). Khi soi một dãy số:
      </p>
      <ol>
        <li>
          <strong>Đọc bốn số cuối trước.</strong> Đuôi 8998, 2892, 9889 đều thuận cho mệnh Thổ.
          Đuôi 3443 thì ngược lại.
        </li>
        <li>
          <strong>Đếm tỉ lệ toàn dãy.</strong> Nếu quá nửa số trong dãy thuộc nhóm tương sinh và
          đồng hành thì đã được xem là hợp; không cần sạch tuyệt đối.
        </li>
        <li>
          <strong>Cân với tiêu chí dễ nhớ.</strong> Một số hợp mệnh nhưng lộn xộn, khó đọc sẽ
          kém hữu dụng hơn một số hơi lệch mệnh mà khách gọi lại nhớ ngay.
        </li>
        <li>
          <strong>Xem thêm các lớp khác</strong> nếu muốn xét kỹ:{" "}
          <Link href="/tin-tuc/bat-cuc-linh-so-la-gi">Bát Cực Linh Số</Link> cho quan hệ từng cặp
          số, và <Link href="/tin-tuc/80-que-kinh-dich-trong-sim">quẻ Kinh Dịch</Link> cho bốn số
          cuối.
        </li>
      </ol>

      <ArticleSimTable
        title="Ví dụ: SIM đang còn hàng có số cuối là 9 (Hỏa sinh Thổ)"
        filter={{ lastDigits: ["9"] }}
        limit={8}
        moreHref="/sim-phong-thuy-hop-menh"
        moreLabel="Lọc SIM theo từng mệnh"
        note="Bảng minh hoạ cho mệnh Thổ. Đổi sang mệnh khác thì đổi nhóm số cuối theo bảng ở mục trên, hoặc dùng công cụ lọc theo mệnh."
      />

      <h2 id="sai-lam">Ba sai lầm thường gặp</h2>
      <ul>
        <li>
          <strong>Lấy con giáp thay cho mệnh.</strong> Tuổi Ngọ không phải một mệnh. Phải tra nạp
          âm của năm sinh mới ra Kim – Mộc – Thủy – Hỏa – Thổ.
        </li>
        <li>
          <strong>Chỉ nhìn một con số cuối.</strong> Cả dãy đều được đọc khi người khác lưu số, nên
          tỉ lệ toàn dãy vẫn có ý nghĩa — chữ số cuối cùng chỉ là một phần trong đó.
        </li>
        <li>
          <strong>Ép cả gia đình theo một mệnh.</strong> Vợ, chồng, con thường khác mệnh nhau. SIM
          là vật dùng riêng nên chọn theo mệnh của người trực tiếp dùng số đó.
        </li>
      </ul>

      <h2 id="chon-nhanh">Cách chọn nhanh trong kho số thật</h2>
      <p>
        Sau khi biết mệnh, việc còn lại là tìm số còn hàng khớp nhóm số của mệnh đó. Ba đường đi
        nhanh nhất trên site:
      </p>
      <ul>
        <li>
          <Link href="/sim-phong-thuy-hop-menh">Chọn SIM theo mệnh</Link> — lọc trực tiếp theo
          Kim, Mộc, Thủy, Hỏa, Thổ.
        </li>
        <li>
          <Link href="/sim-phong-thuy">Tìm SIM hợp tuổi</Link> — nhập năm sinh, giờ sinh, giới
          tính để hệ thống chấm điểm tổng hợp cả năm lớp.
        </li>
        <li>
          <Link href="/mua-sim-gia-re">Kho SIM MobiFone</Link> — dành cho Quý khách muốn tự tìm theo
          đuôi số hoặc theo ngân sách trước, rồi mới soi mệnh sau.
        </li>
      </ul>
      <p>
        Muốn xem các số cùng mệnh đang có mức giá thế nào, mời Quý khách mở{" "}
        <Link href="/sim-hop-menh">kho SIM hợp mệnh</Link> — mỗi số đều hiện giá niêm yết.
      </p>
    </ArticleShell>
  );
}
