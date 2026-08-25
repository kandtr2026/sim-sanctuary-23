"use client";

import { useState } from 'react';
import { Phone } from 'lucide-react';
import Link from 'next/link';
import type { NormalizedSIM, PromotionalData, QuyType } from '@/lib/simUtils';
import QuickContactPopup from '@/components/QuickContactPopup';
import { matchesQuyType, formatPrice, formatBirthDateDisplayLenient, formatSIMNumber } from '@/lib/simUtils';
import { cn } from '@/lib/utils';
import { createHighlightedNumber, createQuyHighlightedNumber } from '@/lib/highlightUtils';

// Fallback only — mirrors NETWORK_PREFIXES in @/lib/simUtils, which deliberately
// covers just Mobifone / Vinaphone / Gmobile. Keep the two lists in sync.
const detectCarrier = (number: string): string => {
  const digits = (number || '').replace(/\D/g, '');
  const prefix = digits.substring(0, 3);
  if (['090', '093', '089', '070', '076', '077', '078', '079'].includes(prefix)) return 'Mobifone';
  if (['088', '091', '094', '081', '082', '083', '084', '085'].includes(prefix)) return 'Vinaphone';
  if (['099', '059'].includes(prefix)) return 'Gmobile';
  return '';
};

interface SIMCardNewProps {
  sim: NormalizedSIM;
  promotional?: PromotionalData;
  quyFilter?: QuyType | null;
  searchQuery?: string;
}

const SIMCardNew = ({ sim, promotional, quyFilter, searchQuery = '' }: SIMCardNewProps) => {
  const [contactOpen, setContactOpen] = useState(false);
  // Build rawNumber from ALL possible sources
  const rawNumber = (() => {
    const sources = [sim.rawDigits, sim.displayNumber, sim.formattedNumber];
    for (const src of sources) {
      if (src) {
        const digits = String(src).replace(/\D/g, '');
        if (digits.length >= 9) return digits;
      }
    }
    return '';
  })();
  // `sim.network` is 'Khác' when the sheet column is blank or unrecognised —
  // fall back to prefix detection so the badge still renders instead of
  // silently disappearing.
  const carrier = sim.network && sim.network !== 'Khác' ? sim.network : detectCarrier(rawNumber);

  const checkoutHref = `/mua-ngay/${encodeURIComponent(sim.id)}`;

  // SIM năm sinh hiển thị theo ngày sinh thay vì dãy số rối từ sheet
  // (VD 0934.092.029 → 0934.1.9.1991, 0909.922.000 → 0909.9.2.2000).
  // Áp dụng khi: sim có tag "Năm sinh" HOẶC người dùng đang tìm theo một năm
  // (vd gõ "2013", "*1999") — lúc đó hệ thống tự "chấm lại" theo năm sinh, không
  // phụ thuộc dấu chấm tuỳ hứng của sheet (090.9922.000, 093.888.2026).
  // Không đọc được ngày (chỉ trùng đuôi năm) thì dùng format 4-3-3 đồng nhất.
  const yearSearchActive = /(19[89]\d|20[0-2]\d)/.test(searchQuery);
  const isBirthYear = sim.tags.includes('Năm sinh') || yearSearchActive;
  const birthDisplay = isBirthYear
    ? formatBirthDateDisplayLenient(sim.rawDigits) ?? formatSIMNumber(sim.rawDigits)
    : null;
  const cardDisplay = birthDisplay || sim.displayNumber || sim.formattedNumber || sim.rawDigits;

  const formatDiscountAmount = (amount: number): string => {
    if (amount >= 1000000) {
      const millions = amount / 1000000;
      const rounded = Math.round(millions * 10) / 10;
      if (Number.isInteger(rounded)) return `Giảm ${rounded} triệu`;
      return `Giảm ${rounded.toString().replace('.', ',')} triệu`;
    }
    if (amount >= 500000) return 'Giảm 1 triệu';
    const thousands = Math.round(amount / 1000);
    return `Giảm ${thousands}k`;
  };

  const formatWithHighlight = (displayNumber: string): React.ReactNode => {
    // Active quý filter: tôn cái DẠNG quý lên (vd *77777* ở giữa dãy số),
    // không chỉ highlight đuôi như mặc định.
    if (quyFilter && matchesQuyType(sim.rawDigits, quyFilter)) {
      const quyHighlighted = createQuyHighlightedNumber(displayNumber, sim.rawDigits, quyFilter);
      if (quyHighlighted.length !== 1 || typeof quyHighlighted[0] !== 'string') {
        return <>{quyHighlighted}</>;
      }
    }

    // SIM năm sinh: ngày sinh (phần sau dấu chấm đầu tiên) tô vàng — khách thấy
    // ngay 0909.9.2.2000 chứ không phải dãy số lẫn lộn.
    if (isBirthYear && birthDisplay && !searchQuery) {
      const dotIdx = birthDisplay.indexOf('.');
      if (dotIdx > -1) {
        return (
          <>
            <span className="opacity-80">{birthDisplay.slice(0, dotIdx)}.</span>
            <span className="text-gold font-extrabold">{birthDisplay.slice(dotIdx + 1)}</span>
          </>
        );
      }
      return birthDisplay;
    }

    // Empty query: show VIP highlight (last segment in gold)
    if (!searchQuery) {
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
    }

    // Use createHighlightedNumber from highlightUtils for consistent wildcard handling
    const rawDigits = sim.rawDigits || displayNumber.replace(/\D/g, '');
    const highlighted = createHighlightedNumber(displayNumber, rawDigits, searchQuery);

    // If it's still just the display number (no highlights), return it as-is
    if (highlighted.length === 1 && typeof highlighted[0] === 'string') {
      return highlighted[0];
    }

    return <>{highlighted}</>;
  };

  const networkColors: Record<string, string> = {
    Mobifone: 'bg-primary text-primary-foreground',
    Vinaphone: 'bg-blue-500 text-white',
    Gmobile: 'bg-emerald-600 text-white',
  };

  const getQuyBadge = (): string | null => {
    if (!quyFilter) return null;
    if (!matchesQuyType(sim.rawDigits, quyFilter)) {
      return null;
    }
    return quyFilter;
  };

  const quyBadgeText = getQuyBadge();
  const originalPrice = promotional?.originalPrice;
  const hasDiscount = originalPrice && originalPrice > 0 && sim.price > 0 && originalPrice > sim.price;
  const discountAmount = hasDiscount ? originalPrice - sim.price : 0;
  const discountBadgeText = hasDiscount ? formatDiscountAmount(discountAmount) : null;

  // One badge system for the whole row: identical padding, radius, weight and
  // font-size so carrier / "Số đẹp" / quý badges sit on one even line no matter
  // which combination a card shows.
  const badgeBase = 'inline-flex items-center rounded px-1.5 py-px font-medium leading-none';
  const badgeFontSize = { fontSize: 'clamp(8px, 1.8vw, 11px)', lineHeight: 1.4 } as const;

  return (
    <>
      {/* The card is deliberately NOT one big click target any more. It used to have
          onClick={() => setContactOpen(true)} on the wrapper, so every click — number,
          price, anywhere — opened the Zalo/call popup and the real checkout at
          /mua-ngay/:simId was unreachable from the listing. Now the number is a link to
          checkout and the action row has two explicit buttons. The contact button must
          stay a sibling of the link, not a descendant: a <button> inside an <a> is
          invalid HTML and browsers handle the nested activation inconsistently. */}
      <div
        className={cn(
          "sim-card-compact group relative overflow-hidden",
          hasDiscount && "ring-1 ring-cta/30 shadow-promo-sm"
        )}>

        {hasDiscount && (
          <img
            src="/flash-sale.webp"
            alt="Flash Sale"
            loading="lazy"
            decoding="async"
            // The file is 168x150; 56x50 is that exact ratio at the w-14 the class
            // list renders. Declaring only width left the height unconstrained, so
            // the browser reserved no vertical space for it.
            width={56}
            height={50}
            className="animate-flash-glow pointer-events-none absolute top-2 left-2 z-20 h-auto w-14 border-0 bg-transparent p-0 shadow-none"
          />
        )}

        <div className={cn("flex items-center gap-1 mb-1.5 flex-wrap max-w-full", hasDiscount && "mt-8")}>
          {carrier && (
            <span
              className={cn(badgeBase, networkColors[carrier] || 'bg-gray-500 text-white')}
              style={badgeFontSize}
            >
              {carrier}
            </span>
          )}
          {carrier && sim.beautyScore >= 50 && (
            <span
              className={cn(badgeBase, 'bg-gold/20 text-gold-dark')}
              style={badgeFontSize}
            >
              ⭐ Số đẹp
            </span>
          )}
          {quyBadgeText && (
            <span
              className={cn(badgeBase, 'bg-primary/10 text-primary border border-primary/20')}
              style={badgeFontSize}
            >
              {quyBadgeText}
            </span>
          )}
        </div>

        <Link
          href={checkoutHref}
          aria-label={`Đặt mua SIM ${cardDisplay} — ${formatPrice(sim.price)}`}
          className="sim-number-auto mb-1.5 block transition-all whitespace-nowrap overflow-hidden text-ellipsis group-hover:[text-shadow:0_0_12px_hsl(var(--gold)_/_0.4)]"
        >
          {searchQuery?.trim()
            ? createHighlightedNumber(
                cardDisplay,
                cardDisplay.replace(/\D/g, ''),
                searchQuery
              )
            : formatWithHighlight(cardDisplay)
          }
        </Link>

        {/* Price above, actions below — NOT side by side. On mobile the card's inner
            width is only 128px while the nowrap price alone needs 84px, so a horizontal
            row could never fit: the old single "ĐẶT GIAO NGAY" button (96px) overflowed
            by 52px and got clipped by the card's overflow-hidden. Prices here go up to
            "39.000.000 đ", which is wider still. Stacking is free — the card has ~68px of
            unused height under its 152px min-height — and it gives the CTA a full-width
            tap target. Measure before making this a row again. */}
        <div className="mt-auto pt-1">
          <div className="flex flex-col">
            {hasDiscount && (
              <span 
                className="text-muted-foreground line-through opacity-70"
                style={{ fontSize: 'clamp(8px, 1.6vw, 11px)' }}
              >
                {formatPrice(originalPrice)}
              </span>
            )}
            <span 
              className="font-bold whitespace-nowrap"
              style={{ 
                fontSize: 'clamp(13px, 2.2vw, 17px)', 
                color: '#FFFFFF',
                lineHeight: '1.2'
              }}
            >
              {formatPrice(sim.price)}
            </span>
          </div>
          {/* Primary: straight to the order form. Secondary: Zalo/call for buyers who
              want to talk first. Grid rather than flex: the CTA's width comes from the
              track (1fr), not from its own flex properties, so .btn-cta-sm — which is
              @apply-generated inside @layer components — cannot collapse it to padding
              width the way it did with flex-1. Phone button is auto-width, CTA takes
              the rest, and the label can never be clipped. */}
          <div className="mt-1.5 grid grid-cols-[auto_1fr] items-stretch gap-1">
            <button
              type="button"
              onClick={() => setContactOpen(true)}
              aria-label={`Gọi hoặc chat Zalo về SIM ${cardDisplay}`}
              title="Gọi / Chat Zalo"
              className="flex items-center justify-center rounded border border-primary/40 bg-primary/10 px-1.5 text-primary transition-colors hover:bg-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Phone style={{ width: 'clamp(10px, 2vw, 14px)', height: 'clamp(10px, 2vw, 14px)' }} />
            </button>
            <Link
              href={checkoutHref}
              aria-label={`Đặt ngay SIM ${cardDisplay}`}
              className="btn-cta-sm flex min-w-0 items-center justify-center whitespace-nowrap text-center"
              style={{ fontSize: 'clamp(8px, 1.8vw, 11px)' }}
            >
              ĐẶT NGAY
            </Link>
          </div>
        </div>
      </div>

      <QuickContactPopup
        open={contactOpen}
        onOpenChange={setContactOpen}
        simNumber={cardDisplay}
        simPrice={formatPrice(sim.price)}
        simNetwork={carrier}
      />
    </>
  );
};

export default SIMCardNew;
