import { useState, useMemo, useRef, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Phone, Search, ChevronRight, ChevronLeft, X, Loader2, Wifi, PhoneCall,
  BadgeCheck, Truck, AlertTriangle, MessageCircle,
} from 'lucide-react';
import Header from '@/components/Header';
import TrustBar from '@/components/TrustBar';
import Footer from '@/components/Footer';
import Navigation from '@/components/Navigation';
import { useCheapSimData } from '@/hooks/useCheapSimData';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import QuickContactPopup from '@/components/QuickContactPopup';
import { CHEAP_PRICE, type CheapSim } from '@/lib/cheapSimSheet';
import {
  CHEAP_FACETS, badgesFor, countFacets, countPrefixes, matchesFacet,
  type CheapFacet,
} from '@/lib/cheapSimFacets';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const ZALO_URL = 'https://zalo.me/0933356666';
const PRICE_LABEL = `${CHEAP_PRICE.toLocaleString('vi-VN')}đ`;

/**
 * The TK179 package every SIM in this warehouse ships with. It used to live in
 * a desktop-only hover tooltip on each of the 30 cards on screen — invisible on
 * mobile, invisible to anyone not hovering, and repeated 30 times in the DOM to
 * say something that is identical for every SIM. It is stated once, in the page
 * header, where it is part of the offer rather than a hidden easter egg.
 */
const TK179_PERKS = [
  { Icon: Wifi, text: '7GB data tốc độ cao mỗi ngày' },
  { Icon: PhoneCall, text: 'Miễn phí gọi nội mạng, 200 phút liên mạng' },
  { Icon: BadgeCheck, text: 'SIM MobiFone chính hãng, sang tên chính chủ' },
  { Icon: Truck, text: 'Giao SIM toàn quốc, miễn phí vận chuyển' },
];

const faqItems = [
  {
    q: `Vì sao mọi SIM ở đây đều ${PRICE_LABEL}?`,
    a: `Đây là kho SIM khuyến mãi đồng giá của MobiFone: toàn bộ số trong kho bán đúng ${PRICE_LABEL}, không phân biệt số đẹp hay số thường, và đã bao gồm gói cước TK179 tháng đầu. Bạn không cần so giá giữa các số — chỉ cần chọn dãy số mình thích.`,
  },
  {
    q: 'Kho này có SIM tứ quý, lộc phát, thần tài không?',
    a: 'Không. Kho đồng giá là SIM phổ thông: đẹp ở mức dễ nhớ (đuôi kép, tránh số 4 và 7, đuôi 6-8-9, số tiến) chứ không có tứ quý, tam hoa hay lộc phát — những dãy đó thuộc phân khúc vài triệu đến vài chục triệu. Nếu bạn cần số phong thủy hoặc số VIP, hãy xem kho SIM chính ở trang chủ.',
  },
  {
    q: 'SIM giá rẻ có sang tên chính chủ được không?',
    a: 'Được. Mọi SIM tại CHONSOMOBIFONE.COM đều hỗ trợ đăng ký chính chủ, kể cả SIM đồng giá. Sau khi nhận SIM, bạn mang CCCD đến cửa hàng MobiFone gần nhất hoặc dùng ứng dụng My MobiFone để đăng ký thông tin thuê bao.',
  },
  {
    q: 'Gói TK179 hết 30 ngày thì sao?',
    a: 'SIM vẫn hoạt động bình thường như một thuê bao trả trước MobiFone. Bạn có thể gia hạn TK179, đổi sang gói cước khác, hoặc chỉ nạp tiền dùng theo nhu cầu. Số điện thoại là của bạn, không phụ thuộc vào việc có duy trì gói hay không.',
  },
  {
    q: 'Bao lâu thì nhận được SIM?',
    a: 'Nội thành TP. Hồ Chí Minh: 30 phút – 2 giờ làm việc. Nội thành Hà Nội và các thành phố lớn: 1 ngày làm việc. Các tỉnh thành khác: 1 – 3 ngày làm việc. Đơn xác nhận sau 20:00 sẽ xử lý vào sáng ngày làm việc kế tiếp. Thanh toán COD khi nhận SIM.',
  },
  {
    q: 'Số tôi đang xem có bị người khác mua mất không?',
    a: 'Mỗi số chỉ có duy nhất một SIM. Kho trên trang này đã loại các số đã bán và được làm mới sau mỗi 10 phút, nhưng nếu hai người cùng đặt một số trong khoảng đó thì đơn xác nhận trước sẽ được giữ số. Đặt hàng online là cách nhanh nhất để giữ chỗ.',
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

const formatPrice = (price: number): string =>
  price > 0 ? `${price.toLocaleString('vi-VN')}đ` : 'Liên hệ';

/**
 * One paragraph per facet, keyed off CHEAP_FACETS so the explainer section can
 * never drift out of sync with the filter chips it is explaining.
 */
const FACET_COPY: Record<CheapFacet, string> = {
  doi: 'Hai số cuối giống nhau (…33, …88) là dạng dễ đọc và dễ nhớ nhất trong kho phổ thông. Khi đọc số qua điện thoại, người nghe chỉ phải ghi một chữ số cho hai vị trí cuối — ít sai sót hơn hẳn.',
  no47: 'Nhiều khách hàng tránh số 4 và số 7 vì lý do kiêng kỵ. Bộ lọc này chỉ giữ những dãy không có cả hai chữ số đó ở bất kỳ vị trí nào, kể cả trong đầu số.',
  tail689: 'Đuôi 6 (lộc), 8 (phát), 9 (vĩnh cửu) là ba chữ số kết thúc được ưa chuộng nhất. Trong kho đồng giá, đây là cách nhanh nhất để có một số "nghe được" mà không phải trả giá số đẹp.',
  tien: 'Ba số cuối tăng dần một đơn vị: …123, …456, …789. Đây là dạng hiếm nhất trong kho — số lượng rất ít và thường hết trước, nên nếu thấy số ưng ý thì nên đặt sớm.',
};

/**
 * Search input handling. The field accepts digits and a leading `*`, matching
 * the syntax the homepage search advertises: `*88` means "ends in 88",
 * anything else means "contains". Returning the bare digit string lets the
 * caller decide which of the two comparisons to run.
 */
const searchDigits = (query: string): string => {
  const digits = query.replace(/\D/g, '');
  // A single digit matches thousands of numbers and is never what someone
  // means; treat it as no filter at all rather than dumping the whole warehouse
  // through a pointless pass.
  return digits.length >= 2 ? digits : '';
};

// ===== SIM CARD =====

/**
 * Same anatomy as SIMCardNew on the homepage, deliberately: a visitor who has
 * seen one grid should not have to relearn the other. Two differences, both
 * driven by this warehouse's data — the price is identical on every card so it
 * is stated small rather than as the headline, and the badges come from
 * cheapSimFacets rather than the homepage tag engine (see that file for why).
 *
 * The whole card is NOT a click target. It used to be, with onClick opening the
 * Zalo popup, so every click anywhere went to chat and the order form at
 * /mua-ngay/:simId was unreachable from this page. The contact button stays a
 * *sibling* of the link: a <button> inside an <a> is invalid HTML.
 */
const CheapSimCard = ({ sim, onContact }: { sim: CheapSim; onContact: (sim: CheapSim) => void }) => {
  const checkoutHref = `/mua-ngay/${encodeURIComponent(sim.id)}`;
  const badges = badgesFor(sim.rawDigits);

  const parts = sim.displayNumber.split('.');
  const number = parts.length === 3 ? (
    <>
      <span className="opacity-80">{parts[0]}.</span>
      <span className="opacity-80">{parts[1]}.</span>
      <span className="font-extrabold text-gold">{parts[2]}</span>
    </>
  ) : sim.displayNumber;

  return (
    <div className="sim-card-compact group relative overflow-hidden">
      <div className="mb-1.5 flex max-w-full flex-wrap items-center gap-1">
        <span
          className="rounded bg-primary px-1.5 py-px font-medium text-primary-foreground"
          style={{ fontSize: 'clamp(8px, 1.8vw, 11px)' }}
        >
          {sim.network}
        </span>
        {badges.map((badge) => (
          <span
            key={badge}
            className="rounded border border-gold/30 bg-gold/15 px-1.5 py-px font-medium text-gold"
            style={{ fontSize: 'clamp(8px, 1.8vw, 11px)' }}
          >
            {badge}
          </span>
        ))}
      </div>

      <Link
        to={checkoutHref}
        aria-label={`Đặt mua SIM ${sim.displayNumber} — ${formatPrice(sim.price)}`}
        className="sim-number-auto mb-1.5 block overflow-hidden text-ellipsis whitespace-nowrap transition-all group-hover:gold-glow"
        style={{ fontSize: 'clamp(14px, 3.5vw, 22px)' }}
      >
        {number}
      </Link>

      {/* Price above, actions below — never side by side. The mobile card's
          inner width is 128px; a nowrap price plus a CTA does not fit in one
          row and the old layout clipped the button against overflow-hidden. */}
      <div className="mt-auto pt-1">
        <div className="flex flex-col">
          <span
            className="font-bold text-foreground"
            style={{ fontSize: 'clamp(13px, 2.2vw, 17px)', lineHeight: '1.2' }}
          >
            {formatPrice(sim.price)}
          </span>
          <span
            className="block text-muted-foreground/70"
            style={{ fontSize: 'clamp(9px, 1.6vw, 12px)', lineHeight: '1.3', letterSpacing: '0.02em' }}
          >
            ĐÃ GỒM GÓI TK179
          </span>
        </div>
        <div className="mt-1.5 grid grid-cols-[auto_1fr] items-stretch gap-1">
          <button
            type="button"
            onClick={() => onContact(sim)}
            aria-label={`Gọi hoặc chat Zalo về SIM ${sim.displayNumber}`}
            title="Gọi / Chat Zalo"
            className="flex items-center justify-center rounded border border-primary/40 bg-primary/10 px-1.5 text-primary transition-colors hover:bg-primary/20"
          >
            <Phone style={{ width: 'clamp(10px, 2vw, 14px)', height: 'clamp(10px, 2vw, 14px)' }} />
          </button>
          <Link
            to={checkoutHref}
            aria-label={`Đặt ngay SIM ${sim.displayNumber}`}
            className="btn-cta-sm flex min-w-0 items-center justify-center whitespace-nowrap text-center"
            style={{ fontSize: 'clamp(8px, 1.8vw, 11px)' }}
          >
            ĐẶT NGAY
          </Link>
        </div>
      </div>
    </div>
  );
};

// ===== FILTER CHIP =====

const chipBase = 'flex-shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors';
const chipIdle = 'border-border bg-card text-foreground/80 hover:border-primary hover:text-primary';
const chipActive = 'border-primary bg-primary text-primary-foreground';

const FilterChip = ({
  label, count, active, onClick, title,
}: { label: string; count: number; active: boolean; onClick: () => void; title?: string }) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    title={title}
    className={cn(chipBase, active ? chipActive : chipIdle)}
  >
    {label}
    <span className={cn('ml-1.5 font-normal', active ? 'text-primary-foreground/75' : 'text-muted-foreground')}>
      {count.toLocaleString('vi-VN')}
    </span>
  </button>
);

// ===== MAIN PAGE =====

const MuaSimGiaRe = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearch, setActiveSearch] = useState('');
  const [activeFacets, setActiveFacets] = useState<CheapFacet[]>([]);
  const [activePrefix, setActivePrefix] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const inventoryRef = useRef<HTMLElement>(null);

  const { sims, isLoading, hasError } = useCheapSimData();
  const isMobile = useIsMobile();
  const ITEMS_PER_PAGE = isMobile ? 20 : 30;

  const [selectedSim, setSelectedSim] = useState<CheapSim | null>(null);
  const [contactOpen, setContactOpen] = useState(false);

  const handleContact = (sim: CheapSim) => {
    setSelectedSim(sim);
    setContactOpen(true);
  };

  // Counts are over the whole warehouse, not the current result set: a chip
  // that shows how many numbers it leads to is only useful if the number does
  // not change every time another chip is pressed.
  const facetCounts = useMemo(() => countFacets(sims), [sims]);
  const prefixes = useMemo(() => countPrefixes(sims).filter(p => p.count >= 10), [sims]);

  const results = useMemo(() => {
    const digits = searchDigits(activeSearch);
    const suffixOnly = activeSearch.trim().startsWith('*');

    return sims.filter((sim) => {
      if (activePrefix && !sim.rawDigits.startsWith(activePrefix)) return false;
      // Facets are AND-ed. They barely overlap by design, so two at once is
      // usually a deliberate "narrow this down", not an accident.
      for (const facet of activeFacets) {
        if (!matchesFacet(sim.rawDigits, facet)) return false;
      }
      if (digits) {
        return suffixOnly ? sim.rawDigits.endsWith(digits) : sim.rawDigits.includes(digits);
      }
      return true;
    });
  }, [sims, activeSearch, activeFacets, activePrefix]);

  const hasFilters = !!activeSearch.trim() || activeFacets.length > 0 || !!activePrefix;

  // Any filter change can shorten the list past the current page. Clamping in
  // render alone would leave the pager showing a page the user never chose;
  // resetting keeps the URL-less state honest.
  useEffect(() => { setCurrentPage(1); }, [activeSearch, activeFacets, activePrefix]);

  const totalPages = Math.max(1, Math.ceil(results.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * ITEMS_PER_PAGE;
  const pageSims = results.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const scrollToInventory = () => {
    inventoryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setActiveSearch(searchQuery);
    setTimeout(scrollToInventory, 50);
  };

  const toggleFacet = (facet: CheapFacet) => {
    setActiveFacets(prev => prev.includes(facet) ? prev.filter(f => f !== facet) : [...prev, facet]);
  };

  const clearAll = () => {
    setSearchQuery('');
    setActiveSearch('');
    setActiveFacets([]);
    setActivePrefix(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setTimeout(scrollToInventory, 50);
  };

  const getPageNumbers = (): (number | '…')[] => {
    const pages: (number | '…')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safePage > 3) pages.push('…');
      for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) pages.push(i);
      if (safePage < totalPages - 2) pages.push('…');
      pages.push(totalPages);
    }
    return pages;
  };

  const stockLabel = sims.length > 0 ? sims.length.toLocaleString('vi-VN') : '—';

  return (
    <>
      <Helmet>
        <title>{`Mua SIM Giá Rẻ – Kho SIM MobiFone Đồng Giá ${PRICE_LABEL}`}</title>
        <meta
          name="description"
          content={`Kho SIM MobiFone khuyến mãi đồng giá ${PRICE_LABEL}, đã gồm gói TK179 (7GB/ngày, miễn phí nội mạng). Chọn số theo đuôi kép, tránh 4-7, đuôi 6-8-9. Đặt online, giao SIM toàn quốc.`}
        />
        <link rel="canonical" href="https://www.chonsomobifone.com/mua-sim-gia-re" />
        <meta property="og:title" content={`Mua SIM Giá Rẻ – Kho SIM MobiFone Đồng Giá ${PRICE_LABEL}`} />
        <meta property="og:description" content={`Toàn bộ SIM trong kho đúng ${PRICE_LABEL}, đã gồm gói cước TK179. Chọn số bạn thích, giá không đổi.`} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.chonsomobifone.com/mua-sim-gia-re" />
        <script type="application/ld+json">{JSON.stringify(faqJsonLd)}</script>
      </Helmet>

      <Header />
      <TrustBar />
      <Navigation />

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
              {stockLabel} SIM MobiFone, mọi số đúng{' '}
              <span className="text-gold">{PRICE_LABEL}</span>
            </h1>
            <p className="mx-auto mb-5 max-w-xl text-sm leading-relaxed text-primary-foreground/85 md:text-base">
              Không có số nào đắt hơn số nào. Chọn dãy số bạn thích, giá vẫn thế — đã gồm
              gói cước TK179 tháng đầu.
            </p>

            <form onSubmit={handleSearch} className="mx-auto mb-5 max-w-lg">
              <label htmlFor="cheap-sim-search" className="sr-only">
                Tìm SIM theo dãy số
              </label>
              <div className="flex overflow-hidden rounded-xl bg-card shadow-elevated ring-1 ring-gold/20 focus-within:ring-2 focus-within:ring-gold">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                  <input
                    id="cheap-sim-search"
                    type="text"
                    inputMode="tel"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value.replace(/[^0-9*]/g, ''))}
                    placeholder="Nhập số cần tìm, ví dụ 899 hoặc *22"
                    className="w-full bg-card py-3 pl-12 pr-3 text-base text-foreground outline-none md:py-3.5"
                  />
                </div>
                <button
                  type="submit"
                  aria-label="Tìm SIM"
                  className="btn-cta flex items-center gap-2 whitespace-nowrap rounded-none px-5 text-sm font-bold md:px-7 md:text-base"
                >
                  <Search className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">Tìm SIM</span>
                </button>
              </div>
              <p className="mt-2 text-xs text-primary-foreground/70">
                Gõ <strong>*22</strong> để tìm số đuôi 22, hoặc gõ chuỗi bất kỳ để tìm số có chứa chuỗi đó.
              </p>
            </form>

            <ul className="mx-auto grid max-w-2xl grid-cols-1 gap-x-6 gap-y-1.5 text-left text-xs text-primary-foreground/85 sm:grid-cols-2 md:text-sm">
              {TK179_PERKS.map(({ Icon, text }) => (
                <li key={text} className="flex items-center gap-2">
                  <Icon className="h-4 w-4 flex-shrink-0 text-gold" aria-hidden="true" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <div className="container mx-auto space-y-10 px-4 py-8 md:space-y-14 md:py-12">
          {/* ===== INVENTORY ===== */}
          <section
            ref={inventoryRef}
            id="kho-sim-gia-re"
            className="scroll-mt-[var(--nav-height)] rounded-xl border border-border bg-card p-4 shadow-card md:p-8"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 className="flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
                <span className="h-8 w-1 rounded-full bg-primary" />
                {hasFilters ? 'Kết quả lọc' : `Kho SIM đồng giá ${PRICE_LABEL}`}
              </h2>
              {hasFilters && (
                <button
                  onClick={clearAll}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:bg-secondary/50"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" /> Xóa bộ lọc
                </button>
              )}
            </div>

            {/* Filters. Every chip is measured against the live warehouse and
                hidden when it would return nothing, so there is no button here
                that leads to an empty grid. */}
            {sims.length > 0 && (
              <div className="mb-4 space-y-2">
                {prefixes.length > 1 && (
                  <div
                    className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    role="group"
                    aria-label="Lọc theo đầu số"
                  >
                    <span className="flex-shrink-0 text-xs font-medium text-muted-foreground">Đầu số</span>
                    {prefixes.map(({ prefix, count }) => (
                      <FilterChip
                        key={prefix}
                        // "Đầu " is load-bearing, not decoration: a bare "090"
                        // sits directly against its own count and renders as
                        // "0904.988", which reads as one 7-digit number.
                        label={`Đầu ${prefix}`}
                        count={count}
                        active={activePrefix === prefix}
                        onClick={() => setActivePrefix(p => (p === prefix ? null : prefix))}
                      />
                    ))}
                  </div>
                )}
                <div
                  className="flex items-center gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  role="group"
                  aria-label="Lọc theo dạng số"
                >
                  <span className="flex-shrink-0 text-xs font-medium text-muted-foreground">Dạng số</span>
                  {CHEAP_FACETS.filter(f => facetCounts[f.id] > 0).map((facet) => (
                    <FilterChip
                      key={facet.id}
                      label={facet.label}
                      count={facetCounts[facet.id]}
                      active={activeFacets.includes(facet.id)}
                      onClick={() => toggleFacet(facet.id)}
                      title={facet.hint}
                    />
                  ))}
                </div>
              </div>
            )}

            {isLoading ? (
              <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3 lg:grid-cols-4 xl:grid-cols-5">
                {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                  <div key={i} className="animate-pulse space-y-3 rounded-xl border border-border bg-card p-4">
                    <div className="h-4 w-16 rounded bg-muted" />
                    <div className="h-6 w-full rounded bg-muted" />
                    <div className="h-4 w-20 rounded bg-muted" />
                    <div className="h-8 w-full rounded bg-muted" />
                  </div>
                ))}
              </div>
            ) : hasError && sims.length === 0 ? (
              <div className="py-12 text-center">
                <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" aria-hidden="true" />
                <p className="mb-1 text-lg font-medium text-foreground">Không tải được kho SIM.</p>
                <p className="mb-4 text-sm text-muted-foreground">
                  Vui lòng tải lại trang, hoặc nhắn Zalo để được báo số trực tiếp.
                </p>
                <a
                  href={ZALO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-cta inline-flex items-center gap-2 text-sm"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" /> Nhắn Zalo nhận số
                </a>
              </div>
            ) : results.length === 0 ? (
              <div className="py-12 text-center">
                <Search className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" aria-hidden="true" />
                <p className="mb-1 text-lg font-medium text-foreground">
                  Không có số nào khớp bộ lọc hiện tại.
                </p>
                <p className="mb-4 text-sm text-muted-foreground">
                  Thử bỏ bớt một điều kiện, hoặc nhập chuỗi số ngắn hơn.
                </p>
                <button onClick={clearAll} className="btn-cta text-sm">
                  Xem lại toàn bộ kho
                </button>
              </div>
            ) : (
              <>
                <p className="mb-4 text-sm text-muted-foreground">
                  Hiển thị {(startIdx + 1).toLocaleString('vi-VN')}–
                  {Math.min(startIdx + ITEMS_PER_PAGE, results.length).toLocaleString('vi-VN')} trong{' '}
                  {results.length.toLocaleString('vi-VN')} số
                  {hasFilters && sims.length > 0 && ` (kho có ${stockLabel} số)`}
                </p>
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3 lg:grid-cols-4 xl:grid-cols-5">
                  {pageSims.map((sim) => (
                    <CheapSimCard key={sim.id} sim={sim} onContact={handleContact} />
                  ))}
                </div>

                {totalPages > 1 && (
                  <nav className="mt-6 flex flex-wrap items-center justify-center gap-1.5" aria-label="Phân trang kho SIM">
                    <button
                      onClick={() => handlePageChange(Math.max(1, safePage - 1))}
                      disabled={safePage === 1}
                      className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary/50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden="true" /> Trước
                    </button>
                    {getPageNumbers().map((p, i) =>
                      p === '…' ? (
                        <span key={`e-${i}`} className="px-2 py-2 text-sm text-muted-foreground">…</span>
                      ) : (
                        <button
                          key={p}
                          onClick={() => handlePageChange(p)}
                          aria-current={safePage === p ? 'page' : undefined}
                          className={cn(
                            'h-9 min-w-[36px] rounded-lg text-sm font-medium transition-colors',
                            safePage === p
                              ? 'bg-primary text-primary-foreground'
                              : 'border border-border bg-card text-foreground hover:bg-secondary/50',
                          )}
                        >
                          {p}
                        </button>
                      ),
                    )}
                    <button
                      onClick={() => handlePageChange(Math.min(totalPages, safePage + 1))}
                      disabled={safePage === totalPages}
                      className="flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary/50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Sau <ChevronRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </nav>
                )}
              </>
            )}
          </section>

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
                không phân biệt số nào đẹp hơn số nào — nên bạn không cần cân nhắc giá, chỉ
                cần chọn dãy số mình thích nhất.
              </p>
              <p>
                Giá đã bao gồm gói cước <strong className="text-foreground">TK179</strong> trong 30 ngày
                đầu: 7GB data tốc độ cao mỗi ngày, miễn phí thoại nội mạng dưới 20 phút mỗi cuộc
                (tối đa 1.500 phút) và 200 phút liên mạng. Hết 30 ngày, SIM vẫn là thuê bao trả
                trước MobiFone bình thường — bạn gia hạn TK179, đổi gói khác hay chỉ nạp tiền
                đều được.
              </p>
              <div className="rounded-lg border border-gold/25 bg-gold/[0.06] p-4">
                <p className="mb-2 font-semibold text-foreground">Kho này hợp với ai?</p>
                <ul className="space-y-1.5 text-sm">
                  <li>• Cần số thứ hai để bán hàng, chạy quảng cáo, tách việc khỏi số cá nhân.</li>
                  <li>• Cần số đăng ký tài khoản, nhận OTP mà không muốn dùng số chính.</li>
                  <li>• Muốn một số dễ nhớ với chi phí bằng một bữa ăn, không phải vài triệu.</li>
                </ul>
              </div>
              <p className="text-sm">
                Cần tứ quý, lộc phát, thần tài hay số phong thủy theo tuổi? Những dãy đó không nằm
                trong kho khuyến mãi này — xem{' '}
                <Link to="/" className="font-medium text-primary underline-offset-2 hover:underline">
                  kho SIM số đẹp
                </Link>{' '}
                hoặc{' '}
                <Link to="/sim-phong-thuy" className="font-medium text-primary underline-offset-2 hover:underline">
                  SIM phong thủy
                </Link>.
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
              Giá không còn là tiêu chí, nên chỉ còn một câu hỏi: số nào bạn đọc lên thấy thuận
              miệng nhất. Bốn cách lọc dưới đây tương ứng đúng với các nút lọc ở kho phía trên.
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {CHEAP_FACETS.map((facet) => (
                <article
                  key={facet.id}
                  className="rounded-xl border border-border bg-card p-5 shadow-card transition-colors hover:border-primary/30"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <h3 className="text-base font-bold text-foreground">{facet.label}</h3>
                    <span className="flex-shrink-0 rounded-full border border-gold/30 bg-gold/15 px-2 py-0.5 text-xs font-semibold text-gold">
                      {facetCounts[facet.id] > 0 ? `${facetCounts[facet.id].toLocaleString('vi-VN')} số` : 'Đang cập nhật'}
                    </span>
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
                { n: '1', t: 'Chọn số', d: 'Bấm số bạn thích ở kho phía trên. Mỗi số chỉ có một SIM.' },
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
          <section className="rounded-xl border border-border bg-card p-6 shadow-card md:p-8">
            <h2 className="mb-5 flex items-center gap-3 text-xl font-bold text-primary md:text-2xl">
              <span className="h-8 w-1 rounded-full bg-primary" />
              Câu hỏi thường gặp
            </h2>
            <Accordion type="single" collapsible className="space-y-2">
              {faqItems.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  className="rounded-lg border border-border px-4 data-[state=open]:bg-secondary/30"
                >
                  <AccordionTrigger className="py-4 text-left font-medium text-foreground hover:text-primary hover:no-underline">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-4 text-muted-foreground">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </section>

          {/* ===== CLOSING CTA ===== */}
          <section className="rounded-xl bg-gradient-to-br from-primary via-primary-dark to-primary p-8 text-center text-primary-foreground md:p-10">
            <h2 className="mb-2 text-xl font-bold md:text-2xl">
              {stockLabel} số đang chờ, mọi số đúng {PRICE_LABEL}
            </h2>
            <p className="mx-auto mb-6 max-w-lg text-sm text-primary-foreground/80">
              Chọn số ở kho phía trên rồi đặt online — hoặc nhắn Zalo, nhân viên sẽ gợi ý số theo
              yêu cầu của bạn.
            </p>
            <div className="flex flex-col items-center justify-center gap-2.5 sm:flex-row">
              <button
                onClick={scrollToInventory}
                className="flex items-center justify-center gap-2 rounded-lg bg-gold px-7 py-2.5 font-bold text-header-bg shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-xl"
              >
                <Search className="h-4 w-4" aria-hidden="true" /> Xem kho SIM
              </button>
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

      <Footer />

      {selectedSim && (
        <QuickContactPopup
          open={contactOpen}
          onOpenChange={setContactOpen}
          simNumber={selectedSim.displayNumber}
          simPrice={formatPrice(selectedSim.price)}
          simNetwork={selectedSim.network}
        />
      )}
    </>
  );
};

export default MuaSimGiaRe;
