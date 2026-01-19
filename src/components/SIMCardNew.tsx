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
import flashSaleIcon from '@/assets/flash-sale.png';

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

  // Highlight based on search query, or fallback to last 4 digits highlight
  const formatWithHighlight = (displayNumber: string): React.ReactNode => {
    const highlightQuery = String(searchQuery || '').replace(/[^\d*]/g, '');

    // If there's a search query with 2+ digits, use search highlighting
    const queryDigits = highlightQuery.replace(/[^\d]/g, '');
    if (queryDigits.length >= 2) {
      const spans = createHighlightedNumber(displayNumber, sim.rawDigits, highlightQuery);
      return <>{spans}</>;
    }
    
    // Default: highlight last segment (after last dot)
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
            @keyframes flashSaleBlink {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.2; transform: scale(1.12); }
            }
            .flash-sale-icon {
              animation: flashSaleBlink 0.5s ease-in-out infinite;
              background: transparent !important;
              border: none !important;
              box-shadow: none !important;
              outline: none !important;
              padding: 0 !important;
            }
          `}</style>
          <img 
            src={flashSaleIcon} 
            alt="Flash Sale" 
            className="flash-sale-icon absolute top-1 left-1 w-10 h-10 object-contain pointer-events-none z-10 block"
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