import { MapPin, Phone, Mail, Clock } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-header-bg text-header-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <h3 className="text-xl font-bold mb-4">
              <span className="text-gold">CHONSO</span>
              <span className="text-primary">MOBIFONE</span>
              <span>.COM</span>
            </h3>
            <p className="text-header-foreground/70 text-sm leading-relaxed mb-4">
              Kho SIM số đẹp uy tín hàng đầu Việt Nam. Chuyên SIM Mobifone, SIM phong thủy, SIM tài lộc với giá tốt nhất thị trường.
            </p>
            <div className="flex items-center gap-2 text-gold">
              <Phone className="w-4 h-4" />
              <span className="font-bold">0909.888.888</span>
            </div>
          </div>

          {/* Policies */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-primary">Chính Sách</h4>
            <ul className="space-y-2 text-sm text-header-foreground/70">
              <li><a href="#" className="hover:text-gold transition-colors">Chính sách bảo mật</a></li>
              <li><a href="#" className="hover:text-gold transition-colors">Điều khoản sử dụng</a></li>
              <li><a href="#" className="hover:text-gold transition-colors">Chính sách đổi trả</a></li>
              <li><a href="#" className="hover:text-gold transition-colors">Chính sách giao hàng</a></li>
              <li><a href="#" className="hover:text-gold transition-colors">Hướng dẫn thanh toán</a></li>
            </ul>
          </div>

          {/* Store Locations */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-primary">Hệ Thống Cửa Hàng</h4>
            <ul className="space-y-3 text-sm text-header-foreground/70">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-gold flex-shrink-0" />
                <span><strong>Hà Nội:</strong> 123 Cầu Giấy, Q. Cầu Giấy</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-gold flex-shrink-0" />
                <span><strong>TP.HCM:</strong> 456 Nguyễn Văn Linh, Q.7</span>
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 text-gold flex-shrink-0" />
                <span><strong>Đà Nẵng:</strong> 789 Nguyễn Văn Thoại</span>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4 text-primary">Liên Hệ</h4>
            <ul className="space-y-3 text-sm text-header-foreground/70">
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gold" />
                <span>Hotline: 0909.888.888</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gold" />
                <span>hotro@chonsomobifone.com</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gold" />
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
