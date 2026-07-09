import { useDeliveredCount } from "@/hooks/useDeliveredCount";

const TrustBar = () => {
  const { deliveredCount, isLoading } = useDeliveredCount();
  const deliveredLabel = isLoading
    ? "…"
    : deliveredCount.toLocaleString("vi-VN");

  return (
    <div className="bg-primary/90 border-b border-primary-dark">
      <div className="container mx-auto px-4 py-2.5">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-[11px] md:text-sm font-medium text-primary-foreground/95 leading-relaxed">
          <div className="flex items-center gap-1.5">
            <span>✅</span>
            <span>{deliveredLabel} đơn đã giao</span>
          </div>
          <div className="hidden sm:block text-primary-foreground/40">|</div>
          <div className="flex items-center gap-1.5">
            <span>⚡</span>
            <span>Ship HCM trong 2-4h</span>
          </div>
          <div className="hidden sm:block text-primary-foreground/40">|</div>
          <div className="flex items-center gap-1.5">
            <span>🔒</span>
            <span>Chính hãng MobiFone</span>
          </div>
          <div className="hidden sm:block text-primary-foreground/40">|</div>
          <div className="flex items-center gap-1.5">
            <span>↩️</span>
            <span>Đổi trả 7 ngày</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustBar;
