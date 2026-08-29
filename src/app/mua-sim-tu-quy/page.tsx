import type { Metadata } from "next";
import { Phone, Shield, Star, Truck, CheckCircle, Sparkles, Award, Users, DollarSign } from "lucide-react";
import MuaSimTuQuyTool from "./MuaSimTuQuyTool";
import CategorySimPriceList from "@/components/CategorySimPriceList";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { buildBreadcrumb } from "@/lib/seo";
import { getCategorySnapshot } from "@/lib/serverSimData";

const ZALO_URL = 'https://zalo.me/0933356666';

const TITLE = "Mua Sim Tứ Quý | Kho Sim Tứ Quý Đẹp Toàn Quốc";
const DESCRIPTION =
  "Kho sim tứ quý 1111, 6666, 8888, 9999 của CHONSOMOBIFONE.COM, giá niêm yết công khai. Quý khách chọn số, nhận sim rồi mới trả tiền, sang tên chính chủ.";
const CANONICAL = "https://www.chonsomobifone.com/mua-sim-tu-quy";

// ISR: match the 5-minute cache window Back uses for the live SIM catalogue, so
// the server-rendered snapshot below refreshes without a per-request refetch.
export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    title: TITLE,
    description: "Kho sim tứ quý 1111, 6666, 8888, 9999 cập nhật mỗi ngày, giá của từng số hiện sẵn trên kho.",
    url: CANONICAL,
    images: [
      {
        url: "https://www.chonsomobifone.com/og-sim-tu-quy.png?v=1",
        width: 1200,
        height: 630,
      },
    ],
  },
};

const faqItems = [
{ q: 'Sim tứ quý giá bao nhiêu?', a: 'Giá sim tứ quý trải rộng từ vài trăm nghìn đến hàng trăm triệu đồng, tùy số quý (1111, 8888, 9999...), đầu số và nhà mạng. Tứ quý 8 và tứ quý 9 thường nằm ở nhóm giá cao nhất do ý nghĩa phong thủy đặc biệt. Từng số trong kho đều có giá niêm yết công khai để Quý khách so sánh trước khi đặt.' },
{ q: 'Mua sim tứ quý ở đâu uy tín?', a: 'CHONSOMOBIFONE.COM có kho tứ quý lớn, giá niêm yết công khai, hỗ trợ sang tên chính chủ và giao sim toàn quốc. Quý khách nhận sim, kiểm tra đúng số rồi mới trả tiền. Mọi giao dịch đều có hóa đơn đầy đủ.' },
{ q: 'Sim tứ quý có sang tên được không?', a: 'Được. Toàn bộ sim tứ quý tại CHONSOMOBIFONE.COM đều hỗ trợ sang tên chính chủ miễn phí. Quý khách mang CMND/CCCD đến cửa hàng nhà mạng gần nhất, hoặc đăng ký ngay trên ứng dụng My Mobifone.' },
{ q: 'Sim tứ quý nhà mạng nào tốt nhất?', a: 'Mỗi nhà mạng mạnh ở một điểm. Mobifone nổi bật về chất lượng cuộc gọi và data 4G/5G. Viettel có vùng phủ sóng rộng. Vinaphone ổn định với người dùng lâu năm. Quan trọng hơn cả vẫn là chọn dãy số hợp mệnh và hợp tuổi của Quý khách.' },
{ q: 'Sim tứ quý có hợp phong thủy không?', a: 'Một chữ số lặp lại bốn lần tạo nên nguồn năng lượng tập trung, nên tứ quý được xem là dòng sim đậm ý nghĩa phong thủy. Mỗi số một hàm ý: 1111 khởi đầu, 6666 lộc lá, 8888 phát tài, 9999 quyền lực. Đội ngũ tư vấn có thể đối chiếu mệnh và tuổi cùng Quý khách trước khi chốt số.' },
{ q: 'Giao sim tứ quý mất bao lâu?', a: 'Nội thành TP.HCM và Hà Nội: 30 phút – 2 tiếng. Các tỉnh thành khác: 1–2 ngày làm việc qua chuyển phát nhanh. Quý khách thanh toán COD khi nhận sim, hoặc chuyển khoản trước nếu thuận tiện hơn.' }];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a }
  }))
};

const tuQuyTypes = [
{
  num: '1',
  title: 'Sim Tứ Quý 1 (1111)',
  content: 'Người mới khởi nghiệp thường tìm về số 1: nguyên khí, đi trước, tự quyết. Bốn số 1 liền nhau đọc lên gọn và dứt khoát, người nghe ghi nhớ ngay lần đầu. Tứ quý 1 phù hợp với chủ doanh nghiệp trẻ, nhà quản lý, hoặc Quý khách đang mở một chương mới và muốn số điện thoại nói hộ điều đó.'
},
{
  num: '2',
  title: 'Sim Tứ Quý 2 (2222)',
  content: 'Dãy 2222 đọc lên nghe đều và êm, đối tác nhớ được số ngay từ cuộc gọi đầu — điều rất có giá với người làm môi giới, đối ngoại hay kinh doanh theo mạng lưới. Số 2 trong phong thủy là âm dương giao hòa: quan hệ bền, hợp tác thuận. Tứ quý 2 cũng là chọn lựa của Quý khách coi trọng gia đình và muốn một số dùng lâu, không phải đổi.'
},
{
  num: '3',
  title: 'Sim Tứ Quý 3 (3333)',
  content: 'Tam tài — Thiên, Địa, Nhân — là gốc của con số 3, hàm ý viên mãn trong cả nghề nghiệp lẫn đời sống. Lặp bốn lần, hàm ý đó nghiêng về tài lộc và sự đi lên bền vững. Thương nhân, nhà đầu tư và người muốn cải thiện vận tài chính hay chọn dòng này. Mức giá của tứ quý 3 cũng dễ tiếp cận hơn tứ quý 8 hay 9.'
},
{
  num: '4',
  title: 'Sim Tứ Quý 4 (4444)',
  content: 'Trong nhóm tứ quý, đây thường là dòng có giá mềm hơn cả, vì nhiều người còn e dè con số 4. Nhưng tứ tượng trưng cho bốn phương, bốn mùa: đủ và kiên cố. Với kỹ sư, nhà thầu, người làm nghề cần độ chính xác, một dãy 4444 vừa dễ đọc trên hợp đồng và bản vẽ, vừa không chiếm nhiều ngân sách. Thực dụng, và đáng cân nhắc.'
},
{
  num: '5',
  title: 'Sim Tứ Quý 5 (5555)',
  content: 'Người làm truyền thông, freelancer, doanh nhân chạy nhiều mảng cùng lúc thường hợp con số 5: linh hoạt, thích nghi nhanh, không đứng một chỗ. Số 5 nằm giữa dãy thập phân và thuộc hành Thổ — nền của mọi sự phát triển, nên hàm ý là sinh sôi và mở rộng. Giá tứ quý 5 vẫn còn mềm so với các dòng 6, 8, 9, đủ để Quý khách sở hữu một dãy đẹp mà không phải cân đo lâu.'
},
{
  num: '6',
  title: 'Sim Tứ Quý 6 (6666)',
  content: 'Tứ quý 6 thuộc nhóm được hỏi nhiều nhất trong kho. Lục lộc trong văn hóa Á Đông là phú quý và bình an, nên dãy 6666 được lòng gần như mọi nhóm khách: doanh nhân, nhân viên văn phòng, người buôn bán tự do. Số này còn dễ đọc qua điện thoại, ít khi bị nghe sai. Cần một dãy vừa đẹp vừa mang nghĩa tích cực, Quý khách nên xem tứ quý 6 trước.'
},
{
  num: '7',
  title: 'Sim Tứ Quý 7 (7777)',
  content: 'Đặt trên danh thiếp hay bảng hiệu, dãy 7777 tạo cảm giác chắc chắn — lý do nhiều luật sư, bác sĩ và người làm lãnh đạo chọn dòng này làm số liên hệ chính. Số 7 được coi là con số may ở nhiều nền văn hóa, gắn với sự hoàn thiện và chiến thắng. Tứ quý 7 là một khoản đầu tư cho hình ảnh cá nhân, bên cạnh dãy số đẹp để dùng mỗi ngày.'
},
{
  num: '8',
  title: 'Sim Tứ Quý 8 (8888)',
  content: 'Tứ quý 8 nằm ở nhóm giá cao nhất, cạnh tứ quý 9, và cũng là dòng được tìm nhiều nhất. Số 8 đọc gần với chữ phát — phát tài, phát đạt, phát triển — nên được yêu thích bậc nhất trong phong thủy Á Đông. Doanh nhân và nhà đầu tư thường xem 8888 như một tài sản: dùng hằng ngày, đồng thời giữ giá trị theo thời gian. Mỗi số chỉ có duy nhất một sim, nên Quý khách gặp số hợp thì nên liên hệ sớm.'
},
{
  num: '9',
  title: 'Sim Tứ Quý 9 (9999)',
  content: 'CEO, người giữ vị thế xã hội, những ai đã có tên trong ngành thường tìm đến 9999. Số 9 lớn nhất trong hàng đơn vị, mang nghĩa cửu trùng: bền lâu, không dứt. Cùng với tứ quý 8, đây là dòng thuộc nhóm giá cao nhất trong kho. Một dãy 9999 nói thay Quý khách khá nhiều, trước cả khi cuộc gọi bắt đầu.'
}];

const fengShuiTable = [
{ sim: '1111', meaning: 'Sự khởi đầu, tiên phong, độc lập' },
{ sim: '2222', meaning: 'Cân bằng, hài hòa, hợp tác' },
{ sim: '3333', meaning: 'Tài lộc, thịnh vượng, phát triển' },
{ sim: '4444', meaning: 'Ổn định, vững chắc, bền bỉ' },
{ sim: '5555', meaning: 'Sinh sôi, sáng tạo, linh hoạt' },
{ sim: '6666', meaning: 'Lộc lá, thuận lợi, may mắn' },
{ sim: '7777', meaning: 'Sức mạnh, quyết đoán, thành công' },
{ sim: '8888', meaning: 'Phát tài, phát đạt, thịnh vượng' },
{ sim: '9999', meaning: 'Quyền lực, đỉnh cao, trường tồn' }];

const benefits = [
{ icon: Star, text: 'Kho sim tứ quý cập nhật mỗi ngày' },
{ icon: Shield, text: 'Giao dịch minh bạch, thông tin bảo mật' },
{ icon: CheckCircle, text: 'Sang tên chính chủ miễn phí' },
{ icon: DollarSign, text: 'Giá niêm yết công khai từng số' },
{ icon: Truck, text: 'Giao sim toàn quốc, nhận sim rồi trả tiền' },
{ icon: Users, text: 'Đội ngũ tư vấn trực 24/7' }];

export default async function MuaSimTuQuyPage() {
  const snapshotSims = await getCategorySnapshot({ tags: ["Tứ quý"] }, 8);
  return (
    <>
      <main className="min-h-screen bg-background">
        {/* ===== 1. HERO SECTION ===== */}
        <section style={{ height: 'clamp(340px, 45vw, 420px)' }} className="relative bg-gradient-to-b from-primary via-primary-dark to-primary text-primary-foreground overflow-hidden flex items-center">
          {/* Subtle background pattern — must stay inset-0 with no horizontal
              margin, otherwise the gradient is pushed off-canvas on narrow
              viewports and clipped on wide ones. */}
          <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{
            backgroundImage: `radial-gradient(circle at 25% 50%, hsl(var(--gold)) 0%, transparent 50%), radial-gradient(circle at 75% 50%, hsl(var(--gold)) 0%, transparent 50%)`
          }} />

          <div className="relative container mx-auto px-4 py-4 text-center">
            {/* Icon badge */}
            <div className="flex justify-center mb-2">
              <div className="w-10 h-10 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-gold" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-[2.25rem] font-extrabold leading-tight max-w-2xl mx-auto mb-2">
              Mua Sim Tứ Quý Giá Tốt – Kho Sim Tứ Quý Đẹp Toàn Quốc
            </h1>

            {/* Description */}
            <p className="text-primary-foreground/80 text-sm md:text-base leading-relaxed max-w-xl mx-auto mb-4">
              Hàng nghìn dãy tứ quý, giá của từng số hiện sẵn trên kho. Quý khách kiểm tra đúng số rồi mới trả tiền, có hỗ trợ sang tên chính chủ và giao sim toàn quốc.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-2.5 max-w-md mx-auto">
              <a href="#kho-sim-tu-quy" className="bg-gold hover:bg-gold-light text-header-bg font-bold px-7 py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                <Star className="w-4 h-4" /> Xem kho sim
              </a>
              <a href={ZALO_URL} target="_blank" rel="noopener noreferrer" className="bg-primary-foreground/10 border border-primary-foreground/25 text-primary-foreground font-semibold px-7 py-2.5 rounded-lg hover:bg-primary-foreground/20 transition-all duration-200 flex items-center justify-center gap-2">
                <Phone className="w-4 h-4" /> Tư vấn chọn sim
              </a>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8 md:py-12 space-y-12 md:space-y-16">

          {/* ===== 2. GIỚI THIỆU SIM TỨ QUÝ ===== */}
          <section className="bg-card rounded-xl shadow-card border border-border p-6 md:p-8">
            <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-3">
              <span className="w-1 h-8 bg-primary rounded-full" />
              Sim Tứ Quý Là Gì?
            </h2>
            <div className="text-muted-foreground leading-relaxed space-y-4">
              <p>
                Sim tứ quý là sim số đẹp có 4 chữ số giống nhau liên tiếp trong dãy số điện thoại, ví dụ 1111, 6666, 8888 hay 9999. Đây là một trong những dòng được săn đón nhiều nhất trên thị trường: nhìn gọn mắt, đọc lên dễ nhớ, và mang ý nghĩa phong thủy rõ ràng.
              </p>
              <p>
                Bốn chữ số giống nhau khiến dãy số đứng lại trong đầu người nghe ngay lần đầu. Đó là lý do thực tế nhất khiến khách hàng tìm <strong>mua sim tứ quý</strong>: đối tác đọc lại được số mà không cần ghi, khách hàng gọi lại đúng số mà không phải tra danh bạ. Trong kinh doanh, một số liên hệ dễ nhớ giúp cuộc trao đổi bắt đầu thuận lợi hơn.
              </p>
              <p>
                Người Việt chọn số theo mệnh và theo tuổi, và tứ quý được xem là dạng đậm nghĩa nhất — một chữ số lặp bốn lần thì hàm ý của nó cũng được nhân lên. 1111 là khởi đầu, 6666 là lộc, 8888 là phát tài, 9999 là quyền lực. Bên cạnh giá trị sử dụng hằng ngày, nhiều khách hàng còn giữ sim tứ quý như một tài sản có thể lên giá theo thời gian.
              </p>
            </div>
          </section>

          {/* Bảng giá thật + ItemList/Product/Offer trong HTML thô — tool bên dưới
              là client island nên bot cần bảng này để thấy giá và tồn kho. */}
          <CategorySimPriceList
            title="Giá sim tứ quý đang bán"
            sims={snapshotSims}
            pageUrl={CANONICAL}
            note="Bảng lấy 8 số tứ quý có giá thấp nhất trong kho tại thời điểm cập nhật."
          />

          {/* ===== 3 + 3b. SEARCH + KHO SIM TỨ QUÝ (client island) ===== */}
          <MuaSimTuQuyTool />

          {/* ===== 4. CÁC LOẠI SIM TỨ QUÝ ===== */}
          <section className="space-y-8">
            <h2 className="text-2xl font-bold text-primary flex items-center gap-3">
              <span className="w-1 h-8 bg-primary rounded-full" />
              Các Loại Sim Tứ Quý Phổ Biến
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tuQuyTypes.map((t) =>
              <article key={t.num} className="bg-card rounded-xl shadow-card border border-border p-5 hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-black text-primary">{t.num}</span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{t.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t.content}</p>
                </article>
              )}
            </div>
          </section>

          {/* ===== 5. LÝ DO NÊN MUA ===== */}
          <section className="bg-card rounded-xl shadow-card border border-border p-6 md:p-8">
            <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-3">
              <span className="w-1 h-8 bg-primary rounded-full" />
              Lý Do Nên Mua Sim Tứ Quý Tại CHONSOMOBIFONE
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {benefits.map((b, i) =>
              <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-secondary/40">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <b.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{b.text}</span>
                </div>
              )}
            </div>
          </section>

          {/* ===== 6. HƯỚNG DẪN CHỌN SIM ===== */}
          <section className="bg-card rounded-xl shadow-card border border-border p-6 md:p-8">
            <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-3">
              <span className="w-1 h-8 bg-primary rounded-full" />
              Hướng Dẫn Chọn Sim Tứ Quý Phù Hợp
            </h2>
            <div className="text-muted-foreground leading-relaxed space-y-4">
              <p>
                Bốn tiêu chí dưới đây giúp Quý khách rút ngắn đường tìm số khi <strong>mua sim tứ quý</strong>: ngân sách, phong thủy, nhà mạng và đầu số.
              </p>
              <p>
                <strong>Chọn theo ngân sách:</strong> Tứ quý có nhiều bậc giá, từ vài trăm nghìn (tứ quý 4) đến hàng trăm triệu (tứ quý 8, 9). Ấn định mức chi trước rồi mới xem số, danh sách sẽ ngắn lại đáng kể. Tứ quý 4 và 5 giá mềm hơn nhưng dãy số vẫn đẹp và vẫn đủ nghĩa.
              </p>
              <p>
                <strong>Chọn theo phong thủy:</strong> Đối chiếu mệnh ngũ hành của Quý khách (Kim, Mộc, Thủy, Hỏa, Thổ) rồi tìm con số tương sinh. Người mệnh Thủy có thể chọn số 1 (hành Thủy) hoặc số 6 (hành Kim sinh Thủy).
              </p>
              <p>
                <strong>Chọn theo nhà mạng:</strong> Mỗi nhà mạng mạnh ở một điểm. Mobifone mạnh về data 4G/5G, Viettel phủ sóng rộng nhất, Vinaphone ổn định với người dùng lâu năm.
              </p>
              <p>
                <strong>Chọn theo đầu số:</strong> Đầu số ảnh hưởng tới cả giá và độ thuận miệng của dãy số. Các đầu số 09x thường đắt hơn 07x, 08x. Quý khách nên đọc to trọn dãy số một lần trước khi quyết, để nghe cả câu chứ không chỉ nghe bốn số cuối.
              </p>
            </div>
          </section>

          {/* ===== 7. Ý NGHĨA PHONG THỦY ===== */}
          <section className="bg-card rounded-xl shadow-card border border-border p-6 md:p-8">
            <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-3">
              <span className="w-1 h-8 bg-primary rounded-full" />
              Ý Nghĩa Phong Thủy Sim Tứ Quý
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Sim Tứ Quý</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Ý Nghĩa Phong Thủy</th>
                  </tr>
                </thead>
                <tbody>
                  {fengShuiTable.map((row, i) =>
                  <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-primary text-base">{row.sim}</td>
                      <td className="py-3 px-4 text-muted-foreground">{row.meaning}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* ===== 8. FAQ ===== */}
          <section className="bg-card rounded-xl shadow-card border border-border p-6 md:p-8">
            <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-3">
              <span className="w-1 h-8 bg-primary rounded-full" />
              Câu Hỏi Thường Gặp Về Sim Tứ Quý
            </h2>
            <Accordion type="single" collapsible className="space-y-2">
              {faqItems.map((faq, index) =>
              <AccordionItem
                key={index}
                value={`faq-${index}`}
                className="border border-border rounded-lg px-4 data-[state=open]:bg-secondary/30">

                  <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary hover:no-underline py-4">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </section>

          {/* ===== 9. CTA CUỐI TRANG ===== */}
          <section className="bg-gradient-to-br from-primary via-primary-dark to-primary rounded-xl p-8 md:p-12 text-center text-primary-foreground">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center">
                <Award className="w-7 h-7 text-gold" />
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3">
              Tìm Dãy Tứ Quý Của Quý Khách
            </h2>
            <p className="text-primary-foreground/80 mb-6 max-w-lg mx-auto">
              Kho tứ quý mở sẵn để Quý khách so số và so giá. Cần thêm một người cùng cân nhắc theo mệnh và tuổi, đội ngũ tư vấn đang trực Zalo và điện thoại.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href="#kho-sim-tu-quy" className="bg-gold text-header-bg font-bold px-6 py-3 rounded-lg hover:bg-gold/90 transition flex items-center gap-2">
                <Star className="w-4 h-4" /> Xem kho sim tứ quý
              </a>
              <a href={ZALO_URL} target="_blank" rel="noopener noreferrer" className="bg-primary-foreground/10 border border-primary-foreground/30 text-primary-foreground font-semibold px-6 py-3 rounded-lg hover:bg-primary-foreground/20 transition flex items-center gap-2">
                <Phone className="w-4 h-4" /> Liên hệ tư vấn
              </a>
            </div>
          </section>

        </div>
      </main>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumb([
              { name: "Trang chủ", path: "/" },
              { name: "SIM tứ quý", path: "/mua-sim-tu-quy" },
            ]),
          ),
        }}
      />
    </>
  );
}
