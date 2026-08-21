"use client";

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Phone, Search, ChevronRight, ChevronLeft, X,
  AlertTriangle, MessageCircle,
} from 'lucide-react';
import { useCheapSimData } from '@/hooks/useCheapSimData';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/simUtils';
import QuickContactPopup from '@/components/QuickContactPopup';
import { CHEAP_PRICE, type CheapSim } from '@/lib/cheapSimSheet';
import {
  CHEAP_FACETS, badgesFor, countFacets, countPrefixes, matchesFacet,
  type CheapFacet,
} from '@/lib/cheapSimFacets';

const ZALO_URL = 'https://zalo.me/0933356666';
const PRICE_LABEL = formatPrice(CHEAP_PRICE);

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
        href={checkoutHref}
        aria-label={`Đặt mua SIM ${sim.displayNumber} — ${formatPrice(sim.price)}`}
        className="sim-number-auto mb-1.5 block overflow-hidden text-ellipsis whitespace-nowrap transition-all group-hover:[text-shadow:0_0_12px_hsl(var(--gold)_/_0.4)]"
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
            className="block text-muted-foreground"
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
            href={checkoutHref}
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

const chipBase = 'flex-shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
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

// ===== MAIN =====

const MuaSimGiaReTool = () => {
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
      {/* Search bar — moved out of the hero, right above the inventory grid. */}
      <section ref={inventoryRef} id="kho-sim-gia-re" className="scroll-mt-[var(--nav-height)] rounded-xl border border-border bg-card p-4 shadow-card md:p-8">
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
          <p className="mt-2 text-xs text-muted-foreground">
            Gõ <strong>*22</strong> để tìm số đuôi 22, hoặc gõ chuỗi bất kỳ để tìm số có chứa chuỗi đó.
          </p>
        </form>

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

export default MuaSimGiaReTool;
