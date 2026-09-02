"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { NavLink } from "@/components/NavLink";

// Kept to 7 items: browse numbers, phong thủy, category pages, năm sinh, giá
// rẻ, read. "THANH TOÁN" removed from nav (giá trị SEO thấp, chuyển xuống
// Footer — footer đã có). SIM NĂM SINH đứng sau SIM TỨ QUÝ, trước SIM GIÁ RẺ.
const menuItems = [
  { label: "SIM SỐ", href: "/" },
  { label: "SIM PHONG THỦY", href: "/sim-phong-thuy" },
  { label: "SIM THẦN TÀI", href: "/sim-than-tai" },
  { label: "SIM TỨ QUÝ", href: "/mua-sim-tu-quy" },
  { label: "SIM NĂM SINH", href: "/sim-nam-sinh" },
  { label: "SIM GIÁ RẺ", href: "/mua-sim-gia-re" },
  { label: "TIN TỨC", href: "/tin-tuc" },
];

const Navigation = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Menu chính chỉ dành cho trang công khai; ẩn hẳn trong khu vực /admin
  // để panel quản trị không bị rối (xem /admin/chien-dich, /admin/du-an, /admin/seo).
  if (pathname?.startsWith("/admin")) return null;

  return (
    <nav className="bg-card sticky top-0 z-50 shadow-soft border-b border-border">
      <div className="container mx-auto px-4">
        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center justify-center gap-2 py-3">
          {menuItems.map((item) => (
            <NavLink
              key={item.label}
              href={item.href}
              end={item.href === "/"}
              className="menu-pill shimmer-hover relative text-primary-foreground text-sm"
              activeClassName="ring-2 ring-gold/70 ring-offset-1 ring-offset-card"
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Mobile Menu Toggle */}
        <div className="lg:hidden flex items-center justify-between py-3">
          <span className="text-gold font-bold text-sm tracking-wide">DANH MỤC</span>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-menu"
            aria-label={mobileOpen ? "Đóng danh mục" : "Mở danh mục"}
            className="p-2.5 rounded-xl bg-primary/90 text-primary-foreground transition-colors hover:bg-primary"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div id="mobile-menu" className="lg:hidden pb-4 space-y-1.5">
            {menuItems.map((item) => (
              <NavLink
                key={item.label}
                href={item.href}
                end={item.href === "/"}
                onClick={() => setMobileOpen(false)}
                className="block px-4 py-3 rounded-xl bg-secondary/80 text-foreground/90 font-medium text-sm hover:bg-gold/10 hover:text-gold transition-all border border-border/40"
                activeClassName="!text-gold !bg-gold/10 border-gold/40"
              >
                {item.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
