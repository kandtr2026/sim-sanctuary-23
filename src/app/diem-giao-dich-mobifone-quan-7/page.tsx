import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { 
  MapPin, 
  Phone, 
  Clock, 
  Navigation, 
  ShieldCheck, 
  Smartphone, 
  UserCheck, 
  RefreshCw, 
  Sparkles, 
  CheckCircle2, 
  MessageSquare
} from "lucide-react";
import CategorySimGrid from "@/components/CategorySimGrid";
import TrustCommitments from "@/components/TrustCommitments";
import FaqAccordion from "@/components/FaqAccordion";
import { BASE_URL, buildBreadcrumb } from "@/lib/seo";

export const revalidate = 300;

const TITLE = "Điểm Giao Dịch MobiFone Quận 7 Him Lam — Đổi eSIM, Đăng Ký Chính Chủ, Sim Số Đẹp";
const DESCRIPTION = "Điểm giao dịch & cửa hàng MobiFone uy tín tại 43A Đường số 9, KDC Him Lam, Phường Tân Hưng, Quận 7. Mở cửa 8:00 - 21:00 hàng ngày. Đổi eSIM 5 phút, đăng ký chính chủ, cấp lại SIM, kho SIM số đẹp MobiFone chính hãng.";
const CANONICAL = `${BASE_URL}/diem-giao-dich-mobifone-quan-7`;

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: CANONICAL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: CANONICAL,
    type: "website",
    locale: "vi_VN",
    images: [{ url: `${BASE_URL}/images/diem-giao-dich-mobifone-quan-7.webp`, width: 1024, height: 1024, alt: "Cửa hàng điểm giao dịch MobiFone Him Lam Quận 7" }],
  },
};

const STORE_ADDRESS = "43A Đường số 9, Phường Tân Hưng, TP. Hồ Chí Minh";
const STORE_HOTLINE = "0933.686.666";
const ZALO_URL = "https://zalo.me/0933686666";
const MAPS_DIRECTIONS_URL = "https://www.google.com/maps/dir/?api=1&destination=place_id:ChIJV2BfBgAvdTERQ39odCHMHT0";
const MAPS_EMBED_URL = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d824.0450640691586!2d106.70810869335848!3d10.74673378940029!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752f00065f6057%3A0x3d1dcc2174687f43!2zQ1RZIFZJ4buETiBUSMOUTkcgTkFNIEtIQU5H!5e0!3m2!1svi!2s!4v1769138059662!5m2!1svi!2s";

const SERVICES = [
  {
    icon: Smartphone,
    title: "Cấp Đổi eSIM MobiFone Lấy Ngay",
    desc: "Hỗ trợ đổi từ SIM vật lý sang eSIM chỉ trong 5 phút. Tương thích hoàn toàn cho iPhone, iPad, Apple Watch và các dòng máy Android đời mới.",
    badge: "5 Phút Lấy Ngay",
  },
  {
    icon: UserCheck,
    title: "Đăng Ký & Chuẩn Hóa Chính Chủ",
    desc: "Cập nhật thông tin thuê bao chính chủ theo quy định mới của Bộ Thông tin & Truyền thông. Tránh bị khóa 1 chiều, 2 chiều nhanh gọn tại quầy.",
    badge: "Miễn Phí Hỗ Trợ",
  },
  {
    icon: RefreshCw,
    title: "Cấp Lại SIM Mất / SIM Cháy / Nâng 5G",
    desc: "Xử lý khôi phục số thuê bao khi bị mất điện thoại, SIM hỏng hoặc nâng cấp lên SIM 4G/5G chất lượng cao, giữ nguyên gói cước và danh bạ.",
    badge: "Bảo Toàn Số",
  },
  {
    icon: Sparkles,
    title: "Kho SIM Số Đẹp MobiFone Tại Chỗ",
    desc: "Trực tiếp xem và kích hoạt hàng ngàn số SIM đẹp: Tam hoa, Thần tài, Lộc phát, Sim năm sinh với giá niêm yết rõ ràng, minh bạch.",
    badge: "Kho Số Thật",
  },
];

const FAQ_ITEMS = [
  {
    q: "Điểm giao dịch MobiFone Quận 7 nằm ở địa chỉ nào?",
    a: "Cửa hàng nằm tại số 43A Đường số 9, Khu dân cư Him Lam, Phường Tân Hưng, Quận 7, TP.HCM (gần Lotte Mart Quận 7 và cầu Kênh Tẻ). Vị trí thuận tiện, có chỗ đậu xe máy và ô tô rộng rãi.",
  },
  {
    q: "Cửa hàng mở cửa những khung giờ nào, có làm việc Thứ 7 & Chủ Nhật không?",
    a: "Điểm giao dịch mở cửa phục vụ từ 8:00 đến 21:00 tất cả các ngày trong tuần (từ Thứ Hai đến Chủ Nhật, không nghỉ trưa) để quý khách tiện ghé xử lý dịch vụ ngoài giờ hành chính.",
  },
  {
    q: "Khi đi làm lại SIM hoặc đăng ký chính chủ cần mang theo giấy tờ gì?",
    a: "Quý khách chỉ cần mang theo Căn cước công dân (CCCD) bản gốc chính chủ còn hạn sử dụng. Nhân viên tại quầy sẽ hỗ trợ quét khuôn mặt và hoàn tất thủ tục trong vòng 5-10 phút.",
  },
  {
    q: "Đổi sang eSIM MobiFone có mất phí không và mất bao lâu?",
    a: "Thủ tục đổi eSIM diễn ra nhanh chóng từ 3 đến 5 phút bằng mã QR code quét trực tiếp trên điện thoại. Chi phí theo biểu phí quy định chuẩn của nhà mạng MobiFone.",
  },
  {
    q: "Tôi có thể mua SIM số đẹp online rồi ghé cửa hàng lấy hoặc giao tận nhà không?",
    a: "Hoàn toàn được! Quý khách có thể chọn số trực tiếp trên website chonsomobifone.com và chọn hình thức nhận SIM tại cửa hàng 43A Đường số 9 (Quận 7) hoặc yêu cầu nhân viên giao tận nhà trong 30-60 phút tại khu vực TP.HCM.",
  },
];

const LOCAL_BUSINESS_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "TelecommunicationsStore",
  "name": "Điểm Giao Dịch MobiFone Quận 7 — Viễn Thông Nam Khang",
  "image": `${BASE_URL}/images/diem-giao-dich-mobifone-quan-7.webp`,
  "url": CANONICAL,
  "telephone": STORE_HOTLINE,
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "43A Đường số 9, KDC Him Lam",
    "addressLocality": "Phường Tân Hưng, Quận 7",
    "addressRegion": "Hồ Chí Minh",
    "postalCode": "700000",
    "addressCountry": "VN"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 10.7467338,
    "longitude": 106.7081087
  },
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      "opens": "08:00",
      "closes": "21:00"
    }
  ],
  "sameAs": [
    "https://www.facebook.com/chonsomobifonecom",
    "https://www.youtube.com/@Chonsomobifonecom"
  ],
  "priceRange": "$$"
};

const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    "name": item.q,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": item.a,
    },
  })),
};

export default function DiemGiaoDichQuan7Page() {
  return (
    <>
      <main className="min-h-screen bg-background pb-12">
        {/* Hero Section */}
        <section className="border-b border-border/40 bg-card/60 pt-6 pb-10">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-7 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  Đại Lý Chính Thức MobiFone — Viễn Thông Nam Khang
                </div>
                
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground leading-tight tracking-tight">
                  Điểm Giao Dịch & Cửa Hàng MobiFone Quận 7 (Khu Him Lam)
                </h1>
                
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  Phục vụ cư dân Quận 7, Nhà Bè, Quận 4 và TP.HCM với đầy đủ dịch vụ viễn thông MobiFone chính hãng: cấp đổi eSIM 5 phút, đăng ký chuẩn hóa chính chủ, khôi phục SIM mất và kho SIM số đẹp có sẵn tại quầy.
                </p>

                <div className="pt-2 flex flex-wrap gap-3">
                  <a
                    href={`tel:${STORE_HOTLINE.replace(/\./g, '')}`}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all shadow-md text-sm"
                  >
                    <Phone className="w-4 h-4" />
                    Gọi Hotline: {STORE_HOTLINE}
                  </a>
                  <a
                    href={MAPS_DIRECTIONS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-gold hover:bg-gold/90 text-header-bg font-bold rounded-xl transition-all shadow-md text-sm"
                  >
                    <Navigation className="w-4 h-4" />
                    Chỉ Đường Google Maps
                  </a>
                  <a
                    href={ZALO_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-card hover:bg-muted text-foreground font-semibold rounded-xl border border-border transition-all text-sm"
                  >
                    <MessageSquare className="w-4 h-4 text-primary" />
                    Chat Zalo Tư Vấn
                  </a>
                </div>

                <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm text-muted-foreground border-t border-border/40">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gold flex-shrink-0" />
                    <span>{STORE_ADDRESS}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gold flex-shrink-0" />
                    <span>Mở cửa: 8:00 – 21:00 (Cả T7 & CN)</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/60 bg-muted aspect-square sm:aspect-[4/3] lg:aspect-square">
                  <Image
                    src="/images/diem-giao-dich-mobifone-quan-7.webp"
                    alt="Không gian điểm giao dịch MobiFone Him Lam Quận 7"
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 40vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                    <span className="text-white text-xs font-medium bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                      📍 43A Đường số 9, KDC Him Lam, Phường Tân Hưng, Q.7
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Dịch Vụ Cốt Lõi Tại Quầy */}
        <section className="container mx-auto px-4 py-10">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-2">
              Các Dịch Vụ Hỗ Trợ Trực Tiếp Tại Quầy Quận 7
            </h2>
            <p className="text-muted-foreground text-sm">
              Xử lý nhanh chóng, minh bạch và chính xác theo quy chuẩn nhà mạng MobiFone
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SERVICES.map((srv, idx) => {
              const Icon = srv.icon;
              return (
                <div key={idx} className="rounded-xl border border-border bg-card p-5 shadow-card hover:border-primary/50 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-muted text-muted-foreground">
                        {srv.badge}
                      </span>
                    </div>
                    <h3 className="font-bold text-foreground text-base mb-2">{srv.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{srv.desc}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-border/40 flex items-center gap-1.5 text-xs text-primary font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Lấy ngay tại quầy</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Bản đồ & Thông tin đường đi */}
        <section className="container mx-auto px-4 py-6">
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-card">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="lg:col-span-5 p-6 lg:p-8 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-gold" />
                    Chỉ Đường Đến Cửa Hàng
                  </h3>
                  <div className="space-y-4 text-sm text-muted-foreground">
                    <p>
                      <strong className="text-foreground">Địa chỉ:</strong> 43A Đường số 9, KDC Him Lam, Phường Tân Hưng, Quận 7, TP.HCM.
                    </p>
                    <p>
                      <strong className="text-foreground">Chỉ dẫn vị trí:</strong> Từ đường Nguyễn Thị Thập rẽ vào KDC Him Lam (đối diện Lotte Mart Q.7) khoảng 300m, đường rộng ô tô quay đầu thoải mái.
                    </p>
                    <p>
                      <strong className="text-foreground">Giờ làm việc:</strong> 8:00 – 21:00 hàng ngày (kể cả Thứ Bảy, Chủ Nhật và ngày lễ).
                    </p>
                    <p>
                      <strong className="text-foreground">Hotline hỗ trợ:</strong>{" "}
                      <a href={`tel:${STORE_HOTLINE.replace(/\./g, '')}`} className="text-primary font-bold hover:underline">
                        {STORE_HOTLINE}
                      </a>
                    </p>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-border/40 flex flex-col sm:flex-row gap-3">
                  <a
                    href={MAPS_DIRECTIONS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-gold hover:bg-gold/90 text-header-bg font-bold rounded-lg transition-colors text-sm"
                  >
                    <Navigation className="w-4 h-4" />
                    Mở Ứng Dụng Google Maps
                  </a>
                </div>
              </div>

              <div className="lg:col-span-7 min-h-[300px] lg:min-h-[400px]">
                <iframe
                  src={MAPS_EMBED_URL}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full min-h-[300px] lg:min-h-[400px]"
                  title="Bản đồ điểm giao dịch MobiFone Him Lam Quận 7"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Kho SIM Sẵn Sàng Tại Quầy */}
        <section className="container mx-auto px-4 pt-8">
          <div className="mb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              Kho SIM Số Đẹp MobiFone Sẵn Sàng Bàn Giao Tại Cửa Hàng
            </h2>
            <p className="text-muted-foreground text-sm">
              Xem trực tiếp tại quầy hoặc đặt giao hỏa tốc 30 phút trong khu vực Quận 7 & lân cận
            </p>
          </div>
          <CategorySimGrid
            title="SIM Số Đẹp Nổi Bật Tại Điểm Giao Dịch"
            searchPlaceholder="Tìm số đẹp sẵn kho: *79, *68, *999..."
            emptyText="Kho tạm hết số khớp bộ lọc này. Quý khách vui lòng gọi 0933.686.666 để nhân viên quầy kiểm tra kho nội bộ."
          />
        </section>

        {/* Cam kết & FAQ */}
        <div className="container mx-auto px-4 mt-12 space-y-8 pt-8 border-t border-border/40">
          <TrustCommitments />
          <FaqAccordion items={FAQ_ITEMS} />
        </div>
      </main>

      {/* Schema JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(LOCAL_BUSINESS_JSON_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            buildBreadcrumb([
              { name: "Trang chủ", path: "/" },
              { name: "Điểm giao dịch MobiFone Quận 7", path: "/diem-giao-dich-mobifone-quan-7" },
            ]),
          ),
        }}
      />
    </>
  );
}
