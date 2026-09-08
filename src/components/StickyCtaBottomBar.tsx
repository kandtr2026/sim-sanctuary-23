"use client";

import { Phone, MessageCircle } from "lucide-react";
import { usePathname } from "next/navigation";
import { useIsMobile } from "@/hooks/use-mobile";

const CHECKOUT_PATH = "/mua-ngay";

const StickyCtaBottomBar = () => {
  const pathname = usePathname() ?? "";
  const isMobile = useIsMobile();

  // Show on every route except checkout (/mua-ngay/...), which already has its
  // own order form. The floating desktop stack is hidden below md, so this bar
  // is the only floating contact layer on mobile — the old allow-list left
  // /sim-phong-thuy, /mua-sim-tu-quy, /dinh-gia-sim, /tin-tuc/*, /thanh-toan,
  // /sim-tra-gop and every policy page with no CTA at all.
  const isCheckout =
    pathname === CHECKOUT_PATH || pathname.startsWith(`${CHECKOUT_PATH}/`);

  if (!isMobile || isCheckout) return null;

  return (
    <>
      {/* Spacer keeps page content clear of the fixed bar */}
      <div className="block md:hidden" style={{ height: "var(--sticky-cta-height)" }} />
      <div
        id="sticky-cta-bottom"
        className="fixed bottom-0 left-0 right-0 z-[70] flex flex-col gap-1.5 px-3 md:hidden"
        style={{
          backgroundColor: "hsl(var(--header-bg))",
          paddingTop: 8,
          paddingBottom: "calc(8px + env(safe-area-inset-bottom, 0px))",
          boxShadow: "0 -2px 10px rgba(0,0,0,0.3)",
          minHeight: 56,
        }}
      >
        {/* Micro-trust: một dòng nhỏ trấn an trước khi khách bấm gọi/Zalo. */}
        <p
          className="text-center font-medium text-white/70"
          style={{ fontSize: 11, lineHeight: 1.2 }}
        >
          Sang tên chính chủ · Giao 30 phút
        </p>
        <div className="flex items-center gap-2">
          {/* Cùng một số 0933.686.666: nút này quay số gọi trực tiếp. */}
          <a
            href="tel:+84933686666"
            aria-label="Gọi tư vấn chọn số qua hotline 0933.686.666"
            className="flex-1 flex items-center justify-center gap-2 rounded-md text-white py-2.5"
            style={{ backgroundColor: "#E31E24", minHeight: 44 }}
          >
            <Phone className="w-4 h-4 shrink-0" />
            <span className="flex flex-col items-start leading-tight">
              <span className="text-sm font-semibold">Gọi tư vấn</span>
              <span className="font-normal opacity-90" style={{ fontSize: 11 }}>chọn số</span>
            </span>
          </a>
          {/* Cùng một số 0933.686.666: nút này mở khung chat Zalo. */}
          <a
            href="https://zalo.me/0933686666"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat Zalo tư vấn, phản hồi trong 5 phút — 0933.686.666"
            className="flex-1 flex items-center justify-center gap-2 rounded-md text-black py-2.5"
            style={{ backgroundColor: "#FFC107", minHeight: 44 }}
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span className="flex flex-col items-start leading-tight">
              <span className="text-sm font-semibold">Chat Zalo</span>
              <span className="font-normal opacity-90" style={{ fontSize: 11 }}>rep trong 5 phút</span>
            </span>
          </a>
        </div>
      </div>
    </>
  );
};

export default StickyCtaBottomBar;
