import { Phone, MessageCircle } from 'lucide-react';

const Header = () => {
  return (
    <header className="bg-header-bg text-header-foreground py-3 px-4">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="text-xl md:text-2xl font-bold tracking-tight">
            <span className="text-gold">CHONSO</span>
            <span className="text-primary">MOBIFONE</span>
            <span className="text-header-foreground">.COM</span>
          </div>
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
            href="tel:0909888888" 
            className="flex items-center gap-2 text-gold font-bold text-lg hover:text-gold-light transition-colors"
          >
            <Phone className="w-5 h-5" />
            <span>0909.888.888</span>
          </a>
          <button className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-primary-foreground px-4 py-2 rounded-lg font-medium transition-all duration-200 hover:-translate-y-0.5">
            <MessageCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Chat tư vấn</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
