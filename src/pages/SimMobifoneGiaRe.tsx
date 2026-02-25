import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Shield, Star, Truck, Clock, CheckCircle, ChevronRight, Users, Sparkles, Heart, DollarSign, Plus, Minus } from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FloatingContactButtons from '@/components/FloatingContactButtons';
import { useSimData } from '@/hooks/useSimData';
import { getPromotionalData } from '@/hooks/useSimData';
import SIMCardNew from '@/components/SIMCardNew';
import type { NormalizedSIM } from '@/lib/simUtils';

const HOTLINE = '0901.19.1111';
const ZALO_URL = 'https://zalo.me/0901191111';

// A/B Test: pick variant once per session
const getABVariant = (): 'A' | 'B' => {
  const stored = sessionStorage.getItem('ab_sim_gia_re');
  if (stored === 'A' || stored === 'B') return stored;
  const variant = Math.random() < 0.5 ? 'A' : 'B';
  sessionStorage.setItem('ab_sim_gia_re', variant);
  return variant;
};

const headlines = {
  A: 'Sim Mobifone Giá Rẻ Chính Chủ – Kho Số Đẹp Từ 199K',
  B: 'Sim Mobifone Giá Rẻ Chỉ Từ 199K – Mỗi Số Chỉ Có 1, Giữ Ngay Kẻo Mất',
};

// Price filter options
const PRICE_FILTERS = [
  { label: 'Dưới 500K', max: 500000 },
  { label: '500K – 1 triệu', min: 500000, max: 1000000 },
  { label: 'Tất cả dưới 1 triệu', max: 1000000 },
];

// FAQ data
const faqItems = [
  { q: 'Sim có chính chủ không?', a: 'Tất cả sim tại CHONSOMOBIFONE.COM đều là sim chính chủ 100%, có giấy tờ đầy đủ. Chúng tôi hỗ trợ sang tên ngay khi nhận sim.' },
  { q: 'Có cần đặt cọc không?', a: 'Không cần đặt cọc. Bạn chỉ cần giữ sim trong 30 phút, nhân viên sẽ liên hệ xác nhận. Thanh toán khi nhận hàng (COD) hoặc chuyển khoản.' },
  { q: 'Bao lâu nhận được sim?', a: 'Nội thành TP.HCM và Hà Nội: 30 phút – 2 tiếng. Các tỉnh thành khác: 1–2 ngày làm việc qua chuyển phát nhanh.' },
  { q: 'Có hỗ trợ sang tên không?', a: 'Có. Chúng tôi hỗ trợ sang tên miễn phí tại cửa hàng Mobifone gần nhất hoặc hướng dẫn qua ứng dụng My Mobifone.' },
  { q: 'Nếu không ưng có hoàn tiền không?', a: 'Có. Nếu sim chưa kích hoạt và còn nguyên seal, bạn được hoàn tiền 100% trong vòng 3 ngày kể từ khi nhận hàng.' },
  { q: 'Có xuất hóa đơn không?', a: 'Có. Chúng tôi xuất hóa đơn VAT theo yêu cầu cho cá nhân và doanh nghiệp. Vui lòng thông báo khi đặt hàng.' },
  { q: 'Sim có bảo hành không?', a: 'Sim Mobifone được bảo hành chất lượng mạng bởi nhà mạng. Nếu sim gặp lỗi kỹ thuật, chúng tôi hỗ trợ đổi sim miễn phí trong 7 ngày.' },
];

// JSON-LD FAQ Schema
const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map((item) => ({
    '@type': 'Question',
    name: item.q,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.a,
    },
  })),
};

const SimMobifoneGiaRe = () => {
  const navigate = useNavigate();
  const [abVariant] = useState(getABVariant);
  const [priceFilter, setPriceFilter] = useState<number | null>(null);
  const [priceMax, setPriceMax] = useState<number>(1000000);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const { allSims } = useSimData();

  // Filter SIMs under price threshold
  const filteredSims = useMemo(() => {
    let sims = allSims.filter((s) => s.price > 0 && s.price <= priceMax);
    // Sort cheapest first
    sims.sort((a, b) => a.price - b.price);
    return sims.slice(0, 24);
  }, [allSims, priceMax]);

  const scrollToCTA = () => {
    document.getElementById('sim-kho')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Helmet>
        <title>Sim Mobifone Giá Rẻ Chính Chủ 2026 – Kho Số Đẹp Từ 199K</title>
        <meta name="description" content="Mua sim Mobifone giá rẻ chính chủ từ 199K. Kho 10.000+ số đẹp cập nhật mỗi ngày. Hỗ trợ sang tên nhanh, giao toàn quốc." />
        <link rel="canonical" href="https://www.chonsomobifone.com/sim-mobifone-gia-re/" />
        <meta property="og:title" content="Sim Mobifone Giá Rẻ Chính Chủ 2026 – Kho Số Đẹp Từ 199K" />
        <meta property="og:description" content="Mua sim Mobifone giá rẻ chính chủ từ 199K. Kho 10.000+ số đẹp cập nhật mỗi ngày." />
        <meta property="og:url" content="https://www.chonsomobifone.com/sim-mobifone-gia-re/" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <Header />

      <main className="min-h-screen">
        {/* ====== SECTION 1: HERO ====== */}
        <section className="relative overflow-hidden" style={{
          background: 'linear-gradient(135deg, #006838 0%, #00a651 50%, #39b54a 100%)',
        }}>
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.3) 0%, transparent 50%)',
          }} />
          <div className="container mx-auto px-4 py-10 md:py-16 relative z-10">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="text-center md:text-left">
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
                  {abVariant === 'A'
                    ? 'Sim Mobifone Giá Rẻ Chính Chủ – Sở Hữu Số Đẹp Ngay Hôm Nay'
                    : 'Sim Mobifone Giá Rẻ Chỉ Từ 199K – Mỗi Số Chỉ Có 1, Giữ Ngay Kẻo Mất'}
                </h1>
                <p className="text-white/90 text-base md:text-lg mb-3">
                  Kho 10.000+ sim số đẹp giá từ 199K – Mỗi số chỉ có 1.
                </p>
                <p className="text-yellow-300 font-semibold text-sm md:text-base mb-6 flex items-center justify-center md:justify-start gap-2">
                  <Users className="w-4 h-4" />
                  Có hơn 50 khách giữ sim mỗi ngày
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start mb-4">
                  <button
                    onClick={scrollToCTA}
                    className="px-8 py-4 rounded-xl font-bold text-lg text-white transition-all hover:scale-105 shadow-lg"
                    style={{ background: 'linear-gradient(180deg, #e53935 0%, #b71c1c 100%)', boxShadow: '0 4px 0 #7f0000, 0 6px 20px rgba(183,28,28,0.4)' }}
                  >
                    GIỮ SIM NGAY
                  </button>
                  <a
                    href={ZALO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-8 py-4 rounded-xl font-bold text-lg text-white transition-all hover:scale-105 border-2 border-white/30 backdrop-blur-sm"
                    style={{ background: 'rgba(255,255,255,0.15)' }}
                  >
                    TƯ VẤN MIỄN PHÍ
                  </a>
                </div>

                <a href={`tel:${HOTLINE.replace(/\./g, '')}`} className="inline-flex items-center gap-2 text-yellow-300 font-bold text-lg hover:text-white transition-colors">
                  <Phone className="w-5 h-5" />
                  Hotline: {HOTLINE}
                </a>
              </div>

              {/* Right side: SIM card mockup */}
              <div className="hidden md:flex justify-center">
                <div className="relative w-64 h-80">
                  <div className="absolute inset-0 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl flex flex-col items-center justify-center p-6">
                    <div className="w-16 h-16 rounded-full bg-yellow-400 flex items-center justify-center mb-4">
                      <span className="text-2xl font-black text-green-900">M</span>
                    </div>
                    <p className="text-white/60 text-xs uppercase tracking-widest mb-2">Mobifone</p>
                    <p className="text-white text-2xl font-bold tracking-wider mb-4">0901.***. ***</p>
                    <div className="w-12 h-8 rounded bg-yellow-400/80 mb-4" />
                    <p className="text-yellow-300 text-sm font-semibold">Số Đẹp Chính Chủ</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====== SECTION 2: VÌ SAO NÊN SỞ HỮU ====== */}
        <section className="py-12 md:py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-center text-foreground mb-10">
              Vì Sao Sim Số Đẹp Mobifone Được Ưa Chuộng?
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { icon: Star, title: 'Dễ nhớ – chuyên nghiệp', desc: 'Số đẹp giúp bạn tạo ấn tượng ngay lần đầu gọi điện.' },
                { icon: Users, title: 'Ấn tượng với khách hàng', desc: 'Số đẹp thể hiện sự chuyên nghiệp trong kinh doanh.' },
                { icon: Sparkles, title: 'Hợp phong thủy, may mắn', desc: 'Chọn số hợp mệnh để thu hút tài lộc, may mắn.' },
                { icon: DollarSign, title: 'Giá rẻ, giá trị lâu dài', desc: 'Đầu tư nhỏ, sử dụng trọn đời với giá trị ngày càng tăng.' },
              ].map((item, i) => (
                <div key={i} className="bg-card rounded-xl p-4 md:p-6 text-center border border-border shadow-soft hover:shadow-card transition-shadow">
                  <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-3">
                    <item.icon className="w-6 h-6 text-green-500" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm md:text-base mb-1">{item.title}</h3>
                  <p className="text-muted-foreground text-xs md:text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <button
                onClick={scrollToCTA}
                className="px-8 py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(180deg, #e53935 0%, #b71c1c 100%)' }}
              >
                GIỮ SIM NGAY
              </button>
            </div>
          </div>
        </section>

        {/* ====== SECTION 3: KHO SIM & BỘ LỌC ====== */}
        <section id="sim-kho" className="py-12 md:py-16 bg-background-secondary">
          <div className="container mx-auto px-4">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-center text-foreground mb-8">
              Kho Sim Mobifone Giá Rẻ Dưới 1 Triệu
            </h2>

            {/* Filter bar */}
            <div className="flex flex-wrap gap-2 justify-center mb-8 p-4 rounded-xl" style={{ background: 'linear-gradient(135deg, #006838, #00a651)' }}>
              {PRICE_FILTERS.map((f) => (
                <button
                  key={f.label}
                  onClick={() => setPriceMax(f.max)}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                    priceMax === f.max
                      ? 'bg-white text-green-800 shadow-md'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* SIM Grid - mobile cards, desktop table-like */}
            {filteredSims.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
                {filteredSims.map((sim) => (
                  <SIMCardNew
                    key={sim.id}
                    sim={sim}
                    promotional={getPromotionalData(sim.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-lg mb-2">Đang tải kho sim...</p>
                <p className="text-sm">Vui lòng đợi trong giây lát</p>
              </div>
            )}

            <div className="text-center mt-8">
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 rounded-xl font-semibold text-white border-2 border-white/30 hover:bg-white/10 transition-colors"
              >
                Xem toàn bộ kho sim →
              </button>
            </div>
          </div>
        </section>

        {/* ====== SECTION 4: CAM KẾT ====== */}
        <section className="py-12 md:py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-center text-foreground mb-10">
              Cam Kết Khi Mua Sim Tại Chonsomobifone.com
            </h2>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                {[
                  'Sim chính chủ 100%',
                  'Hỗ trợ sang tên miễn phí',
                  'Không đúng mô tả – hoàn tiền ngay',
                  'Giao COD toàn quốc',
                  'Không phí ẩn – giá niêm yết rõ ràng',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 bg-card rounded-xl p-4 border border-border shadow-soft">
                    <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-foreground font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-center">
                <div className="w-64 h-72 rounded-2xl bg-card border border-border shadow-card flex flex-col items-center justify-center p-6">
                  <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                    <Shield className="w-10 h-10 text-green-500" />
                  </div>
                  <p className="text-foreground font-bold text-lg text-center mb-2">Uy Tín – Chất Lượng</p>
                  <p className="text-muted-foreground text-sm text-center">Hơn 5.000 khách hàng tin tưởng</p>
                </div>
              </div>
            </div>
            <div className="text-center mt-8">
              <button
                onClick={scrollToCTA}
                className="px-8 py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(180deg, #e53935 0%, #b71c1c 100%)' }}
              >
                GIỮ SIM NGAY
              </button>
            </div>
          </div>
        </section>

        {/* ====== SECTION 5: NỘI DUNG SEO ====== */}
        <section className="py-12 md:py-16 bg-background-secondary">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground mb-8">
              Mua Sim Mobifone Giá Rẻ Chính Chủ Ở Đâu Uy Tín?
            </h2>
            <div className="prose prose-invert max-w-none space-y-6 text-muted-foreground leading-relaxed">
              <p>
                Trong thời đại số, việc sở hữu một <strong className="text-foreground">sim Mobifone giá rẻ</strong> nhưng có số đẹp không còn là điều xa xỉ. 
                Với kho hơn 10.000 số đẹp được cập nhật mỗi ngày, CHONSOMOBIFONE.COM mang đến cho bạn cơ hội sở hữu sim số đẹp 
                Mobifone chính chủ với mức giá chỉ từ 199.000đ.
              </p>

              <h3 className="text-lg font-bold text-foreground">Cách chọn sim Mobifone giá rẻ phù hợp</h3>
              <p>
                Khi <strong className="text-foreground">mua sim Mobifone giá rẻ</strong>, bạn cần xác định nhu cầu sử dụng: 
                sim cho công việc nên chọn số dễ nhớ, đuôi đẹp; sim cá nhân có thể chọn theo năm sinh hoặc 
                phong thủy. Những <strong className="text-foreground">sim số đẹp Mobifone</strong> giá dưới 500K thường có đuôi tiến, đuôi 
                lộc phát hoặc các tổ hợp số ý nghĩa mà vẫn nằm trong tầm giá phải chăng.
              </p>

              <h3 className="text-lg font-bold text-foreground">Sim dưới 500K có đáng mua không?</h3>
              <p>
                Hoàn toàn đáng mua! Nhiều người nghĩ <strong className="text-foreground">sim Mobifone dưới 500K</strong> không có số đẹp, 
                nhưng thực tế tại CHONSOMOBIFONE.COM, phân khúc này có rất nhiều lựa chọn hấp dẫn. 
                Các sim tam hoa, tứ quý nhỏ, đuôi 68, 86, 39, 79 đều nằm trong tầm giá này. 
                Đây là khoản đầu tư nhỏ nhưng mang lại giá trị sử dụng lâu dài – vì số điện thoại 
                gắn bó với bạn hàng chục năm.
              </p>

              <h3 className="text-lg font-bold text-foreground">Phân biệt sim chính chủ và sim trôi nổi</h3>
              <p>
                <strong className="text-foreground">Sim Mobifone chính chủ</strong> là sim đã được đăng ký thông tin thuê bao 
                theo đúng quy định của Bộ TT&TT. Khi mua sim chính chủ, bạn được cung cấp đầy đủ giấy tờ 
                để sang tên. Ngược lại, sim trôi nổi không có thông tin chủ thuê bao rõ ràng, có thể bị 
                khóa bất cứ lúc nào. Tại CHONSOMOBIFONE.COM, 100% sim đều là <strong className="text-foreground">sim chính chủ</strong>, 
                được hỗ trợ sang tên miễn phí ngay sau khi mua.
              </p>

              <h3 className="text-lg font-bold text-foreground">Lưu ý khi mua sim online</h3>
              <p>
                Khi mua sim số đẹp online, hãy chọn đơn vị uy tín có địa chỉ rõ ràng, 
                hỗ trợ thanh toán COD (nhận hàng mới thanh toán), và cam kết đổi trả nếu 
                sim không đúng mô tả. Tránh mua từ các nguồn không rõ xuất xứ, giá quá rẻ 
                bất thường hoặc yêu cầu chuyển khoản trước toàn bộ.
              </p>

              <h3 className="text-lg font-bold text-foreground">Vì sao nên mua tại CHONSOMOBIFONE.COM?</h3>
              <p>
                CHONSOMOBIFONE.COM là đơn vị phân phối <strong className="text-foreground">sim số đẹp Mobifone</strong> uy tín hàng đầu 
                với hơn 5 năm kinh nghiệm. Chúng tôi cam kết:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Kho sim 10.000+ số, cập nhật liên tục mỗi ngày</li>
                <li>Giá niêm yết rõ ràng, không phí ẩn</li>
                <li>Sim chính chủ 100%, hỗ trợ sang tên</li>
                <li>Giao hàng COD toàn quốc, nội thành nhận trong 1-2 giờ</li>
                <li>Đổi trả trong 3 ngày nếu sim chưa kích hoạt</li>
                <li>Đội ngũ tư vấn chuyên nghiệp, hỗ trợ 24/7</li>
              </ul>
              <p>
                Với phương châm "Mỗi khách hàng là một đối tác lâu dài", chúng tôi luôn 
                đặt quyền lợi khách hàng lên hàng đầu. Hãy liên hệ ngay hôm nay để được 
                tư vấn chọn <strong className="text-foreground">sim Mobifone giá rẻ</strong> phù hợp nhất!
              </p>
            </div>
          </div>
        </section>

        {/* ====== SECTION 6: QUY TRÌNH MUA ====== */}
        <section className="py-12 md:py-16 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-center text-foreground mb-10">
              Chỉ 4 Bước Để Sở Hữu Sim Ngay Hôm Nay
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {[
                { step: '1', title: 'Chọn Sim', desc: 'Tìm số ưng ý trong kho sim', icon: Star },
                { step: '2', title: 'Giữ Sim', desc: 'Nhấn giữ sim trong 30 phút', icon: Clock },
                { step: '3', title: 'Xác Nhận', desc: 'Nhân viên liên hệ xác nhận', icon: Phone },
                { step: '4', title: 'Nhận Sim', desc: 'Giao tận nơi, thanh toán COD', icon: Truck },
              ].map((item, i) => (
                <div key={i} className="relative">
                  <div className="bg-card rounded-xl p-4 md:p-6 text-center border border-border shadow-soft h-full">
                    <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center mx-auto mb-3 font-bold text-lg">
                      {item.step}
                    </div>
                    <item.icon className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <h3 className="font-bold text-foreground text-sm md:text-base mb-1">{item.title}</h3>
                    <p className="text-muted-foreground text-xs md:text-sm">{item.desc}</p>
                  </div>
                  {i < 3 && (
                    <ChevronRight className="hidden md:block absolute top-1/2 -right-4 w-6 h-6 text-muted-foreground transform -translate-y-1/2 z-10" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ====== SECTION 7: FAQ ====== */}
        <section className="py-12 md:py-16 bg-background-secondary">
          <div className="container mx-auto px-4 max-w-3xl">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-center text-foreground mb-10">
              Câu Hỏi Thường Gặp
            </h2>
            <div className="space-y-3">
              {faqItems.map((item, i) => (
                <div key={i} className="bg-card rounded-xl border border-border shadow-soft overflow-hidden">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                    className="w-full flex items-center justify-between p-4 md:p-5 text-left font-medium text-foreground hover:text-green-500 transition-colors"
                  >
                    <span className="pr-4">{item.q}</span>
                    {expandedFaq === i ? (
                      <Minus className="w-5 h-5 flex-shrink-0 text-green-500" />
                    ) : (
                      <Plus className="w-5 h-5 flex-shrink-0 text-muted-foreground" />
                    )}
                  </button>
                  {expandedFaq === i && (
                    <div className="px-4 md:px-5 pb-4 md:pb-5 text-muted-foreground text-sm leading-relaxed border-t border-border pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <button
                onClick={scrollToCTA}
                className="px-8 py-3 rounded-xl font-bold text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(180deg, #e53935 0%, #b71c1c 100%)' }}
              >
                GIỮ SIM NGAY
              </button>
            </div>
          </div>
        </section>

        {/* ====== SECTION 8: CTA CUỐI ====== */}
        <section className="py-16 md:py-20 relative overflow-hidden" style={{
          background: 'linear-gradient(135deg, #b71c1c 0%, #e53935 30%, #006838 70%, #00a651 100%)',
        }}>
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.3) 0%, transparent 60%)',
          }} />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white mb-6 leading-tight">
              Đừng Để Người Khác Sở Hữu Mất<br className="hidden sm:block" /> Số Đẹp Bạn Đang Xem
            </h2>
            <p className="text-white/80 text-base md:text-lg mb-8 max-w-xl mx-auto">
              Mỗi số chỉ có 1 – Hơn 50 khách giữ sim mỗi ngày. Hành động ngay!
            </p>
            <button
              onClick={scrollToCTA}
              className="px-10 py-5 rounded-xl font-extrabold text-xl text-white transition-all hover:scale-110 shadow-2xl"
              style={{ background: 'linear-gradient(180deg, #e53935 0%, #b71c1c 100%)', boxShadow: '0 6px 0 #7f0000, 0 8px 30px rgba(183,28,28,0.5)' }}
            >
              GIỮ SIM NGAY
            </button>
            <div className="mt-6">
              <a href={`tel:${HOTLINE.replace(/\./g, '')}`} className="text-yellow-300 font-bold text-lg hover:text-white transition-colors">
                <Phone className="w-5 h-5 inline mr-2" />
                Hotline: {HOTLINE}
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
};

export default SimMobifoneGiaRe;
