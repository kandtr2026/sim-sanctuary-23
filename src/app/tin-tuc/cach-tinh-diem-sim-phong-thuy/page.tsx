import Link from "next/link";
import ArticleShell, { type FaqItem } from "@/components/blog/ArticleShell";
import { DataTable, KeyPoints, Note } from "@/components/blog/ArticleBits";
import { articleMetadata } from "@/lib/articleSeo";
import { getArticle } from "@/content/tinTucArticles";
import { buildProfile, scoreSim } from "@/lib/simHopTuoi";
import { analyzeDigits, detectNetwork, detectSimTags, formatSIMNumber, type NormalizedSIM } from "@/lib/simUtils";

const article = getArticle("cach-tinh-diem-sim-phong-thuy");
export const metadata = articleMetadata(article);

/**
 * Ví dụ chấm điểm trong bài được tính BẰNG CHÍNH engine của site
 * (`scoreSim` trong src/lib/simHopTuoi.ts) chứ không gõ tay, nên con số in ra
 * luôn khớp với kết quả khách thấy ở /sim-phong-thuy. Nếu trọng số trong engine
 * đổi, bảng ví dụ tự đổi theo.
 */
const EXAMPLE_DIGITS = "0901234568";
const EXAMPLE_YEAR = 1990;

const makeSim = (digits: string): NormalizedSIM => {
  const { digitCounts, sumDigits } = analyzeDigits(digits);
  const tags = detectSimTags(digits);
  return {
    id: "vi-du",
    rawDigits: digits,
    displayNumber: formatSIMNumber(digits),
    formattedNumber: formatSIMNumber(digits),
    price: 0,
    prefix3: digits.slice(0, 3),
    prefix4: digits.slice(0, 4),
    last2: digits.slice(-2),
    last3: digits.slice(-3),
    last4: digits.slice(-4),
    last5: digits.slice(-5),
    last6: digits.slice(-6),
    digitCounts,
    sumDigits,
    tags,
    isVIP: false,
    network: detectNetwork(digits),
    beautyScore: 0,
  };
};

// Giờ Ngọ (index 6), giới tính nam — chỉ để ví dụ có đủ dữ liệu đầu vào.
const exampleProfile = buildProfile(EXAMPLE_YEAR, 6, "nam");
const exampleScore = scoreSim(makeSim(EXAMPLE_DIGITS), exampleProfile);

const PILLARS: { name: string; weight: string; what: string }[] = [
  {
    name: "Ngũ hành bản mệnh",
    weight: "40%",
    what: "Từng chữ số thuộc hành nào, hành đó sinh hay khắc mệnh của người dùng",
  },
  {
    name: "Âm dương & cung phi",
    weight: "20%",
    what: "Tỉ lệ số chẵn – số lẻ trong dãy, đối chiếu với cung phi và giờ sinh",
  },
  {
    name: "Quẻ Kinh Dịch",
    weight: "20%",
    what: "Bốn số cuối chia 80, phần dư tra ra quẻ và mức cát – hung",
  },
  {
    name: "Tổng nút",
    weight: "15%",
    what: "Tổng tất cả chữ số, lấy phần dư khi chia 10",
  },
  {
    name: "Cấu trúc & cặp cát",
    weight: "5%",
    what: "Đuôi lặp (tam hoa, tứ quý), số tiến, các cặp 68/86/39/79/38/78",
  },
];

const NUT_SCORES: [string, string, string][] = [
  ["9", "10/10", "Cao nhất — thường được gọi là số đại cát"],
  ["8", "9/10", "Rất tốt, gắn với ý nghĩa phát đạt"],
  ["7", "8/10", "Tốt — mốc từ 7 trở lên được xem là ngưỡng đẹp"],
  ["6", "6/10", "Trung bình khá"],
  ["5", "5/10", "Trung bình"],
  ["0 – 4", "2 – 2,4/10", "Thấp; nút 0 bị coi là kém nhất"],
];

const faq: FaqItem[] = [
  {
    q: "Tổng nút của SIM là gì và tính thế nào?",
    a: "Tổng nút là tổng tất cả chữ số trong dãy, sau đó lấy phần dư khi chia cho 10. Ví dụ 0901234568 có tổng các chữ số là 38, nút bằng 8. Theo quan niệm dân gian, nút từ 7 trở lên được xem là tốt, nút 9 là cao nhất.",
  },
  {
    q: "Sim đại cát là sim như thế nào?",
    a: "Không có định nghĩa thống nhất. Cách hiểu phổ biến nhất là sim có tổng nút cao (thường là 9, đôi khi tính cả 8) và bốn số cuối rơi vào nhóm quẻ đại cát khi chia 80. Một số nơi còn đòi thêm điều kiện dãy số hợp mệnh người dùng, nên cùng một số có thể là đại cát với người này mà không với người khác.",
  },
  {
    q: "Vì sao cùng một số mà mỗi trang chấm một điểm khác nhau?",
    a: "Vì trọng số mỗi nơi đặt khác nhau. Có nơi cho ngũ hành 40%, có nơi chỉ tính quẻ và tổng nút. Ngoài ra bảng quy số về ngũ hành cũng tồn tại hai hệ khác nhau. Điểm số vì thế chỉ có ý nghĩa khi so các số với nhau trong CÙNG một hệ, không nên so điểm giữa hai website.",
  },
  {
    q: "Điểm bao nhiêu thì gọi là hợp?",
    a: "Trên thang 10, từ khoảng 7 điểm trở lên thường được xem là hợp, 8 trở lên là tốt. Nhưng quan trọng hơn con số tổng là xem điểm bị trừ ở trụ nào: một số bị trừ nặng ở ngũ hành sẽ khác hẳn một số chỉ bị trừ ở phần cấu trúc.",
  },
  {
    q: "Cần biết giờ sinh mới chấm được điểm không?",
    a: "Bốn trong năm trụ không cần giờ sinh: ngũ hành bản mệnh chỉ cần năm sinh, còn quẻ, tổng nút và cấu trúc chỉ cần dãy số. Giờ sinh chỉ tham gia vào trụ âm dương – cung phi. Không nhớ giờ sinh thì kết quả vẫn dùng được, chỉ là trụ đó kém chính xác hơn.",
  },
  {
    q: "Có nên chọn số chỉ vì điểm cao?",
    a: "Không nên. Điểm phong thuỷ là niềm tin dân gian, còn giá trị thực dụng của một số nằm ở chỗ dễ nhớ, dễ đọc qua điện thoại và phù hợp ngân sách. Cách dùng hợp lý là lọc theo ngân sách và độ dễ nhớ trước, rồi dùng điểm để chọn giữa các số đã ngang nhau.",
  },
];

export default function CachTinhDiemSimPage() {
  return (
    <ArticleShell
      article={article}
      faq={faq}
      related={[
        "sim-hop-menh-ngu-hanh",
        "80-que-kinh-dich-trong-sim",
        "bat-cuc-linh-so-la-gi",
      ]}
      lead={
        <p>
          Tra cùng một số trên ba website xem sim, bạn sẽ nhận ba điểm số khác nhau. Đó không hẳn
          là chuyện trang nào sai — mà vì mỗi nơi cân trọng số theo cách riêng và không ai nói rõ
          công thức. Bài này mở hết phần bên trong: năm trụ cột được tính thế nào, mỗi trụ nặng bao
          nhiêu phần trăm, và cách bạn tự kiểm lại bằng giấy bút.
        </p>
      }
    >
      <KeyPoints
        items={[
          <>
            Điểm phong thuỷ SIM trên chonsomobifone.com được cộng từ{" "}
            <strong>5 trụ cột</strong>: ngũ hành 40%, âm dương 20%, quẻ Kinh Dịch 20%, tổng nút
            15%, cấu trúc số 5%.
          </>,
          <>
            <strong>Tổng nút</strong> = tổng các chữ số, lấy phần dư khi chia 10. Từ 7 trở lên được
            xem là tốt.
          </>,
          <>
            <strong>Quẻ</strong> = bốn số cuối chia 80, lấy phần dư.
          </>,
          <>
            Đừng so điểm giữa hai website khác nhau — trọng số và bảng quy số của họ không giống nhau.
          </>,
          <>
            Muốn có điểm cho một số cụ thể ngay: dùng{" "}
            <Link href="/sim-phong-thuy">công cụ tìm SIM hợp tuổi</Link> hoặc{" "}
            <Link href="/dinh-gia-sim">định giá SIM</Link>.
          </>,
        ]}
      />

      <h2 id="nam-tru-cot">Năm trụ cột và trọng số</h2>
      <p>
        Một điểm số phong thuỷ chỉ đáng tin khi bạn biết nó được cộng từ đâu. Đây là cấu trúc điểm
        mà công cụ trên site đang dùng, viết ra đầy đủ:
      </p>

      <DataTable
        head={["Trụ cột", "Trọng số", "Xét điều gì"]}
        rows={PILLARS.map((p) => [p.name, p.weight, p.what])}
        caption="Cấu trúc điểm phong thuỷ SIM — tổng 100%, thang điểm 0–10"
      />

      <p>
        Ngũ hành chiếm phần lớn nhất vì đây là trụ duy nhất phụ thuộc vào <em>người dùng</em>: cùng
        một số có thể rất hợp với người mệnh Thổ và kém hợp với người mệnh Mộc. Bốn trụ còn lại chỉ
        xét bản thân dãy số nên giống nhau với mọi người.
      </p>

      <h2 id="tru-ngu-hanh">Trụ 1 — Ngũ hành bản mệnh (40%)</h2>
      <p>
        Mỗi chữ số được quy về một hành, rồi so với mệnh của người dùng. Thứ tự cộng – trừ điểm
        theo mức độ thuận:
      </p>
      <ul>
        <li>
          <strong>Số sinh mệnh</strong> (ví dụ số Hỏa với người mệnh Thổ): cộng nhiều nhất.
        </li>
        <li>
          <strong>Số đồng hành</strong> với mệnh: cộng vừa.
        </li>
        <li>
          <strong>Số trung tính hoặc bị mệnh khắc</strong>: trừ nhẹ.
        </li>
        <li>
          <strong>Số khắc mệnh</strong> (số Mộc với người mệnh Thổ): trừ nặng nhất.
        </li>
      </ul>
      <p>
        Điểm của trụ này là <em>trung bình</em> trên toàn bộ mười chữ số, nên một hai số không
        thuận không kéo sập cả dãy — nhưng nửa dãy toàn số khắc mệnh thì có. Bảng quy số về ngũ
        hành và cách tra mệnh theo năm sinh nằm trong bài{" "}
        <Link href="/tin-tuc/sim-hop-menh-ngu-hanh">chọn SIM hợp mệnh theo ngũ hành</Link>.
      </p>

      <h2 id="tru-am-duong">Trụ 2 — Âm dương và cung phi (20%)</h2>
      <p>
        Số chẵn được xem là Âm, số lẻ là Dương. Trụ này không thưởng cho dãy &ldquo;nhiều số
        chẵn&rdquo; hay &ldquo;nhiều số lẻ&rdquo;, mà thưởng cho <strong>sự bù trừ</strong>: người
        có cung phi thiên Dương thì dãy số nghiêng Âm được cộng điểm, và ngược lại. Giờ sinh tham
        gia điều chỉnh thêm mức nghiêng đó.
      </p>
      <p>
        Hệ quả thực tế: một dãy 5 chẵn – 5 lẻ hầu như luôn được điểm khá cho mọi người, còn dãy
        toàn chẵn hoặc toàn lẻ thì chỉ hợp với một nhóm người nhất định.
      </p>

      <h2 id="tru-tong-nut">Trụ 3 — Tổng nút (15%)</h2>
      <p>Cách tính gồm hai bước, làm nhẩm được:</p>
      <ol>
        <li>Cộng tất cả mười chữ số của SIM.</li>
        <li>Lấy phần dư khi chia cho 10 — đó là nút.</li>
      </ol>
      <p>
        Ví dụ với {formatSIMNumber(EXAMPLE_DIGITS)}: tổng các chữ số là{" "}
        {analyzeDigits(EXAMPLE_DIGITS).sumDigits}, nút bằng {exampleScore.nut}.
      </p>

      <DataTable
        head={["Nút", "Điểm trụ này", "Cách hiểu thường gặp"]}
        rows={NUT_SCORES.map((r) => [r[0], r[1], r[2]])}
        caption="Thang điểm theo tổng nút"
      />

      <Note tone="tip" title="&ldquo;Sim đại cát&rdquo; nghĩa là gì">
        Cụm &ldquo;sim đại cát&rdquo; hay được dùng cho số có tổng nút cao — thường là nút 9, đôi
        khi tính cả nút 8 — và bốn số cuối rơi vào nhóm quẻ đại cát. Vì không có định nghĩa thống
        nhất, hãy hỏi rõ người bán họ dựa vào tiêu chí nào khi gọi một số là đại cát.
      </Note>

      <h2 id="tru-que">Trụ 4 — Quẻ Kinh Dịch (20%)</h2>
      <p>
        Lấy bốn số cuối chia 80, phần dư là số quẻ; dư 0 thì tính là quẻ 80. Mỗi quẻ có một mức từ
        đại cát đến đại hung, và mức đó quy thành điểm:
      </p>

      <DataTable
        head={["Mức quẻ", "Điểm trụ này"]}
        rows={[
          ["Đại cát", "10/10"],
          ["Cát", "8/10"],
          ["Bình thường", "5/10"],
          ["Hung", "3/10"],
          ["Đại hung", "1/10"],
        ]}
        caption="Quy đổi mức quẻ thành điểm"
      />

      <p>
        Bảng tra trọn 80 quẻ, cùng cách phân biệt hệ 80 quẻ với hệ 81 linh số và 64 quẻ Chu Dịch,
        nằm trong bài <Link href="/tin-tuc/80-que-kinh-dich-trong-sim">80 quẻ Kinh Dịch trong SIM</Link>.
      </p>

      <h2 id="tru-cau-truc">Trụ 5 — Cấu trúc số và cặp cát (5%)</h2>
      <p>
        Trụ nhẹ nhất, nhưng là trụ gần với thị trường nhất — nó thưởng đúng những thứ khiến một số
        dễ nhớ và có giá:
      </p>
      <ul>
        <li>Đuôi lặp ba số (tam hoa) hoặc bốn số (tứ quý).</li>
        <li>Đuôi số tiến liền mạch: 0123, 1234, … 6789.</li>
        <li>Cặp cát ở đuôi: 68 và 86 (lộc phát), 39 và 79 (thần tài), 38 và 78 (ông địa).</li>
      </ul>
      <p>
        Vì chỉ chiếm 5%, trụ này không đủ để cứu một số bị trừ nặng ở ngũ hành — nhưng nó thường là
        thứ quyết định giá bán, nên đừng bỏ qua khi cân ngân sách.
      </p>

      <h2 id="bat-cuc">Bát Cực Linh Số — lớp lọc tính riêng</h2>
      <p>
        Ngoài năm trụ trên, công cụ còn tính riêng phần{" "}
        <Link href="/tin-tuc/bat-cuc-linh-so-la-gi">Bát Cực Linh Số</Link> và <em>không</em> cộng nó
        vào điểm tổng. Lý do: Bát Cực đọc quan hệ từng cặp số, phù hợp làm <strong>bộ lọc</strong>
        {" "}(&ldquo;phải có Thiên Y&rdquo;, &ldquo;loại Tuyệt Mệnh&rdquo;) hơn là làm một con số
        cộng gộp. Trộn nó vào điểm tổng sẽ làm loãng cả hai.
      </p>

      <h2 id="vi-du">Ví dụ chấm điểm một số cụ thể</h2>
      <p>
        Dưới đây là kết quả chấm số {formatSIMNumber(EXAMPLE_DIGITS)} cho người sinh năm{" "}
        {EXAMPLE_YEAR} ({exampleProfile.thienCan} {exampleProfile.diaChi}, nạp âm{" "}
        {exampleProfile.napAm}, mệnh {exampleProfile.menh}), giờ{" "}
        {exampleProfile.gioLabel.split(" ")[0]}, nam. Các con số này do chính công cụ trên site tính
        ra, không phải ví dụ minh hoạ:
      </p>

      <DataTable
        head={["Trụ cột", "Điểm", "Chi tiết"]}
        rows={[
          ["Ngũ hành bản mệnh", `${exampleScore.nguHanhScore}/10`, `Mệnh ${exampleProfile.menh}`],
          ["Âm dương & cung phi", `${exampleScore.amDuongScore}/10`, `Cung phi ${exampleProfile.cungPhi.amDuong}`],
          ["Quẻ Kinh Dịch", `${exampleScore.queScore}/10`, `Quẻ ${exampleScore.que} — ${exampleScore.hexagramLevel}`],
          ["Tổng nút", `${exampleScore.nutScore}/10`, `Nút ${exampleScore.nut}`],
          ["Cấu trúc & cặp cát", `${exampleScore.phuScore}/10`, "Đuôi không lặp, không cặp cát"],
          ["Điểm tổng", `${exampleScore.score}/10`, "Đã áp trọng số 40/20/20/15/5"],
        ]}
        caption={`Kết quả chấm ${formatSIMNumber(EXAMPLE_DIGITS)} cho hồ sơ ví dụ`}
      />

      <p>
        Lời quẻ của bốn số cuối: <em>{exampleScore.hexagram}</em>. Đọc bảng này bạn thấy ngay giá
        trị của việc bóc tách theo trụ: điểm tổng chỉ nói &ldquo;khá&rdquo; hay
        &ldquo;kém&rdquo;, còn từng trụ mới cho biết nên đổi số hay giữ.
      </p>

      <h2 id="ba-cach-sai">Ba cách chấm điểm sai thường gặp</h2>
      <ul>
        <li>
          <strong>Chấm điểm mà bỏ qua người dùng.</strong> Nếu một trang cho điểm một số mà không
          hỏi năm sinh của bạn, thì trụ chiếm 40% đã bị bỏ trống. Điểm đó chỉ đo độ đẹp của dãy số,
          không đo độ hợp.
        </li>
        <li>
          <strong>Đổi bảng quy số giữa đường.</strong> Có hai hệ quy số về ngũ hành đang được dùng
          song song. Dùng hệ A để tính rồi tra ý nghĩa theo hệ B thì kết quả vô nghĩa.
        </li>
        <li>
          <strong>So điểm giữa hai website.</strong> Điểm 9,2 ở nơi này có thể tương đương 7,5 ở
          nơi khác vì trọng số khác nhau. Chỉ so các số <em>trong cùng một hệ</em>.
        </li>
      </ul>

      <Note tone="info" title="Nhắc lại về bản chất">
        Toàn bộ hệ thống điểm này dựa trên tri thức dân gian, không phải kết luận khoa học, và
        không phải lời khuyên tài chính. Hãy dùng nó như một tiêu chí phụ để chọn giữa những số đã
        cùng tầm giá.
      </Note>

      <h2 id="lam-gi-tiep">Làm gì tiếp</h2>
      <ul>
        <li>
          Có số muốn kiểm: mở <Link href="/sim-phong-thuy">tìm SIM hợp tuổi</Link>, nhập năm sinh và
          giờ sinh để xem điểm theo từng trụ.
        </li>
        <li>
          Muốn biết một số đang ở khoảng giá nào:{" "}
          <Link href="/dinh-gia-sim">định giá SIM</Link>.
        </li>
        <li>
          Chỉ muốn lọc nhanh theo mệnh:{" "}
          <Link href="/sim-phong-thuy-hop-menh">chọn SIM theo mệnh</Link>.
        </li>
        <li>
          Xem giá từng dòng số trước khi quyết ngân sách:{" "}
          <Link href="/tin-tuc/gia-sim-so-dep-mobifone">giá SIM số đẹp MobiFone</Link>.
        </li>
      </ul>
    </ArticleShell>
  );
}
