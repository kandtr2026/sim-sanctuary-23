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
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "call_click", {
        event_category: "contact",
        event_label: "header_call",
        phone_number: "+84938868868",
      });
    }
  }}
  className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition"
>
  <Phone className="w-5 h-5 text-gold" />
  <span className="text-red-500">0938.868.868</span>
</a>



  <a
    href="https://zalo.me/0901191111"
    target="_blank"
    rel="noopener noreferrer"
    onClick={() => {
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "click_zalo", {
          event_category: "contact",
          event_label: "header_zalo",
        });
      }
    }}
    className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-primary-foreground px-4 py-2 rounded"
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
