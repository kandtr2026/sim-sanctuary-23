import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Phone, Shield, Star, Truck, CheckCircle, Search, ChevronRight, Sparkles, Award, Users, DollarSign } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import { useSimData } from '@/hooks/useSimData';
import SIMCardNew from '@/components/SIMCardNew';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { NormalizedSIM } from '@/lib/simUtils';

const HOTLINE = '0901.19.1111';
const ZALO_URL = 'https://zalo.me/0901191111';

const faqItems = [
  { q: 'Sim tứ quý giá bao nhiêu?', a: 'Giá sim tứ quý dao động từ vài trăm nghìn đến hàng trăm triệu đồng, tùy thuộc vào số quý (1111, 8888, 9999...), đầu số và nhà mạng. Sim tứ quý 8 và tứ quý 9 thường có giá cao nhất do ý nghĩa phong thủy đặc biệt.' },
  { q: 'Mua sim tứ quý ở đâu uy tín?', a: 'CHONSOMOBIFONE.COM là địa chỉ uy tín để mua sim tứ quý với kho số lớn, giá minh bạch, hỗ trợ sang tên chính chủ và giao sim toàn quốc. Mọi giao dịch đều an toàn, có hóa đơn đầy đủ.' },
  { q: 'Sim tứ quý có sang tên được không?', a: 'Có. Tất cả sim tứ quý tại CHONSOMOBIFONE.COM đều hỗ trợ sang tên chính chủ miễn phí. Bạn chỉ cần mang CMND/CCCD đến cửa hàng nhà mạng gần nhất hoặc sử dụng ứng dụng My Mobifone.' },
  { q: 'Sim tứ quý nhà mạng nào tốt nhất?', a: 'Mỗi nhà mạng đều có ưu điểm riêng. Mobifone nổi bật với chất lượng cuộc gọi và data 4G/5G. Viettel có vùng phủ sóng rộng. Vinaphone phù hợp người dùng truyền thống. Quan trọng nhất là chọn số hợp phong thủy với bạn.' },
  { q: 'Sim tứ quý có hợp phong thủy không?', a: 'Sim tứ quý mang ý nghĩa phong thủy rất mạnh vì sự lặp lại 4 lần tạo nên năng lượng tập trung. Mỗi con số có ý nghĩa riêng: 1111 (khởi đầu), 6666 (lộc lá), 8888 (phát tài), 9999 (quyền lực). Bạn nên chọn số phù hợp với mệnh và tuổi.' },
  { q: 'Giao sim tứ quý mất bao lâu?', a: 'Nội thành TP.HCM và Hà Nội: 30 phút – 2 tiếng. Các tỉnh thành khác: 1–2 ngày làm việc qua chuyển phát nhanh. Thanh toán COD khi nhận hàng hoặc chuyển khoản trước.' },
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

const tuQuyTypes = [
  {
    num: '1',
    title: 'Sim Tứ Quý 1 (1111)',
    content: 'Sim tứ quý 1 mang ý nghĩa của sự khởi đầu mới, tiên phong và độc lập. Trong phong thủy, số 1 tượng trưng cho nguyên khí, sự sáng tạo và ý chí mạnh mẽ. Người sở hữu sim tứ quý 1 thường là người có tố chất lãnh đạo, thích đi đầu và không ngại thử thách. Đối tượng phù hợp nhất là doanh nhân khởi nghiệp, nhà quản lý hoặc những ai muốn bắt đầu một chương mới trong cuộc sống. Mua sim tứ quý 1 là lựa chọn thông minh cho người muốn khẳng định bản thân và xây dựng thương hiệu cá nhân từ con số may mắn.',
  },
  {
    num: '2',
    title: 'Sim Tứ Quý 2 (2222)',
    content: 'Sim tứ quý 2 đại diện cho sự cân bằng, hài hòa và hợp tác. Số 2 trong phong thủy tượng trưng cho âm dương giao hòa, mối quan hệ bền vững và sự đồng thuận. Người dùng sim tứ quý 2 thường gặp thuận lợi trong các mối quan hệ đối tác, hôn nhân và kinh doanh cần sự hợp tác. Đặc biệt phù hợp với người làm việc nhóm, nhà ngoại giao, hoặc những ai coi trọng tình cảm gia đình. Mua sim tứ quý 2 giúp thu hút năng lượng hòa hợp và mang lại sự ổn định trong cuộc sống.',
  },
  {
    num: '3',
    title: 'Sim Tứ Quý 3 (3333)',
    content: 'Sim tứ quý 3 biểu tượng cho tài lộc, thịnh vượng và sự phát triển bền vững. Số 3 gắn liền với tam tài (Thiên – Địa – Nhân), mang ý nghĩa viên mãn trong cả sự nghiệp lẫn cuộc sống. Người sở hữu sim tứ quý 3 thường gặp may mắn trong tài chính, kinh doanh phát đạt và được quý nhân phù trợ. Đối tượng lý tưởng là thương nhân, nhà đầu tư hoặc người muốn cải thiện vận tài lộc. Mua sim tứ quý 3 là cách đầu tư khôn ngoan cho vận may dài hạn.',
  },
  {
    num: '4',
    title: 'Sim Tứ Quý 4 (4444)',
    content: 'Sim tứ quý 4 mang ý nghĩa của sự ổn định, vững chắc và nền tảng bền vững. Dù nhiều người e ngại số 4, nhưng trong phong thủy, tứ tượng trưng cho bốn phương, bốn mùa – biểu hiện của sự toàn vẹn và kiên cố. Sim tứ quý 4 thường có giá mềm hơn nhưng mang giá trị thực tế cao, phù hợp với người coi trọng sự bền bỉ và kiên trì. Đối tượng phù hợp là kỹ sư, nhà xây dựng, hoặc người làm nghề cần sự chính xác. Mua sim tứ quý 4 là lựa chọn thực dụng và đáng cân nhắc.',
  },
  {
    num: '5',
    title: 'Sim Tứ Quý 5 (5555)',
    content: 'Sim tứ quý 5 tượng trưng cho sự sinh sôi, phát triển và biến đổi tích cực. Số 5 đứng giữa thập phân, mang ý nghĩa trung tâm, cân bằng giữa các yếu tố. Trong ngũ hành, số 5 liên quan đến hành Thổ – nền tảng của mọi sự phát triển. Người dùng sim tứ quý 5 thường linh hoạt, sáng tạo và có khả năng thích nghi cao. Phù hợp với doanh nhân đa ngành, người làm truyền thông hoặc freelancer. Mua sim tứ quý 5 giúp kích hoạt năng lượng sáng tạo và mở rộng cơ hội.',
  },
  {
    num: '6',
    title: 'Sim Tứ Quý 6 (6666)',
    content: 'Sim tứ quý 6 là biểu tượng của lộc lá, thuận lợi và may mắn trong mọi việc. Số 6 trong văn hóa Á Đông được xem là "lục lộc" – phú quý, bình an. Sim tứ quý 6 là một trong những số được săn đón nhiều nhất vì mang lại cảm giác thịnh vượng và hanh thông. Đối tượng phù hợp rộng: từ doanh nhân, nhân viên văn phòng đến người kinh doanh tự do. Mua sim tứ quý 6 là cách đầu tư vào vận lộc cá nhân, vừa đẹp vừa mang ý nghĩa tích cực.',
  },
  {
    num: '7',
    title: 'Sim Tứ Quý 7 (7777)',
    content: 'Sim tứ quý 7 đại diện cho sức mạnh, quyết đoán và thành công. Số 7 được coi là con số may mắn trong nhiều nền văn hóa trên thế giới, tượng trưng cho sự hoàn thiện và chiến thắng. Người sở hữu sim tứ quý 7 thường toát lên phong thái tự tin, có sức ảnh hưởng mạnh mẽ. Đặc biệt phù hợp với người làm lãnh đạo, luật sư, bác sĩ hoặc những ngành nghề đòi hỏi uy tín. Mua sim tứ quý 7 không chỉ là chọn số đẹp mà còn là đầu tư vào hình ảnh cá nhân.',
  },
  {
    num: '8',
    title: 'Sim Tứ Quý 8 (8888)',
    content: 'Sim tứ quý 8 là ông vua trong các sim số đẹp, mang ý nghĩa "phát" – phát tài, phát đạt, phát triển. Số 8 là con số được yêu thích nhất trong phong thủy Á Đông, tượng trưng cho sự giàu có và thịnh vượng vô tận. Sim tứ quý 8 luôn nằm trong top tìm kiếm và có giá trị tăng theo thời gian. Phù hợp với doanh nhân, nhà đầu tư, người kinh doanh muốn thu hút tài lộc. Mua sim tứ quý 8 là quyết định đầu tư giá trị, vừa sử dụng vừa có thể tăng giá.',
  },
  {
    num: '9',
    title: 'Sim Tứ Quý 9 (9999)',
    content: 'Sim tứ quý 9 tượng trưng cho đỉnh cao, quyền lực và sự trường tồn. Số 9 là con số lớn nhất trong hàng đơn vị, mang ý nghĩa cửu trùng – vĩnh cửu, bất diệt. Người sở hữu sim tứ quý 9 thường có tham vọng lớn, muốn đạt đến đỉnh cao sự nghiệp và được xã hội tôn trọng. Đối tượng phù hợp: CEO, chính trị gia, người có vị thế xã hội cao. Mua sim tứ quý 9 không chỉ khẳng định đẳng cấp mà còn mang lại năng lượng mạnh mẽ cho chủ nhân.',
  },
];

const fengShuiTable = [
  { sim: '1111', meaning: 'Sự khởi đầu, tiên phong, độc lập' },
  { sim: '2222', meaning: 'Cân bằng, hài hòa, hợp tác' },
  { sim: '3333', meaning: 'Tài lộc, thịnh vượng, phát triển' },
  { sim: '4444', meaning: 'Ổn định, vững chắc, bền bỉ' },
  { sim: '5555', meaning: 'Sinh sôi, sáng tạo, linh hoạt' },
  { sim: '6666', meaning: 'Lộc lá, thuận lợi, may mắn' },
  { sim: '7777', meaning: 'Sức mạnh, quyết đoán, thành công' },
  { sim: '8888', meaning: 'Phát tài, phát đạt, thịnh vượng' },
  { sim: '9999', meaning: 'Quyền lực, đỉnh cao, trường tồn' },
];

const sampleSims = [
  { number: '0909.1111.88', carrier: 'Mobifone', price: '45 triệu' },
  { number: '0933.2222.68', carrier: 'Mobifone', price: '28 triệu' },
  { number: '0903.3333.99', carrier: 'Mobifone', price: '65 triệu' },
  { number: '0789.4444.86', carrier: 'Mobifone', price: '12 triệu' },
  { number: '0938.5555.79', carrier: 'Mobifone', price: '35 triệu' },
  { number: '0908.6666.39', carrier: 'Mobifone', price: '88 triệu' },
  { number: '0937.7777.68', carrier: 'Mobifone', price: '55 triệu' },
  { number: '0909.8888.68', carrier: 'Mobifone', price: '150 triệu' },
  { number: '0939.9999.86', carrier: 'Mobifone', price: '120 triệu' },
];

const benefits = [
  { icon: Star, text: 'Kho sim tứ quý lớn nhất' },
  { icon: Shield, text: 'Giao dịch an toàn, bảo mật' },
  { icon: CheckCircle, text: 'Sang tên chính chủ miễn phí' },
  { icon: DollarSign, text: 'Giá cạnh tranh, minh bạch' },
  { icon: Truck, text: 'Giao sim toàn quốc nhanh chóng' },
  { icon: Users, text: 'Hỗ trợ tư vấn 24/7' },
];

const MuaSimTuQuy = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { allSims, isLoading } = useSimData();

  // Filter SIMs that contain 4 repeated digits (tứ quý) - default display
  const tuQuySims = useMemo(() => {
    const pattern = /(0{4}|1{4}|2{4}|3{4}|4{4}|5{4}|6{4}|7{4}|8{4}|9{4})/;
    return allSims
      .filter((s) => {
        const digits = s.rawDigits || s.displayNumber?.replace(/\D/g, '') || '';
        return pattern.test(digits) && s.price > 0;
      })
      .sort((a, b) => a.price - b.price)
      .slice(0, 24);
  }, [allSims]);

  // Search results: query ALL sims, not just tứ quý
  const searchResults = useMemo(() => {
    if (!activeSearch.trim()) return null;
    const raw = activeSearch.replace(/\s/g, '');
    
    // Suffix search: *7777 → ends with 7777
    if (raw.startsWith('*')) {
      const suffix = raw.slice(1).replace(/\D/g, '');
      if (!suffix) return null;
      return allSims
        .filter((s) => {
          const digits = s.rawDigits || s.displayNumber?.replace(/\D/g, '') || '';
          return digits.endsWith(suffix);
        })
        .sort((a, b) => a.price - b.price)
        .slice(0, 60);
    }
    
    // Default: contains search
    const q = raw.replace(/\D/g, '');
    if (!q) return null;
    return allSims
      .filter((s) => {
        const digits = s.rawDigits || s.displayNumber?.replace(/\D/g, '') || '';
        return digits.includes(q);
      })
      .sort((a, b) => a.price - b.price)
      .slice(0, 60);
  }, [allSims, activeSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setActiveSearch(searchQuery);
    // Simulate brief loading for UX
    setTimeout(() => setIsSearching(false), 300);
    // Scroll to results
    setTimeout(() => {
      document.getElementById('kho-sim-tu-quy')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setActiveSearch('');
  };

  const displaySims = searchResults ?? tuQuySims;
  const hasActiveSearch = !!activeSearch.trim();

  const scrollToSims = () => {
    document.getElementById('kho-sim-tu-quy')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <>
      <Helmet>
        <title>Mua Sim Tứ Quý Giá Tốt | Kho Sim Tứ Quý Đẹp Toàn Quốc</title>
        <meta name="description" content="Kho sim tứ quý đẹp giá tốt từ CHONSOMOBIFONE.COM. Hàng nghìn sim 1111, 6666, 8888, 9999 cập nhật mỗi ngày. Mua sim tứ quý uy tín, giao dịch an toàn." />
        <link rel="canonical" href="https://chonsomobifone.com/mua-sim-tu-quy" />
        <meta property="og:title" content="Mua Sim Tứ Quý Giá Tốt | Kho Sim Tứ Quý Đẹp Toàn Quốc" />
        <meta property="og:description" content="Kho sim tứ quý đẹp giá tốt. Hàng nghìn sim 1111, 6666, 8888, 9999 cập nhật mỗi ngày." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://chonsomobifone.com/mua-sim-tu-quy" />
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <Header />
      <Navigation />

      <main className="min-h-screen bg-background">
        {/* ===== 1. HERO SECTION ===== */}
        <section className="bg-gradient-to-br from-primary via-primary-dark to-primary text-primary-foreground">
          <div className="container mx-auto px-4 py-12 md:py-16 lg:py-20 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-14 h-14 rounded-full bg-gold/20 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-gold" />
              </div>
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 leading-tight">
              Mua Sim Tứ Quý Giá Tốt – Kho Sim Tứ Quý Đẹp Toàn Quốc
            </h1>
            <p className="text-primary-foreground/85 text-base md:text-lg max-w-2xl mx-auto mb-8">
              Kho sim tứ quý đẹp với hàng nghìn số từ Viettel, Mobifone và Vinaphone. Giao dịch an toàn, hỗ trợ sang tên chính chủ và giao sim toàn quốc.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="max-w-xl mx-auto mb-6">
              <div className="flex bg-card rounded-lg overflow-hidden shadow-lg">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="tel"
                    inputMode="tel"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nhập số tứ quý cần tìm..."
                    className="w-full pl-12 pr-4 py-4 bg-card text-foreground text-base focus:outline-none"
                  />
                </div>
                <button type="submit" className="btn-cta px-6 flex items-center gap-2 rounded-none">
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Tìm SIM</span>
                </button>
              </div>
            </form>

            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={scrollToSims} className="bg-gold text-header-bg font-bold px-6 py-3 rounded-lg hover:bg-gold/90 transition flex items-center gap-2">
                <Star className="w-4 h-4" /> Xem kho sim
              </button>
              <a href={ZALO_URL} target="_blank" rel="noopener noreferrer" className="bg-primary-foreground/10 border border-primary-foreground/30 text-primary-foreground font-semibold px-6 py-3 rounded-lg hover:bg-primary-foreground/20 transition flex items-center gap-2">
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
                Sim tứ quý là loại sim số đẹp có 4 chữ số giống nhau liên tiếp trong dãy số điện thoại, ví dụ như 1111, 6666, 8888 hay 9999. Đây là một trong những dòng sim được săn đón nhiều nhất trên thị trường nhờ tính thẩm mỹ cao, dễ nhớ và mang ý nghĩa phong thủy sâu sắc.
              </p>
              <p>
                Vì sao nhiều người tìm <strong>mua sim tứ quý</strong>? Trước hết, sim tứ quý tạo ấn tượng mạnh mẽ ngay từ lần đầu tiên. Bốn con số lặp lại liên tiếp không chỉ dễ nhớ mà còn thể hiện đẳng cấp và phong cách của người sở hữu. Trong kinh doanh, một số điện thoại đẹp giúp tăng độ tin cậy và chuyên nghiệp khi giao dịch với đối tác, khách hàng.
              </p>
              <p>
                Về phong thủy, mỗi con số mang một nguồn năng lượng riêng. Khi 4 con số giống nhau kết hợp, năng lượng đó được khuếch đại gấp bội, tạo nên sức mạnh phong thủy đặc biệt. Người Việt tin rằng chọn sim phù hợp với mệnh và tuổi sẽ mang lại vận may, tài lộc và sự thuận lợi trong mọi việc. Ngoài ra, sim tứ quý còn là tài sản có giá trị tăng theo thời gian, vừa sử dụng hàng ngày vừa có thể đầu tư sinh lời.
              </p>
            </div>
          </section>

          {/* ===== 3. SIM TỨ QUÝ NỔI BẬT (sample table) ===== */}
          <section className="bg-card rounded-xl shadow-card border border-border p-6 md:p-8">
            <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-3">
              <span className="w-1 h-8 bg-primary rounded-full" />
              Sim Tứ Quý Nổi Bật
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Số SIM</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Nhà mạng</th>
                    <th className="text-right py-3 px-4 font-semibold text-foreground">Giá</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleSims.map((s, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-foreground tracking-wide">{s.number}</td>
                      <td className="py-3 px-4 text-muted-foreground">{s.carrier}</td>
                      <td className="py-3 px-4 text-right font-semibold text-primary">{s.price}</td>
                      <td className="py-3 px-4 text-center">
                        <a href={`tel:+84901191111`} className="inline-flex items-center gap-1 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-semibold hover:bg-primary/90 transition">
                          <Phone className="w-3 h-3" /> Liên hệ
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-xs text-muted-foreground italic">* Giá minh họa, liên hệ hotline {HOTLINE} để nhận báo giá chính xác.</p>
          </section>

          {/* ===== 3b. KHO SIM TỨ QUÝ THỰC TẾ ===== */}
          <section id="kho-sim-tu-quy" className="bg-card rounded-xl shadow-card border border-border p-6 md:p-8">
            <h2 className="text-2xl font-bold text-primary mb-4 flex items-center gap-3">
              <span className="w-1 h-8 bg-primary rounded-full" />
              {hasActiveSearch ? `Kết quả tìm kiếm "${activeSearch}"` : 'Kho Sim Tứ Quý Cập Nhật'}
            </h2>
            {hasActiveSearch && (
              <button onClick={clearSearch} className="mb-4 text-sm text-primary hover:underline">
                ← Quay lại kho sim tứ quý
              </button>
            )}
            {isLoading || isSearching ? (
              <div className="text-center py-8 text-muted-foreground">Đang tải kho sim...</div>
            ) : displaySims.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {displaySims.map((sim) => (
                  <SIMCardNew key={sim.id} sim={sim} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                {hasActiveSearch
                  ? 'Không tìm thấy sim chứa chuỗi số bạn đang tìm. Vui lòng thử số khác.'
                  : `Không tìm thấy sim tứ quý phù hợp. Vui lòng liên hệ hotline ${HOTLINE} để được tư vấn.`}
              </div>
            )}
            <div className="mt-6 text-center">
              <button onClick={() => navigate('/')} className="btn-cta inline-flex items-center gap-2 px-6 py-3">
                Xem toàn bộ kho sim <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </section>

          {/* ===== 4. CÁC LOẠI SIM TỨ QUÝ ===== */}
          <section className="space-y-8">
            <h2 className="text-2xl font-bold text-primary flex items-center gap-3">
              <span className="w-1 h-8 bg-primary rounded-full" />
              Các Loại Sim Tứ Quý Phổ Biến
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tuQuyTypes.map((t) => (
                <article key={t.num} className="bg-card rounded-xl shadow-card border border-border p-5 hover:border-primary/30 transition-colors">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-black text-primary">{t.num}</span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{t.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{t.content}</p>
                </article>
              ))}
            </div>
          </section>

          {/* ===== 5. LÝ DO NÊN MUA ===== */}
          <section className="bg-card rounded-xl shadow-card border border-border p-6 md:p-8">
            <h2 className="text-2xl font-bold text-primary mb-6 flex items-center gap-3">
              <span className="w-1 h-8 bg-primary rounded-full" />
              Lý Do Nên Mua Sim Tứ Quý Tại CHONSOMOBIFONE
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-secondary/40">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <b.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground">{b.text}</span>
                </div>
              ))}
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
                Khi <strong>mua sim tứ quý</strong>, điều quan trọng nhất là chọn đúng số phù hợp với nhu cầu và ngân sách. Dưới đây là một số tiêu chí giúp bạn đưa ra quyết định:
              </p>
              <p>
                <strong>Chọn theo tài chính:</strong> Sim tứ quý có nhiều mức giá từ vài trăm nghìn (tứ quý 4) đến hàng trăm triệu (tứ quý 8, 9). Hãy xác định ngân sách trước để thu hẹp lựa chọn. Sim tứ quý 4, 5 thường có giá mềm nhưng vẫn rất đẹp và ý nghĩa.
              </p>
              <p>
                <strong>Chọn theo phong thủy:</strong> Xem xét mệnh ngũ hành của bạn (Kim, Mộc, Thủy, Hỏa, Thổ) và chọn con số tương sinh. Ví dụ, người mệnh Thủy nên chọn số 1 (hành Thủy) hoặc số 6 (hành Kim sinh Thủy).
              </p>
              <p>
                <strong>Chọn theo nhà mạng:</strong> Mỗi nhà mạng có chất lượng dịch vụ và vùng phủ sóng khác nhau. Mobifone mạnh về data 4G/5G, Viettel phủ sóng rộng nhất, Vinaphone ổn định cho người dùng lâu năm.
              </p>
              <p>
                <strong>Chọn theo đầu số:</strong> Đầu số cũng ảnh hưởng đến giá và tính thẩm mỹ. Các đầu số 09x thường đắt hơn 07x, 08x. Hãy cân nhắc tổng thể cả dãy số để có sự kết hợp hài hòa nhất.
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
                  {fengShuiTable.map((row, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="py-3 px-4 font-bold text-primary text-base">{row.sim}</td>
                      <td className="py-3 px-4 text-muted-foreground">{row.meaning}</td>
                    </tr>
                  ))}
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
              Sở Hữu Ngay Sim Tứ Quý Đẹp Cho Bạn
            </h2>
            <p className="text-primary-foreground/80 mb-6 max-w-lg mx-auto">
              Hàng nghìn sim tứ quý đẹp đang chờ bạn. Liên hệ ngay để được tư vấn chọn số hợp phong thủy và nhận giá tốt nhất.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={scrollToSims} className="bg-gold text-header-bg font-bold px-6 py-3 rounded-lg hover:bg-gold/90 transition flex items-center gap-2">
                <Star className="w-4 h-4" /> Xem kho sim tứ quý
              </button>
              <a href={ZALO_URL} target="_blank" rel="noopener noreferrer" className="bg-primary-foreground/10 border border-primary-foreground/30 text-primary-foreground font-semibold px-6 py-3 rounded-lg hover:bg-primary-foreground/20 transition flex items-center gap-2">
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

export default MuaSimTuQuy;
