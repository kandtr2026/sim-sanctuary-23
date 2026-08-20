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
        className="fixed bottom-0 left-0 right-0 z-[70] flex items-center gap-2 px-3 md:hidden"
        style={{
          backgroundColor: "hsl(var(--header-bg))",
          paddingTop: 8,
          paddingBottom: "calc(8px + env(safe-area-inset-bottom, 0px))",
          boxShadow: "0 -2px 10px rgba(0,0,0,0.3)",
          minHeight: 56,
        }}
      >
        <a
          href="tel:+84938868868"
          className="flex-1 flex items-center justify-center gap-2 rounded-md text-white font-semibold text-sm py-3"
          style={{ backgroundColor: "#E31E24", minHeight: 44 }}
        >
          <Phone className="w-4 h-4" />
          <span>Tư vấn chọn số</span>
        </a>
        <a
          href="https://zalo.me/0933356666"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 rounded-md text-black font-semibold text-sm py-3"
          style={{ backgroundColor: "#FFC107", minHeight: 44 }}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Chat Zalo - Giao ngay</span>
        </a>
      </div>
    </>
  );
};

export default StickyCtaBottomBar;
