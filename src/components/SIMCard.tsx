import { type NormalizedSIM } from '@/lib/simUtils';
import { getPromotionalData } from '@/hooks/useSimData';
import { ShoppingCart, Shield } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SIMCardProps {
  sim: NormalizedSIM;
}

// Format price to Vietnamese display (e.g. 3500000 → "3,5 triệu")
const formatPrice = (price: number): string => {
  if (!price || price <= 0) return 'Liên hệ';
  const million = price / 1_000_000;
  if (million >= 1000) return `${(million / 1000).toFixed(0)} tỷ`;
  if (Number.isInteger(million)) return `${million} triệu`;
  return `${million.toFixed(1).replace('.', ',')} triệu`;
};

const SIMCard = ({ sim }: SIMCardProps) => {
  const promoData = getPromotionalData(sim.id);
  const originalPrice = promoData?.originalPrice;
  const hasDiscount =
    originalPrice && originalPrice > 0 && sim.price > 0 && originalPrice > sim.price;

  // Highlight last 3 digits (VIP-style)
  const formatWithHighlight = (formatted: string) => {
    const parts = formatted.split('.');
    if (parts.length === 3) {
      return (
        <>
          <span className="text-gold">{parts[0]}</span>
          <span className="text-muted-foreground">.</span>
          <span className="text-gold">{parts[1]}</span>
          <span className="text-muted-foreground">.</span>
          <span className="text-gold-dark font-extrabold gold-glow">{parts[2]}</span>
        </>
      );
    }
    return <span className="text-gold">{formatted}</span>;
  };

  // Network badge colors — covers all values detectNetwork() can return
  const networkColors: Record<string, string> = {
    Mobifone:     'bg-primary text-primary-foreground',
    Vinaphone:    'bg-blue-500 text-white',
    Gmobile:      'bg-green-600 text-white',
    Khác:         'bg-gray-500 text-white',
  };

  const badgeClass =
    networkColors[sim.network] ?? 'bg-gray-500 text-white';

  return (
    <div className="sim-card group">
      {/* Network Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${badgeClass}`}>
          {sim.network}
        </span>

        {/* Discount badge (shown only when there is a real discount) */}
        {hasDiscount && originalPrice && (
          <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-500 text-white">
            -{Math.round((1 - sim.price / originalPrice) * 100)}%
          </span>
        )}
      </div>

      {/* SIM Number */}
      <div className="text-center py-4">
        <p className="sim-number tracking-wider">
          {formatWithHighlight(sim.formattedNumber)}
        </p>
      </div>

      {/* Tag Badges — use sim.tags (NormalizedSIM field) */}
      <div className="flex flex-wrap gap-1.5 mb-4 justify-center">
        {sim.tags
          .filter((t) => t !== 'SIM thường')
          .map((tag) => (
            <span key={tag} className="badge-type">
              {tag}
            </span>
          ))}
      </div>

      {/* Price */}
      <div className="text-center mb-4">
        {hasDiscount && originalPrice ? (
          <>
            <p className="text-sm line-through text-muted-foreground">
              {formatPrice(originalPrice)}
            </p>
            <p className="text-2xl font-bold text-cta">{formatPrice(sim.price)}</p>
          </>
        ) : (
          <p className="text-2xl font-bold text-cta">{formatPrice(sim.price)}</p>
        )}
      </div>

      {/* CTA Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="btn-cta w-full flex items-center justify-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            <span>MUA NGAY</span>
          </button>
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className="bg-header-bg text-header-foreground max-w-xs"
        >
          <div className="flex items-start gap-2 p-1">
            <Shield className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p className="text-sm">Hỗ trợ đăng ký chính chủ – Giao SIM toàn quốc</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </div>
  );
};

export default SIMCard;
