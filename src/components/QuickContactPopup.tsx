import { Phone } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const HOTLINE = '0938868868';
const ZALO_BASE = '0901191111';

interface QuickContactPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  simNumber: string;
  simPrice: string;
  simNetwork?: string;
}

const QuickContactPopup = ({ open, onOpenChange, simNumber, simPrice, simNetwork }: QuickContactPopupProps) => {
  const networkText = simNetwork && simNetwork !== 'Khác' ? ` Mạng: ${simNetwork}` : '';
  const zaloMessage = `Chào shop, tôi muốn đặt sim ${simNumber}, giá ${simPrice}. Nhờ shop tư vấn và giữ sim giúp tôi.${networkText}`;
  const zaloUrl = `https://zalo.me/${ZALO_BASE}?text=${encodeURIComponent(zaloMessage)}`;
  const callUrl = `tel:${HOTLINE}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="text-center text-lg font-bold">
            Liên hệ đặt hàng ngay hôm nay
          </DialogTitle>
        </DialogHeader>

        {/* SIM info summary */}
        <div className="text-center mb-2">
          <div className="text-2xl font-bold text-primary tracking-wider mb-1">{simNumber}</div>
          <div className="text-lg font-semibold text-foreground">{simPrice}</div>
          {simNetwork && simNetwork !== 'Khác' && (
            <span className="inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold bg-primary text-primary-foreground">
              {simNetwork}
            </span>
          )}
        </div>

        <div className="space-y-3 mt-2">
          {/* Zalo button */}
          <a
            href={zaloUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl bg-[#0068ff] hover:bg-[#0055dd] text-white font-bold text-base transition-colors shadow-md"
          >
            <span className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0">
              <span className="text-[#0068ff] font-extrabold text-lg">Z</span>
            </span>
            Chat Zalo đặt hàng
          </a>

          {/* Call button */}
          <a
            href={callUrl}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base transition-colors shadow-md"
          >
            <Phone className="w-5 h-5" />
            Gọi giao ngay
          </a>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickContactPopup;
