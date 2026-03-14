import { useState, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Phone, Shield, Star, Truck, CheckCircle, Search, ChevronRight, ChevronLeft, Sparkles, Award, Users, DollarSign, Tag, X, Loader2 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import { useCheapSimData } from '@/hooks/useCheapSimData';
import { useIsMobile } from '@/hooks/use-mobile';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const HOTLINE = '0901.19.1111';
const ZALO_URL = 'https://zalo.me/0901191111';
const ORDER_WEBAPP_URL = "https://script.google.com/macros/s/AKfycby_3QYkdJSBo43QiJlJ88rSLCsXN7baZtnW5v9VeF3AZJAVzZOjB35bhfFCHZBrVwA/exec";
const MAKE_WEBHOOK_PROXY = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/make-webhook-proxy`;

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

// ===== LOCAL TYPES =====
interface CheapSimNormalized {
  id: string;
  rawDigits: string;
  displayNumber: string;
  formattedNumber: string;
  price: number;
  prefix3: string;
  prefix4: string;
  last2: string;
  last3: string;
  last4: string;
  last5: string;
  last6: string;
  digitCounts: number[];
  sumDigits: number;
  tags: string[];
  isVIP: boolean;
  network: string;
  beautyScore: number;
}

// ===== LOCAL SIM CARD (same style as SIMCardNew, but opens modal) =====
const networkColors: Record<string, string> = {
  Mobifone: 'bg-primary text-primary-foreground',
  Vinaphone: 'bg-blue-500 text-white',
  Gmobile: 'bg-emerald-600 text-white',
};

const formatPriceDisplay = (price: number): string => {
  if (!price || isNaN(price) || price <= 0) return 'Liên hệ';
  if (price >= 1000000000) {
    const b = Math.round((price / 1000000000) * 10) / 10;
    return Number.isInteger(b) ? `${b} tỷ` : `${b.toString().replace('.', ',')} tỷ`;
  }
  if (price >= 1000000) {
    const m = Math.round((price / 1000000) * 10) / 10;
    return Number.isInteger(m) ? `${m} triệu` : `${m.toString().replace('.', ',')} triệu`;
  }
  return `${price.toLocaleString('vi-VN')} đ`;
};

const CheapSimCard = ({ sim, onBuy }: { sim: CheapSimNormalized; onBuy: (sim: CheapSimNormalized) => void }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const formatWithHighlight = (displayNumber: string) => {
    const parts = displayNumber.split('.');
    if (parts.length === 3) {
      return (
        <>
          <span className="opacity-80">{parts[0]}.</span>
          <span className="opacity-80">{parts[1]}.</span>
          <span className="text-gold font-extrabold">{parts[2]}</span>
        </>
      );
    }
    return displayNumber;
  };

  return (
    <div
      className="sim-card-compact group relative overflow-visible md:p-2 p-1 md:min-h-[140px] min-h-[auto]"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* TK179 Hover Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none hidden md:block">
          <div className="bg-card border border-border rounded-lg shadow-lg p-3 whitespace-nowrap text-xs space-y-1">
            <p className="font-bold text-gold text-sm">Ưu đãi gói TK179</p>
            <p className="text-foreground">✔ SIM Mobifone chỉ 229.000đ</p>
            <p className="text-foreground">✔ Tặng gói TK179</p>
            <p className="text-foreground">✔ 7GB data/ngày</p>
            <p className="text-foreground">✔ 200 phút liên mạng</p>
            <p className="text-foreground">✔ Miễn phí nội mạng</p>
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent border-t-border" />
          </div>
        </div>
      )}

      <div className="flex items-center gap-0.5 md:gap-1 mb-1 md:mb-1.5 flex-wrap max-w-full">
        {sim.network && sim.network !== 'Khác' && (
          <span
            className={cn("px-1 md:px-1.5 py-px rounded font-medium", networkColors[sim.network] || 'bg-gray-500 text-white')}
            style={{ fontSize: 'clamp(7px, 1.6vw, 11px)' }}
          >
            {sim.network}
          </span>
        )}
      </div>

      {/* Sim number - larger on mobile */}
      <div
        className="sim-number-auto mb-1 md:mb-1.5 group-hover:gold-glow transition-all whitespace-nowrap overflow-hidden text-ellipsis md:text-[clamp(14px,3.5vw,22px)] text-[clamp(14px,4.2vw,20px)]"
      >
        {formatWithHighlight(sim.displayNumber || sim.formattedNumber)}
      </div>

      {/* Desktop: price + button inline | Mobile: stacked */}
      <div className="hidden md:flex items-center justify-between mt-auto pt-1">
        <span
          className="font-bold"
          style={{ fontSize: 'clamp(14px, 3vw, 21px)', color: '#FFFFFF' }}
        >
          {formatPriceDisplay(sim.price)}
        </span>
        <button
          onClick={() => onBuy(sim)}
          className="btn-cta-sm flex items-center gap-1 py-1 px-2"
          style={{ fontSize: 'clamp(8px, 1.8vw, 11px)' }}
        >
          <Phone style={{ width: 'clamp(8px, 1.8vw, 12px)', height: 'clamp(8px, 1.8vw, 12px)' }} />
          MUA NGAY
        </button>
      </div>

      {/* Mobile only: stacked price + button */}
      <div className="flex md:hidden flex-col gap-0.5 mt-auto">
        <span className="font-bold text-sm" style={{ color: '#FFFFFF' }}>
          {formatPriceDisplay(sim.price)}
        </span>
        <button
          onClick={() => onBuy(sim)}
          className="btn-cta-sm flex items-center justify-center gap-1 py-1 px-1.5 w-full"
          style={{ fontSize: 'clamp(9px, 2.5vw, 12px)' }}
        >
          <Phone className="w-3 h-3" />
          MUA NGAY
        </button>
      </div>
    </div>
  );
};

// ===== MAIN PAGE =====
const MuaSimGiaRe = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showFullInventory, setShowFullInventory] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const fullInventoryRef = useRef<HTMLDivElement>(null);
  const { sims: cheapSimsRaw, isLoading } = useCheapSimData();
  const isMobile = useIsMobile();
  const ITEMS_PER_PAGE = isMobile ? 20 : 30;

  // Order modal state
  const [selectedSim, setSelectedSim] = useState<CheapSimNormalized | null>(null);
  const [orderOpen, setOrderOpen] = useState(false);
  const [formData, setFormData] = useState({ fullName: '', phone: '', address: '', note: '', paymentMethod: 'COD' as 'COD' | 'BANK' });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [confirmationData, setConfirmationData] = useState<{ orderCode: string; fullName: string; phone: string; address: string } | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const handleBuy = (sim: CheapSimNormalized) => {
    setSelectedSim(sim);
    setFormData({ fullName: '', phone: '', address: '', note: '', paymentMethod: 'COD' });
    setFormErrors({});
    setIsSuccess(false);
    setOrderOpen(true);
  };

  const normalizeName = (v: string) => v.trim().replace(/\s{2,}/g, ' ');
  const normalizePhone = (v: string) => v.replace(/\D/g, '');
  const normalizeAddress = (v: string) => v.trim().replace(/\s{2,}/g, ' ');

  const validateForm = () => {
    const errs: Record<string, string> = {};

    // Name validation
    const name = normalizeName(formData.fullName);
    const nameRegex = /^[a-zA-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ\s]+$/;
    if (!name || name.length < 20 || name.length > 50 || !nameRegex.test(name)) {
      errs.fullName = 'Họ tên phải từ 20 đến 50 ký tự và không chứa số hoặc ký tự đặc biệt.';
    }

    // Phone validation
    const phone = normalizePhone(formData.phone);
    if (phone.length !== 10) {
      errs.phone = 'Số điện thoại phải gồm đúng 10 chữ số.';
    }

    // Address validation
    const address = normalizeAddress(formData.address);
    if (!address || address.length < 20 || address.length > 200) {
      errs.address = 'Địa chỉ nhận hàng phải từ 20 đến 200 ký tự.';
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const generateOrderCode = () => {
    const ts = Date.now();
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORD${ts}${rand}`;
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !selectedSim) return;
    setIsSubmitting(true);

    const orderCode = generateOrderCode();
    const cleanName = normalizeName(formData.fullName);
    const cleanPhone = normalizePhone(formData.phone);
    const cleanAddress = normalizeAddress(formData.address);

    const payload = {
      orderCode,
      createdAt: new Date().toISOString(),
      simId: selectedSim.id,
      simRawDigits: selectedSim.rawDigits,
      simDisplayNumber: selectedSim.displayNumber,
      originalPriceVnd: selectedSim.price,
      priceVnd: selectedSim.price,
      fullName: cleanName,
      phone: cleanPhone,
      address: cleanAddress,
      note: formData.note.trim(),
      paymentMethod: formData.paymentMethod,
      source: 'LovableWeb-CheapSim',
    };

    try {
      const res = await fetch(MAKE_WEBHOOK_PROXY, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      fetch(ORDER_WEBAPP_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        mode: 'no-cors',
      }).catch(() => {});

      setConfirmationData({ orderCode, fullName: cleanName, phone: cleanPhone, address: cleanAddress });
      setIsSuccess(true);
      toast.success('Đặt hàng thành công!');
    } catch {
      toast.error('Có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) setFormErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // Map cheap sims to NormalizedSIM shape
  const allCheapSims: CheapSimNormalized[] = useMemo(() => {
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
        network: s.network,
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
      return allCheapSims.filter((s) => (s.rawDigits || s.displayNumber?.replace(/\D/g, '') || '').endsWith(suffix)).slice(0, 60);
    }
    const q = raw.replace(/\D/g, '');
    if (!q) return null;
    return allCheapSims.filter((s) => (s.rawDigits || s.displayNumber?.replace(/\D/g, '') || '').includes(q)).slice(0, 60);
  }, [allCheapSims, activeSearch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    setActiveSearch(searchQuery);
    setCurrentPage(1);
    setTimeout(() => setIsSearching(false), 300);
    setTimeout(() => {
      document.getElementById('kho-sim-gia-re')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setActiveSearch('');
    setCurrentPage(1);
  };

  const hasActiveSearch = !!activeSearch.trim();

  const scrollToSims = () => {
    setSearchQuery('');
    setActiveSearch('');
    setCurrentPage(1);
    setTimeout(() => {
      document.getElementById('kho-sim-gia-re')?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
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
        <meta property="og:description" content="Kho sim giá rẻ với hàng nghìn số đẹp dễ nhớ. Giá chỉ từ vài chục nghìn, cập nhật mỗi ngày." />
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
              Mua Sim Giá Rẻ – KHO SIM ĐỒNG GIÁ 229K CAM KẾT RẺ NHẤT HỆ MẶT TRỜI
            </h1>
            <p className="text-primary-foreground/80 text-sm md:text-base leading-relaxed max-w-xl mx-auto mb-4">
              Kho sim giá rẻ với hàng nghìn số đẹp từ CHONSOMOBIFONE.COM. Giá chỉ 229k tặng kèm gói cước TK179 thoải mái lướt web, chơi game, xem phim thả ga, phù hợp mọi nhu cầu mọi lứa tuổi.
            </p>
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
                <button type="submit" className="btn-cta px-5 md:px-7 flex items-center gap-2 rounded-none text-sm md:text-base font-bold whitespace-nowrap">
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Tìm SIM</span>
                </button>
              </div>
            </form>
            <div className="flex flex-col sm:flex-row justify-center gap-2.5 max-w-md mx-auto">
              <button onClick={scrollToSims} className="bg-gold hover:bg-gold-light text-header-bg font-bold px-7 py-2.5 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                <Star className="w-4 h-4" /> Xem kho sim giá rẻ
              </button>
              <a href={ZALO_URL} target="_blank" rel="noopener noreferrer" className="bg-primary-foreground/10 border border-primary-foreground/25 text-primary-foreground font-semibold px-7 py-2.5 rounded-lg hover:bg-primary-foreground/20 transition-all duration-200 flex items-center justify-center gap-2">
                <Phone className="w-4 h-4" /> Tư vấn chọn sim
              </a>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8 md:py-12 space-y-12 md:space-y-16">
          {/* Section "Kho Sim Giá Rẻ Cập Nhật" đã được xóa theo yêu cầu */}

          {/* ===== FULL INVENTORY WITH PAGINATION ===== */}
          {showFullInventory && (
            <section ref={fullInventoryRef} className="bg-card rounded-xl shadow-card border border-border p-6 md:p-8">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <h2 className="text-2xl font-bold text-primary flex items-center gap-3">
                  <span className="w-1 h-8 bg-primary rounded-full" />
                  {hasActiveSearch ? `Kết quả tìm kiếm "${activeSearch}"` : 'KHO SIM ĐỒNG GIÁ 229K'}
                </h2>
                {hasActiveSearch && (
                  <button
                    onClick={clearSearch}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-border bg-card hover:bg-secondary/50 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" /> Xóa tìm kiếm
                  </button>
                )}
              </div>
              {(() => {
                if (isSearching) {
                  return (
                    <div className="flex items-center justify-center py-12 gap-3">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      <span className="text-muted-foreground">Đang tìm kiếm...</span>
                    </div>
                  );
                }

                const sourceData = hasActiveSearch ? (searchResults ?? []) : allCheapSims;

                if (hasActiveSearch && sourceData.length === 0) {
                  return (
                    <div className="text-center py-12">
                      <Search className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                      <p className="text-lg font-medium text-foreground mb-1">Không tìm thấy sim phù hợp với số bạn đang tìm.</p>
                      <p className="text-sm text-muted-foreground">Thử nhập chuỗi số khác hoặc ngắn hơn.</p>
                    </div>
                  );
                }

                const totalPages = Math.ceil(sourceData.length / ITEMS_PER_PAGE);
                const safePage = Math.min(currentPage, totalPages || 1);
                const startIdx = (safePage - 1) * ITEMS_PER_PAGE;
                const pageSims = sourceData.slice(startIdx, startIdx + ITEMS_PER_PAGE);

                if (isLoading) {
                  return (
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="animate-pulse rounded-xl border border-border bg-card p-4 space-y-3">
                          <div className="h-4 w-16 bg-muted rounded" />
                          <div className="h-6 w-full bg-muted rounded" />
                          <div className="h-4 w-20 bg-muted rounded" />
                          <div className="h-8 w-full bg-muted rounded" />
                        </div>
                      ))}
                    </div>
                  );
                }

                if (pageSims.length === 0) {
                  return (
                    <div className="text-center py-8 text-muted-foreground">
                      Hiện chưa có sim giá rẻ trong kho. Vui lòng quay lại sau.
                    </div>
                  );
                }

                const getPageNumbers = () => {
                  const pages: (number | '...')[] = [];
                  if (totalPages <= 7) {
                    for (let i = 1; i <= totalPages; i++) pages.push(i);
                  } else {
                    pages.push(1);
                    if (safePage > 3) pages.push('...');
                    for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i);
                    if (safePage < totalPages - 2) pages.push('...');
                    pages.push(totalPages);
                  }
                  return pages;
                };

                const handlePageChange = (page: number) => {
                  setCurrentPage(page);
                  setTimeout(() => fullInventoryRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
                };

                return (
                  <>
                    <p className="text-sm text-muted-foreground mb-4">
                      Hiển thị {startIdx + 1}–{Math.min(startIdx + ITEMS_PER_PAGE, sourceData.length)} trong tổng số {sourceData.length} sim
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-3">
                      {pageSims.map((sim) => (
                        <CheapSimCard key={sim.id} sim={sim} onBuy={handleBuy} />
                      ))}
                    </div>
                    {totalPages > 1 && (
                      <div className="flex items-center justify-center gap-1.5 mt-6 flex-wrap">
                        <button
                          onClick={() => handlePageChange(Math.max(1, safePage - 1))}
                          disabled={safePage === 1}
                          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border border-border bg-card hover:bg-secondary/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" /> Trước
                        </button>
                        {getPageNumbers().map((p, i) =>
                          p === '...' ? (
                            <span key={`e-${i}`} className="px-2 py-2 text-muted-foreground text-sm">…</span>
                          ) : (
                            <button
                              key={p}
                              onClick={() => handlePageChange(p)}
                              className={`min-w-[36px] h-9 rounded-lg text-sm font-medium transition-colors ${
                                safePage === p
                                  ? 'bg-primary text-primary-foreground'
                                  : 'border border-border bg-card hover:bg-secondary/50 text-foreground'
                              }`}
                            >
                              {p}
                            </button>
                          )
                        )}
                        <button
                          onClick={() => handlePageChange(Math.min(totalPages, safePage + 1))}
                          disabled={safePage === totalPages}
                          className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium border border-border bg-card hover:bg-secondary/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          Sau <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
            </section>
          )}



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
              <p>Khi tìm <strong>mua sim giá rẻ</strong>, việc chọn đúng số phù hợp sẽ giúp bạn vừa tiết kiệm vừa hài lòng lâu dài. Dưới đây là một số tiêu chí quan trọng giúp bạn đưa ra quyết định:</p>
              <p><strong>Chọn theo ngân sách:</strong> Xác định rõ mức chi phí bạn sẵn sàng bỏ ra. Sim dưới 200k phù hợp cho nhu cầu cơ bản. Sim từ 200k–500k thường có dãy số đẹp hơn. Sim từ 500k–1 triệu là phân khúc "giá rẻ nhưng số đẹp" với nhiều lựa chọn hấp dẫn.</p>
              <p><strong>Chọn theo đầu số:</strong> Mỗi đầu số gắn liền với nhà mạng và có độ "quen thuộc" khác nhau. Đầu số 09x thường được đánh giá cao hơn 07x hay 08x. Hãy chọn đầu số phù hợp với thói quen sử dụng và vùng phủ sóng nơi bạn sinh sống.</p>
              <p><strong>Chọn theo nhà mạng:</strong> Nếu bạn cần phủ sóng rộng, Viettel là lựa chọn an toàn. Nếu ưu tiên data nhanh và gói cước linh hoạt, Mobifone rất phù hợp. Vinaphone thì ổn định cho người dùng truyền thống. Quan trọng là chọn nhà mạng phù hợp nhu cầu thực tế.</p>
              <p><strong>Chọn theo <em>sim dễ nhớ giá rẻ</em>:</strong> Ưu tiên các dạng số có quy luật: số tiến (1234), số lặp (1199), số gánh (1881) hoặc số đuôi đẹp. Những <strong>sim giá rẻ dễ nhớ</strong> này giúp người khác dễ ghi nhớ số của bạn, tạo lợi thế khi giao tiếp và kinh doanh.</p>
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
                <AccordionItem key={index} value={`faq-${index}`} className="border border-border rounded-lg px-4 data-[state=open]:bg-secondary/30">
                  <AccordionTrigger className="text-left font-medium text-foreground hover:text-primary hover:no-underline py-4">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-4">{faq.a}</AccordionContent>
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
            <h2 className="text-2xl md:text-3xl font-bold mb-3">Tìm Ngay Sim Giá Rẻ Phù Hợp Với Bạn</h2>
            <p className="text-primary-foreground/80 mb-6 max-w-lg mx-auto">Hàng nghìn sim giá rẻ số đẹp đang chờ bạn. Kho sim cập nhật mỗi ngày, hỗ trợ giao sim và sang tên toàn quốc.</p>
            <div className="flex justify-center">
              <a href={ZALO_URL} target="_blank" rel="noopener noreferrer" className="bg-primary-foreground/10 border border-primary-foreground/30 text-primary-foreground font-semibold px-6 py-3 rounded-lg hover:bg-primary-foreground/20 transition flex items-center gap-2">
                <Phone className="w-4 h-4" /> Liên hệ tư vấn
              </a>
            </div>
          </section>
        </div>
      </main>

      <Footer />

      {/* ===== ORDER MODAL ===== */}
      <Dialog open={orderOpen} onOpenChange={(open) => { if (!open) { setOrderOpen(false); } }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          {isSuccess && confirmationData ? (
            <div className="py-4">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground text-center mb-4">Xác nhận thông tin đơn hàng</h2>
              <div className="bg-secondary/30 rounded-lg p-4 space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mã đơn hàng:</span>
                  <span className="font-semibold text-foreground">{confirmationData.orderCode}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Họ tên:</span>
                  <span className="font-medium text-foreground">{confirmationData.fullName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Số điện thoại:</span>
                  <span className="font-medium text-foreground">{confirmationData.phone}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Địa chỉ nhận hàng:</span>
                  <span className="font-medium text-foreground text-right max-w-[60%]">{confirmationData.address}</span>
                </div>
              </div>
              <Button onClick={() => { setOrderOpen(false); setIsSuccess(false); setConfirmationData(null); }} size="lg" className="w-full gap-2">
                <CheckCircle className="w-4 h-4" /> Xác nhận
              </Button>
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">Đặt mua SIM</DialogTitle>
              </DialogHeader>

              {/* SIM Info */}
              {selectedSim && (
                <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
                  <p className="text-sm text-muted-foreground">THÔNG TIN SIM</p>
                  <div className="text-xl font-bold text-primary tracking-wide">
                    {selectedSim.displayNumber}
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <span className="text-muted-foreground">Mạng:</span>
                    <span className={cn("px-2 py-0.5 rounded text-xs font-medium", networkColors[selectedSim.network] || 'bg-gray-500 text-white')}>
                      {selectedSim.network}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Giá: </span>
                    <span className="font-semibold text-cta text-lg">{formatPriceDisplay(selectedSim.price)}</span>
                  </div>
                </div>
              )}

              {/* Order Form */}
              <form onSubmit={handleSubmitOrder} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="modal-fullName">Họ tên <span className="text-destructive">*</span></Label>
                  <Input id="modal-fullName" placeholder="Nguyễn Văn A" value={formData.fullName} onChange={(e) => handleInputChange('fullName', e.target.value)} className={formErrors.fullName ? 'border-destructive' : ''} />
                  {formErrors.fullName && <p className="text-xs text-destructive">{formErrors.fullName}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="modal-phone">Điện thoại liên hệ <span className="text-destructive">*</span></Label>
                  <Input id="modal-phone" type="tel" placeholder="0909 123 456" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} className={formErrors.phone ? 'border-destructive' : ''} />
                  {formErrors.phone && <p className="text-xs text-destructive">{formErrors.phone}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="modal-address">Địa chỉ <span className="text-destructive">*</span></Label>
                  <Input id="modal-address" placeholder="123 Đường ABC, Quận 1, TP.HCM" value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} className={formErrors.address ? 'border-destructive' : ''} />
                  {formErrors.address && <p className="text-xs text-destructive">{formErrors.address}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="modal-note">Yêu cầu khác</Label>
                  <Textarea id="modal-note" placeholder="Ghi chú thêm (nếu có)" value={formData.note} onChange={(e) => handleInputChange('note', e.target.value)} rows={2} />
                </div>
                <div className="space-y-2">
                  <Label>Hình thức thanh toán</Label>
                  <div className="flex items-center space-x-3 rounded-lg border border-border p-3 bg-muted/30">
                    <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    </div>
                    <Label className="flex-1">Thanh toán khi nhận sim</Label>
                  </div>
                </div>
                <Button type="submit" size="lg" className="w-full gap-2 text-base" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...</>
                  ) : (
                    <><Phone className="w-4 h-4" /> MUA NGAY</>
                  )}
                </Button>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MuaSimGiaRe;
