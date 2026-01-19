import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const menuItems = [
  { label: 'SIM SỐ', href: '#sim-so' },
  { label: 'SIM PHONG THỦY', href: '/sim-phong-thuy' },
  { label: 'SIM TRẢ GÓP', href: '#tra-gop' },
  { label: 'ĐỊNH GIÁ SIM', href: '/dinh-gia-sim' },
  { label: 'THANH TOÁN', href: '/thanh-toan' },
  { label: 'TIN TỨC', href: '#tin-tuc' },
];

const Navigation = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav className="bg-card sticky top-0 z-50 shadow-soft border-b border-border">
      <div className="container mx-auto px-4">
        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center justify-center gap-2 py-3">
          {menuItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="menu-pill shimmer-hover relative text-primary-foreground text-sm"
            >
              {item.label}
            </a>
          ))}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="lg:hidden flex items-center justify-between py-3">
          <span className="text-primary font-semibold">Menu</span>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg bg-primary text-primary-foreground"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="lg:hidden pb-4 space-y-2">
            {menuItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 rounded-lg bg-primary-light text-primary-dark font-medium hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
