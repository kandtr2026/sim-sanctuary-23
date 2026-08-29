import type { Metadata } from "next";
import { Wifi, PhoneCall, BadgeCheck, Truck, MessageCircle, Search } from "lucide-react";
import MuaSimGiaReTool from "./MuaSimGiaReTool";
import CategorySimPriceList from "@/components/CategorySimPriceList";
import FaqAccordion from "@/components/FaqAccordion";
import { CHEAP_PRICE } from "@/lib/cheapSimSheet";
import { CHEAP_FACETS, type CheapFacet } from "@/lib/cheapSimFacets";
import { getCheapSnapshot } from "@/lib/serverCheapSims";
import { normalizeSIM } from "@/lib/simUtils";
import { buildBreadcrumb } from "@/lib/seo";

const ZALO_URL = 'https://zalo.me/0933356666';
const PRICE_LABEL = `${CHEAP_PRICE.toLocaleString('vi-VN')}đ`;

const TITLE = `Mua SIM Giá Rẻ – SIM MobiFone Đồng Giá ${PRICE_LABEL}`;
const DESCRIPTION = `Kho SIM MobiFone khuyến mãi đồng giá ${PRICE_LABEL}, một phần số kèm sẵn gói cước. Quý khách chủ động chọn số theo đuôi kép, tránh 4-7, đuôi 6-8-9. Giao SIM toàn quốc.`;
const CANONICAL = "https://www.chonsomobifone.com/mua-sim-gia-re";

// ISR: match the 10-minute promo-warehouse window loosely at 5 minutes, so the
// server-rendered snapshot below refreshes without a per-request sheet fetch.
export const revalidate = 300;

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    type: "website",
    title: TITLE,
    description: `Toàn bộ SIM trong kho đúng ${PRICE_LABEL}, một phần số kèm sẵn gói cước. Quý khách chọn dãy số ưng ý, giá không đổi.`,
    url: CANONICAL,
    images: [{ url: "/share-banner.png?v=999", width: 1200, height: 630 }],
  },
};

// Kho khuyến mãi KHÔNG đồng nhất về gói cước: đếm trên 13.088 dòng của kho
// (cột `Phân loại`) cho 8.387 số không kèm gói, 2.292 M125M, 782 MXH120, 649
// TK179, 546 TK159, 307 TK135, 71 PT90, 53 NA90. Vì vậy trang chỉ được nói về
// gói ở mức "một phần kho có kèm gói", còn gói cụ thể thì nhãn trên từng thẻ SIM
// tự khai theo dòng đó (xem MuaSimGiaReTool.tsx). Đồng giá 229.000đ vẫn đúng cho
// toàn kho — đó là điều duy nhất được hứa cho mọi số.
const KHO_PERKS = [
  { Icon: Wifi, text: 'Một phần kho kèm sẵn gói cước, nhãn ghi rõ trên từng số' },
  { Icon: PhoneCall, text: 'Số nào chưa có gói, Quý khách tự chọn gói sau khi kích hoạt' },
  { Icon: BadgeCheck, text: 'SIM MobiFone chính hãng, sang tên chính chủ' },
  { Icon: Truck, text: 'Giao SIM toàn quốc, miễn phí vận chuyển' },
];

const faqItems = [
  {
    q: `Vì sao mọi SIM ở đây đều ${PRICE_LABEL}?`,
    a: `Đây là kho SIM khuyến mãi đồng giá của MobiFone: toàn bộ số trong kho bán đúng ${PRICE_LABEL}, không phân biệt số đẹp hay số thường. Quý khách không phải cân giá giữa các số — chỉ cần chọn dãy số ưng ý nhất.`,
  },
  {
    q: 'Kho này có SIM tứ quý, lộc phát, thần tài không?',
    a: 'Không. Kho đồng giá là SIM phổ thông: đẹp ở mức dễ nhớ (đuôi kép, tránh số 4 và 7, đuôi 6-8-9, số tiến) chứ không có tứ quý, tam hoa hay lộc phát — những dãy đó thuộc phân khúc vài triệu đến vài chục triệu. Quý khách cần số phong thủy hoặc số VIP, vui lòng xem kho SIM chính ở trang chủ.',
  },
  {
    q: 'SIM giá rẻ có sang tên chính chủ được không?',
    a: 'Được. Mọi SIM tại CHONSOMOBIFONE.COM đều hỗ trợ đăng ký chính chủ, kể cả SIM đồng giá. Sau khi nhận SIM, Quý khách mang CCCD đến cửa hàng MobiFone gần nhất, hoặc đăng ký thông tin thuê bao trên ứng dụng My MobiFone.',
  },
  {
    q: 'SIM có kèm gói cước không? Gói hết hạn thì sao?',
    a: 'Tùy từng số. Nhãn dưới giá của mỗi SIM ghi rõ số đó kèm gói nào (TK179, M125M, MXH120, TK159, TK135…) hoặc chưa kèm gói. Với số có gói, hết thời hạn ưu đãi thì SIM vẫn hoạt động bình thường như một thuê bao trả trước MobiFone: Quý khách chủ động gia hạn, đổi gói khác, hoặc chỉ nạp tiền dùng theo nhu cầu. Số điện thoại thuộc về Quý khách, không phụ thuộc vào việc có duy trì gói hay không.',
  },
  {
    q: 'Bao lâu thì nhận được SIM?',
    a: 'Nội thành TP. Hồ Chí Minh: 30 phút – 2 giờ làm việc. Nội thành Hà Nội và các thành phố lớn: 1 ngày làm việc. Các tỉnh thành khác: 1 – 3 ngày làm việc. Đơn xác nhận sau 20:00 được xử lý vào sáng ngày làm việc kế tiếp. Quý khách nhận SIM rồi thanh toán COD.',
  },
  {
    q: 'Số tôi đang xem có bị người khác mua mất không?',
    a: 'Mỗi số chỉ có duy nhất một SIM. Kho trên trang này đã loại các số đã bán và được làm mới sau mỗi 10 phút; nếu hai người cùng đặt một số trong khoảng đó thì đơn xác nhận trước sẽ được giữ số. Đặt hàng online là cách nhanh nhất để giữ chỗ.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: { '@type': 'Answer', text: item.a },
  })),
};

/**
 * One paragraph per facet, keyed off CHEAP_FACETS so the explainer section can
 * never drift out of sync with the filter chips it is explaining.
 */
const FACET_COPY: Record<CheapFacet, string> = {
  doi: 'Hai số cuối giống nhau (…33, …88) là dạng dễ đọc và dễ nhớ nhất trong kho phổ thông. Khi đọc số qua điện thoại, người nghe chỉ phải ghi một chữ số cho hai vị trí cuối — ít sai sót hơn hẳn.',
  no47: 'Nhiều khách hàng tránh số 4 và số 7 vì lý do kiêng kỵ. Bộ lọc này chỉ giữ những dãy không có cả hai chữ số đó ở bất kỳ vị trí nào, kể cả trong đầu số.',
  tail689: 'Đuôi 6 (lộc), 8 (phát), 9 (vĩnh cửu) là ba chữ số kết thúc được ưa chuộng nhất. Trong kho đồng giá, đây là cách nhanh nhất để Quý khách có một số thuận tai mà không phải trả mức giá của phân khúc số đẹp.',
  tien: 'Ba số cuối tăng dần một đơn vị: …123, …456, …789. Đây là dạng hiếm nhất trong kho — số lượng rất ít và thường hết trước, nên Quý khách gặp dãy ưng ý thì nên đặt sớm.',
};

export default async function MuaSimGiaRePage() {
  // Real promo SIMs, server-rendered into the HTML. The checkout route
  // (/mua-ngay/[id]) resolves these SIMKM… ids, and CategorySimPriceList only
  // reads id/rawDigits/price, so mapping through normalizeSIM is enough.
  //
  // Vì sao chốt cứng `price === CHEAP_PRICE`: cả trang này nói "đồng giá
  // 229.000đ", nhưng `buildCheapSim` chỉ chặn giá trong khoảng 10k–500k
  // (CHEAP_PRICE_BOUNDS) — nếu một hàng trong sheet lệch khỏi 229.000đ thì bảng
  // và Offer JSON-LD sẽ tự mâu thuẫn với chữ "đồng giá" ngay trên cùng trang.
  // Lọc ở đây khiến giá in ra, giá trong schema và giá quảng cáo luôn là MỘT số.
  const cheapSnapshot = await getCheapSnapshot(8);
  const snapshotSims = cheapSnapshot
    .filter((s) => s.price === CHEAP_PRICE)
    .map((s) => normalizeSIM(s.rawDigits, s.displayNumber, s.price, s.id));
  return (
    <>
      <main className="min-h-screen bg-background">
        {/* ===== HERO =====
            minHeight, not height: a fixed clamp() height plus overflow-hidden
            clipped the search box and the perk list on narrow viewports. */}
        <section
          style={{ minHeight: 'clamp(300px, 38vw, 380px)' }}
          className="relative flex items-center bg-gradient-to-b from-primary via-primary-dark to-primary text-primary-foreground"
        >
          <div
            className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.07]"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 50%, hsl(var(--gold)) 0%, transparent 50%), radial-gradient(circle at 75% 50%, hsl(var(--gold)) 0%, transparent 50%)`,
            }}
          />
          <div className="container relative mx-auto px-4 py-6 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-gold md:text-sm">
              Kho khuyến mãi MobiFone
            </p>
            <h1 className="mx-auto mb-3 max-w-3xl text-2xl font-extrabold leading-tight sm:text-3xl md:text-4xl">
              SIM MobiFone, mọi số đúng{' '}
              <span className="text-gold">{PRICE_LABEL}</span>
            </h1>
            <p className="mx-auto mb-5 max-w-xl text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              Quý khách chọn dãy số ưng ý, giá vẫn thế — không có số nào đắt hơn số nào. Số nào
              kèm sẵn gói cước, nhãn dưới giá ghi rõ tên gói.
            </p>

            <ul className="mx-auto grid max-w-2xl grid-cols-1 gap-x-6 gap-y-1.5 text-left text-xs text-primary-foreground/85 sm:grid-cols-2 md:text-sm">
              {KHO_PERKS.map(({ Icon, text }) => (
                <li key={text} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 flex-shrink-0 text-gold" aria-hidden="true" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ===== SEARCH + INVENTORY (client island) ===== */}
        <div className="container mx-auto space-y-10 px-4 py-8 md:space-y-14 md:py-12">
          {/* Bảng số thật + ItemList/Product/Offer trong HTML thô. Giá trên trang
              này vốn đã có sẵn (hero, FAQ, metadata) nên khối này gánh phần còn
              thiếu: đánh dấu sản phẩm cho 8 số đang bán. Mọi dòng cùng mức
              229.000đ là ĐÚNG bản chất kho, không phải lỗi hiển thị. */}
          <CategorySimPriceList
            title={`Số đang còn trong kho — đồng giá ${PRICE_LABEL}`}
            sims={snapshotSims}
            pageUrl={CANONICAL}
            intro={`Số thật đang còn trong kho, mỗi số đúng ${PRICE_LABEL} — Quý khách không phải cân giá giữa các số.`}
            note={`Kho khuyến mãi bán một mức duy nhất, nên cột giá của mọi dòng đều là ${PRICE_LABEL} — Quý khách chỉ cần chọn dãy số ưng ý.`}
          />

          <MuaSimGiaReTool />

          {/* ===== WHAT THIS KHO IS ===== */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-4 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Kho đồng giá {PRICE_LABEL} là gì?
            </h2>
            <div className="space-y-4 leading-relaxed text-muted-foreground">
              <p>
                Đây là kho SIM khuyến mãi của MobiFone, tách riêng khỏi kho SIM số đẹp thông
                thường. Toàn bộ số trong kho bán <strong className="text-foreground">đúng {PRICE_LABEL}</strong>,
                không phân biệt số nào đẹp hơn số nào — nên Quý khách không phải cân nhắc giá,
                chỉ cần chọn dãy số ưng ý nhất.
              </p>
              <p>
                Một phần số trong kho kèm sẵn gói cước MobiFone tháng đầu — thường gặp là{' '}
                <strong className="text-foreground">TK179</strong> (7GB data mỗi ngày),{' '}
                <strong className="text-foreground">M125M</strong>,{' '}
                <strong className="text-foreground">MXH120</strong>,{' '}
                <strong className="text-foreground">TK159</strong>,{' '}
                <strong className="text-foreground">TK135</strong>. Nhãn ngay dưới giá của từng số
                cho Quý khách biết số đó kèm gói nào, hoặc chưa kèm gói. Hết thời hạn ưu đãi, SIM
                vẫn là thuê bao trả trước bình thường — Quý khách chủ động gia hạn, đổi gói khác
                hay chỉ nạp tiền dùng dần.
              </p>
              <div className="rounded-lg border border-gold/25 bg-gold/[0.06] p-4">
                <p className="mb-2 font-semibold text-foreground">Kho này hợp với ai?</p>
                <ul className="space-y-1.5 text-sm">
                  <li>• Cần số thứ hai để bán hàng, chạy quảng cáo, tách việc khỏi số cá nhân.</li>
                  <li>• Cần số đăng ký tài khoản, nhận OTP mà không muốn dùng số chính.</li>
                  <li>• Muốn một dãy số dễ nhớ và tối ưu ngân sách, thay vì trả vài triệu đồng.</li>
                </ul>
              </div>
              <p className="text-sm">
                Cần tứ quý, lộc phát, thần tài hay số phong thủy theo tuổi? Những dãy đó không nằm
                trong kho khuyến mãi này — Quý khách vui lòng xem{' '}
                <a href="/" className="font-medium text-primary underline-offset-2 hover:underline">
                  kho SIM số đẹp
                </a>{' '}
                hoặc{' '}
                <a href="/sim-phong-thuy" className="font-medium text-primary underline-offset-2 hover:underline">
                  SIM phong thủy
                </a>.
              </p>
            </div>
          </section>

          {/* ===== HOW TO PICK — maps 1:1 to the filter chips above ===== */}
          <section>
            <h2 className="mb-2 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Chọn số thế nào khi mọi số cùng giá?
            </h2>
            <p className="mb-5 text-sm text-muted-foreground">
              Giá không còn là tiêu chí, nên chỉ còn một câu hỏi: dãy nào Quý khách đọc lên thấy
              thuận miệng nhất. Bốn cách lọc dưới đây tương ứng đúng với các nút lọc ở kho phía trên.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {CHEAP_FACETS.map((facet) => (
                <article
                  key={facet.id}
                  className="rounded-xl border border-border bg-card p-5 shadow-card transition-colors hover:border-primary/30"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-base font-bold text-foreground">{facet.label}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {FACET_COPY[facet.id]}
                  </p>
                </article>
              ))}
            </div>
          </section>

          {/* ===== ORDER FLOW ===== */}
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-5 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Đặt SIM trong 3 bước
            </h2>
            <ol className="grid list-none grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { n: '1', t: 'Chọn số', d: 'Bấm vào dãy số Quý khách chọn ở kho phía trên. Mỗi số chỉ có một SIM.' },
                { n: '2', t: 'Điền thông tin', d: 'Họ tên, số liên hệ, địa chỉ nhận. Không cần thanh toán trước.' },
                { n: '3', t: 'Nhận SIM, trả tiền', d: 'COD khi nhận. Nội thành HCM 30 phút – 2 giờ, tỉnh 1–3 ngày.' },
              ].map((step) => (
                <li key={step.n} className="rounded-lg border border-border/60 bg-secondary/30 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
                      style={{ backgroundColor: 'hsl(var(--gold))', color: 'hsl(var(--background))' }}
                    >
                      {step.n}
                    </span>
                    <h3 className="text-sm font-bold text-foreground">{step.t}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{step.d}</p>
                </li>
              ))}
            </ol>
          </section>

          {/* ===== FAQ ===== */}
          <FaqAccordion items={faqItems} />

          {/* ===== CLOSING CTA ===== */}
          <section className="rounded-xl bg-gradient-to-br from-primary via-primary-dark to-primary p-8 text-center text-primary-foreground md:p-10">
            <h2 className="mb-2 text-xl font-bold md:text-2xl">
              Hàng nghìn số đang chờ, mọi số đúng {PRICE_LABEL}
            </h2>
            <p className="mx-auto mb-6 max-w-lg text-sm text-primary-foreground/80">
              Quý khách chọn số ở kho phía trên rồi đặt online — hoặc nhắn Zalo để đội ngũ tư vấn
              gợi ý số theo đúng yêu cầu.
            </p>
            <div className="flex flex-col items-center justify-center gap-2.5 sm:flex-row">
              <a
                href="#kho-sim-gia-re"
                className="flex items-center justify-center gap-2 rounded-lg bg-gold px-7 py-2.5 font-bold text-header-bg shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-xl"
              >
                <Search className="h-4 w-4" aria-hidden="true" /> Xem kho SIM
              </a>
              <a
                href={ZALO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg border border-primary-foreground/25 bg-primary-foreground/10 px-7 py-2.5 font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-foreground/20"
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" /> Nhắn Zalo tư vấn
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
              { name: "SIM giá rẻ", path: "/mua-sim-gia-re" },
            ]),
          ),
        }}
      />
    </>
  );
}
