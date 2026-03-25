import { Phone, CheckCircle2 } from 'lucide-react';
import simCardGold from '@/assets/sim-card-gold.png';
import {
  Dialog,
  DialogContent,
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
  const zaloMessage = `Chào shop, tôi muốn đặt sim ${simNumber}, giá ${simPrice}. Nhờ shop tư vấn và giữ sim giúp tôi.`;
  const zaloUrl = `https://zalo.me/${ZALO_BASE}?text=${encodeURIComponent(zaloMessage)}`;
  const callUrl = `tel:${HOTLINE}`;

  const digits = simNumber.replace(/\D/g, '');
  const prefix = digits.substring(0, 3);
  const networkName = simNetwork && simNetwork !== 'Khác' ? simNetwork : '';
  const description = networkName
    ? `Sim Số Đẹp ${networkName} Đầu ${prefix}`
    : `Sim Số Đẹp Đầu ${prefix}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md p-0 border border-[hsl(45,80%,45%)]/40 bg-[#1a1a1a] rounded-2xl overflow-hidden shadow-[0_0_40px_rgba(245,179,1,0.15)] [&>button]:z-[60] [&>button]:w-10 [&>button]:h-10 [&>button]:pointer-events-auto [&>button]:rounded-full [&>button]:border [&>button]:border-[hsl(45,80%,45%)]/40 [&>button]:bg-[#2a2a2a] [&>button]:text-white [&>button]:hover:bg-[#3a3a3a] [&>button]:right-3 [&>button]:top-3"
        aria-describedby={undefined}
      >
        {/* Title */}
        <div className="pt-6 pb-2 px-6 text-center">
          <h2 className="text-xl font-bold text-[hsl(45,90%,65%)]">
            Liên hệ đặt hàng ngay hôm nay
          </h2>
        </div>

        {/* Scarcity badge */}
        <div className="flex justify-center pb-3">
          <span className="bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
            GIỚI HẠN: Chỉ còn 1 Số
          </span>
        </div>

        {/* SIM info section */}
        <div className="px-6 pb-4">
          <div className="flex items-center gap-4">
            {/* SIM card illustration */}
            <div className="shrink-0 w-36 h-24 flex items-center justify-center">
              <img src={simCardGold} alt="SIM Card" className="w-full h-full object-contain rounded-lg drop-shadow-lg" />
            </div>

            {/* SIM details */}
            <div className="flex-1 min-w-0">
              <div className="text-2xl sm:text-3xl font-extrabold text-primary tracking-wide leading-tight">
                {simNumber}
              </div>
              <div className="text-xl sm:text-2xl font-bold text-white mt-1">
                {simPrice}
              </div>
              <div className="text-sm text-white/60 mt-0.5">
                {description}
              </div>
            </div>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="px-6 space-y-3">
          {/* Zalo */}
          <a
            href={zaloUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl bg-[#0068ff] hover:bg-[#0055dd] text-white font-bold text-base transition-colors shadow-lg"
          >
            <span className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0">
              <span className="text-[#0068ff] font-extrabold text-xl">Z</span>
            </span>
            <div className="flex flex-col items-center">
              <span className="text-base font-bold leading-tight">Chat Zalo đặt hàng</span>
              <span className="text-xs font-normal opacity-80 leading-tight">Nhận tư vấn miễn phí</span>
            </div>
          </a>

          {/* Call */}
          <a
            href={callUrl}
            className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base transition-colors shadow-lg"
          >
            <span className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-white" />
            </span>
            <div className="flex flex-col items-center">
              <span className="text-base font-bold leading-tight">Gọi giao ngay</span>
              <span className="text-xs font-normal opacity-80 leading-tight">Hỗ trợ 24/7 (Miễn phí cuộc gọi)</span>
            </div>
          </a>
        </div>

        {/* Trust bar */}
        <div className="px-6 py-4 mt-2 flex items-center justify-between text-xs text-white/50">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(45,80%,55%)] shrink-0" />
            Kiểm tra trước khi nhận
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(45,80%,55%)] shrink-0" />
            Cam kết chính chủ
          </span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-[hsl(45,80%,55%)] shrink-0" />
            Miễn phí giao hàng
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickContactPopup;
