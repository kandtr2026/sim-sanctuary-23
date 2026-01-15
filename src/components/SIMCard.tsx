import { type SIMData, formatPrice } from '@/data/simData';
import { ShoppingCart, Shield } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SIMCardProps {
  sim: SIMData;
}

const SIMCard = ({ sim }: SIMCardProps) => {
  // Highlight VIP digits (last 4)
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

  const networkColors: Record<string, string> = {
    Mobifone: 'bg-primary text-primary-foreground',
    Viettel: 'bg-red-500 text-white',
    Vinaphone: 'bg-blue-500 text-white',
    iTelecom: 'bg-orange-500 text-white',
  };

  return (
    <div className="sim-card group">
      {/* Network Badge */}
      <div className="flex items-center justify-between mb-3">
        <span className={`px-2 py-0.5 rounded text-xs font-medium ${networkColors[sim.network]}`}>
          {sim.network}
        </span>
        {sim.isVIP && (
          <span className="badge-vip flex items-center gap-1">
            <span>⭐</span> VIP
          </span>
        )}
      </div>

      {/* SIM Number */}
      <div className="text-center py-4">
        <p className="sim-number tracking-wider">
          {formatWithHighlight(sim.formattedNumber)}
        </p>
      </div>

      {/* Type Badges */}
      <div className="flex flex-wrap gap-1.5 mb-4 justify-center">
        {sim.types.filter(t => t !== 'SIM thường').map((type) => (
          <span key={type} className="badge-type">
            {type}
          </span>
        ))}
      </div>

      {/* Price */}
      <div className="text-center mb-4">
        <p className="text-2xl font-bold text-cta">
          {formatPrice(sim.price)}
        </p>
      </div>

      {/* CTA Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="btn-cta w-full flex items-center justify-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            <span>MUA NGAY</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-header-bg text-header-foreground max-w-xs">
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
