const TrustBar = () => {
  return (
    <div className="bg-primary border-b border-primary-dark">
      <div className="container mx-auto px-4 py-2">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-xs md:text-sm font-semibold text-primary-foreground">
          <div className="flex items-center gap-1.5">
            <span>✅</span>
            <span>1,247 đơn đã giao</span>
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
