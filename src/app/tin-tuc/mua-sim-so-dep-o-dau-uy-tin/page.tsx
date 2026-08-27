import Link from "next/link";
import ArticleShell, { type FaqItem } from "@/components/blog/ArticleShell";
import { DataTable, KeyPoints, Note } from "@/components/blog/ArticleBits";
import TrustCommitments from "@/components/TrustCommitments";
import { articleMetadata } from "@/lib/articleSeo";
import { getArticle } from "@/content/tinTucArticles";

const article = getArticle("mua-sim-so-dep-o-dau-uy-tin");
export const metadata = articleMetadata(article);

const CHECKLIST: [string, string, string][] = [
  [
    "1. Giá có niêm yết công khai không?",
    "Số nào cũng phải kèm giá, xem được mà không cần nhắn tin.",
    "Nơi bắt \"inbox giá\" cho từng số thường định giá theo người mua, không theo số.",
  ],
  [
    "2. Có được xem thông tin thuê bao trước không?",
    "Người bán nói rõ SIM đang đứng tên ai, còn hạn hay không, thuộc gói nào.",
    "Không trả lời được câu này thì rất có thể họ cũng chỉ là người trung gian.",
  ],
  [
    "3. Có cam kết sang tên chính chủ không?",
    "Phải nói rõ sang tên ở đâu (cửa hàng nhà mạng hay app), ai chịu chi phí.",
    "SIM không sang tên được sẽ không dùng để xác thực ngân hàng, ví điện tử.",
  ],
  [
    "4. Nhận SIM trước rồi trả tiền được không?",
    "Ship COD, cầm SIM, gắn máy gọi thử rồi mới thanh toán.",
    "Yêu cầu chuyển 100% trước khi thấy SIM là rủi ro lớn nhất trong ngành này.",
  ],
  [
    "5. Nếu SIM không kích hoạt được thì sao?",
    "Phải có chính sách đổi số khác hoặc hoàn tiền, nói trước khi mua.",
    "Không có chính sách rõ ràng thì mọi lỗi sẽ thành lỗi của người mua.",
  ],
  [
    "6. Có địa chỉ, hotline, pháp nhân rõ ràng không?",
    "Số điện thoại gọi được, địa chỉ tra được, có mặt lâu dài trên một tên miền.",
    "Chỉ có tài khoản mạng xã hội và số tài khoản cá nhân là dấu hiệu đáng cân nhắc.",
  ],
  [
    "7. Số tài khoản nhận tiền có trùng tên người bán không?",
    "Tên chủ tài khoản phải khớp với pháp nhân hoặc người đang giao dịch với bạn.",
    "Chuyển vào tài khoản tên người thứ ba là chuyện gần như không thể đòi lại.",
  ],
  [
    "8. Có bị thúc \"chốt ngay kẻo mất số\" không?",
    "Người bán đàng hoàng sẽ để bạn kiểm tra, so giá, hỏi lại.",
    "Áp lực thời gian là công cụ quen thuộc để bạn bỏ qua bảy bước phía trên.",
  ],
];

const RED_FLAGS: [string, string][] = [
  [
    "Giá thấp hơn hẳn mặt bằng cùng dòng",
    "Tứ quý 8888 đầu số cổ chào giá vài triệu là điều không xảy ra trên thị trường thật. Giá quá tốt thường đi kèm SIM không sang tên được, đang cầm cố, hoặc đơn giản là không tồn tại.",
  ],
  [
    "Đòi đặt cọc để \"giữ số\"",
    "Đặt cọc trước khi được xem thông tin thuê bao là hình thức mất tiền phổ biến nhất. Nếu buộc phải cọc, hãy cọc phần nhỏ và có biên nhận ghi rõ điều kiện hoàn.",
  ],
  [
    "Không cho gọi thử vào số",
    "Một số đang hoạt động thì gọi vào phải đổ chuông. Từ chối cho kiểm tra là dấu hiệu số đang bị khoá hoặc không thuộc quyền bán của họ.",
  ],
  [
    "Ép chuyển sang liên hệ ngoài luồng",
    "Bị kéo khỏi kênh chính thức sang tài khoản cá nhân lạ, đổi số tài khoản giữa cuộc trò chuyện, hoặc đổi người phụ trách liên tục.",
  ],
  [
    "Hứa \"sim phong thuỷ đảm bảo tài lộc\"",
    "Phong thuỷ số là niềm tin dân gian. Bất kỳ ai cam kết kết quả tài chính từ một dãy số đều đang bán niềm tin, không bán SIM.",
  ],
];

const faq: FaqItem[] = [
  {
    q: "Mua SIM số đẹp ở đâu uy tín?",
    a: "Không có giấy phép riêng cho nghề bán SIM số đẹp, nên thay vì tìm một cái tên, hãy kiểm tra tám điều: giá niêm yết công khai, thông tin thuê bao rõ ràng, cam kết sang tên chính chủ, nhận SIM trước khi trả tiền, chính sách đổi hoàn, pháp nhân và hotline thật, tên chủ tài khoản nhận tiền khớp người bán, và không bị thúc chốt gấp.",
  },
  {
    q: "Mua SIM online có an toàn không?",
    a: "An toàn nếu bạn giữ nguyên tắc nhận SIM và kiểm tra trước khi thanh toán. Rủi ro không nằm ở việc mua online mà nằm ở việc chuyển toàn bộ tiền trước khi thấy SIM.",
  },
  {
    q: "Làm sao biết SIM có sang tên chính chủ được không?",
    a: "Hỏi người bán SIM đang đứng tên ai và có kèm giấy tờ chuyển nhượng không. Sau khi nhận SIM, bạn có thể tự kiểm tra thông tin thuê bao rồi tiến hành cập nhật sang tên mình. Cách kiểm tra có trong bài hướng dẫn kiểm tra SIM chính chủ MobiFone trên site.",
  },
  {
    q: "Có nên đặt cọc giữ số không?",
    a: "Chỉ nên khi bạn đã xác minh được người bán và số đó. Nếu vẫn phải cọc, hãy cọc phần nhỏ, có biên nhận ghi rõ điều kiện hoàn cọc, và chuyển vào tài khoản đúng tên người bán.",
  },
  {
    q: "Nếu đã chuyển tiền mà không nhận được SIM thì làm gì?",
    a: "Lưu toàn bộ tin nhắn, biên lai chuyển khoản, số tài khoản người nhận, rồi trình báo cơ quan công an nơi bạn cư trú. Đồng thời thông báo cho ngân hàng của bạn càng sớm càng tốt. Khả năng thu hồi phụ thuộc vào việc tiền đã bị rút chưa, nên thời gian là yếu tố quyết định.",
  },
  {
    q: "SIM đã dùng rồi có mua được không?",
    a: "Được, và phần lớn SIM số đẹp trên thị trường đều là SIM đã hoà mạng trước đó. Điều cần kiểm là SIM còn hoạt động, không nợ cước, không ràng buộc gói cam kết, và chuyển được quyền sử dụng sang tên bạn.",
  },
];

export default function MuaSimOdauUyTinPage() {
  return (
    <ArticleShell
      article={article}
      faq={faq}
      related={[
        "cach-tranh-mat-tien-oan-khi-mua-sim-so-dep",
        "gia-sim-so-dep-mobifone",
        "kiem-tra-sim-chinh-chu-mobifone",
      ]}
      lead={
        <p>
          Nghề bán SIM số đẹp không có giấy phép riêng, không có cơ quan xếp hạng, nên câu hỏi
          &ldquo;chỗ nào uy tín&rdquo; gần như không thể trả lời bằng một cái tên. Cách kiểm soát
          rủi ro thực tế là chuyển câu hỏi thành một danh sách tám điều kiểm tra được — làm hết
          tám bước thì phần lớn rủi ro tự biến mất.
        </p>
      }
    >
      <KeyPoints
        items={[
          <>
            Nguyên tắc quan trọng nhất: <strong>nhận SIM, kiểm tra rồi mới trả tiền</strong>. Đây là
            lớp bảo vệ mạnh hơn mọi lời cam kết.
          </>,
          <>
            Giá phải <strong>niêm yết công khai</strong> — nơi bắt inbox từng số thường định giá theo
            người mua.
          </>,
          <>
            Hỏi rõ <strong>SIM đang đứng tên ai</strong> và có sang tên chính chủ được không.
          </>,
          <>
            Tên <strong>chủ tài khoản nhận tiền</strong> phải khớp người bán; khác tên là dấu hiệu
            dừng lại.
          </>,
          <>
            Bị thúc &ldquo;chốt ngay kẻo mất số&rdquo; là chiêu để bạn bỏ qua các bước kiểm tra.
          </>,
        ]}
      />

      <h2 id="checklist">Tám điều cần kiểm tra trước khi trả tiền</h2>
      <p>
        Danh sách này xếp theo thứ tự bạn nên hỏi trong một cuộc trao đổi thật, từ điều dễ kiểm tra
        nhất đến điều cần quan sát thái độ người bán:
      </p>

      <DataTable
        head={["Câu hỏi", "Câu trả lời tốt trông như thế nào", "Vì sao quan trọng"]}
        rows={CHECKLIST.map(([q, good, why]) => [q, good, why])}
        caption="Checklist 8 bước kiểm tra một nơi bán SIM số đẹp"
        boldFirstColumn={false}
      />

      <Note tone="tip" title="Một mẹo lọc nhanh trong ba mươi giây">
        Trước khi hỏi bất cứ điều gì, hãy thử gọi vào chính số SIM mà bạn muốn mua. Nếu số đổ chuông
        thì ít nhất nó đang hoạt động và tồn tại. Nếu người bán từ chối cho bạn thử, phần lớn các
        bước sau không cần làm nữa.
      </Note>

      <h2 id="dau-hieu-canh-bao">Năm dấu hiệu nên dừng lại ngay</h2>

      <DataTable
        head={["Dấu hiệu", "Vì sao đáng lo"]}
        rows={RED_FLAGS.map(([flag, why]) => [flag, why])}
        caption="Các dấu hiệu cảnh báo phổ biến khi mua SIM số đẹp"
        boldFirstColumn={false}
      />

      <p>
        Bài{" "}
        <Link href="/tin-tuc/cach-tranh-mat-tien-oan-khi-mua-sim-so-dep">
          cách tránh mất tiền oan khi mua SIM số đẹp
        </Link>{" "}
        đi sâu hơn vào từng tình huống cụ thể, kể cả trường hợp đã chuyển tiền.
      </p>

      <h2 id="ba-nhom-nguoi-ban">Ba nhóm người bán và điểm mạnh, điểm yếu</h2>

      <DataTable
        head={["Nhóm", "Điểm mạnh", "Điểm cần lưu ý"]}
        rows={[
          [
            "Cửa hàng của nhà mạng",
            "Chắc chắn về pháp lý, sang tên tại quầy",
            "Kho số đẹp hạn chế, ít dòng tứ quý, ngũ quý; giá cố định không thương lượng",
          ],
          [
            "Đại lý SIM số đẹp có tên miền riêng",
            "Kho số rộng, có giá niêm yết, có chính sách đổi hoàn",
            "Chất lượng rất khác nhau — cần chạy đủ checklist 8 bước ở trên",
          ],
          [
            "Người bán cá nhân trên mạng xã hội, sàn rao",
            "Đôi khi có số lạ, giá mềm hơn",
            "Không pháp nhân, không chính sách; rủi ro cao nhất trong ba nhóm",
          ],
        ]}
        caption="So sánh ba nhóm nguồn mua SIM số đẹp"
      />

      <h2 id="quy-trinh-an-toan">Quy trình mua an toàn, năm bước</h2>
      <ol>
        <li>
          <strong>Chốt ngân sách và dòng số trước.</strong> Biết mặt bằng giá của dòng mình nhắm để
          không bị hét — xem{" "}
          <Link href="/tin-tuc/gia-sim-so-dep-mobifone">khoảng giá theo từng dòng số</Link>.
        </li>
        <li>
          <strong>Xác minh số và người bán.</strong> Gọi thử vào số, hỏi thông tin thuê bao, kiểm tra
          tên chủ tài khoản nhận tiền.
        </li>
        <li>
          <strong>Thống nhất bằng chữ.</strong> Giá cuối, ai chịu phí sang tên, thời gian giao, điều
          kiện đổi hoàn — nhắn lại một tin tóm tắt để hai bên cùng xác nhận.
        </li>
        <li>
          <strong>Nhận SIM, kiểm tra tại chỗ.</strong> Gắn vào máy, gọi ra, nhận tin nhắn, kiểm tra
          thông tin thuê bao rồi mới thanh toán.
        </li>
        <li>
          <strong>Sang tên ngay.</strong> Đừng để việc này &ldquo;làm sau&rdquo; — hướng dẫn ở bài{" "}
          <Link href="/tin-tuc/kiem-tra-sim-chinh-chu-mobifone">
            kiểm tra và chuẩn hoá SIM chính chủ MobiFone
          </Link>
          .
        </li>
      </ol>

      <h2 id="tai-day">Cách chonsomobifone.com xử lý năm điểm trên</h2>
      <p>
        Để bạn đối chiếu chứ không phải tin lời: đây là cam kết đang áp dụng cho mọi đơn tại kho
        SIM MobiFone của chúng tôi.
      </p>

      <div className="not-prose my-6">
        <TrustCommitments />
      </div>

      <p>
        Toàn bộ số trong <Link href="/mua-sim-gia-re">kho SIM MobiFone</Link> đều hiện giá ngay trên
        số, không cần nhắn tin hỏi giá. Nếu bạn muốn đối chiếu mức giá cho một dãy số cụ thể trước
        khi liên hệ, dùng <Link href="/dinh-gia-sim">công cụ định giá SIM</Link>.
      </p>

      <Note tone="info" title="Điều chúng tôi không cam kết">
        Không có nơi bán nào cam kết được rằng một dãy số sẽ mang lại tài lộc hay may mắn. Các nội
        dung phong thuỷ trên site được trình bày như tri thức dân gian để bạn tham khảo khi chọn
        giữa những số cùng tầm giá — không phải lời khuyên tài chính.
      </Note>
    </ArticleShell>
  );
}
