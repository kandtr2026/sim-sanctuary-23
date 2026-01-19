import { MapPin, Phone, Mail, Clock } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-header-bg text-header-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 items-start justify-items-start">
          {/* Brand */}
          <div className="w-full min-w-0 lg:pr-4">
            <h3 className="text-xl font-bold mb-4">
              <span className="text-gold">CHONSO</span>
              <span className="text-primary">MOBIFONE</span>
              <span>.COM</span>
            </h3>
            <p className="text-header-foreground/70 text-sm leading-relaxed mb-4 break-words">
              Kho SIM số đẹp uy tín hàng đầu Việt Nam. Chuyên SIM Mobifone, SIM phong thủy, SIM tài lộc với giá tốt nhất thị trường.
            </p>
            <div className="flex items-center gap-2 text-gold">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span className="font-bold">0938.868.868</span>
            </div>
          </div>

          {/* Policies */}
          <div className="w-full min-w-0 lg:px-2">
            <h4 className="text-lg font-bold mb-4 text-gold uppercase">CHÍNH SÁCH</h4>
            <ul className="space-y-2 text-sm text-header-foreground/70">
              <li><a href="#" className="hover:text-gold transition-colors">Chính sách bảo mật</a></li>
              <li><a href="#" className="hover:text-gold transition-colors">Điều khoản sử dụng</a></li>
              <li><a href="#" className="hover:text-gold transition-colors">Chính sách đổi trả</a></li>
              <li><a href="#" className="hover:text-gold transition-colors">Chính sách giao hàng</a></li>
              <li><a href="#" className="hover:text-gold transition-colors">Hướng dẫn thanh toán</a></li>
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
          </div>

          {/* Contact */}
          <div className="w-full min-w-0 lg:pl-4">
            <h4 className="text-lg font-bold mb-4 text-gold uppercase">LIÊN HỆ</h4>
            <ul className="space-y-3 text-sm text-header-foreground/70">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gold flex-shrink-0" />
                <span>Hotline: 0938.868.868</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gold flex-shrink-0" />
                <span className="break-words">hotro@chonsomobifone.com</span>
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
            <p>© 2024 CHONSOMOBIFONE.COM - Đại lý SIM số đẹp Mobifone ủy quyền</p>
            <p>GPKD: 0123456789 - Cấp ngày 01/01/2020</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
