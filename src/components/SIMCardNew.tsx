import { Phone } from 'lucide-react';
import type { NormalizedSIM } from '@/lib/simUtils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SIMCardNewProps {
  sim: NormalizedSIM;
}

const SIMCardNew = ({ sim }: SIMCardNewProps) => {
  const formatPrice = (price: number): string => {
    if (price >= 1000000000) {
      return `${(price / 1000000000).toFixed(1)} tỷ`;
    }
    if (price >= 1000000) {
      return `${(price / 1000000).toFixed(0)} triệu`;
    }
    return `${price.toLocaleString('vi-VN')} đ`;
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

  return (
    <div className="sim-card group relative overflow-hidden">
      {/* VIP Badge */}
      {sim.isVIP && (
        <div className="absolute top-2 right-2">
          <span className="badge-vip">VIP</span>
        </div>
      )}

      {/* Network Badge */}
      <div className="flex items-center gap-2 mb-3">
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
        <div>
          <span className="text-xl font-bold text-cta">{formatPrice(sim.price)}</span>
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
