import { MapPin, Phone, Mail, Clock, Navigation } from "lucide-react";
import { Link } from "react-router-dom";

// SIM category pages. SIM ĐỒNG GIÁ 229K, SIM TRẢ GÓP and ĐỊNH GIÁ SIM were removed
// from the main nav (trimmed to 4 items in Navigation.tsx); these links are what keep
// them internally linked and reachable. Do not drop them without adding the pages back
// somewhere else — public/sitemap.xml still declares all of them.
const simCategoryLinks = [
  { label: "SIM đồng giá 229K", to: "/mua-sim-gia-re" },
  { label: "SIM tứ quý", to: "/mua-sim-tu-quy" },
  { label: "SIM trả góp", to: "/sim-tra-gop" },
  { label: "Định giá SIM", to: "/dinh-gia-sim" },
];

const policyLinks = [
  { label: "Chính sách bảo mật", to: "/chinh-sach-bao-mat" },
  { label: "Điều khoản sử dụng", to: "/dieu-khoan-su-dung" },
  { label: "Chính sách giao hàng", to: "/chinh-sach-giao-hang" },
  { label: "Hướng dẫn thanh toán", to: "/thanh-toan" },
];

const Footer = () => {
  return (
    <footer className="bg-header-bg text-header-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 items-start justify-items-start">
          {/* Brand */}
          <div className="w-full min-w-0 lg:pr-4">
            <h3 className="text-xl font-bold mb-4">
              <Link to="/" aria-label="CHONSOMOBIFONE.COM — Trang chủ">
                <span className="text-gold">CHONSO</span>
                <span className="text-primary">MOBIFONE</span>
                <span>.COM</span>
              </Link>
            </h3>
            <p className="text-header-foreground/70 text-sm leading-relaxed mb-4 break-words">
              Kho SIM số đẹp uy tín hàng đầu Việt Nam. Chuyên SIM Mobifone, SIM phong thủy, SIM tài lộc với giá tốt nhất
              thị trường.
            </p>
            <a href="tel:0938868868" className="inline-flex items-center gap-2 text-gold hover:text-gold-light transition-colors">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span className="font-bold">0938.868.868</span>
            </a>
          </div>

          {/* SIM categories + Policies (stacked: keeps the grid at 4 columns so the
              map column below does not get squeezed into an unreadable width) */}
          <div className="w-full min-w-0 lg:px-2">
            <h4 className="text-lg font-bold mb-4 text-gold uppercase">DANH MỤC SIM</h4>
            <ul className="space-y-2 text-sm text-header-foreground/70">
              {simCategoryLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-gold transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h4 className="text-lg font-bold mb-4 mt-6 text-gold uppercase">CHÍNH SÁCH</h4>
            <ul className="space-y-2 text-sm text-header-foreground/70">
              {policyLinks.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className="hover:text-gold transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Store Locations */}
          <div className="w-full min-w-0 lg:px-2">
            <h4 className="text-lg font-bold mb-4 text-gold uppercase">ĐỊA CHỈ CỬA HÀNG</h4>
            <ul className="space-y-3 text-sm text-header-foreground/70">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-gold flex-shrink-0" />
                <span className="break-words">43A Đường số 9 Phường Tân Hưng TPHCM</span>
              </li>
            </ul>

            {/* Google Maps Embed */}
            <div className="mt-3 rounded-xl overflow-hidden">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d824.0450640691586!2d106.70810869335848!3d10.74673378940029!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f00065f6057%3A0x3d1dcc2174687f43!2zQ1RZIFZJ4buETiBUSMOUTkcgTkFNIEtIQU5H!5e0!3m2!1svi!2s!4v1769138059662!5m2!1svi!2s"
                width="100%"
                height="200"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="rounded-xl h-[160px] md:h-[200px]"
                title="Địa chỉ cửa hàng CHONSOMOBIFONE"
              />
            </div>

            {/* Directions CTA */}
            <a
              href="https://maps.app.goo.gl/AgPJ8cqdaWxbaQys5"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gold hover:bg-gold/90 text-header-bg font-semibold rounded-lg transition-colors min-h-[44px] text-sm"
            >
              <Navigation className="w-4 h-4" />
              Chỉ đường Google Maps
            </a>
          </div>

          {/* Contact */}
          <div className="w-full min-w-0 lg:pl-4">
            <h4 className="text-lg font-bold mb-4 text-gold uppercase">LIÊN HỆ</h4>
            <ul className="space-y-3 text-sm text-header-foreground/70">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gold flex-shrink-0" />
                <span>
                  Hotline:{" "}
                  <a href="tel:0938868868" className="hover:text-gold transition-colors">
                    0938.868.868
                  </a>
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gold flex-shrink-0" />
                <a href="mailto:hotro@chonsomobifone.com" className="break-words hover:text-gold transition-colors">
                  hotro@chonsomobifone.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gold flex-shrink-0" />
                <span>8:00 - 21:00 hàng ngày</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-header-foreground/10 mt-8 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-header-foreground/50">
            <p>CÔNG TY TNHH TM DV VIỄN THÔNG NAM KHANG</p>
            <p>GPKD: 0317861294 - Cấp ngày 31/05/2023</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
