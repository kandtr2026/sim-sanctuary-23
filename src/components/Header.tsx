import { Phone, MessageCircle } from "lucide-react";

const Header = () => {
  return (
    <header className="bg-header-bg text-header-foreground py-3 px-4">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <a href="/" className="text-xl md:text-2xl font-bold tracking-tight">
            <span className="text-gold">CHONSO</span>
            <span className="text-primary">MOBIFONE</span>
            <span className="text-header-foreground">.COM</span>
          </a>
        </div>

        {/* Tagline */}
        <div className="text-center hidden lg:block">
          <p className="text-sm md:text-base font-medium text-header-foreground/90">
            Kho SIM số đẹp – Giá chuẩn – Giao SIM toàn quốc
          </p>
        </div>

        {/* Contact */}
        <div className="flex items-center gap-4">
          <a
            href="tel:+84938868868"
            onClick={() => {
              window.gtag?.("event", "click_call", {
                event_category: "contact",
                event_label: "header_call",
                phone_number: "+84938868868",
              });
            }}
            className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition-colors"
          >
            <Phone className="w-5 h-5 text-gold" />
            <span className="text-red-500">0938.868.868</span>
          </a>
          <a
            href="https://zalo.me/0901191111?text=%F0%9F%91%8B%20Xin%20ch%C3%A0o%2C%20t%C3%B4i%20%C4%91ang%20quan%20t%C3%A2m%20%C4%91%E1%BA%BFn%20sim%20s%E1%BB%91%20%C4%91%E1%BA%B9p%20tr%C3%AAn%20website%20v%C3%A0%20mu%E1%BB%91n%20%C4%91%C6%B0%E1%BB%A3c%20t%C6%B0%20v%E1%BA%A5n."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-primary-foreground px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:-translate-y-0.5"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Chat tư vấn</span>
          </a>
        </div>
      </div>
    </header>
  );
};

export default Header;
