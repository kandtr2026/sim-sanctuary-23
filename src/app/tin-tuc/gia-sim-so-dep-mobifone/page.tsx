import Link from "next/link";
import ArticleShell, { type FaqItem } from "@/components/blog/ArticleShell";
import { DataTable, KeyPoints, Note } from "@/components/blog/ArticleBits";
import ArticleSimTable from "@/components/blog/ArticleSimTable";
import { articleMetadata } from "@/lib/articleSeo";
import { getArticle } from "@/content/tinTucArticles";
import { getServerSims } from "@/lib/serverSimData";
import type { NormalizedSIM } from "@/lib/simUtils";

const article = getArticle("gia-sim-so-dep-mobifone");
export const metadata = articleMetadata(article);

// Bảng giá đọc từ kho thật → ISR mỗi giờ. Không để trang đóng băng ở giá lúc build.
export const revalidate = 3600;

const vnd = new Intl.NumberFormat("vi-VN");

/** Rút gọn giá về dạng người Việt đọc nhanh: 1.250.000 → "1,25 triệu". */
const shortPrice = (price: number): string => {
  if (price >= 1_000_000_000) return `${(price / 1_000_000_000).toFixed(1).replace(".", ",")} tỷ`;
  if (price >= 1_000_000) {
    const millions = price / 1_000_000;
    const text = millions >= 100 ? millions.toFixed(0) : millions.toFixed(1);
    return `${text.replace(".", ",").replace(",0", "")} triệu`;
  }
  return `${vnd.format(price)} đ`;
};

const median = (sorted: number[]): number =>
  sorted.length % 2 === 1
    ? sorted[(sorted.length - 1) / 2]
    : Math.round((sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2);

interface Bucket {
  label: string;
  note: string;
  prices: number[];
}

/**
 * Thống kê giá THẬT từ kho của site, nhóm theo dòng số và theo đầu số.
 *
 * Vì sao tự tính thay vì gõ bảng giá tay: bảng giá gõ tay sẽ lệch ngay tuần sau
 * và không ai nhớ cập nhật. Ở đây trang đọc kho lúc render (ISR 1 giờ) nên số
 * liệu luôn là giá đang niêm yết. Nếu kho đọc lỗi → mảng rỗng → bài tự ẩn bảng
 * và vẫn còn phần phân tích yếu tố định giá.
 */
const buildBuckets = (sims: NormalizedSIM[]) => {
  const withPrice = sims.filter((s) => s.price > 0);

  const byTag = (tag: string): number[] =>
    withPrice.filter((s) => s.tags?.includes(tag)).map((s) => s.price);

  const tagBuckets: Bucket[] = [
    { label: "Lục quý (6 số giống nhau)", note: "Hiếm nhất, gần như hàng sưu tầm", prices: byTag("Lục quý") },
    { label: "Ngũ quý (5 số giống nhau)", note: "Dòng đỉnh, thanh khoản tốt", prices: byTag("Ngũ quý") },
    { label: "Tứ quý (4 số cuối giống nhau)", note: "Dòng được săn nhiều nhất", prices: byTag("Tứ quý") },
    { label: "Tam hoa kép", note: "Hai bộ ba số giống nhau", prices: byTag("Tam hoa kép") },
    { label: "Tam hoa (3 số cuối giống nhau)", note: "Dễ nhớ, tầm giá vừa", prices: byTag("Tam hoa") },
    { label: "Tiến lên (…3456, …6789)", note: "Dãy số tăng liền mạch", prices: byTag("Tiến lên") },
    { label: "Gánh đảo (…ABBA)", note: "Đối xứng, dễ đọc", prices: byTag("Gánh đảo") },
    { label: "Lộc phát (đuôi 68 · 86)", note: "Nhóm phong thuỷ phổ biến nhất", prices: byTag("Lộc phát") },
    { label: "Thần tài (đuôi 39 · 79)", note: "Được giới kinh doanh ưa chuộng", prices: byTag("Thần tài") },
    { label: "Ông địa (đuôi 38 · 78)", note: "Giá thường mềm hơn thần tài", prices: byTag("Ông địa") },
    { label: "Năm sinh", note: "Giá phụ thuộc năm cụ thể", prices: byTag("Năm sinh") },
  ];

  const prefixBuckets: Bucket[] = ["090", "093", "089", "070", "076", "077", "078", "079"].map(
    (prefix) => ({
      label: `Đầu số ${prefix}`,
      note: ["090", "093"].includes(prefix) ? "Đầu số cổ" : "Đầu số 10 số phát hành sau",
      prices: withPrice.filter((s) => s.rawDigits.startsWith(prefix)).map((s) => s.price),
    }),
  );

  const toRows = (buckets: Bucket[]) =>
    buckets
      .filter((b) => b.prices.length >= 3)
      .map((b) => {
        const sorted = [...b.prices].sort((a, b2) => a - b2);
        return [
          b.label,
          String(sorted.length),
          shortPrice(sorted[0]),
          shortPrice(median(sorted)),
          shortPrice(sorted[sorted.length - 1]),
          b.note,
        ];
      });

  return {
    total: withPrice.length,
    tagRows: toRows(tagBuckets),
    prefixRows: toRows(prefixBuckets),
  };
};

const FACTORS: [string, string][] = [
  [
    "Dạng số của 4 số cuối",
    "Yếu tố nặng nhất. Lặp (tứ quý, tam hoa) và tiến liền mạch luôn đắt hơn dãy rời rạc, kể cả khi các số khác giống nhau.",
  ],
  [
    "Đầu số",
    "Đầu số cổ 090 và 093 giữ giá cao hơn 07x cùng dạng đuôi, vì gắn với thời điểm hoà mạng sớm và tâm lý người dùng lâu năm.",
  ],
  [
    "Độ liền mạch của toàn dãy",
    "Số đọc một hơi là nhớ được sẽ đắt hơn số phải chia nhịp lạ, dù cùng đuôi.",
  ],
  [
    "Con số cụ thể trong bộ lặp",
    "Tứ quý 8888 và 9999 đắt hơn hẳn tứ quý 2222 hay 4444 — cùng dạng nhưng khác nhau nhiều lần về giá.",
  ],
  [
    "Hai số cuối",
    "68, 86, 39, 79 nâng giá nhẹ so với đuôi trung tính; đuôi bị tránh (49, 53, số 4) thường mềm giá.",
  ],
  [
    "Nguồn gốc và tình trạng SIM",
    "SIM còn nguyên, sang tên chính chủ được luôn có giá cao hơn SIM ràng buộc gói cam kết hoặc chưa rõ tình trạng.",
  ],
];

const faq: FaqItem[] = [
  {
    q: "SIM số đẹp MobiFone giá bao nhiêu?",
    a: "Khoảng giá rất rộng: từ vài trăm nghìn cho SIM dễ nhớ đầu số 07x, tới hàng trăm triệu cho tứ quý và ngũ quý đầu số cổ. Bảng trong bài này lấy trực tiếp giá đang niêm yết trong kho của chonsomobifone.com, có cả giá thấp nhất, trung vị và cao nhất theo từng dòng số.",
  },
  {
    q: "Vì sao hai SIM cùng là tứ quý mà giá lệch nhau nhiều lần?",
    a: "Vì con số lặp là số nào, và đầu số là gì. Tứ quý 8888 hoặc 9999 đầu số cổ 090 thuộc nhóm cao nhất, còn tứ quý 2222 hoặc 4444 đầu số 07x nằm ở nhóm thấp nhất trong cùng dạng. Phần đầu dãy có dễ đọc hay không cũng tác động đáng kể.",
  },
  {
    q: "Đầu số cổ 090, 093 đắt hơn 07x bao nhiêu?",
    a: "Không có tỉ lệ cố định, nhưng cùng dạng đuôi thì đầu số cổ thường cao hơn rõ rệt. Bảng giá theo đầu số trong bài cho thấy khoảng giá thực tế của từng đầu số trong kho hiện tại để bạn tự so.",
  },
  {
    q: "Có nên mua SIM số đẹp trả góp?",
    a: "Trả góp phù hợp khi bạn cần một số cụ thể cho công việc và không muốn dồn tiền một lần. Cần đọc kỹ điều kiện, kỳ hạn và tổng số tiền phải trả trước khi ký. Thông tin về hình thức này xem tại trang sim trả góp trên site.",
  },
  {
    q: "Giá trong bài có phải giá thị trường chung không?",
    a: "Không. Đây là giá đang niêm yết trong kho của chonsomobifone.com tại thời điểm trang được tạo lại, dùng để tham khảo mặt bằng. Mỗi nơi bán có tệp hàng khác nhau nên giá có thể khác.",
  },
  {
    q: "Làm sao biết một số cụ thể có bị hét giá không?",
    a: "Cách nhanh nhất là so với các số cùng dạng, cùng đầu số trong bảng ở trên, hoặc dùng công cụ định giá SIM trên site để xem khoảng giá tham khảo cho chính dãy số đó.",
  },
];

export default async function GiaSimSoDepPage() {
  const sims = await getServerSims();
  const { total, tagRows, prefixRows } = buildBuckets(sims);

  return (
    <ArticleShell
      article={article}
      faq={faq}
      related={[
        "mua-sim-so-dep-o-dau-uy-tin",
        "y-nghia-2-so-cuoi-dien-thoai",
        "cach-tranh-mat-tien-oan-khi-mua-sim-so-dep",
      ]}
      lead={
        <p>
          Câu hỏi &ldquo;SIM này bao nhiêu&rdquo; không có một đáp án, vì giá SIM số đẹp phụ thuộc
          vào sáu yếu tố khác nhau và chúng nhân lên với nhau. Bài này mổ xẻ từng yếu tố, kèm bảng
          khoảng giá <strong>lấy trực tiếp từ kho hàng thật</strong> — thấp nhất, trung vị và cao
          nhất theo từng dòng số, để bạn có mặt bằng mà so.
        </p>
      }
    >
      <KeyPoints
        items={[
          <>
            Thứ tự ảnh hưởng tới giá: <strong>dạng 4 số cuối</strong> &gt; <strong>đầu số</strong>{" "}
            &gt; độ liền mạch toàn dãy &gt; con số cụ thể trong bộ lặp &gt; hai số cuối.
          </>,
          <>
            Cùng một dạng số, <strong>đầu số cổ 090 · 093</strong> luôn ở mặt bằng cao hơn 07x.
          </>,
          <>
            Tứ quý <strong>8888 · 9999</strong> đắt hơn nhiều lần tứ quý 2222 · 4444 — cùng dạng
            không có nghĩa cùng giá.
          </>,
          <>
            Bảng giá dưới đây là giá <strong>đang niêm yết trong kho</strong>, không phải giá thị
            trường chung.
          </>,
          <>
            Có số muốn kiểm giá: dùng <Link href="/dinh-gia-sim">công cụ định giá SIM</Link>.
          </>,
        ]}
      />

      <h2 id="sau-yeu-to">Sáu yếu tố quyết định giá một SIM</h2>
      <p>
        Người mới thường nghĩ giá SIM do &ldquo;đẹp&rdquo; quyết định, nhưng &ldquo;đẹp&rdquo; là
        tổng của nhiều tiêu chí đo được. Xếp theo mức ảnh hưởng từ mạnh đến nhẹ:
      </p>

      <DataTable
        head={["Yếu tố", "Ảnh hưởng thế nào"]}
        rows={FACTORS.map(([k, v]) => [k, v])}
        caption="Sáu yếu tố định giá SIM số đẹp, xếp theo mức ảnh hưởng"
      />

      {tagRows.length > 0 ? (
        <>
          <h2 id="bang-gia-theo-dong">Khoảng giá theo từng dòng số</h2>
          <p>
            Số liệu dưới đây tính từ {vnd.format(total)} SIM đang có giá niêm yết trong kho. Cột
            &ldquo;Trung vị&rdquo; đáng tin hơn giá trung bình, vì một vài số cực đắt không kéo lệch
            được nó — đây chính là mức bạn nên dùng làm mốc tham khảo.
          </p>

          <DataTable
            head={["Dòng số", "Số lượng", "Thấp nhất", "Trung vị", "Cao nhất", "Ghi chú"]}
            rows={tagRows}
            caption="Khoảng giá theo dòng số — đọc từ kho SIM MobiFone của chonsomobifone.com"
          />

          <Note tone="info" title="Cách đọc bảng cho đúng">
            Khoảng giá rộng không có nghĩa người bán tuỳ hứng. Trong cùng một dòng, số lượng chữ số
            lặp, con số được lặp và đầu số tạo ra nhiều bậc giá khác nhau. Hãy so một số với các số
            <em> cùng dòng và cùng đầu số</em>, đừng so với cả dòng.
          </Note>
        </>
      ) : (
        <Note tone="info" title="Bảng giá đang được cập nhật">
          Kho số tạm thời chưa đọc được để dựng bảng khoảng giá. Bạn có thể xem giá niêm yết trực
          tiếp tại <Link href="/mua-sim-gia-re">kho SIM MobiFone</Link>.
        </Note>
      )}

      {prefixRows.length > 0 ? (
        <>
          <h2 id="bang-gia-theo-dau-so">Khoảng giá theo đầu số</h2>
          <p>
            Bảng này trả lời câu hỏi &ldquo;đầu số cổ đắt hơn bao nhiêu&rdquo; bằng số liệu thay vì
            cảm nhận. Lưu ý mỗi đầu số có cơ cấu hàng khác nhau, nên chênh lệch phản ánh cả tệp hàng
            chứ không chỉ giá trị đầu số:
          </p>

          <DataTable
            head={["Đầu số", "Số lượng", "Thấp nhất", "Trung vị", "Cao nhất", "Ghi chú"]}
            rows={prefixRows}
            caption="Khoảng giá theo đầu số MobiFone trong kho hiện tại"
          />
          <p>
            Danh sách đầy đủ các đầu số MobiFone và lịch sử chuyển đổi từ 11 số về 10 số nằm trong
            bài{" "}
            <Link href="/tin-tuc/cac-dau-so-mang-mobifone-moi-nhat">
              các đầu số MobiFone mới nhất
            </Link>
            .
          </p>
        </>
      ) : null}

      <h2 id="theo-ngan-sach">Chọn theo ngân sách: nên nhắm dòng nào</h2>
      <p>
        Cách thực dụng nhất là đi từ ngân sách, không đi từ dòng số. Với mỗi mức tiền, luôn có một
        dòng cho bạn dãy số dễ nhớ nhất trong tầm đó:
      </p>
      <ul>
        <li>
          <strong>Dưới 1 triệu:</strong> SIM dễ nhớ đầu 07x, đuôi lộc phát hoặc thần tài, hoặc SIM
          năm sinh. Ưu tiên dãy đọc một hơi là nhớ.
        </li>
        <li>
          <strong>1 – 5 triệu:</strong> tam hoa đuôi, gánh đảo, đuôi kép đầu 07x; hoặc đuôi phong
          thuỷ đầu số cổ.
        </li>
        <li>
          <strong>5 – 20 triệu:</strong> tam hoa kép, tứ quý con số nhỏ, tiến lên; đầu số cổ với
          đuôi đẹp.
        </li>
        <li>
          <strong>Trên 20 triệu:</strong> tứ quý 6 · 8 · 9, ngũ quý, số VIP đầu số cổ — nhóm này
          nên xem như tài sản, cần kiểm tra nguồn gốc thật kỹ.
        </li>
      </ul>

      <ArticleSimTable
        title="SIM giá mềm đang còn hàng, đuôi lộc phát 68 · 86"
        filter={{ suffixes: ["68", "86"] }}
        limit={8}
        moreHref="/mua-sim-gia-re"
        moreLabel="Xem toàn bộ kho SIM MobiFone theo giá"
        note="Bảng sắp theo giá tăng dần nên các số ở đầu bảng là mức thấp nhất đang có cho đuôi này."
      />

      <h2 id="dinh-gia">Tự định giá một số trước khi hỏi mua</h2>
      <p>
        Trước khi nhắn hỏi giá, bạn có thể tự ước lượng để biết mình đang ở đâu:
      </p>
      <ol>
        <li>Xác định dòng số của nó — nhìn bốn số cuối trước.</li>
        <li>Xem đầu số là cổ (090, 093) hay mới (07x, 089).</li>
        <li>Tra khoảng giá trung vị của đúng dòng đó trong bảng ở trên.</li>
        <li>
          Cộng thêm nếu con số lặp là 6 · 8 · 9, trừ đi nếu là 0 · 4 hoặc phần đầu dãy khó đọc.
        </li>
        <li>
          Đối chiếu bằng <Link href="/dinh-gia-sim">công cụ định giá SIM</Link> để có khoảng giá cho
          chính dãy số đó.
        </li>
      </ol>

      <Note tone="warn" title="Giá rẻ bất thường là dấu hiệu cần dừng lại">
        Một số được chào thấp hơn hẳn mặt bằng cùng dòng thường có lý do: SIM chưa sang tên được,
        đang ràng buộc gói cam kết, hoặc người bán không giữ số. Trước khi chuyển tiền, đọc{" "}
        <Link href="/tin-tuc/mua-sim-so-dep-o-dau-uy-tin">8 điều cần kiểm tra</Link> và{" "}
        <Link href="/tin-tuc/cach-tranh-mat-tien-oan-khi-mua-sim-so-dep">
          cách tránh mất tiền oan
        </Link>
        .
      </Note>

      <h2 id="ket">Chốt lại</h2>
      <p>
        Giá SIM số đẹp không có bảng giá cố định, nhưng có <em>mặt bằng</em> — và mặt bằng đó đo
        được. Biết dòng số, biết đầu số, biết trung vị của dòng đó là đủ để bạn thương lượng không
        bị hớ. Nếu muốn xem số thật kèm giá thật, mở{" "}
        <Link href="/mua-sim-gia-re">kho SIM MobiFone</Link>; muốn lọc theo tuổi và mệnh thì dùng{" "}
        <Link href="/sim-phong-thuy">công cụ tìm SIM hợp tuổi</Link>; còn nếu cần chia nhỏ khoản
        tiền, xem <Link href="/sim-tra-gop">hình thức trả góp</Link>.
      </p>
    </ArticleShell>
  );
}
