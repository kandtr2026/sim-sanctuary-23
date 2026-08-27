import Link from "next/link";
import ArticleShell, { type FaqItem } from "@/components/blog/ArticleShell";
import { DataTable, KeyPoints, Note } from "@/components/blog/ArticleBits";
import { articleMetadata } from "@/lib/articleSeo";
import { getArticle } from "@/content/tinTucArticles";
import { HEXAGRAMS, getHexagramFromSuffix, type HexagramLevel } from "@/lib/hexagrams";

const article = getArticle("80-que-kinh-dich-trong-sim");
export const metadata = articleMetadata(article);

const ALL = Object.values(HEXAGRAMS).sort((a, b) => a.index - b.index);
const byLevel = (level: HexagramLevel) => ALL.filter((h) => h.level === level);

const LEVEL_COUNTS: [HexagramLevel, number][] = [
  ["Đại cát", byLevel("Đại cát").length],
  ["Cát", byLevel("Cát").length],
  ["Bình thường", byLevel("Bình thường").length],
  ["Hung", byLevel("Hung").length],
  ["Đại hung", byLevel("Đại hung").length],
];

/** Ví dụ tính tay trong bài — lấy trực tiếp từ engine để con số trong bài không
 *  bao giờ sai lệch so với công cụ trên site. */
const EXAMPLES = ["6868", "8888", "1368", "3979", "0000"].map((suffix) => {
  const hex = getHexagramFromSuffix(suffix);
  const n = parseInt(suffix, 10);
  return [
    suffix,
    `${n} ÷ 80 = ${Math.floor(n / 80)} dư ${n % 80}`,
    String(hex?.index ?? "—"),
    hex?.title ?? "—",
    hex?.level ?? "—",
  ];
});

const faq: FaqItem[] = [
  {
    q: "Cách tính quẻ Kinh Dịch của SIM như thế nào?",
    a: "Lấy 4 số cuối của SIM làm một số nguyên rồi chia cho 80; phần dư chính là số quẻ. Nếu chia hết (phần dư 0) thì lấy quẻ 80. Ví dụ đuôi 6868: 6868 chia 80 được 85 dư 68, vậy ứng với quẻ số 68.",
  },
  {
    q: "Nên lấy 4 số cuối hay 6 số cuối?",
    a: "Cả hai cách đều đang được dùng. Lấy 4 số cuối là phổ biến nhất vì đó là phần người khác nhớ nhiều nhất. Lấy 6 số cuối cho kết quả khác và thường được dùng để đối chiếu. Điều quan trọng là chọn một cách rồi dùng nhất quán, đừng đổi qua lại để tìm kết quả đẹp hơn.",
  },
  {
    q: "Vì sao là 80 quẻ mà không phải 64 quẻ như Kinh Dịch gốc?",
    a: "Kinh Dịch gốc có 64 quẻ. Bảng 80 quẻ dùng khi xem số là một biến thể lưu truyền trong dân gian, mở rộng thành 80 mục để chia hết cho phép lấy phần dư của bốn chữ số. Nó không đồng nhất với 64 quẻ Chu Dịch, nên đừng dùng hai bảng lẫn nhau.",
  },
  {
    q: "Quẻ hung thì có phải bỏ số đó không?",
    a: "Theo cách hiểu dân gian, quẻ chỉ là một trong nhiều lớp khi xem số, cùng với ngũ hành, âm dương, tổng nút và Bát Cực Linh Số. Trong bảng 80 quẻ có tới 26 quẻ thuộc nhóm hung hoặc đại hung, nên nếu chỉ dựa vào quẻ thì bạn sẽ loại bỏ khoảng một phần ba số trên thị trường, kể cả những số rất dễ nhớ.",
  },
  {
    q: "Số đuôi 0000 tra quẻ ra gì?",
    a: "Đuôi 0000 chia 80 dư 0 nên được quy về quẻ số 80 — quẻ được xếp mức đại cát trong bảng này. Đây là một trong những lý do các số tứ quý 0 vẫn được nhiều người ưa chuộng dù con số 0 không nổi bật về mặt ngũ hành.",
  },
  {
    q: "Có công cụ tra quẻ tự động không?",
    a: "Có. Công cụ tìm SIM hợp tuổi trên chonsomobifone.com đã tính sẵn quẻ cho toàn bộ kho số và cộng vào điểm tổng, nên bạn không cần tự chia tay từng số.",
  },
];

export default function QueKinhDichPage() {
  return (
    <ArticleShell
      article={article}
      faq={faq}
      related={[
        "cach-tinh-diem-sim-phong-thuy",
        "bat-cuc-linh-so-la-gi",
        "sim-hop-menh-ngu-hanh",
      ]}
      lead={
        <p>
          &ldquo;Chia 80&rdquo; là phép xem SIM được nhắc nhiều nhất trong các nhóm chơi số: lấy
          bốn số cuối chia cho 80, phần dư là số quẻ, rồi tra ý nghĩa. Cách tính chỉ mất mười
          giây, nhưng chỗ dễ làm sai lại nằm ở những chi tiết ít ai nói rõ. Bài này có đủ cách
          tính, ví dụ tính tay và bảng tra trọn 80 quẻ.
        </p>
      }
    >
      <KeyPoints
        items={[
          <>
            Công thức: <strong>4 số cuối ÷ 80 → lấy phần dư</strong>. Dư 0 thì tính là quẻ 80.
          </>,
          <>
            Bảng dùng khi xem số có <strong>80 quẻ</strong>, không phải 64 quẻ như Chu Dịch gốc —
            hai bảng khác nhau, không dùng lẫn.
          </>,
          <>
            Trong 80 quẻ có <strong>{byLevel("Đại cát").length} quẻ đại cát</strong> và{" "}
            <strong>{byLevel("Hung").length + byLevel("Đại hung").length} quẻ hung hoặc đại hung</strong>
            {" "}— tỉ lệ hung khá cao, nên đừng lấy quẻ làm tiêu chí duy nhất.
          </>,
          <>
            Cách lấy <strong>6 số cuối</strong> cho kết quả khác; chọn một cách và dùng nhất quán.
          </>,
          <>
            Công cụ <Link href="/sim-phong-thuy">tìm SIM hợp tuổi</Link> đã chấm quẻ sẵn cho cả
            kho số.
          </>,
        ]}
      />

      <h2 id="cach-tinh">Cách tính quẻ trong mười giây</h2>
      <p>Ba bước, không cần máy tính chuyên dụng:</p>
      <ol>
        <li>
          <strong>Lấy bốn số cuối</strong> của dãy SIM và đọc chúng như một số nguyên. Đuôi 6868
          đọc là sáu nghìn tám trăm sáu tám.
        </li>
        <li>
          <strong>Chia cho 80 và giữ lại phần dư.</strong> Phần nguyên không dùng đến. Nếu chia
          hết, phần dư là 0 thì quy về quẻ 80.
        </li>
        <li>
          <strong>Tra phần dư</strong> vào bảng 80 quẻ ở cuối bài để lấy lời quẻ và mức cát – hung.
        </li>
      </ol>

      <DataTable
        head={["Đuôi số", "Phép chia", "Quẻ số", "Lời quẻ", "Mức"]}
        rows={EXAMPLES}
        caption="Năm ví dụ tính tay theo bốn số cuối"
      />

      <Note tone="tip" title="Một cách diễn đạt khác cho cùng phép tính">
        Nhiều nơi hướng dẫn: lấy bốn số cuối chia 80, giữ phần thập phân rồi nhân lại với 80. Kết
        quả hoàn toàn trùng với cách lấy phần dư ở trên — chỉ là hai cách nói của cùng một phép
        toán. Cách lấy phần dư ít bị sai số làm tròn hơn khi bấm máy tính.
      </Note>

      <h2 id="80-hay-64">80 quẻ hay 64 quẻ?</h2>
      <p>
        Kinh Dịch gốc có 64 quẻ, dựng từ tám quái ghép đôi. Bảng dùng để xem số điện thoại lại có
        80 mục, và đây là điểm gây nhầm lẫn phổ biến nhất. Bảng 80 quẻ là một biến thể lưu truyền
        trong dân gian, mỗi mục là một câu lời quẻ ngắn kèm mức cát – hung. Nó thuận tiện vì 80
        chia đẹp cho dải bốn chữ số, nhưng <strong>không tương ứng một-đối-một với 64 quẻ Chu
        Dịch</strong>. Nếu bạn đọc một trang nói &ldquo;quẻ 63 Thuỷ Hoả Kỳ Tế&rdquo; thì đó là hệ
        64 quẻ, không phải hệ đang bàn ở đây.
      </p>

      <DataTable
        head={["Mức", "Số quẻ", "Tỉ lệ"]}
        rows={LEVEL_COUNTS.map(([level, count]) => [
          level,
          String(count),
          `${Math.round((count / ALL.length) * 100)}%`,
        ])}
        caption="Phân bố mức cát – hung trong bảng 80 quẻ"
      />

      <h2 id="chia-80-hay-81">Chia 80 hay chia 81? Ba hệ đang bị gọi lẫn tên</h2>
      <p>
        Trên các diễn đàn, bạn sẽ gặp cả &ldquo;bói sim chia 80&rdquo; lẫn &ldquo;bói sim 4 số cuối
        chia 81&rdquo;. Chúng không phải cùng một thứ bị nói sai — mà là ba hệ khác nhau:
      </p>

      <DataTable
        head={["Hệ", "Cách tính", "Số mục", "Ghi chú"]}
        rows={[
          [
            "80 quẻ (dân gian)",
            "4 số cuối chia 80, lấy phần dư",
            "80",
            "Hệ dùng trong bài này và trong công cụ trên site. Mỗi mục là một câu lời quẻ.",
          ],
          [
            "81 linh số",
            "4 số cuối chia 81, lấy phần dư",
            "81",
            "Bắt nguồn từ phái số học Nhật – Hoa, mỗi số kèm một lời luận riêng. Không phải Kinh Dịch.",
          ],
          [
            "64 quẻ Chu Dịch",
            "Tách thượng quái – hạ quái từ dãy số, có thể lấy thêm hào động",
            "64",
            "Hệ Kinh Dịch gốc. Cách tính phức tạp hơn, không dùng phép chia đơn giản.",
          ],
        ]}
        caption="Ba hệ thường bị gọi lẫn khi xem số điện thoại"
      />

      <p>
        Vì phần dư của phép chia 80 và phép chia 81 gần như luôn khác nhau, tra sai hệ sẽ ra một
        lời quẻ hoàn toàn khác. Nếu bạn đọc một bảng tra ở nơi khác, hãy kiểm tra bảng đó có bao
        nhiêu mục trước khi dùng: 80, 81 hay 64.
      </p>

      <p>
        Con số đáng chú ý: nhóm hung và đại hung chiếm khoảng một phần ba bảng. Điều đó có nghĩa
        nếu chỉ dùng quẻ để sàng, bạn sẽ gạt đi rất nhiều số vốn dễ nhớ và có giá tốt. Người xem
        có kinh nghiệm thường dùng quẻ như một lớp <em>xác nhận thêm</em>, sau khi đã lọc theo{" "}
        <Link href="/tin-tuc/sim-hop-menh-ngu-hanh">ngũ hành bản mệnh</Link> và{" "}
        <Link href="/tin-tuc/bat-cuc-linh-so-la-gi">Bát Cực Linh Số</Link>.
      </p>

      <h2 id="que-dai-cat">Các quẻ đại cát</h2>
      <p>
        Đây là {byLevel("Đại cát").length} quẻ được xếp mức cao nhất. Nếu bạn đang chọn giữa nhiều
        số cùng tầm giá, ưu tiên số có đuôi rơi vào các quẻ này là cách sàng nhanh:
      </p>

      <DataTable
        head={["Quẻ", "Lời quẻ"]}
        rows={byLevel("Đại cát").map((h) => [String(h.index), h.title])}
        caption="Nhóm quẻ đại cát trong bảng 80 quẻ"
      />

      <h2 id="que-dai-hung">Hai quẻ đại hung</h2>
      <p>
        Ngược lại, chỉ có hai quẻ bị xếp mức thấp nhất. Đây là nhóm mà người xem kỹ thường tránh:
      </p>

      <DataTable
        head={["Quẻ", "Lời quẻ"]}
        rows={byLevel("Đại hung").map((h) => [String(h.index), h.title])}
        caption="Nhóm quẻ đại hung trong bảng 80 quẻ"
      />

      <Note tone="info" title="Trình bày như một niềm tin dân gian">
        Bảng quẻ và các mức cát – hung ở đây là tri thức dân gian được lưu truyền, không phải kết
        luận khoa học. Hãy dùng nó để chọn giữa những số đã cùng tầm giá và cùng độ dễ nhớ, chứ
        không nên vì một lời quẻ mà trả thêm nhiều tiền, hoặc bỏ đi một số đang rất phù hợp với
        công việc của mình.
      </Note>

      <h2 id="bang-tra-80">Bảng tra trọn 80 quẻ</h2>
      <p>
        Bảng dưới đây là bảng đầy đủ mà công cụ chấm điểm trên chonsomobifone.com đang dùng. Cột
        &ldquo;Quẻ&rdquo; chính là phần dư bạn tính được ở bước hai.
      </p>

      <DataTable
        head={["Quẻ", "Lời quẻ", "Mức"]}
        rows={ALL.map((h) => [String(h.index), h.title, h.level])}
        caption="Bảng tra 80 quẻ dùng khi xem số điện thoại"
      />

      <h2 id="dung-the-nao">Dùng quẻ thế nào cho có ích</h2>
      <ul>
        <li>
          <strong>Sàng cuối, không sàng đầu.</strong> Lọc theo ngân sách, đầu số và độ dễ nhớ
          trước; đến khi còn vài số ngang nhau thì mới dùng quẻ để chọn.
        </li>
        <li>
          <strong>Không đổi cách tính để lấy kết quả đẹp.</strong> Nếu bốn số cuối cho quẻ hung mà
          bạn chuyển sang sáu số cuối chỉ để có quẻ cát, thì phép xem mất hết ý nghĩa.
        </li>
        <li>
          <strong>Ghi lại kết quả.</strong> Khi so nhiều số, hãy viết ra quẻ của từng số rồi mới
          quyết định — tra rồi nhớ nhẩm rất dễ lẫn.
        </li>
        <li>
          <strong>Kiểm tra phần thực tế trước khi trả tiền.</strong> Quẻ đẹp không thay được việc
          xác minh SIM còn hoạt động và sang tên được — xem{" "}
          <Link href="/tin-tuc/mua-sim-so-dep-o-dau-uy-tin">8 điều cần kiểm tra</Link>.
        </li>
      </ul>

      <p>
        Nếu bạn muốn bỏ qua phần tính tay: mở{" "}
        <Link href="/sim-phong-thuy">công cụ tìm SIM hợp tuổi</Link>, nhập năm sinh và giờ sinh,
        hệ thống sẽ chấm cả quẻ lẫn bốn lớp còn lại trên toàn bộ{" "}
        <Link href="/mua-sim-gia-re">kho SIM MobiFone</Link> đang còn hàng và xếp số phù hợp nhất
        lên đầu.
      </p>
    </ArticleShell>
  );
}
