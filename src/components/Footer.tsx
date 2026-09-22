import { MapPin, Phone, Mail, Clock, Navigation, Youtube } from "lucide-react";
import Link from "next/link";

// Kênh mạng xã hội chính thức của shop (A Khoa 22/09) — handle sạch, bỏ tracking.
const YOUTUBE_URL = "https://www.youtube.com/@Chonsomobifonecom";
const TIKTOK_CHANNELS = [
  { url: "https://www.tiktok.com/@vienthongnamkhanghcm", label: "TikTok · Viễn Thông Nam Khang" },
  { url: "https://www.tiktok.com/@simdepsongkhoa", label: "TikTok · Sim Đẹp Song Khoa" },
];

// lucide-react không có icon TikTok → SVG nốt nhạc đơn giản, vẫn nhận diện được.
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
    <path d="M16.5 3c.35 2.02 1.62 3.5 3.5 3.82v2.6c-1.28 0-2.5-.38-3.5-1.02v6.7c0 3.4-2.85 6.12-6.25 5.9-3-.2-5.4-2.72-5.3-5.72.1-3 2.62-5.4 5.62-5.3.3 0 .6.03.88.1v2.72a2.7 2.7 0 0 0-.9-.16c-1.5 0-2.68 1.28-2.6 2.8.08 1.4 1.28 2.52 2.68 2.44 1.42-.03 2.52-1.2 2.52-2.63V3h2.85z" />
  </svg>
);

// Google Maps Place ID của cửa hàng (43A Đường số 9, Tân Hưng, TPHCM) — dùng
// cho nút "Chỉ đường" + schema. Embed iframe dùng pb string đầy đủ (Google
// không nhận `q=place_id:` ở embed endpoint — sẽ hiện bản đồ toàn cầu).
const STORE_PLACE_ID = "ChIJV2BfBgAvdTERQ39odCHMHT0";
const MAPS_EMBED_URL =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d824.0450640691586!2d106.70810869335848!3d10.74673378940029!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f00065f6057%3A0x3d1dcc2174687f43!2zQ1RZIFZJ4buETiBUSMOUTkcgTkFNIEtIQU5H!5e0!3m2!1svi!2s!4v1769138059662!5m2!1svi!2s";
const MAPS_DIRECTIONS_URL = `https://www.google.com/maps/dir/?api=1&destination=place_id:${STORE_PLACE_ID}`;

// SIM category pages. SIM ĐỒNG GIÁ 229K, SIM TRẢ GÓP and ĐỊNH GIÁ SIM were removed
// from the main nav (trimmed to 4 items in Navigation.tsx); these links are what keep
// them internally linked and reachable. Do not drop them without adding the pages back
// somewhere else — public/sitemap.xml still declares all of them.
const simCategoryLinks = [
  { label: "SIM đồng giá 229K", href: "/mua-sim-gia-re" },
  { label: "SIM tứ quý", href: "/mua-sim-tu-quy" },
  { label: "SIM trả góp", href: "/sim-tra-gop" },
];

const policyLinks = [
  { label: "Chính sách bảo mật", href: "/chinh-sach-bao-mat" },
  { label: "Điều khoản sử dụng", href: "/dieu-khoan-su-dung" },
  { label: "Chính sách giao hàng", href: "/chinh-sach-giao-hang" },
  { label: "Hướng dẫn thanh toán", href: "/thanh-toan" },
];

const Footer = () => {
  return (
    <footer className="bg-header-bg text-header-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 items-start justify-items-start">
          {/* Brand */}
          <div className="w-full min-w-0 lg:pr-4">
            <h3 className="text-xl font-bold mb-4">
              <Link href="/" aria-label="CHONSOMOBIFONE.COM — Trang chủ">
                <span className="text-gold">CHONSO</span>
                <span className="text-primary">MOBIFONE</span>
                <span>.COM</span>
              </Link>
            </h3>
            <p className="text-header-foreground/70 text-sm leading-relaxed mb-4 break-words">
              Chuyên SIM Mobifone số đẹp: phong thủy, tài lộc, tứ quý. Giá niêm yết công khai, đăng ký thông tin chính chủ, 30 phút giao toàn quốc.
            </p>
            <a href="tel:0933686666" className="inline-flex items-center gap-2 text-gold hover:text-gold-light transition-colors">
              <Phone className="w-4 h-4 flex-shrink-0" />
              <span className="font-bold">0933.686.666</span>
            </a>
          </div>

          {/* SIM categories + Policies (stacked: keeps the grid at 4 columns so the
              map column below does not get squeezed into an unreadable width) */}
          <div className="w-full min-w-0 lg:px-2">
            <h4 className="text-lg font-bold mb-4 text-gold uppercase">DANH MỤC SIM</h4>
            <ul className="space-y-2 text-sm text-header-foreground/70">
              {simCategoryLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-gold transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>

            <h4 className="text-lg font-bold mb-4 mt-6 text-gold uppercase">CHÍNH SÁCH</h4>
            <ul className="space-y-2 text-sm text-header-foreground/70">
              {policyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-gold transition-colors">
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
                <span className="break-words">43A Đường số 9, Phường Tân Hưng, TP. Hồ Chí Minh</span>
              </li>
            </ul>

            {/* Google Maps Embed */}
            <div className="mt-3 rounded-xl overflow-hidden">
              <iframe
                src={MAPS_EMBED_URL}
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
              href={MAPS_DIRECTIONS_URL}
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
                  <a href="tel:0933686666" className="hover:text-gold transition-colors">
                    0933.686.666
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

            {/* Kênh mạng xã hội của shop: YouTube + 2 kênh TikTok (A Khoa 22/09) */}
            <div className="mt-4 space-y-2">
              <a
                href={YOUTUBE_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Kênh YouTube CHONSOMOBIFONE"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg transition-colors min-h-[44px] text-sm"
              >
                <Youtube className="w-5 h-5" />
                Kênh YouTube
              </a>
              {TIKTOK_CHANNELS.map((ch) => (
                <a
                  key={ch.url}
                  href={ch.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={ch.label}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-header-foreground/10 hover:bg-header-foreground/20 border border-header-foreground/20 text-header-foreground font-semibold rounded-lg transition-colors min-h-[44px] text-sm"
                >
                  <TikTokIcon className="w-4 h-4 flex-shrink-0" />
                  {ch.label}
                </a>
              ))}
            </div>
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
