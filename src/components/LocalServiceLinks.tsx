import Link from "next/link";
import { MapPin, Phone } from "lucide-react";

/**
 * Khối liên kết nội bộ tới cụm trang dịch vụ tại cửa hàng Quận 7.
 * Mục đích: các trang này đang "Discovered - currently not indexed" (Googlebot
 * chưa cào). Gắn link từ các trang danh mục đã index + được cào thường xuyên để
 * Google tìm và cào chúng sớm hơn. Giữ text neo đúng cụm khách tìm trên GSC
 * ("đại lý mobifone quận 7", "mobifone gần đây").
 */
const LINKS = [
  { href: "/diem-giao-dich-mobifone-quan-7", label: "Đại lý MobiFone Quận 7 gần đây" },
  { href: "/doi-esim-mobifone-quan-7", label: "Đổi eSIM MobiFone Quận 7" },
  { href: "/lam-lai-sim-mobifone-quan-7", label: "Làm lại SIM MobiFone Quận 7" },
  { href: "/lam-lai-sim-mobifone", label: "Thủ tục làm lại SIM bị mất, hỏng" },
];

export default function LocalServiceLinks({ className = "" }: { className?: string }) {
  return (
    <section
      aria-labelledby="local-service-links"
      className={`rounded-xl border border-border bg-card p-5 shadow-card md:p-6 ${className}`}
    >
      <h2
        id="local-service-links"
        className="mb-2 flex items-center gap-2 text-base font-bold text-foreground md:text-lg"
      >
        <MapPin className="h-4 w-4 text-gold" aria-hidden />
        Cửa hàng MobiFone Quận 7 — nhận SIM, đổi eSIM tại chỗ
      </h2>
      <p className="mb-3 text-sm leading-relaxed text-muted-foreground">
        Quý khách ở Quận 7 (Tân Hưng, Him Lam, Phú Mỹ Hưng) có thể ghé 43A Đường số 9, P. Tân Hưng
        để xem SIM, đăng ký chính chủ, đổi eSIM hoặc làm lại SIM. Mở cửa 8:00–21:00 hằng ngày.
      </p>
      <ul className="flex flex-wrap gap-2 text-sm">
        {LINKS.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              className="inline-flex min-h-10 items-center rounded-full border border-border bg-background/60 px-3 font-medium text-primary transition hover:border-gold/60"
            >
              {l.label}
            </Link>
          </li>
        ))}
        <li>
          <a
            href="tel:0938868868"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 font-semibold text-gold"
          >
            <Phone className="h-3.5 w-3.5" aria-hidden />
            0938.868.868
          </a>
        </li>
      </ul>
    </section>
  );
}
