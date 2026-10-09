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
  MessageSquare,
  Star
} from "lucide-react";
import CategorySimGrid from "@/components/CategorySimGrid";
import TrustCommitments from "@/components/TrustCommitments";
import FaqAccordion from "@/components/FaqAccordion";
import { BASE_URL, buildBreadcrumb } from "@/lib/seo";

export const revalidate = 300;

const TITLE = "Đại Lý MobiFone Quận 7 Gần Đây — 43A Đường Số 9, P. Tân Hưng";
const DESCRIPTION = "Đại lý & điểm giao dịch MobiFone Quận 7 gần đây tại 43A Đường số 9, Phường Tân Hưng. Mở cửa 8:00 - 21:00 hàng ngày. Đổi eSIM 5 phút, đăng ký chính chủ, cấp lại SIM, kho SIM số đẹp MobiFone chính hãng.";
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
    images: [{ url: `${BASE_URL}/images/diem-giao-dich-mobifone-quan-7.webp`, width: 1024, height: 1024, alt: "Cửa hàng điểm giao dịch MobiFone Quận 7" }],
  },
};

const STORE_ADDRESS = "43A Đường số 9, Phường Tân Hưng, TP. Hồ Chí Minh";
const STORE_HOTLINE = "0938.868.868";
const ZALO_URL = "https://zalo.me/0938868868";
const MAPS_DIRECTIONS_URL = "https://www.google.com/maps/dir/?api=1&destination=CTY+VI%E1%BB%84N+TH%C3%94NG+NAM+KHANG&destination_place_id=ChIJV2BfBgAvdTERQ39odCHMHT0";
const GOOGLE_MAPS_PLACE_URL = "https://maps.google.com/?cid=4403900454697205571";
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
    q: "MobiFone gần đây ở Quận 7 nằm ở đâu?",
    a: "MobiFone gần đây tại Quận 7 là đại lý Viễn Thông Nam Khang ở số 43A Đường số 9, Phường Tân Hưng, TP.HCM. Vị trí gần Him Lam, Phú Mỹ Hưng, đường Trần Xuân Soạn và thuận tiện cho khách ở Nhà Bè ghé đổi eSIM, cấp lại SIM hoặc mua SIM số đẹp.",
  },
  {
    q: "Điểm giao dịch MobiFone Quận 7 nằm ở địa chỉ nào?",
    a: "Cửa hàng nằm tại số 43A Đường số 9, Phường Tân Hưng, Quận 7, TP.HCM (gần đường Phan Huy Thực và đường Trần Xuân Soạn). Vị trí thuận tiện, đường rộng, có chỗ đậu xe máy và ô tô thoải mái.",
  },
  {
    q: "MobiFone gần đây nhất ở Quận 7 có hỗ trợ eSIM và làm chính chủ không?",
    a: "Có. Đại lý MobiFone Quận 7 — Viễn Thông Nam Khang tại 43A Đường số 9, Phường Tân Hưng hỗ trợ đổi eSIM, cấp lại SIM, chuẩn hóa thông tin chính chủ và mua SIM số đẹp MobiFone tại quầy. Khách ở Tân Hưng, Him Lam, Phú Mỹ Hưng, Nhà Bè có thể ghé trực tiếp hoặc bấm Google Maps để chỉ đường nhanh.",
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
  "hasMap": GOOGLE_MAPS_PLACE_URL,
  "telephone": STORE_HOTLINE,
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "43A Đường số 9, Phường Tân Hưng",
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
                  Đại Lý MobiFone Quận 7 Gần Đây — Viễn Thông Nam Khang
                </div>
                
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground leading-tight tracking-tight">
                  Đại Lý & Điểm Giao Dịch MobiFone Quận 7 Gần Đây — P. Tân Hưng
                </h1>
                
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  Cần tìm MobiFone gần đây tại Quận 7? Viễn Thông Nam Khang ở 43A Đường số 9, P. Tân Hưng phục vụ cư dân Him Lam, Phú Mỹ Hưng, Nhà Bè và Quận 4 với đầy đủ dịch vụ MobiFone chính hãng: cấp đổi eSIM 5 phút, đăng ký chuẩn hóa chính chủ, khôi phục SIM mất và kho SIM số đẹp có sẵn tại quầy.
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
                    Chỉ Đường Đến Nam Khang (Maps)
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

                <div className="mt-4 rounded-2xl border border-gold/30 bg-gold/10 p-4 text-sm leading-6 text-body">
                  <p className="font-semibold text-foreground">
                    Đang ở Him Lam, Tân Hưng, Phú Mỹ Hưng hoặc Nhà Bè và cần tìm <strong>MobiFone gần đây</strong>? Hãy ghé Nam Khang trước 21:00 để xử lý nhanh tại quầy.
                  </p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
                    <li><strong>Đổi eSIM MobiFone Quận 7</strong>: quét QR, kích hoạt trong 3–5 phút.</li>
                    <li><strong>Cấp lại SIM / chuẩn hóa chính chủ</strong>: mang CCCD bản gốc để nhân viên kiểm tra hồ sơ.</li>
                    <li><strong>Mua SIM số đẹp MobiFone</strong>: xem kho số tại quầy hoặc đặt giữ số online trước khi ghé.</li>
                  </ul>
                </div>
              </div>

              <div className="lg:col-span-5">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/60 bg-muted aspect-square sm:aspect-[4/3] lg:aspect-square">
                  <Image
                    src="/images/diem-giao-dich-mobifone-quan-7.webp"
                    alt="Không gian điểm giao dịch MobiFone Quận 7"
                    fill
                    priority
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 40vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent flex items-end p-4">
                    <span className="text-white text-xs font-medium bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10">
                      📍 43A Đường số 9, Phường Tân Hưng, Q.7
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-8">
          <div className="rounded-2xl border border-primary/25 bg-primary/10 p-5 shadow-card md:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gold">MobiFone gần đây tại Quận 7</p>
            <h2 className="mt-2 text-xl font-bold text-foreground md:text-2xl">
              Cần đổi eSIM, làm lại SIM hoặc chuẩn hóa chính chủ trong hôm nay?
            </h2>
            <p className="mt-2 text-sm leading-6 text-body md:text-base">
              Nhắn Zalo trước khi ghé để nhân viên kiểm tra giấy tờ, tình trạng thuê bao và thời gian xử lý. Khách ở Him Lam, Tân Hưng, Phú Mỹ Hưng, Nhà Bè có thể bấm Google Maps đến 43A Đường số 9.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <a href={ZALO_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-gold px-4 py-3 text-sm font-bold text-header-bg transition-colors hover:bg-gold/90">
                Chat Zalo trước khi ghé
              </a>
              <a href={`tel:${STORE_HOTLINE.replace(/\./g, '')}`} className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90">
                Gọi {STORE_HOTLINE}
              </a>
              <a href={MAPS_DIRECTIONS_URL} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground transition-colors hover:border-gold">
                Chỉ đường Google Maps
              </a>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm">
              <Link href="/esim-mobifone" className="font-semibold text-primary underline-offset-2 hover:underline">eSIM MobiFone là gì?</Link>
              <Link href="/doi-esim-mobifone" className="font-semibold text-primary underline-offset-2 hover:underline">Thủ tục đổi eSIM</Link>
              <Link href="/sim-dau-so/0708" className="font-semibold text-primary underline-offset-2 hover:underline">Kho SIM 0708 MobiFone</Link>
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
                    Chỉ Đường Đến Đại Lý MobiFone Quận 7 Gần Đây
                  </h3>
                  <div className="space-y-4 text-sm text-muted-foreground">
                    <p>
                      <strong className="text-foreground">Địa chỉ:</strong> 43A Đường số 9, Phường Tân Hưng, Quận 7, TP.HCM.
                    </p>
                    <p>
                      <strong className="text-foreground">Chỉ dẫn vị trí:</strong> Đại lý MobiFone gần đây cho khu Him Lam, Tân Hưng, Phú Mỹ Hưng và Nhà Bè; nằm trên Đường số 9 (gần đường Phan Huy Thực và đường Trần Xuân Soạn). Tuyến đường rộng thông thoáng, ô tô và xe máy đậu đỗ thuận tiện.
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
                    Chỉ Đường Đến Nam Khang (Google Maps)
                  </a>
                  <a
                    href={GOOGLE_MAPS_PLACE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-card hover:bg-muted text-foreground font-semibold rounded-lg border border-border transition-colors text-sm"
                  >
                    <Star className="w-4 h-4 text-gold fill-gold" />
                    Đánh Giá Google (5.0 ★)
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
                  title="Bản đồ điểm giao dịch MobiFone Quận 7"
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
            emptyText="Kho tạm hết số khớp bộ lọc này. Quý khách vui lòng gọi hotline 0938.868.868 để nhân viên quầy kiểm tra kho nội bộ."
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
