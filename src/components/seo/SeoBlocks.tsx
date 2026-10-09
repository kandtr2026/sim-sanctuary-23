import Link from "next/link";
import { MessageCircle, Phone } from "lucide-react";

export interface QuickAnswerBoxProps {
  eyebrow?: string;
  title?: string;
  children: React.ReactNode;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
}

export function QuickAnswerBox({
  eyebrow = "Trả lời nhanh",
  title,
  children,
  primaryHref,
  primaryLabel,
  secondaryHref,
  secondaryLabel,
}: QuickAnswerBoxProps) {
  return (
    <div className="rounded-2xl border border-gold/35 bg-gold/10 p-5 shadow-sm">
      <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-gold">{eyebrow}</p>
      {title ? <h2 className="mb-3 text-xl font-bold text-foreground">{title}</h2> : null}
      <div className="space-y-3 text-sm leading-7 text-body md:text-base">{children}</div>
      {(primaryHref && primaryLabel) || (secondaryHref && secondaryLabel) ? (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          {primaryHref && primaryLabel ? (
            <Link
              href={primaryHref}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg bg-gold px-5 py-3 text-sm font-bold text-header-bg transition-colors hover:bg-gold-light"
            >
              {primaryLabel}
            </Link>
          ) : null}
          {secondaryHref && secondaryLabel ? (
            <Link
              href={secondaryHref}
              className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-border bg-card px-5 py-3 text-sm font-semibold text-foreground transition-colors hover:border-gold"
            >
              {secondaryLabel}
            </Link>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function SeoCtaBox({
  title = "Cần kiểm tra nhanh trước khi ghé?",
  description = "Gửi Zalo số đang dùng hoặc nhu cầu chọn SIM, đội Chọn Số MobiFone sẽ kiểm tra thủ tục, giữ số và báo hướng xử lý phù hợp.",
  zaloHref = "https://zalo.me/0933686666",
  phoneHref = "tel:+84933686666",
}: {
  title?: string;
  description?: string;
  zaloHref?: string;
  phoneHref?: string;
}) {
  return (
    <div className="rounded-2xl border border-primary/25 bg-primary/10 p-5">
      <h2 className="text-xl font-bold text-foreground">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-body">{description}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <a
          href={zaloHref}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-gold px-5 py-3 font-bold text-header-bg transition-colors hover:bg-gold-light"
        >
          <MessageCircle className="h-4 w-4" /> Chat Zalo 0933.686.666
        </a>
        <a
          href={phoneHref}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Phone className="h-4 w-4" /> Gọi tư vấn
        </a>
      </div>
    </div>
  );
}

export function InternalLinkGrid({
  title = "Liên kết liên quan",
  links,
}: {
  title?: string;
  links: { href: string; label: string; desc?: string }[];
}) {
  return (
    <section className="rounded-2xl border border-border bg-card/60 p-5">
      <h2 className="mb-4 text-xl font-bold text-foreground">{title}</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-xl border border-border bg-background/70 p-4 transition-colors hover:border-gold"
          >
            <span className="font-semibold text-primary">{link.label}</span>
            {link.desc ? <span className="mt-1 block text-sm leading-6 text-muted-foreground">{link.desc}</span> : null}
          </Link>
        ))}
      </div>
    </section>
  );
}
