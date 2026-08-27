import Link from "next/link";
import ArticleShell, { type FaqItem } from "@/components/blog/ArticleShell";
import { DataTable, KeyPoints, Note } from "@/components/blog/ArticleBits";
import ArticleSimTable from "@/components/blog/ArticleSimTable";
import { articleMetadata } from "@/lib/articleSeo";
import { getArticle } from "@/content/tinTucArticles";
import { NANG_LUONG_LIST, NL_META } from "@/lib/batCuc";

const article = getArticle("bat-cuc-linh-so-la-gi");
export const metadata = articleMetadata(article);

// Bài có bảng SIM thật đọc từ kho → ISR mỗi giờ thay vì đóng băng lúc build.
export const revalidate = 3600;

const faq: FaqItem[] = [
  {
    q: "Bát Cực Linh Số là gì?",
    a: "Bát Cực Linh Số là cách xem dãy số dựa trên 8 năng lượng của Bát Trạch – Du Niên: 4 năng lượng cát (Sinh Khí, Thiên Y, Diên Niên, Phục Vị) và 4 năng lượng hung (Họa Hại, Lục Sát, Ngũ Quỷ, Tuyệt Mệnh). Mỗi năng lượng ứng với 8 cặp số, tổng cộng 64 cặp. Người xem tách dãy số thành các cặp liền nhau rồi đếm xem năng lượng nào chiếm nhiều nhất.",
  },
  {
    q: "Vì sao số 5 và số 0 không có trong bảng 64 cặp?",
    a: "Vì bảng 64 cặp được dựng từ 8 quái của Bát Trạch, ứng với 8 con số 1, 2, 3, 4, 6, 7, 8, 9. Số 5 nằm ở trung cung nên không thuộc quái nào, còn số 0 không có trong Hà Đồ – Lạc Thư gốc. Cặp nào chứa 5 hoặc 0 thì được xem là trung tính và bỏ qua khi đếm năng lượng.",
  },
  {
    q: "Cách tách cặp số cho đúng?",
    a: "Tách theo kiểu chồng lấn: mỗi chữ số ghép với chữ số ngay sau nó. Ví dụ 1234 cho ba cặp 12, 23, 34 chứ không phải hai cặp 12 và 34. Một SIM 10 số sẽ cho 9 cặp, trong đó các cặp chứa 0 hoặc 5 bị bỏ qua.",
  },
  {
    q: "Sim có năng lượng hung thì có nên mua không?",
    a: "Theo quan niệm dân gian, gần như không dãy số nào thuần cát. Điều thường được khuyên là xem năng lượng CHỦ ĐẠO và các cặp ở bốn số cuối, vì đó là phần người khác nhớ và đọc nhiều nhất. Một cặp hung nằm giữa dãy, xen giữa nhiều cặp cát, thường không bị coi là vấn đề lớn.",
  },
  {
    q: "Bát Cực Linh Số khác gì cách xem theo ngũ hành?",
    a: "Ngũ hành xét từng con số riêng lẻ thuộc hành nào rồi so với mệnh của người dùng, nên kết quả phụ thuộc vào năm sinh. Bát Cực Linh Số xét quan hệ giữa hai số đứng cạnh nhau, nên đọc ra tính chất của bản thân dãy số mà chưa cần biết tuổi. Hai cách bổ sung cho nhau chứ không thay thế nhau.",
  },
  {
    q: "Có cần biết giờ sinh để xem Bát Cực Linh Số không?",
    a: "Không. Bản thân phép Bát Cực chỉ cần dãy số. Giờ sinh và ngày sinh chỉ cần khi bạn muốn kết hợp thêm cung phi, âm dương và ngũ hành bản mệnh để chấm điểm tổng hợp cho từng SIM.",
  },
];

/** Bảng 64 cặp lấy trực tiếp từ engine `src/lib/batCuc.ts` — bài viết và công cụ
 *  trên site không bao giờ lệch nhau, và sửa engine là bài tự cập nhật. */
const pairRows = NANG_LUONG_LIST.map((nl) => [
  nl.label,
  nl.loai === "cát" ? "Cát" : "Hung",
  nl.pairs.join(" · "),
  nl.yNghia.join(", "),
]);

const meaningRows = NANG_LUONG_LIST.map((nl) => [
  nl.label,
  nl.loai === "cát" ? "Cát" : "Hung",
  nl.moTa,
]);

const hoaGiaiRows = NANG_LUONG_LIST.filter((nl) => nl.hoaGiai).map((nl) => [
  nl.label,
  nl.pairs.slice(0, 4).join(" · "),
  NL_META[nl.hoaGiai!].label,
  NL_META[nl.hoaGiai!].pairs.slice(0, 4).join(" · "),
]);

export default function BatCucLinhSoPage() {
  return (
    <ArticleShell
      article={article}
      faq={faq}
      related={[
        "cach-tinh-diem-sim-phong-thuy",
        "sim-hop-menh-ngu-hanh",
        "80-que-kinh-dich-trong-sim",
      ]}
      lead={
        <p>
          Hai người cùng xem một dãy SIM có thể đưa ra hai nhận xét khác nhau, đơn giản vì họ
          dùng hai hệ quy chiếu khác nhau. Người xem theo ngũ hành đọc từng con số; người xem
          theo <strong>Bát Cực Linh Số</strong> đọc quan hệ giữa hai số đứng cạnh nhau. Bài này
          trình bày trọn bộ 8 năng lượng, bảng tra 64 cặp số, và cách tự soi một dãy SIM bằng
          giấy bút trong khoảng hai phút.
        </p>
      }
    >
      <KeyPoints
        items={[
          <>
            Bát Cực Linh Số chia <strong>64 cặp số</strong> thành 8 năng lượng: 4 cát (Sinh Khí,
            Thiên Y, Diên Niên, Phục Vị) và 4 hung (Họa Hại, Lục Sát, Ngũ Quỷ, Tuyệt Mệnh).
          </>,
          <>
            Tách dãy số theo kiểu <strong>chồng lấn</strong>: 1234 → 12, 23, 34. SIM 10 số cho 9 cặp.
          </>,
          <>
            Cặp chứa <strong>số 5 hoặc số 0</strong> được xem là trung tính, không tính vào năng lượng nào.
          </>,
          <>
            Điều đáng quan tâm là <strong>năng lượng chủ đạo</strong> và các cặp ở bốn số cuối, không
            phải việc dãy số có xuất hiện cặp hung hay không.
          </>,
          <>
            Muốn khỏi tính tay, có thể dùng công cụ{" "}
            <Link href="/sim-phong-thuy">tìm SIM hợp tuổi</Link> — nó chấm sẵn phần Bát Cực trên
            toàn bộ kho số.
          </>,
        ]}
      />

      <h2 id="bat-cuc-la-gi">Bát Cực Linh Số là gì?</h2>
      <p>
        Bát Cực Linh Số (còn được gọi là phép xem số theo Du Niên hoặc Bát Trạch) xuất phát từ
        thuật Bát Trạch trong phong thuỷ nhà ở. Trong Bát Trạch, tám hướng nhà ứng với tám quái,
        và quan hệ giữa hai quái tạo ra tám trạng thái năng lượng — bốn tốt, bốn xấu. Khi ứng
        dụng vào dãy số, mỗi con số được gán về một quái, nên <strong>một cặp hai số cũng tạo ra
        một trong tám năng lượng đó</strong>.
      </p>
      <p>
        Điểm khác biệt cần nắm: cách xem này không quan tâm con số &ldquo;đẹp&rdquo; hay
        &ldquo;xấu&rdquo; theo nghĩa lộc phát, thần tài. Nó chỉ đọc <em>quan hệ</em> giữa các số
        đứng cạnh nhau. Vì vậy một dãy toàn số 8 vẫn có thể ra kết quả bình thường, còn một dãy
        nhìn không nổi bật lại có thể toàn cặp cát.
      </p>

      <Note tone="info" title="Về cách tiếp cận trong bài">
        Toàn bộ nội dung dưới đây trình bày một hệ thống <strong>niềm tin dân gian</strong> đang
        được dùng phổ biến khi chọn số, không phải quy luật đã được kiểm chứng khoa học. Hãy xem
        nó như một tiêu chí phụ giúp chọn giữa nhiều số cùng tầm giá, chứ không phải căn cứ để
        trả thêm nhiều tiền.
      </Note>

      <h2 id="tam-nang-luong">Tám năng lượng: bốn cát, bốn hung</h2>
      <p>
        Bốn năng lượng cát thường được xếp theo thứ tự Sinh Khí – Thiên Y – Diên Niên – Phục Vị,
        từ &ldquo;động&rdquo; đến &ldquo;tĩnh&rdquo;. Bốn năng lượng hung xếp theo mức độ tăng
        dần: Họa Hại – Lục Sát – Ngũ Quỷ – Tuyệt Mệnh.
      </p>

      <DataTable
        head={["Năng lượng", "Tính chất", "Ý nghĩa thường được gán"]}
        rows={meaningRows}
        caption="Tám năng lượng trong Bát Cực Linh Số"
      />

      <p>
        Cần lưu ý một điều mà nhiều nơi nói không rõ: <strong>năng lượng hung không đồng nghĩa
        với &ldquo;xấu toàn diện&rdquo;</strong>. Trong hệ thống này, mỗi năng lượng hung vẫn kèm
        một nhóm tính chất được xem là mặt mạnh — chẳng hạn Họa Hại gắn với khẩu tài và khả năng
        phản biện, Ngũ Quỷ gắn với trí tuệ và tài hoa, Tuyệt Mệnh gắn với sự quyết đoán khi đầu
        tư. Người làm nghề nói nhiều, tranh luận nhiều đôi khi lại được khuyên chọn số có Họa
        Hại vừa phải.
      </p>

      <h2 id="bang-tra-64-cap">Bảng tra 64 cặp số</h2>
      <p>
        Mỗi năng lượng ứng với đúng 8 cặp, gồm 4 cặp cơ bản và 4 cặp đảo ngược của chúng. Cặp
        đảo (ví dụ 68 và 86) được xem là <strong>cùng năng lượng</strong> — đây là lý do 68 và 86
        đều được coi là cặp tốt trong dân gian.
      </p>

      <DataTable
        head={["Năng lượng", "Cát/Hung", "8 cặp số", "Từ khoá"]}
        rows={pairRows}
        caption="Bảng 64 cặp số — dùng chung với công cụ chấm điểm trên chonsomobifone.com"
      />

      <Note tone="tip" title="Vì sao không có số 5 và số 0">
        Bảng trên chỉ dùng tám con số 1, 2, 3, 4, 6, 7, 8, 9 — ứng với tám quái. Số 5 nằm ở
        trung cung nên không thuộc quái nào; số 0 không có mặt trong Hà Đồ – Lạc Thư gốc. Do đó
        mọi cặp có chứa 5 hoặc 0 (05, 15, 50, 59, 90&hellip;) đều được coi là trung tính và bỏ
        qua khi đếm. Một dãy nhiều số 5 và 0 vì thế thường cho kết quả Bát Cực khá
        &ldquo;nhạt&rdquo; — không phải vì nó xấu, mà vì có ít cặp để đọc.
      </Note>

      <h2 id="cach-tu-soi">Cách tự soi một dãy SIM trong hai phút</h2>
      <p>Quy trình gồm bốn bước, làm bằng giấy bút là đủ:</p>
      <ol>
        <li>
          <strong>Viết dãy số liền nhau</strong>, bỏ dấu chấm và khoảng trắng. Ví dụ:
          0933356666.
        </li>
        <li>
          <strong>Tách cặp chồng lấn</strong> — mỗi số ghép với số kế tiếp: 09, 93, 33, 33, 35,
          56, 66, 66, 66. Một SIM 10 số luôn cho 9 cặp.
        </li>
        <li>
          <strong>Tra từng cặp</strong> vào bảng 64 cặp phía trên và gạch bỏ những cặp chứa 5
          hoặc 0. Ở ví dụ này, 09, 35, 56 bị bỏ; còn lại 93 (Sinh Khí), 33 và 33 (Phục Vị), 66,
          66, 66 (Phục Vị).
        </li>
        <li>
          <strong>Đếm và xác định năng lượng chủ đạo</strong>: Phục Vị 5 cặp, Sinh Khí 1 cặp.
          Dãy này chủ đạo Phục Vị — theo quan niệm dân gian là năng lượng ổn định, tích luỹ, tụ
          tài bền, phù hợp người muốn giữ khách lâu dài hơn là bung sức bứt phá.
        </li>
      </ol>

      <p>
        Với dãy dài như căn cước 12 số, cách làm không đổi, chỉ nhiều cặp hơn. Nếu không muốn
        tính tay cho từng số trong kho hàng nghìn số, công cụ{" "}
        <Link href="/sim-phong-thuy">tìm SIM hợp tuổi</Link> đã chấm sẵn phần này và cho phép lọc
        theo đúng năng lượng bạn muốn có hoặc muốn tránh.
      </p>

      <h2 id="doc-ket-qua">Đọc kết quả sao cho đúng trọng tâm</h2>
      <p>
        Sai lầm phổ biến nhất là đếm tổng số cặp cát rồi kết luận. Ba nguyên tắc đọc kết quả
        thường được người trong nghề dùng:
      </p>
      <ul>
        <li>
          <strong>Ưu tiên bốn số cuối.</strong> Đây là phần được đọc và nhớ nhiều nhất, nên các
          cặp nằm ở đuôi được coi là có sức nặng hơn cặp ở giữa dãy.
        </li>
        <li>
          <strong>Xem tỉ lệ, không xem số lượng tuyệt đối.</strong> Bốn cặp cát trên tổng 5 cặp
          đọc được là rất đậm; bốn cặp cát trên tổng 9 cặp chỉ là trung bình.
        </li>
        <li>
          <strong>Cặp lặp lại làm đậm năng lượng.</strong> Ba cặp 66 liền nhau không phải
          &ldquo;ba lần tốt&rdquo; mà là một tính chất Phục Vị rất đậm — ổn định đến mức trì, nếu
          bạn cần sự bứt phá thì lại không hợp.
        </li>
      </ul>

      <h2 id="hoa-giai">Hoá giải: cặp cát bù cặp hung</h2>
      <p>
        Trong hệ thống này, mỗi năng lượng hung có một năng lượng cát được coi là hoá giải tương
        ứng. Đây cũng là cơ sở của cách chọn SIM &ldquo;bù&rdquo; cho căn cước: nếu số căn cước
        có nhiều cặp hung, người ta tìm SIM có nhiều cặp cát hoá giải đúng loại đó.
      </p>

      <DataTable
        head={["Năng lượng hung", "Ví dụ cặp", "Cát hoá giải", "Ví dụ cặp hoá giải"]}
        rows={hoaGiaiRows}
        caption="Cặp năng lượng hung và năng lượng cát được xem là hoá giải tương ứng"
        boldFirstColumn
      />

      <ArticleSimTable
        title="SIM đang còn hàng có cặp Thiên Y (68 · 86) ở đuôi"
        filter={{ suffixes: ["68", "86"] }}
        limit={8}
        moreHref="/sim-loc-phat"
        moreLabel="Xem toàn bộ kho SIM đuôi lộc phát 68 · 86"
        note="Thiên Y là năng lượng gắn với tài lộc trong Bát Cực Linh Số, ứng với 8 cặp số trong đó 68 và 86 là hai cặp phổ biến nhất trên thị trường."
      />

      <h2 id="ket-hop">Kết hợp với các cách xem khác</h2>
      <p>
        Bát Cực Linh Số chỉ là một trong nhiều lớp thường được cân nhắc khi chọn số. Trên thực
        tế, một số được xem là &ldquo;hợp&rdquo; khi nhiều lớp cùng đồng thuận:
      </p>
      <ul>
        <li>
          <Link href="/tin-tuc/sim-hop-menh-ngu-hanh">Ngũ hành bản mệnh</Link> — từng con số
          thuộc hành nào, có tương sinh với mệnh của bạn hay không.
        </li>
        <li>
          <Link href="/tin-tuc/80-que-kinh-dich-trong-sim">Quẻ Kinh Dịch</Link> — lấy bốn hoặc
          sáu số cuối chia 80 để tra quẻ.
        </li>
        <li>
          <strong>Tổng nút</strong> — tổng các chữ số rồi lấy phần dư khi chia 10.
        </li>
        <li>
          <strong>Âm dương</strong> — tỉ lệ số chẵn và số lẻ trong dãy.
        </li>
      </ul>
      <p>
        Cách cộng gộp năm lớp này thành một điểm số được nói kỹ trong bài{" "}
        <Link href="/tin-tuc/cach-tinh-diem-sim-phong-thuy">cách tính điểm SIM phong thuỷ</Link>.
        Nếu bạn chỉ muốn xem nhanh một số cụ thể đang đứng ở đâu so với thị trường, dùng công cụ{" "}
        <Link href="/dinh-gia-sim">định giá SIM</Link>.
      </p>

      <h2 id="luu-y">Bốn điều nên tỉnh táo</h2>
      <ul>
        <li>
          <strong>Không có dãy số nào toàn cát.</strong> Nếu ai đó khẳng định số họ bán
          &ldquo;100% cát&rdquo;, gần như chắc chắn họ đã bỏ qua các cặp không thuận.
        </li>
        <li>
          <strong>Đừng để phong thuỷ quyết định ngân sách.</strong> Yếu tố khiến một số dễ nhớ và
          dễ đọc — dạng số, đầu số, độ liền mạch — mới là thứ quyết định giá thị trường.
        </li>
        <li>
          <strong>Cẩn thận với bảng tra khác nhau giữa các nguồn.</strong> Vài trang xếp cặp
          không giống nhau. Hãy chọn một hệ và dùng nhất quán, thay vì gộp nhiều hệ rồi tự làm
          rối.
        </li>
        <li>
          <strong>Số thật quan trọng hơn điểm số.</strong> Trước khi trả tiền, hãy kiểm tra SIM
          có hoạt động, có sang tên chính chủ được hay không — xem{" "}
          <Link href="/tin-tuc/mua-sim-so-dep-o-dau-uy-tin">8 điều cần kiểm tra</Link>.
        </li>
      </ul>

      <p>
        Nếu bạn đã biết mình muốn năng lượng nào, cách nhanh nhất là mở{" "}
        <Link href="/sim-phong-thuy">công cụ tìm SIM hợp tuổi</Link>, chọn năng lượng cần có và
        để hệ thống lọc trong{" "}
        <Link href="/mua-sim-gia-re">kho SIM MobiFone</Link> đang còn hàng.
      </p>
    </ArticleShell>
  );
}
