import Link from "next/link";
import ArticleShell, { type FaqItem } from "@/components/blog/ArticleShell";
import { DataTable, KeyPoints, Note } from "@/components/blog/ArticleBits";
import ArticleSimTable from "@/components/blog/ArticleSimTable";
import { articleMetadata } from "@/lib/articleSeo";
import { getArticle } from "@/content/tinTucArticles";
import { nangLuongCuaCap, NL_META } from "@/lib/batCuc";
import { nguHanhCuaSo } from "@/lib/simHopTuoi";

const article = getArticle("y-nghia-2-so-cuoi-dien-thoai");
export const metadata = articleMetadata(article);

// Có bảng SIM thật đọc từ kho → ISR mỗi giờ.
export const revalidate = 3600;

/** Nghĩa đồng âm của từng chữ số theo cách đọc phổ biến ở Việt Nam. */
const DIGIT_GLOSS: Record<string, string> = {
  "0": "trọn vẹn",
  "1": "dẫn đầu",
  "2": "có đôi",
  "3": "tài",
  "4": "tứ",
  "5": "sinh",
  "6": "lộc",
  "7": "thất",
  "8": "phát",
  "9": "cửu",
};

/** Tên gọi thị trường của những cặp thật sự có tên riêng. */
const NAMED_PAIRS: Record<string, string> = {
  "68": "Lộc phát",
  "86": "Phát lộc",
  "39": "Thần tài nhỏ",
  "79": "Thần tài lớn",
  "38": "Ông địa nhỏ",
  "78": "Ông địa lớn",
  "88": "Phát phát",
  "99": "Trường cửu",
  "66": "Lộc lộc",
  "33": "Tài tài",
  "89": "Phát cửu",
  "98": "Cửu phát",
  "69": "Lộc cửu",
  "96": "Cửu lộc",
  "36": "Tam lộc",
  "63": "Lộc tài",
  "18": "Nhất phát",
  "28": "Mãi phát",
  "26": "Mãi lộc",
  "56": "Sinh lộc",
  "58": "Sinh phát",
  "49": "Tứ cửu — hay bị tránh",
  "53": "Hay bị tránh",
  "44": "Tứ tứ — hay bị tránh",
};

const PAIRS = Array.from({ length: 100 }, (_, i) => String(i).padStart(2, "0"));

const pairRows = PAIRS.map((pair) => {
  const nl = nangLuongCuaCap(pair);
  const meta = nl ? NL_META[nl] : null;
  const h1 = nguHanhCuaSo(pair[0]);
  const h2 = nguHanhCuaSo(pair[1]);
  const gloss = `${DIGIT_GLOSS[pair[0]]} – ${DIGIT_GLOSS[pair[1]]}`;
  return [
    pair,
    meta ? `${meta.label} (${meta.loai})` : "Trung tính",
    `${h1} – ${h2}`,
    NAMED_PAIRS[pair] ?? gloss,
  ];
});

const TOP_PAIRS = ["68", "86", "39", "79", "38", "78", "88", "99", "66", "89"];
const topRows = TOP_PAIRS.map((pair) => {
  const nl = nangLuongCuaCap(pair);
  const meta = nl ? NL_META[nl] : null;
  return [
    pair,
    NAMED_PAIRS[pair] ?? "—",
    meta ? `${meta.label} (${meta.loai})` : "Trung tính",
    meta?.yNghia.join(", ") ?? "—",
  ];
});

const faq: FaqItem[] = [
  {
    q: "Hai số cuối điện thoại có ý nghĩa gì?",
    a: "Có ba cách đọc phổ biến. Cách dân gian đọc theo đồng âm của từng chữ số, ví dụ 68 là lộc phát, 86 là phát lộc, 39 là thần tài nhỏ, 79 là thần tài lớn. Cách Bát Cực Linh Số xét cặp hai số thuộc năng lượng nào trong tám năng lượng. Cách ngũ hành xét hành của từng số so với mệnh người dùng. Bảng tra đủ 100 cặp từ 00 đến 99 có trong bài.",
  },
  {
    q: "Đuôi 68 và 86 khác nhau ra sao?",
    a: "Cả hai cùng thuộc năng lượng Thiên Y trong Bát Cực Linh Số, nên về mặt năng lượng được xem là như nhau. Khác biệt chỉ ở cách đọc dân gian: 68 đọc là lộc phát, 86 đọc là phát lộc. Trên thị trường, giá hai đuôi này thường tương đương nhau, phụ thuộc nhiều hơn vào đầu số và phần còn lại của dãy.",
  },
  {
    q: "Đuôi 49 và 53 có thật sự xấu không?",
    a: "Đây là niềm tin xuất phát từ câu nói dân gian về tuổi 49 và 53, không liên quan trực tiếp tới hệ thống ngũ hành hay Bát Cực. Xét theo Bát Cực Linh Số, cặp 49 thuộc Thiên Y — nhóm cát. Vì vậy đây là ví dụ rõ nhất cho việc hai hệ đánh giá có thể trái ngược, và người mua nên biết mình đang tin theo hệ nào.",
  },
  {
    q: "Cặp số nào không thuộc năng lượng nào?",
    a: "Mọi cặp có chứa số 0 hoặc số 5 đều được xem là trung tính trong Bát Cực Linh Số, vì bảng năng lượng chỉ dùng tám con số 1, 2, 3, 4, 6, 7, 8, 9. Số 5 nằm ở trung cung, còn số 0 không có trong Hà Đồ gốc.",
  },
  {
    q: "Hai số cuối có làm SIM đắt hơn không?",
    a: "Có, nhưng ít hơn nhiều so với dạng số tổng thể. Đuôi 68, 86, 39, 79 thường có mặt bằng giá cao hơn đuôi trung tính cùng đầu số. Tuy vậy yếu tố quyết định giá vẫn là bốn số cuối có lặp hay tiến, đầu số cổ hay đầu số mới, và toàn dãy có dễ đọc hay không.",
  },
  {
    q: "Nên chọn theo hai số cuối hay bốn số cuối?",
    a: "Bốn số cuối quan trọng hơn, vì đó là cụm người ta nhớ và đọc lại. Hai số cuối chỉ nên dùng để chọn giữa các số đã ngang nhau về bốn số cuối, giá và độ dễ nhớ.",
  },
];

export default function YNghia2SoCuoiPage() {
  return (
    <ArticleShell
      article={article}
      faq={faq}
      related={[
        "bat-cuc-linh-so-la-gi",
        "sim-hop-menh-ngu-hanh",
        "gia-sim-so-dep-mobifone",
      ]}
      lead={
        <p>
          Hai số cuối là phần người khác đọc lại nhiều nhất khi nhắc số của bạn, nên cũng là phần
          được gán ý nghĩa nhiều nhất. Vấn đề là mỗi nơi giải nghĩa một kiểu: nơi đọc theo đồng âm,
          nơi tra theo Bát Cực Linh Số, nơi xét ngũ hành. Bài này đặt cả ba cách cạnh nhau và có
          bảng tra trọn 100 cặp từ 00 đến 99.
        </p>
      }
    >
      <KeyPoints
        items={[
          <>
            Ba cách đọc hai số cuối: <strong>đồng âm dân gian</strong>,{" "}
            <strong>Bát Cực Linh Số</strong> (cặp số thuộc năng lượng nào), và{" "}
            <strong>ngũ hành</strong> (hành của số so với mệnh người dùng).
          </>,
          <>
            Cặp phổ biến nhất: <strong>68 · 86</strong> (lộc phát) thuộc Thiên Y và{" "}
            <strong>39</strong> (thần tài nhỏ) thuộc Sinh Khí — đều là năng lượng cát.
          </>,
          <>
            Nhưng <strong>79</strong> và <strong>38</strong> thì ngược: dân gian gọi là thần tài lớn
            và ông địa, còn Bát Cực Linh Số xếp vào <strong>nhóm hung</strong>.
          </>,
          <>
            Mọi cặp chứa <strong>số 0 hoặc số 5</strong> đều trung tính theo Bát Cực Linh Số.
          </>,
          <>
            Ba cách đọc có thể <strong>trái ngược nhau</strong> — trường hợp rõ nhất là cặp 49.
          </>,
          <>
            Bốn số cuối vẫn quan trọng hơn hai số cuối. Xem thêm{" "}
            <Link href="/tin-tuc/80-que-kinh-dich-trong-sim">cách tra quẻ theo bốn số cuối</Link>.
          </>,
        ]}
      />

      <h2 id="vi-sao-quan-trong">Vì sao hai số cuối được để ý nhất</h2>
      <p>
        Khi đọc số qua điện thoại, người ta thường đọc theo cụm và nhấn ở cụm cuối. Khi lưu danh
        bạ, hai số cuối là phần mắt dừng lại. Vì vậy hai số cuối gánh phần lớn giá trị
        &ldquo;nhận diện&rdquo; của một dãy số — và cũng vì vậy mà thị trường gán cho nó những tên
        gọi riêng như lộc phát, thần tài, ông địa.
      </p>
      <p>
        Điều đó không có nghĩa hai số cuối quan trọng nhất về mặt phong thuỷ. Trong cách chấm điểm
        thông dụng, bốn số cuối mới là cụm dùng để tra quẻ, còn toàn dãy mới quyết định phần ngũ
        hành. Hai số cuối là <em>tiêu chí chọn tinh</em>, không phải tiêu chí chọn thô.
      </p>

      <h2 id="ba-cach-doc">Ba cách đọc cùng một cặp số</h2>
      <p>Lấy cặp 68 làm ví dụ, ba hệ nói ba điều khác nhau và không mâu thuẫn:</p>
      <ul>
        <li>
          <strong>Đồng âm dân gian:</strong> 6 đọc gần &ldquo;lộc&rdquo;, 8 đọc gần
          &ldquo;phát&rdquo; — thành &ldquo;lộc phát&rdquo;.
        </li>
        <li>
          <strong>Bát Cực Linh Số:</strong> cặp 68 thuộc năng lượng Thiên Y, nhóm cát, gắn với tài
          lộc và sự an tâm.
        </li>
        <li>
          <strong>Ngũ hành:</strong> số 6 thuộc Kim, số 8 thuộc Thổ. Thổ sinh Kim, nên cặp này được
          xem là hài hoà, đặc biệt thuận với người mệnh Kim.
        </li>
      </ul>
      <p>
        Rắc rối chỉ xuất hiện khi ba hệ nói ngược nhau — và điều đó xảy ra thường hơn bạn tưởng.
        Cặp 49 bị dân gian tránh vì câu nói về tuổi 49, nhưng xét theo Bát Cực Linh Số thì 49 thuộc
        Thiên Y, cùng nhóm với 68. Không có cách hoà giải nào ngoài việc bạn tự chọn tin theo hệ
        nào, rồi dùng nhất quán.
      </p>

      <h2 id="top-10">Mười cặp được săn nhiều nhất</h2>

      <DataTable
        head={["Cặp", "Tên gọi thị trường", "Năng lượng Bát Cực", "Từ khoá năng lượng"]}
        rows={topRows}
        caption="Các cặp số cuối có tên gọi riêng và được tìm nhiều nhất"
      />

      <p>
        Bảng trên cho thấy ngay điều bất ngờ nhất của chủ đề này:{" "}
        <strong>tên gọi dân gian và năng lượng Bát Cực không luôn đi cùng nhau</strong>. Cặp 79 được
        gọi là thần tài lớn nhưng lại thuộc Ngũ Quỷ; cặp 38 gọi là ông địa nhỏ nhưng thuộc Lục Sát.
        Ngược lại, 78 — cặp ít được nhắc hơn — lại thuộc Diên Niên, một trong bốn năng lượng cát.
      </p>
      <p>
        Không hệ nào &ldquo;đúng&rdquo; hơn hệ nào; chúng ra đời từ hai truyền thống khác nhau. Điều
        nên làm là chọn hệ mình tin rồi dùng nhất quán. Nếu bạn theo cách đọc đồng âm dân gian, đuôi
        79 vẫn là số được thị trường săn đón và có giá; nếu bạn theo Bát Cực Linh Số, hãy xem toàn bộ
        các cặp trong dãy chứ không chỉ hai số cuối — cách làm có trong bài{" "}
        <Link href="/tin-tuc/bat-cuc-linh-so-la-gi">Bát Cực Linh Số</Link>.
      </p>

      <ArticleSimTable
        title="SIM MobiFone đang còn hàng, đuôi 68 · 86"
        filter={{ suffixes: ["68", "86"] }}
        limit={8}
        moreHref="/sim-loc-phat"
        moreLabel="Xem toàn bộ kho SIM lộc phát"
      />

      <ArticleSimTable
        title="SIM MobiFone đang còn hàng, đuôi 39 · 79"
        filter={{ suffixes: ["39", "79"] }}
        limit={8}
        moreHref="/sim-than-tai"
        moreLabel="Xem toàn bộ kho SIM thần tài"
      />

      <h2 id="bang-tra-100">Bảng tra trọn 100 cặp số cuối (00 – 99)</h2>
      <p>
        Cột &ldquo;Năng lượng&rdquo; lấy từ bảng 64 cặp của{" "}
        <Link href="/tin-tuc/bat-cuc-linh-so-la-gi">Bát Cực Linh Số</Link>; cột
        &ldquo;Ngũ hành&rdquo; theo Hà Đồ; cột cuối là tên gọi thị trường nếu cặp đó có tên riêng,
        còn lại là nghĩa ghép từ đồng âm của từng chữ số.
      </p>

      <DataTable
        head={["Cặp", "Năng lượng Bát Cực", "Ngũ hành 2 số", "Tên gọi / nghĩa ghép"]}
        rows={pairRows}
        caption="Bảng tra ý nghĩa 100 cặp số cuối theo ba hệ"
      />

      <Note tone="info" title="Đọc bảng này thế nào cho đúng">
        Bảng trên là công cụ đối chiếu, không phải phán quyết. Một cặp &ldquo;hung&rdquo; nằm ở hai
        số cuối của một dãy mà toàn bộ phần còn lại đều thuận thì thường không bị coi là vấn đề.
        Ngược lại, một cặp cát cũng không cứu được dãy số khó đọc, khó nhớ.
      </Note>

      <h2 id="cap-bi-tranh">Những cặp hay bị tránh — và góc nhìn ngược lại</h2>
      <p>
        Ba nhóm thường bị bỏ qua trên thị trường Việt Nam: cặp chứa số 4 (đồng âm với
        &ldquo;tử&rdquo;), cặp 49 và 53 (do câu nói dân gian về tuổi), và cặp 07 hoặc 17 (bị một số
        nơi gán nghĩa không thuận).
      </p>
      <p>Hai điều đáng biết trước khi loại chúng:</p>
      <ul>
        <li>
          <strong>Giá thường mềm hơn.</strong> Vì bị nhiều người tránh, số có đuôi này thường rẻ
          hơn đáng kể so với số cùng đầu số, cùng độ dễ nhớ. Người thực dụng coi đây là cơ hội.
        </li>
        <li>
          <strong>Các hệ phong thuỷ không đồng thuận.</strong> Như đã nói ở trên, 49 thuộc nhóm cát
          theo Bát Cực. Nếu bạn xem số theo hệ này thì lý do tránh 49 không còn đứng vững.
        </li>
      </ul>

      <h2 id="anh-huong-gia">Hai số cuối ảnh hưởng giá tới đâu</h2>
      <p>
        Trên kho SIM MobiFone thực tế, thứ tự ảnh hưởng tới giá thường là: dạng số của bốn số cuối
        (lặp, tiến, gánh) &gt; đầu số &gt; độ liền mạch của toàn dãy &gt; hai số cuối. Nói cách
        khác, đuôi 68 giúp một số dễ bán hơn, nhưng không biến một số khó nhớ thành số đắt. Khoảng
        giá tham khảo cho từng dòng số nằm trong bài{" "}
        <Link href="/tin-tuc/gia-sim-so-dep-mobifone">giá SIM số đẹp MobiFone</Link>.
      </p>

      <h2 id="cach-dung">Cách dùng bảng khi đang chọn số</h2>
      <ol>
        <li>
          <strong>Lọc theo ngân sách và đầu số trước.</strong> Đây là hai điều kiện cứng, không
          thương lượng được.
        </li>
        <li>
          <strong>Xem bốn số cuối.</strong> Ưu tiên cụm dễ đọc: lặp, tiến, hoặc có nhịp.
        </li>
        <li>
          <strong>Đến lúc còn vài số ngang nhau</strong> thì mở bảng 100 cặp ở trên để chọn hai số
          cuối theo hệ bạn tin.
        </li>
        <li>
          <strong>Kiểm tra phần thực tế.</strong> Số đẹp mà không sang tên được thì vô nghĩa — xem{" "}
          <Link href="/tin-tuc/mua-sim-so-dep-o-dau-uy-tin">8 điều cần kiểm tra trước khi trả tiền</Link>.
        </li>
      </ol>
      <p>
        Nếu muốn máy làm hộ toàn bộ việc đối chiếu, công cụ{" "}
        <Link href="/sim-phong-thuy">tìm SIM hợp tuổi</Link> chấm sẵn cả ba hệ trên toàn bộ{" "}
        <Link href="/mua-sim-gia-re">kho SIM MobiFone</Link> đang còn hàng.
      </p>
    </ArticleShell>
  );
}
