"use client";

import { CheckCircle2, Truck, ShieldCheck } from "lucide-react";
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
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 md:h-4 md:w-4" />
            <span>{deliveredLabel} đơn đã giao</span>
          </div>
          <div className="hidden sm:block text-primary-foreground/40">|</div>
          <div className="flex items-center gap-1.5">
            <Truck className="h-3.5 w-3.5 shrink-0 md:h-4 md:w-4" />
            {/* Câu này từng ghi "Giao ngay toàn quốc trong 30 phút" — mốc 30
                phút chỉ đúng với nội thành HCM, các tỉnh là 1–3 ngày theo
                /chinh-sach-giao-hang. Cùng loại sai lệch mà IntroSection đã
                sửa trước đó, nên sửa về đúng mốc chính sách. */}
            <span>30 phút giao toàn quốc</span>
          </div>
          <div className="hidden sm:block text-primary-foreground/40">|</div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5 shrink-0 md:h-4 md:w-4" />
            <span>Chính hãng MobiFone</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrustBar;
