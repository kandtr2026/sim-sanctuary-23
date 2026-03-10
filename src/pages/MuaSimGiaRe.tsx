import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Phone, Shield, Star, Truck, CheckCircle, Search, ChevronRight, Sparkles, Award, Users, DollarSign, Tag } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import { useCheapSimData } from '@/hooks/useCheapSimData';
import SIMCardNew from '@/components/SIMCardNew';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const HOTLINE = '0901.19.1111';
const ZALO_URL = 'https://zalo.me/0901191111';

const faqItems = [
  {
    q: 'Sim giá rẻ có dùng tốt không?',
    a: 'Có. Sim giá rẻ vẫn sử dụng cùng hạ tầng mạng với các sim giá cao hơn. Bạn vẫn được gọi điện, nhắn tin, dùng data 4G/5G bình thường. Sự khác biệt chủ yếu nằm ở tính thẩm mỹ của dãy số, không ảnh hưởng đến chất lượng dịch vụ.',
  },
  {
    q: 'Sim dưới 500k có sang tên được không?',
    a: 'Hoàn toàn được. Tất cả sim tại CHONSOMOBIFONE.COM đều hỗ trợ sang tên chính chủ, bất kể mức giá. Bạn chỉ cần mang CMND/CCCD đến cửa hàng nhà mạng gần nhất hoặc dùng ứng dụng My Mobifone để đăng ký.',
  },
  {
    q: 'Mua sim giá rẻ ở đâu uy tín?',
    a: 'CHONSOMOBIFONE.COM là địa chỉ uy tín với kho sim cập nhật hàng ngày, giá minh bạch, hỗ trợ sang tên chính chủ miễn phí và giao sim toàn quốc. Mọi giao dịch an toàn, có xác nhận đơn hàng rõ ràng.',
  },
  {
    q: 'Sim giá rẻ có dùng lâu dài được không?',
    a: 'Có. Sim giá rẻ hoạt động giống hệt sim thường, bạn có thể dùng lâu dài mà không gặp vấn đề gì. Chỉ cần duy trì nạp tiền hoặc đăng ký gói cước theo quy định nhà mạng là sim sẽ hoạt động bình thường.',
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


const MuaSimGiaRe = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { sims: cheapSimsRaw, isLoading } = useCheapSimData();

  // Map cheap sims to NormalizedSIM shape for SIMCardNew
  const allCheapSims = useMemo(() => {
    return cheapSimsRaw.map((s) => {
      const digits = s.rawDigits;
      const counts = Array(10).fill(0);
      for (const d of digits) counts[parseInt(d)]++;
      return {
        id: s.id,
        rawDigits: digits,
        displayNumber: s.displayNumber,
        formattedNumber: s.displayNumber,
        price: s.price,
        prefix3: digits.substring(0, 3),
        prefix4: digits.substring(0, 4),
        last2: digits.slice(-2),
        last3: digits.slice(-3),
        last4: digits.slice(-4),
        last5: digits.slice(-5),
        last6: digits.slice(-6),
        digitCounts: counts,
        sumDigits: digits.split('').reduce((a: number, b: string) => a + parseInt(b), 0),
        tags: [] as string[],
        isVIP: false,
        network: s.network as 'Mobifone' | 'Vinaphone' | 'Gmobile' | 'Khác',
        beautyScore: 0,
      };
    });
  }, [cheapSimsRaw]);

  const cheapSims = useMemo(() => allCheapSims.slice(0, 12), [allCheapSims]);


  const searchResults = useMemo(() => {
    if (!activeSearch.trim()) return null;
    const raw = activeSearch.replace(/\s/g, '');

    if (raw.startsWith('*')) {
      const suffix = raw.slice(1).replace(/\D/g, '');
      if (!suffix) return null;
      return allCheapSims
        .filter((s) => {
          const digits = s.rawDigits || s.displayNumber?.replace(/\D/g, '') || '';
          return digits.endsWith(suffix);
        })
        .slice(0, 60);
    }

    const q = raw.replace(/\D/g, '');
    if (!q) return null;
    return allCheapSims
      .filter((s) => {
        const digits = s.rawDigits || s.displayNumber?.replace(/\D/g, '') || '';
        return digits.includes(q);
      })
      .slice(0, 60);
  }, [allCheapSims, activeSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setActiveSearch(searchQuery);
    setTimeout(() => setIsSearching(false), 300);
    setTimeout(() => {
      document.getElementById('kho-sim-gia-re')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setActiveSearch('');
  };

  const displaySims = searchResults ?? cheapSims;
  const hasActiveSearch = !!activeSearch.trim();

  const scrollToSims = () => {
    document.getElementById('kho-sim-gia-re')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Helmet>
        <title>Mua Sim Giá Rẻ – Kho Sim Số Đẹp Giá Tốt Toàn Quốc</title>
        <meta
          name="description"
          content="Kho sim giá rẻ từ Viettel, Mobifone, Vinaphone với hàng nghìn số đẹp dễ nhớ chỉ từ vài chục nghìn đến dưới 1 triệu. Cập nhật kho sim mỗi ngày, hỗ trợ giao sim và sang tên toàn quốc."
        />
        <link rel="canonical" href="https://chonsomobifone.com/mua-sim-gia-re" />
        <meta property="og:title" content="Mua Sim Giá Rẻ – Kho Sim Số Đẹp Giá Tốt Toàn Quốc" />
        <meta
          property="og:description"
          content="Kho sim giá rẻ với hàng nghìn số đẹp dễ nhớ. Giá chỉ từ vài chục nghìn, cập nhật mỗi ngày."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://chonsomobifone.com/mua-sim-gia-re" />
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <Header />
      <Navigation />

      <main className="min-h-screen bg-background">
        {/* ===== 1. HERO SECTION ===== */}
        <section
          style={{ height: 'clamp(340px, 45vw, 420px)' }}
          className="relative bg-gradient-to-b from-primary via-primary-dark to-primary text-primary-foreground overflow-hidden flex items-center"
        >
          <div
            className="absolute inset-0 opacity-[0.07] border-0 px-0 mx-[190px]"
            style={{
              backgroundImage: `radial-gradient(circle at 25% 50%, hsl(var(--gold)) 0%, transparent 50%), radial-gradient(circle at 75% 50%, hsl(var(--gold)) 0%, transparent 50%)`,
            }}
          />

          <div className="relative container mx-auto px-4 py-4 text-center">
            <div className="flex justify-center mb-2">
              <div className="w-10 h-10 rounded-full bg-gold/15 border border-gold/30 flex items-center justify-center">
                <Tag className="w-5 h-5 text-gold" />
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-[2.25rem] font-extrabold leading-tight max-w-2xl mx-auto mb-2">
              Mua Sim Giá Rẻ – Kho Sim Số Đẹp Giá Tốt Toàn Quốc
            </h1>

            <p className="text-primary-foreground/80 text-sm md:text-base leading-relaxed max-w-xl mx-auto mb-4">
              Kho sim giá rẻ với hàng nghìn số đẹp từ CHONSOMOBIFONE.COM. Giá chỉ từ vài trăm nghìn đến dưới 1 triệu, phù hợp cho mọi nhu cầu sử dụng.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="max-w-lg mx-auto mb-4">
              <div className="flex bg-card rounded-xl overflow-hidden shadow-elevated ring-1 ring-gold/20">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    inputMode="tel"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value.replace(/[^0-9*]/g, ''))}
                    placeholder="Nhập số cần tìm..."
                    className="w-full pl-12 pr-3 py-3 md:py-3.5 bg-card text-foreground text-base focus:outline-none"
                  />
                </div>
                <button
                  type="submit"
                  className="btn-cta px-5 md:px-7 flex items-center gap-2 rounded-none text-sm md:text-base font-bold whitespace-nowrap"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Tìm SIM</span>
                </button>
              </div>
            </form>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-2.5 max-w-md mx-auto">
              <button
                onClick={scrollToSims}
                className="bg-gold hover:bg-gold-light text-header-bg font-bold px-7 py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <Star className="w-4 h-4" /> Xem kho sim giá rẻ
              </button>
              <a
                href={ZALO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary-foreground/10 border border-primary-foreground/25 text-primary-foreground font-semibold px-7 py-2.5 rounded-lg hover:bg-primary-foreground/20 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" /> Tư vấn chọn sim
              </a>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8 md:py-12 space-y-12 md:space-y-16">
          {/* ===== 2. KHO SIM GIÁ RẺ ===== */}
          <section id="kho-sim-gia-re" className="bg-card rounded-xl shadow-card border border-border p-6 md:p-8">
            <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-3">
              <span className="w-1 h-8 bg-primary rounded-full" />
              {hasActiveSearch ? `Kết quả tìm kiếm "${activeSearch}"` : 'Kho Sim Giá Rẻ Cập Nhật'}
            </h2>
            {hasActiveSearch && (
              <button onClick={clearSearch} className="mb-4 text-sm text-primary hover:underline">
                ← Quay lại kho sim giá rẻ
              </button>
            )}
            {isLoading || isSearching ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-4 space-y-3">
                    <div className="h-4 w-16 bg-muted rounded" />
                    <div className="h-6 w-full bg-muted rounded" />
                    <div className="h-4 w-20 bg-muted rounded" />
                    <div className="h-8 w-full bg-muted rounded" />
                  </div>
                ))}
              </div>
            ) : displaySims.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {displaySims.map((sim) => (
                  <SIMCardNew key={sim.id} sim={sim} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {hasActiveSearch
                  ? 'Không tìm thấy sim giá rẻ phù hợp. Vui lòng thử số khác.'
                  : 'Hiện chưa có sim giá rẻ trong kho. Vui lòng quay lại sau.'}
              </div>
            )}
            <div className="mt-6 text-center">
              <button onClick={() => navigate('/')} className="btn-cta inline-flex items-center gap-2 px-6 py-3">
                Xem toàn bộ kho sim <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* ===== 3. GIỚI THIỆU SIM GIÁ RẺ ===== */}
          <section className="bg-card rounded-xl shadow-card border border-border p-6 md:p-8">
            <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-3">
              <span className="w-1 h-8 bg-primary rounded-full" />
              Sim Giá Rẻ Là Gì?
            </h2>
            <div className="text-muted-foreground leading-relaxed space-y-4">
              <p>
                <strong>Sim giá rẻ</strong> là những số điện thoại có mức giá thấp nhưng vẫn đáp ứng đầy đủ nhu cầu nghe gọi và truy cập internet hằng ngày. Với nhu cầu sử dụng ngày càng phổ biến như bán hàng online, đăng ký tài khoản hoặc dùng làm số phụ, nhiều người lựa chọn <strong>mua sim giá rẻ</strong> để tiết kiệm chi phí nhưng vẫn tiện lợi khi sử dụng.
              </p>
              <p>
                Tại kho sim của chúng tôi, mỗi sim chỉ có giá <strong>229.000đ</strong> và được tặng kèm gói cước <strong>TK179</strong> với nhiều ưu đãi hấp dẫn trong 30 ngày sử dụng.
              </p>
              <div>
                <p className="font-semibold text-foreground mb-2">Ưu đãi khi mua sim:</p>
                <ul className="space-y-1.5">
                  <li>✔ 7GB data tốc độ cao mỗi ngày (hết dung lượng ngừng truy cập)</li>
                  <li>✔ Miễn phí thoại nội mạng dưới 20 phút mỗi cuộc (tối đa 1500 phút)</li>
                  <li>✔ Miễn phí 200 phút thoại liên mạng</li>
                  <li>✔ Thời gian sử dụng 30 ngày</li>
                </ul>
              </div>
              <p>
                Với mức giá chỉ 229.000đ, người dùng có thể sở hữu một <strong>sim dễ nhớ giá rẻ</strong>, vừa phục vụ liên lạc vừa đáp ứng nhu cầu data và gọi thoại hằng ngày.
              </p>
            </div>
          </section>

          <section className="space-y-8">
            <h2 className="text-2xl font-bold text-primary flex items-center gap-3">
              <span className="w-1 h-8 bg-primary rounded-full" />
              Các Loại Sim Giá Rẻ Phổ Biến
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <article className="bg-card rounded-xl shadow-card border border-border p-5 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Sim Dưới 500k</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Phân khúc sim dưới 500k là lựa chọn phổ biến nhất cho những ai cần số mới với chi phí tiết kiệm. Dù giá mềm, nhiều sim trong tầm giá này vẫn có dãy số khá đẹp, dễ nhớ và phù hợp cho mọi mục đích sử dụng. Đặc biệt thích hợp làm số phụ, số kinh doanh hoặc số đăng ký tài khoản.
                </p>
              </article>

              <article className="bg-card rounded-xl shadow-card border border-border p-5 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Sim Giá Rẻ Dễ Nhớ</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong>Sim dễ nhớ giá rẻ</strong> là những sim có quy luật số rõ ràng: số lặp (11, 22, 33), số tiến (123, 456, 789), số cân bằng (1221, 3443), hoặc số gánh (1881, 2992). Những dạng số này giúp người khác dễ ghi nhớ số của bạn, rất có lợi khi dùng trong kinh doanh hoặc giao tiếp hàng ngày.
                </p>
              </article>

              <article className="bg-card rounded-xl shadow-card border border-border p-5 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground">Sim Mobi Dễ Nhớ</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <strong>Sim mobi dễ nhớ</strong> sử dụng các đầu số Mobifone phổ biến: 090, 093, 089, 070, 076, 077, 078, 079. Mobifone được đánh giá cao về chất lượng cuộc gọi HD, data 4G/5G tốc độ nhanh và gói cước linh hoạt. Kết hợp đầu số đẹp với giá rẻ, đây là lựa chọn hàng đầu cho người dùng thông minh.
                </p>
              </article>
            </div>
          </section>

          {/* ===== 6. LÝ DO NÊN MUA SIM GIÁ RẺ ===== */}
          <section className="bg-card rounded-xl shadow-card border border-border p-6 md:p-8">
            <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-3">
              <span className="w-1 h-8 bg-primary rounded-full" />
              Vì Sao Nên Mua Sim Giá Rẻ?
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: DollarSign, text: 'Chi phí thấp, tiết kiệm ngân sách' },
                { icon: Users, text: 'Phù hợp làm số phụ, số dự phòng' },
                { icon: Shield, text: 'Dễ đăng ký tài khoản, xác minh OTP' },
                { icon: Sparkles, text: 'Có thể chọn số dễ nhớ, có quy luật' },
                { icon: Star, text: 'Phù hợp bán hàng online, kinh doanh' },
                { icon: Truck, text: 'Giao sim toàn quốc, sang tên miễn phí' },
              ].map((b, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-secondary/40">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <b.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{b.text}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ===== 7. HƯỚNG DẪN CHỌN SIM GIÁ RẺ ===== */}
          <section className="bg-card rounded-xl shadow-card border border-border p-6 md:p-8">
            <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-3">
              <span className="w-1 h-8 bg-primary rounded-full" />
              Cách Chọn Sim Giá Rẻ Phù Hợp
            </h2>
            <div className="text-muted-foreground leading-relaxed space-y-4">
              <p>
                Khi tìm <strong>mua sim giá rẻ</strong>, việc chọn đúng số phù hợp sẽ giúp bạn vừa tiết kiệm vừa hài lòng lâu dài. Dưới đây là một số tiêu chí quan trọng giúp bạn đưa ra quyết định:
              </p>
              <p>
                <strong>Chọn theo ngân sách:</strong> Xác định rõ mức chi phí bạn sẵn sàng bỏ ra. Sim dưới 200k phù hợp cho nhu cầu cơ bản. Sim từ 200k–500k thường có dãy số đẹp hơn. Sim từ 500k–1 triệu là phân khúc "giá rẻ nhưng số đẹp" với nhiều lựa chọn hấp dẫn.
              </p>
              <p>
                <strong>Chọn theo đầu số:</strong> Mỗi đầu số gắn liền với nhà mạng và có độ "quen thuộc" khác nhau. Đầu số 09x thường được đánh giá cao hơn 07x hay 08x. Hãy chọn đầu số phù hợp với thói quen sử dụng và vùng phủ sóng nơi bạn sinh sống.
              </p>
              <p>
                <strong>Chọn theo nhà mạng:</strong> Nếu bạn cần phủ sóng rộng, Viettel là lựa chọn an toàn. Nếu ưu tiên data nhanh và gói cước linh hoạt, Mobifone rất phù hợp. Vinaphone thì ổn định cho người dùng truyền thống. Quan trọng là chọn nhà mạng phù hợp nhu cầu thực tế.
              </p>
              <p>
                <strong>Chọn theo <em>sim dễ nhớ giá rẻ</em>:</strong> Ưu tiên các dạng số có quy luật: số tiến (1234), số lặp (1199), số gánh (1881) hoặc số đuôi đẹp. Những <strong>sim giá rẻ dễ nhớ</strong> này giúp người khác dễ ghi nhớ số của bạn, tạo lợi thế khi giao tiếp và kinh doanh.
              </p>
            </div>
          </section>

          {/* ===== 8. FAQ ===== */}
          <section className="bg-card rounded-xl shadow-card border border-border p-6 md:p-8">
            <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-3">
              <span className="w-1 h-8 bg-primary rounded-full" />
              Câu Hỏi Thường Gặp Khi Mua Sim Giá Rẻ
            </h2>
            <Accordion type="single" collapsible className="space-y-2">
              {faqItems.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  className="border border-border rounded-lg px-4 data-[state=open]:bg-secondary/30"
                >
                  <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary hover:no-underline py-4">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
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
              Tìm Ngay Sim Giá Rẻ Phù Hợp Với Bạn
            </h2>
            <p className="text-primary-foreground/80 mb-6 max-w-lg mx-auto">
              Hàng nghìn sim giá rẻ số đẹp đang chờ bạn. Kho sim cập nhật mỗi ngày, hỗ trợ giao sim và sang tên toàn quốc.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={scrollToSims}
                className="bg-gold text-header-bg font-bold px-6 py-3 rounded-lg hover:bg-gold/90 transition flex items-center gap-2"
              >
                <Star className="w-4 h-4" /> Xem toàn bộ kho sim giá rẻ
              </button>
              <a
                href={ZALO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary-foreground/10 border border-primary-foreground/30 text-primary-foreground font-semibold px-6 py-3 rounded-lg hover:bg-primary-foreground/20 transition flex items-center gap-2"
              >
                <Phone className="w-4 h-4" /> Liên hệ tư vấn
              </a>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default MuaSimGiaRe;
