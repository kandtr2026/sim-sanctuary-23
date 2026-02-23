import { MapPin, Phone, Mail, Clock, Navigation } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-header-bg text-header-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 items-start justify-items-start">
          {/* Brand */}
          <div className="w-full min-w-0 lg:pr-4">
            <h3 className="text-xl font-bold mb-4">
              <a href="/">
                <span className="text-gold">CHONSO</span>
                <span className="text-primary">MOBIFONE</span>
                <span>.COM</span>
              </a>
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
            <p>GPKD: 0317861294 - Cấp ngày 31/05/2023</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
