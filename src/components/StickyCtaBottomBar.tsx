import { Phone, ShoppingCart } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const ALLOWED_PATHS = ["/", "/mua-sim-gia-re"];

const StickyCtaBottomBar = () => {
  const location = useLocation();
  const isMobile = useIsMobile();

  if (!isMobile || !ALLOWED_PATHS.includes(location.pathname)) return null;

  return (
    <>
      {/* Spacer to prevent content from being hidden behind the bar */}
      <div className="block md:hidden" style={{ height: 70 }} />
      <div
        id="sticky-cta-bottom"
        className="fixed bottom-0 left-0 right-0 z-[9998] flex items-center gap-2 px-3 md:hidden"
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
          href="https://zalo.me/0901191111"
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 rounded-md text-black font-semibold text-sm py-3"
          style={{ backgroundColor: "#FFC107", minHeight: 44 }}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Xem giỏ hàng</span>
        </a>
      </div>
    </>
  );
};

export default StickyCtaBottomBar;
