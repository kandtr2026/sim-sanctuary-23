import { MessageCircle, Phone } from "lucide-react";

const ZALO_URL = "https://zalo.me/0933356666";
const CALL_URL = "tel:+84938868868";

/**
 * Băng CTA nhắc lại cuối trang — đặt sau kho SIM trên các trang đích đón Ads.
 * Server Component: render tĩnh. Mọi <a> href zalo.me/tel: bắn generate_lead
 * qua listener toàn cục — không cần onClick tracking riêng.
 */
interface LeadMagnetCtaProps {
  title?: string;
  subtitle?: string;
}

export default function LeadMagnetCta({
  title = "Chưa tìm được số ưng ý?",
  subtitle = "Quý khách nhắn Zalo, đội ngũ tư vấn lọc số theo tuổi, mệnh và ngân sách trong 5 phút.",
}: LeadMagnetCtaProps) {
  return (
    <section className="rounded-xl border border-border bg-gradient-to-b from-primary via-primary-dark to-primary p-6 text-primary-foreground shadow-card md:p-8">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-xl font-extrabold leading-tight text-primary-foreground md:text-2xl">
          {title}
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-sm leading-relaxed text-primary-foreground/85 md:text-base">
          {subtitle}
        </p>
        <div className="mt-6 flex flex-col justify-center gap-2.5 sm:flex-row">
          <a
            href={ZALO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-lg bg-gold px-7 py-2.5 font-bold text-header-bg shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-gold-light hover:shadow-xl"
          >
            <MessageCircle className="h-4 w-4" /> Chat Zalo chọn số
          </a>
          <a
            href={CALL_URL}
            className="flex items-center justify-center gap-2 rounded-lg border border-primary-foreground/30 bg-primary-foreground/10 px-7 py-2.5 font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary-foreground/20"
          >
            <Phone className="h-4 w-4" /> Gọi tư vấn
          </a>
        </div>
      </div>
    </section>
  );
}
