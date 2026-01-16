import { Phone } from 'lucide-react';
import type { NormalizedSIM, PromotionalData, QuyType } from '@/lib/simUtils';
import { matchesQuyType } from '@/lib/simUtils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SIMCardNewProps {
  sim: NormalizedSIM;
  promotional?: PromotionalData;
  quyFilter?: QuyType | null;
}

const SIMCardNew = ({ sim, promotional, quyFilter }: SIMCardNewProps) => {
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

  // Determine if this SIM has a valid promotion
  const hasPromotion = !!(
    promotional?.finalPrice &&
    promotional?.originalPrice &&
    promotional.finalPrice < promotional.originalPrice
  );

  // Get discount badge text based on type and value
  const getDiscountBadgeText = (): string | null => {
    if (!hasPromotion || !promotional) return null;
    
    if (promotional.discountType === 'percent' && promotional.discountValue) {
      return `Giảm ${promotional.discountValue}%`;
    }
    if (promotional.discountType === 'amount' && promotional.discountValue) {
      if (promotional.discountValue >= 1000000) {
        return `Giảm ${(promotional.discountValue / 1000000).toFixed(0)} triệu`;
      }
      return `Giảm ${promotional.discountValue.toLocaleString('vi-VN')}đ`;
    }
    if (promotional.discountType === 'fixed') {
      return 'Giá khuyến mãi';
    }
    // Fallback: calculate percent if we have both prices
    if (promotional.finalPrice && promotional.originalPrice > 0) {
      const percentOff = Math.round((1 - promotional.finalPrice / promotional.originalPrice) * 100);
      if (percentOff > 0) {
        return `Giảm ${percentOff}%`;
      }
    }
    return 'Khuyến mãi';
  };

  // Highlight the last 4 digits
  const formatWithHighlight = (formatted: string): React.ReactNode => {
    const parts = formatted.split('.');
    if (parts.length === 3) {
      return (
        <>
          <span className="opacity-80">{parts[0]}.</span>
          <span className="opacity-80">{parts[1]}.</span>
          <span className="text-gold font-extrabold">{parts[2]}</span>
        </>
      );
    }
    return formatted;
  };

  const networkColors: Record<string, string> = {
    Mobifone: 'bg-primary text-primary-foreground',
    Viettel: 'bg-red-500 text-white',
    Vinaphone: 'bg-blue-500 text-white',
    iTelecom: 'bg-orange-500 text-white',
    Khác: 'bg-gray-500 text-white'
  };

  const discountBadgeText = getDiscountBadgeText();

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

  // Use sim.price as the display price (already has effective price from useSimData)
  // If promotional data exists, use it for original/final display
  const displayOriginalPrice = promotional?.originalPrice ?? sim.price;
  const displayFinalPrice = promotional?.finalPrice;

  return (
    <div className={cn(
      "sim-card-compact group relative overflow-hidden",
      hasPromotion && "ring-1 ring-cta/30 shadow-promo-sm"
    )}>
      {/* VIP Badge - Scaled down */}
      {sim.isVIP && (
        <div className="absolute top-1 right-1">
          <span className="badge-vip-sm">VIP</span>
        </div>
      )}

      {/* Discount Badge - Scaled down */}
      {discountBadgeText && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute top-1 left-1 animate-badge-in">
                <span className="badge-discount-sm">
                  {discountBadgeText}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ưu đãi áp dụng trong thời gian ngắn</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}

      {/* Network Badge + Quý Position Badge - Scaled down */}
      <div className={cn("flex items-center gap-1 mb-1.5 flex-wrap", discountBadgeText && "mt-4")}>
        <span className={`px-1.5 py-px rounded text-[10px] font-medium ${networkColors[sim.network]}`}>
          {sim.network}
        </span>
        {sim.beautyScore >= 50 && (
          <span className="px-1.5 py-px rounded text-[10px] font-medium bg-gold/20 text-gold-dark">
            ⭐ Số đẹp
          </span>
        )}
        {quyBadgeText && (
          <span className="px-1.5 py-px rounded text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20 animate-fade-in">
            {quyBadgeText}
          </span>
        )}
      </div>

      {/* SIM Number - Auto-resize based on container width */}
      {/* Priority: displayNumber (from Google Sheet) > formattedNumber (generated) */}
      <div className="sim-number-auto mb-1.5 group-hover:gold-glow transition-all whitespace-nowrap">
        {formatWithHighlight(sim.displayNumber || sim.formattedNumber)}
      </div>

      {/* Tags - Scaled down, filter out duplicate "Số đẹp" since we already show ⭐ Số đẹp badge */}
      <div className="flex flex-wrap gap-0.5 mb-1.5">
        {sim.tags
          .filter(tag => !['Số đẹp', 'SỐ ĐẸP', 'SO DEP', 'Số Đẹp'].includes(tag))
          .slice(0, 3)
          .map((tag) => (
          <span key={tag} className="badge-type-sm">
            {tag}
          </span>
        ))}
        {sim.tags.length > 3 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="badge-type-sm cursor-help">+{sim.tags.length - 3}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{sim.tags.slice(3).join(', ')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Price and CTA - Scaled down */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          {/* Promotional Price Display */}
          {hasPromotion && displayFinalPrice ? (
            <>
              {/* Original price - strikethrough, muted */}
              <span className="text-[10px] text-muted-foreground line-through opacity-70">
                {formatPrice(displayOriginalPrice)}
              </span>
              {/* Final price - emphasized */}
              <span className="text-sm font-bold text-cta animate-price-pulse">
                {formatPrice(displayFinalPrice)}
              </span>
            </>
          ) : (
            /* Regular price display - use sim.price which is the effective price */
            <span className="text-sm font-bold text-cta">
              {formatPrice(sim.price)}
            </span>
          )}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="btn-cta-sm flex items-center gap-1 py-1 px-2 text-[10px]">
                <Phone className="w-2.5 h-2.5" />
                MUA NGAY
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Liên hệ: 0909.123.456</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
};

export default SIMCardNew;