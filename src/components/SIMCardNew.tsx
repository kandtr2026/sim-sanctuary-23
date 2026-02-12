import { Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { NormalizedSIM, PromotionalData, QuyType } from '@/lib/simUtils';
import { matchesQuyType } from '@/lib/simUtils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { createHighlightedNumber } from '@/lib/highlightUtils';
// Flash sale icon is now served from public folder as '/flash-sale.png'

interface SIMCardNewProps {
  sim: NormalizedSIM;
  promotional?: PromotionalData;
  quyFilter?: QuyType | null;
  simId?: string; // SimID from Google Sheet
  searchQuery?: string; // For highlighting matched digits
}

const SIMCardNew = ({ sim, promotional, quyFilter, simId, searchQuery = '' }: SIMCardNewProps) => {
  const navigate = useNavigate();

  const handleBuyClick = () => {
    // Use simId if provided, otherwise fall back to sim.id
    const targetId = simId || sim.id;
    navigate(`/mua-ngay/${encodeURIComponent(targetId)}`);
  };
  // Format price for display - exact formatting without rounding/flooring
  const formatPrice = (price: number | undefined): string => {
    if (price === undefined || price === null || isNaN(price) || price <= 0) return 'Liên hệ';
    
    // Billions (tỷ)
    if (price >= 1000000000) {
      const billions = price / 1000000000;
      const rounded = Math.round(billions * 10) / 10; // Round to 1 decimal
      if (Number.isInteger(rounded)) {
        return `${rounded} tỷ`;
      }
      return `${rounded.toString().replace('.', ',')} tỷ`;
    }
    
    // Millions (triệu)
    if (price >= 1000000) {
      const millions = price / 1000000;
      const rounded = Math.round(millions * 10) / 10; // Round to 1 decimal
      if (Number.isInteger(rounded)) {
        return `${rounded} triệu`;
      }
      return `${rounded.toString().replace('.', ',')} triệu`;
    }
    
    // Thousands - use dot separator for Vietnamese format
    return `${price.toLocaleString('vi-VN')} đ`;
  };

  // Format discount amount for badge (e.g., "Giảm 10 triệu")
  const formatDiscountAmount = (amount: number): string => {
    if (amount >= 1000000) {
      const millions = amount / 1000000;
      const rounded = Math.round(millions * 10) / 10;
      if (Number.isInteger(rounded)) {
        return `Giảm ${rounded} triệu`;
      }
      return `Giảm ${rounded.toString().replace('.', ',')} triệu`;
    }
    // Dưới 1 triệu: làm tròn lên 1 triệu hoặc hiển thị theo nghìn
    if (amount >= 500000) {
      return 'Giảm 1 triệu';
    }
    const thousands = Math.round(amount / 1000);
    return `Giảm ${thousands}k`;
  };

  // Highlight based on search query, or fallback to last segment VIP highlight
  const formatWithHighlight = (displayNumber: string): React.ReactNode => {
    const q = String(searchQuery || '').replace(/[^0-9*]/g, '');
    const digitsOnly = q.replace(/\*/g, '');
    const candidateDigits = (sim.rawDigits || displayNumber).replace(/\D/g, '');

    // No meaningful search -> VIP default highlight (last segment gold)
    if (!digitsOnly) {
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

    // Compute highlight ranges on candidateDigits (digit indices to bold)
    const hlSet = new Set<number>();

    if (q.includes('*')) {
      const starIdx = q.indexOf('*');
      const isPrefix = !q.startsWith('*') && q.endsWith('*') && q.indexOf('*') === q.lastIndexOf('*');
      const isSuffix = q.startsWith('*') && !q.endsWith('*') && q.indexOf('*') === q.lastIndexOf('*');
      const isMid = !q.startsWith('*') && !q.endsWith('*') && q.indexOf('*') === q.lastIndexOf('*');

      if (isMid) {
        const prefix = q.slice(0, starIdx).replace(/\*/g, '');
        const suffix = q.slice(starIdx + 1).replace(/\*/g, '');
        if (candidateDigits.startsWith(prefix)) {
          for (let i = 0; i < prefix.length; i++) hlSet.add(i);
        }
        if (candidateDigits.endsWith(suffix)) {
          const start = candidateDigits.length - suffix.length;
          for (let i = start; i < candidateDigits.length; i++) hlSet.add(i);
        }
      } else if (isPrefix) {
        const prefix = q.replace(/\*/g, '');
        if (candidateDigits.startsWith(prefix)) {
          for (let i = 0; i < prefix.length; i++) hlSet.add(i);
        }
      } else if (isSuffix) {
        const suffix = q.replace(/\*/g, '');
        if (candidateDigits.endsWith(suffix)) {
          const start = candidateDigits.length - suffix.length;
          for (let i = start; i < candidateDigits.length; i++) hlSet.add(i);
        }
      }
      // else: multiple wildcards or weird pattern -> no highlight (safe)
    } else if (digitsOnly.length === 10) {
      // Exact match -> highlight all
      if (candidateDigits === digitsOnly) {
        for (let i = 0; i < candidateDigits.length; i++) hlSet.add(i);
      }
    } else {
      // Contains match -> highlight first occurrence
      const idx = candidateDigits.indexOf(digitsOnly);
      if (idx !== -1) {
        for (let i = idx; i < idx + digitsOnly.length; i++) hlSet.add(i);
      }
    }

    // If nothing matched, render plain
    if (hlSet.size === 0) return displayNumber;

    // Render display string, mapping digit positions to highlight set
    const result: React.ReactNode[] = [];
    let digitIdx = 0;
    let buf = '';
    let bufHl = false;

    const flush = () => {
      if (buf) {
        result.push(
          <span key={result.length} className={bufHl ? 'font-semibold text-red-600' : 'opacity-80'}>
            {buf}
          </span>
        );
        buf = '';
      }
    };

    for (const ch of displayNumber) {
      if (/\d/.test(ch)) {
        const isHl = hlSet.has(digitIdx);
        if (buf && bufHl !== isHl) flush();
        bufHl = isHl;
        buf += ch;
        digitIdx++;
      } else {
        // non-digit (dot, space) - keep in current buffer
        buf += ch;
      }
    }
    flush();

    return <>{result}</>;
  };

  const networkColors: Record<string, string> = {
    Mobifone: 'bg-primary text-primary-foreground',
    Viettel: 'bg-red-500 text-white',
    Vinaphone: 'bg-blue-500 text-white',
    iTelecom: 'bg-orange-500 text-white',
    Khác: 'bg-gray-500 text-white'
  };

  // Discount badge text is now computed from promotional data

  // Compute quý badge text at render time (position-agnostic)
  const getQuyBadge = (): string | null => {
    if (!quyFilter) return null;
    // Verify this SIM actually matches the filter
    if (!matchesQuyType(sim.rawDigits, quyFilter)) {
      return null;
    }
    return quyFilter;
  };

  const quyBadgeText = getQuyBadge();

  // sim.price = giá hiển thị chính (Final_Price nếu hợp lệ, ngược lại GIÁ BÁN)
  // promotional?.originalPrice = GIÁ BÁN gốc từ Google Sheet
  // Hiển thị giá gạch ngang và badge giảm giá khi: originalPrice tồn tại, > 0, và > sim.price
  const originalPrice = promotional?.originalPrice;
  const hasDiscount = originalPrice && originalPrice > 0 && sim.price > 0 && originalPrice > sim.price;
  const discountAmount = hasDiscount ? originalPrice - sim.price : 0;
  const discountBadgeText = hasDiscount ? formatDiscountAmount(discountAmount) : null;

  return (
    <div className={cn(
      "sim-card-compact group relative overflow-hidden",
      hasDiscount && "ring-1 ring-cta/30 shadow-promo-sm"
    )}>
      {/* VIP Badge - Scaled down */}
      {sim.isVIP && (
        <div className="absolute top-1 right-1">
          <span className="badge-vip-sm">VIP</span>
        </div>
      )}

      {/* Flash Sale Icon - Only shown for discounted SIMs */}
      {hasDiscount && (
        <>
          <style>{`
            @keyframes flashBlink {
              0%   { opacity: 1; transform: scale(1); filter: drop-shadow(0 0 0px rgba(255,255,255,0)); }
              50%  { opacity: 0.25; transform: scale(1.18); filter: drop-shadow(0 0 10px rgba(255,255,255,0.9)); }
              100% { opacity: 1; transform: scale(1); filter: drop-shadow(0 0 0px rgba(255,255,255,0)); }
            }
          `}</style>
          <img
            src="/flash-sale.png"
            alt="Flash Sale"
            className="absolute top-2 left-2 z-20"
            style={{
              width: '56px',
              height: 'auto',
              background: 'transparent',
              border: 'none',
              padding: 0,
              boxShadow: 'none',
              animation: 'flashBlink 0.45s infinite ease-in-out',
              pointerEvents: 'none'
            }}
          />
        </>
      )}

      {/* Network Badge + Quý Position Badge - Responsive scaling */}
      <div className={cn("flex items-center gap-1 mb-1.5 flex-wrap max-w-full", hasDiscount && "mt-8")}>
        <span
          className="px-1.5 py-px rounded font-medium bg-white text-black"
          style={{ fontSize: 'clamp(8px, 1.8vw, 11px)' }}
        >
          {sim.network}
        </span>
        {sim.beautyScore >= 50 && (
          <span 
            className="px-1.5 py-px rounded font-medium bg-gold/20 text-gold-dark"
            style={{ fontSize: 'clamp(8px, 1.8vw, 11px)' }}
          >
            ⭐ Số đẹp
          </span>
        )}
        {quyBadgeText && (
          <span 
            className="px-1.5 py-px rounded font-semibold bg-primary/10 text-primary border border-primary/20 animate-fade-in"
            style={{ fontSize: 'clamp(8px, 1.8vw, 11px)' }}
          >
            {quyBadgeText}
          </span>
        )}
      </div>

      {/* SIM Number - Auto-resize based on container width with clamp() */}
      {/* Priority: displayNumber (from Google Sheet) > formattedNumber (generated) */}
      <div 
        className="sim-number-auto mb-1.5 group-hover:gold-glow transition-all whitespace-nowrap overflow-hidden text-ellipsis"
        style={{ fontSize: 'clamp(14px, 3.5vw, 22px)' }}
      >
        {formatWithHighlight(sim.displayNumber || sim.formattedNumber)}
      </div>

      {/* Tags - Responsive scaling, filter out duplicate "Số đẹp" since we already show ⭐ Số đẹp badge */}
      <div className="flex flex-wrap gap-0.5 mb-1.5 max-w-full overflow-hidden">
        {sim.tags
          .filter(tag => !['Số đẹp', 'SỐ ĐẸP', 'SO DEP', 'Số Đẹp'].includes(tag))
          .slice(0, 3)
          .map((tag) => (
          <span 
            key={tag} 
            className="badge-type-sm"
            style={{ fontSize: 'clamp(8px, 1.6vw, 11px)' }}
          >
            {tag}
          </span>
        ))}
        {sim.tags.length > 3 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span 
                  className="badge-type-sm cursor-help"
                  style={{ fontSize: 'clamp(8px, 1.6vw, 11px)' }}
                >
                  +{sim.tags.length - 3}
                </span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{sim.tags.slice(3).join(', ')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Price and CTA - Aligned bottom with mt-auto, responsive scaling */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <div className="flex flex-col">
          {/* Hiển thị giá gốc gạch ngang khi có giảm giá */}
          {hasDiscount && (
            <span 
              className="text-muted-foreground line-through opacity-70"
              style={{ fontSize: 'clamp(8px, 1.6vw, 11px)' }}
            >
              {formatPrice(originalPrice)}
            </span>
          )}
          {/* Giá chính (Final_Price hoặc GIÁ BÁN) - ~50% larger, white color */}
          <span 
            className="font-bold"
            style={{ 
              fontSize: 'clamp(14px, 3vw, 21px)', 
              color: '#FFFFFF' 
            }}
          >
            {formatPrice(sim.price)}
          </span>
        </div>
        <button 
          onClick={handleBuyClick}
          className="btn-cta-sm flex items-center gap-1 py-1 px-2"
          style={{ fontSize: 'clamp(8px, 1.8vw, 11px)' }}
        >
          <Phone style={{ width: 'clamp(8px, 1.8vw, 12px)', height: 'clamp(8px, 1.8vw, 12px)' }} />
          MUA NGAY
        </button>
      </div>
    </div>
  );
};

export default SIMCardNew;