import Link from "next/link";
import { buildBreadcrumb, type BreadcrumbItem } from "@/lib/seo";

const HOTLINE = "0938.868.868";
const EMAIL = "hotro@chonsomobifone.com";
const ADDRESS = "43A Đường số 9, Phường Tân Hưng, TP. Hồ Chí Minh";

type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[] };

export interface PolicyDoc {
  slug: string;
  title: string;
  description: string;
  intro: string;
  blocks: Block[];
}

/** Keyed by route slug so all three policy pages share one component. */
export const POLICY_DOCS: Record<string, PolicyDoc> = {
  "chinh-sach-bao-mat": {
    slug: "chinh-sach-bao-mat",
    title: "Chính sách bảo mật",
    description:
      "Chính sách bảo mật thông tin khách hàng tại CHONSOMOBIFONE.COM: dữ liệu được thu thập, mục đích sử dụng, thời gian lưu trữ và quyền của khách hàng.",
    intro:
      "CHONSOMOBIFONE.COM cam kết bảo vệ thông tin cá nhân của Quý khách. Chính sách dưới đây giải thích chúng tôi thu thập những dữ liệu gì, dùng để làm gì và Quý khách có những quyền nào đối với dữ liệu của mình.",
    blocks: [
      { type: "h2", text: "1. Thông tin chúng tôi thu thập" },
      {
        type: "ul",
        items: [
          "Họ tên, số điện thoại và địa chỉ nhận SIM — dùng để xác nhận và giao đơn hàng.",
          "Thông tin trên CCCD/CMND — chỉ thu thập khi Quý khách yêu cầu sang tên chính chủ, theo quy định của nhà mạng.",
          "Số SIM Quý khách quan tâm hoặc đã đặt mua.",
          "Dữ liệu truy cập ẩn danh (trang đã xem, thiết bị, nguồn truy cập) thông qua Google Analytics và Google Tag Manager.",
        ],
      },
      { type: "h2", text: "2. Mục đích sử dụng thông tin" },
      {
        type: "ul",
        items: [
          "Liên hệ xác nhận đơn hàng và tư vấn chọn số.",
          "Thực hiện thủ tục đăng ký thông tin chính chủ với nhà mạng.",
          "Giao SIM và xử lý bảo hành, đổi trả nếu phát sinh.",
          "Cải thiện chất lượng website và dịch vụ.",
        ],
      },
      { type: "h2", text: "3. Chia sẻ thông tin cho bên thứ ba" },
      {
        type: "p",
        text: "Chúng tôi KHÔNG bán, không trao đổi và không cho thuê thông tin cá nhân của Quý khách. Thông tin chỉ được chia sẻ trong hai trường hợp: (a) cung cấp cho nhà mạng và đơn vị chuyển phát để hoàn tất đơn hàng, và (b) cung cấp cho cơ quan nhà nước có thẩm quyền khi có yêu cầu hợp pháp bằng văn bản.",
      },
      { type: "h2", text: "4. Thời gian lưu trữ" },
      {
        type: "p",
        text: "Thông tin đơn hàng được lưu trong thời gian cần thiết để phục vụ bảo hành và nghĩa vụ kế toán theo quy định pháp luật. Quý khách có thể yêu cầu xóa dữ liệu bất cứ lúc nào, trừ phần dữ liệu buộc phải lưu theo luật.",
      },
      { type: "h2", text: "5. Bảo mật dữ liệu" },
      {
        type: "p",
        text: "Website sử dụng kết nối HTTPS được mã hóa. Chỉ nhân viên phụ trách đơn hàng được truy cập thông tin khách hàng. Chúng tôi không lưu trữ thông tin thẻ ngân hàng của Quý khách trên hệ thống — mọi thanh toán chuyển khoản đều thực hiện trực tiếp qua ngân hàng.",
      },
      { type: "h2", text: "6. Quyền của khách hàng" },
      {
        type: "ul",
        items: [
          "Yêu cầu xem, chỉnh sửa hoặc xóa thông tin cá nhân của mình.",
          "Yêu cầu ngừng nhận thông tin tư vấn, khuyến mãi.",
          "Khiếu nại nếu cho rằng dữ liệu bị sử dụng sai mục đích.",
        ],
      },
      { type: "h2", text: "7. Liên hệ" },
      {
        type: "p",
        text: `Mọi yêu cầu liên quan đến dữ liệu cá nhân, vui lòng liên hệ hotline ${HOTLINE} hoặc email ${EMAIL}. Địa chỉ: ${ADDRESS}.`,
      },
    ],
  },

  "dieu-khoan-su-dung": {
    slug: "dieu-khoan-su-dung",
    title: "Điều khoản sử dụng",
    description:
      "Điều khoản sử dụng website CHONSOMOBIFONE.COM: quy định về giá SIM, tình trạng kho số, quyền và trách nhiệm của khách hàng và của chúng tôi.",
    intro:
      "Khi truy cập và đặt mua SIM tại CHONSOMOBIFONE.COM, Quý khách đồng ý với các điều khoản dưới đây. Vui lòng đọc kỹ trước khi sử dụng dịch vụ.",
    blocks: [
      { type: "h2", text: "1. Về giá và tình trạng SIM" },
      {
        type: "ul",
        items: [
          "Giá niêm yết trên website là giá bán SIM, đã bao gồm phí sang tên chính chủ, chưa bao gồm phí hòa mạng hoặc gói cước theo yêu cầu riêng.",
          "Kho số được cập nhật liên tục. Một số SIM có thể đã được bán trước khi hệ thống cập nhật; trong trường hợp đó chúng tôi sẽ thông báo và tư vấn số tương đương.",
          "Chúng tôi có quyền điều chỉnh giá mà không cần báo trước. Giá áp dụng cho đơn hàng là giá tại thời điểm nhân viên xác nhận đơn với Quý khách.",
        ],
      },
      { type: "h2", text: "2. Đặt hàng và xác nhận" },
      {
        type: "p",
        text: "Đơn hàng đặt trên website là đề nghị mua. Đơn chỉ được xem là hoàn tất sau khi nhân viên CHONSOMOBIFONE kiểm tra kho số và xác nhận lại với Quý khách qua điện thoại hoặc Zalo.",
      },
      { type: "h2", text: "3. Trách nhiệm của khách hàng" },
      {
        type: "ul",
        items: [
          "Cung cấp thông tin liên hệ và thông tin đăng ký chính chủ trung thực, chính xác.",
          "Chỉ chuyển tiền vào số tài khoản được công bố tại trang Thanh toán. CHONSOMOBIFONE không chịu trách nhiệm với các khoản chuyển vào tài khoản khác.",
          "Không sử dụng SIM mua tại CHONSOMOBIFONE cho mục đích vi phạm pháp luật Việt Nam.",
        ],
      },
      { type: "h2", text: "4. Trách nhiệm của CHONSOMOBIFONE" },
      {
        type: "ul",
        items: [
          "Cung cấp SIM đúng số, đúng nhà mạng và đúng giá đã xác nhận.",
          "Hỗ trợ thủ tục sang tên chính chủ theo quy định của nhà mạng.",
          "Bảo mật thông tin khách hàng theo Chính sách bảo mật.",
        ],
      },
      { type: "h2", text: "5. Giới hạn trách nhiệm" },
      {
        type: "p",
        text: "Các nội dung về ý nghĩa phong thủy, luận giải con số trên website mang tính tham khảo văn hóa, không phải cam kết về tài lộc hay kết quả cụ thể. Chất lượng sóng, dung lượng data và các dịch vụ viễn thông thuộc trách nhiệm của nhà mạng, không thuộc phạm vi bảo hành của chúng tôi.",
      },
      { type: "h2", text: "6. Sở hữu trí tuệ" },
      {
        type: "p",
        text: "Toàn bộ nội dung, hình ảnh và dữ liệu kho số trên CHONSOMOBIFONE.COM thuộc quyền sở hữu của CÔNG TY TNHH TM DV VIỄN THÔNG NAM KHANG. Vui lòng không sao chép, thu thập tự động hoặc sử dụng lại cho mục đích thương mại khi chưa có sự đồng ý bằng văn bản.",
      },
      { type: "h2", text: "7. Thay đổi điều khoản" },
      {
        type: "p",
        text: `Chúng tôi có thể cập nhật điều khoản này khi cần thiết. Phiên bản mới nhất luôn được công bố tại trang này. Mọi thắc mắc vui lòng liên hệ hotline ${HOTLINE}.`,
      },
    ],
  },

  "chinh-sach-giao-hang": {
    slug: "chinh-sach-giao-hang",
    title: "Chính sách giao hàng",
    description:
      "Chính sách giao SIM của CHONSOMOBIFONE.COM: thời gian giao hàng nội thành TP.HCM và các tỉnh, phí giao hàng, thanh toán COD, kiểm tra khi nhận và đổi trả.",
    intro:
      "CHONSOMOBIFONE giao SIM toàn quốc. Dưới đây là thời gian, phạm vi, chi phí giao hàng và quy trình kiểm tra khi nhận SIM.",
    blocks: [
      { type: "h2", text: "1. Phạm vi và thời gian giao hàng" },
      {
        type: "ul",
        items: [
          "Nội thành TP. Hồ Chí Minh: giao trong 30 phút – 2 giờ làm việc.",
          "Nội thành Hà Nội và các thành phố lớn: 1 ngày làm việc.",
          "Các tỉnh thành khác: 1 – 3 ngày làm việc qua chuyển phát nhanh.",
          "Đơn xác nhận sau 20:00 sẽ được xử lý vào sáng ngày làm việc kế tiếp.",
        ],
      },
      { type: "h2", text: "2. Phí giao hàng" },
      {
        type: "p",
        text: "CHONSOMOBIFONE giao SIM miễn phí toàn quốc. Quý khách không phải trả thêm phí vận chuyển ngoài giá SIM đã xác nhận.",
      },
      { type: "h2", text: "3. Hình thức nhận SIM" },
      {
        type: "ul",
        items: [
          `Nhận trực tiếp tại cửa hàng: ${ADDRESS}.`,
          "Giao tận nhà, thanh toán khi nhận (COD) — áp dụng cho phần lớn đơn hàng.",
          "Chuyển khoản trước, sau đó nhận SIM tại điểm giao dịch nhà mạng — áp dụng cho một số trường hợp cần cấp lại SIM.",
        ],
      },
      { type: "h2", text: "4. Kiểm tra khi nhận SIM" },
      {
        type: "p",
        text: "Quý khách vui lòng kiểm tra đúng số SIM, tình trạng niêm phong và gắn SIM thử trước khi thanh toán cho nhân viên giao hàng. Sau khi Quý khách đã nhận và thanh toán, chúng tôi không giải quyết khiếu nại về việc sai số.",
      },
      { type: "h2", text: "5. Giấy tờ cần chuẩn bị" },
      {
        type: "p",
        text: "Để đăng ký thông tin chính chủ, Quý khách cần chuẩn bị CCCD thẻ cứng (bản gốc) của người đứng tên SIM. Không thể đăng ký chính chủ nếu thiếu giấy tờ này.",
      },
      { type: "h2", text: "6. Đổi trả và hoàn tiền" },
      {
        type: "ul",
        items: [
          "Giao sai số so với đơn đã xác nhận: đổi lại đúng số hoặc hoàn tiền 100%.",
          "SIM không kích hoạt được do lỗi kỹ thuật từ đầu: đổi SIM mới cùng số miễn phí.",
          "SIM đã kích hoạt và sử dụng bình thường: không áp dụng đổi trả vì thay đổi ý định.",
        ],
      },
      { type: "h2", text: "7. Hỗ trợ" },
      {
        type: "p",
        text: `Đơn hàng chậm trễ hoặc phát sinh sự cố, vui lòng gọi hotline ${HOTLINE} (8:00 – 21:00 hàng ngày) hoặc email ${EMAIL} để được xử lý.`,
      },
    ],
  },
};

function breadcrumbFor(doc: PolicyDoc): BreadcrumbItem[] {
  return [
    { name: "Trang chủ", path: "/" },
    { name: doc.title, path: `/${doc.slug}` },
  ];
}

/**
 * Server Component shared by the three policy routes. Renders the visible
 * breadcrumb, the article body, the CTA row, and the BreadcrumbList JSON-LD.
 */
export function PolicyArticle({ doc }: { doc: PolicyDoc }) {
  return (
    <>
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-gold transition-colors">
            Trang chủ
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground/80">{doc.title}</span>
        </nav>

        <article className="bg-card rounded-xl shadow-card border border-border p-6 md:p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gold mb-4">{doc.title}</h1>
          <p className="text-foreground/80 leading-relaxed mb-6">{doc.intro}</p>

          <div className="space-y-5">
            {doc.blocks.map((block, i) => {
              if (block.type === "h2") {
                return (
                  <h2 key={i} className="text-lg md:text-xl font-bold text-primary pt-2">
                    {block.text}
                  </h2>
                );
              }
              if (block.type === "ul") {
                return (
                  <ul key={i} className="list-disc pl-5 space-y-2 text-foreground/80 leading-relaxed">
                    {block.items.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                );
              }
              return (
                <p key={i} className="text-foreground/80 leading-relaxed">
                  {block.text}
                </p>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-border flex flex-wrap gap-3">
            <Link
              href="/thanh-toan"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              Hướng dẫn thanh toán
            </Link>
            <a
              href={`tel:${HOTLINE.replace(/\./g, "")}`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gold text-header-bg font-semibold text-sm hover:bg-gold/90 transition-colors"
            >
              Gọi {HOTLINE}
            </a>
          </div>
        </article>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumb(breadcrumbFor(doc))) }}
      />
    </>
  );
}
