import { Phone } from 'lucide-react';
import type { NormalizedSIM } from '@/lib/simUtils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface SIMCardNewProps {
  sim: NormalizedSIM;
}

const SIMCardNew = ({ sim }: SIMCardNewProps) => {
  // Format price for display
  const formatPrice = (price: number): string => {
    if (price >= 1000000000) {
      return `${(price / 1000000000).toFixed(1)} tỷ`;
    }
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(0)} triệu`;
    }
    return `${price.toLocaleString('vi-VN')} đ`;
  };

  // Get discount badge text based on type and value
  const getDiscountBadgeText = (): string | null => {
    if (!sim.hasPromotion) return null;
    
    if (sim.discountType === 'percent' && sim.discountValue) {
      return `Giảm ${sim.discountValue}%`;
    }
    if (sim.discountType === 'amount' && sim.discountValue) {
      if (sim.discountValue >= 1000000) {
        return `Giảm ${(sim.discountValue / 1000000).toFixed(0)} triệu`;
      }
      return `Giảm ${sim.discountValue.toLocaleString('vi-VN')}đ`;
    }
    if (sim.discountType === 'fixed') {
      return 'Giá khuyến mãi';
    }
    // Fallback: calculate percent if we have both prices
    if (sim.finalPrice && sim.originalPrice > 0) {
      const percentOff = Math.round((1 - sim.finalPrice / sim.originalPrice) * 100);
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

  return (
    <div className={cn(
      "sim-card group relative overflow-hidden",
      sim.hasPromotion && "ring-2 ring-cta/30 shadow-promo"
    )}>
      {/* VIP Badge */}
      {sim.isVIP && (
        <div className="absolute top-2 right-2">
          <span className="badge-vip">VIP</span>
        </div>
      )}

      {/* Discount Badge */}
      {discountBadgeText && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute top-2 left-2 animate-badge-in">
                <span className="badge-discount">
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

      {/* Network Badge */}
      <div className={cn("flex items-center gap-2 mb-3", discountBadgeText && "mt-6")}>
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${networkColors[sim.network]}`}>
          {sim.network}
        </span>
        {sim.beautyScore >= 50 && (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-gold/20 text-gold-dark">
            ⭐ Số đẹp
          </span>
        )}
      </div>

      {/* SIM Number */}
      <div className="sim-number mb-3 group-hover:gold-glow transition-all">
        {formatWithHighlight(sim.formattedNumber)}
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1 mb-3">
        {sim.tags.slice(0, 3).map((tag) => (
          <span key={tag} className="badge-type">
            {tag}
          </span>
        ))}
        {sim.tags.length > 3 && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="badge-type cursor-help">+{sim.tags.length - 3}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{sim.tags.slice(3).join(', ')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      {/* Price and CTA */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          {/* Promotional Price Display */}
          {sim.hasPromotion && sim.finalPrice ? (
            <>
              {/* Original price - strikethrough, muted */}
              <span className="text-sm text-muted-foreground line-through opacity-70">
                {formatPrice(sim.originalPrice)}
              </span>
              {/* Final price - emphasized */}
              <span className="text-xl font-bold text-cta animate-price-pulse">
                {formatPrice(sim.finalPrice)}
              </span>
            </>
          ) : (
            /* Regular price display */
            <span className="text-xl font-bold text-cta">
              {formatPrice(sim.originalPrice)}
            </span>
          )}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="btn-cta flex items-center gap-2 py-2 px-4 text-sm">
                <Phone className="w-4 h-4" />
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