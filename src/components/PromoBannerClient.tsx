"use client";

/**
 * Storefront promo / flash-sale banner (client half). Renders the visual bar, a
 * REAL per-second countdown to `campaign.ends_at`, a session-scoped dismiss, and
 * hides itself on /admin. The campaign is fetched on the server by
 * <PromoBanner /> and passed down as a plain, serialisable prop.
 *
 * The countdown is honest: it ticks down to the admin-set `ends_at` and, the
 * moment that passes on the client clock, the whole banner unmounts (returns
 * null). No looping/fake timers, no reset. Digits are never rendered on the
 * server — build/ISR "now" would be stale — so they stay "--" until the client
 * ticks after mount, which also keeps hydration stable.
 */

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowRight, Clock, X, Zap } from "lucide-react";
import type { SiteCampaign } from "@/lib/campaigns";

interface PromoBannerClientProps {
  campaign: SiteCampaign;
  /** Site-wide Zalo CTA, used when the campaign sets no cta_url. */
  fallbackCtaUrl: string;
}

const pad = (n: number) => n.toString().padStart(2, "0");

function splitRemaining(ms: number) {
  const sec = Math.floor(Math.max(0, ms) / 1000);
  return {
    days: Math.floor(sec / 86400),
    hours: Math.floor((sec % 86400) / 3600),
    minutes: Math.floor((sec % 3600) / 60),
    seconds: sec % 60,
  };
}

export default function PromoBannerClient({
  campaign,
  fallbackCtaUrl,
}: PromoBannerClientProps) {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);
  const [nowMs, setNowMs] = useState<number | null>(null);

  const endMs = campaign.ends_at ? new Date(campaign.ends_at).getTime() : NaN;
  const isFlash = campaign.type === "flash_sale" && !Number.isNaN(endMs);
  const storageKey = `promo-dismissed-${campaign.id}`;

  // Restore the session dismiss. Client-only; the default (false) matches the
  // server render, so hydration stays consistent.
  useEffect(() => {
    try {
      if (sessionStorage.getItem(storageKey) === "1") setDismissed(true);
    } catch {
      /* storage blocked (private mode) — just show the banner */
    }
  }, [storageKey]);

  // Real countdown tick — only when there is a valid flash-sale end time.
  useEffect(() => {
    if (!isFlash) return;
    setNowMs(Date.now());
    const id = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [isFlash]);

  const dismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(storageKey, "1");
    } catch {
      /* ignore */
    }
  };

  // --- visibility gates (after every hook, per the rules of hooks) ---
  if (pathname?.startsWith("/admin")) return null; // never on the admin app
  if (dismissed) return null;
  // Honest expiry: once the client clock passes ends_at, remove the banner.
  if (isFlash && nowMs !== null && endMs - nowMs <= 0) return null;

  const parts = isFlash && nowMs !== null ? splitRemaining(endMs - nowMs) : null;

  const title = campaign.headline?.trim() || campaign.name;
  const ctaUrl = campaign.cta_url?.trim() || fallbackCtaUrl;
  const ctaLabel = campaign.cta_label?.trim() || "Chat Zalo nhận ưu đãi";
  const external = /^https?:\/\//i.test(ctaUrl);

  return (
    <section
      aria-label={isFlash ? "Khuyến mãi flash sale" : "Khuyến mãi"}
      className="relative isolate overflow-hidden border-b border-gold/30 bg-gradient-to-r from-primary-dark via-primary to-primary-dark"
    >
      {/* Decorative gold sheen on the right. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-2/3 bg-[radial-gradient(ellipse_at_right,hsl(var(--gold)_/_0.18),transparent_70%)]"
      />

      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-2 py-2.5 pr-8 md:flex-row md:items-center md:justify-between md:gap-4">
          {/* Message */}
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-black/30 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wider text-gold ring-1 ring-gold/40">
              <Zap className="h-3.5 w-3.5" aria-hidden />
              {isFlash ? "Flash Sale" : "Ưu đãi"}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight text-white md:text-base">
                {title}
              </p>
              {campaign.subline?.trim() && (
                <p className="truncate text-xs leading-snug text-white/85 md:text-sm">
                  {campaign.subline}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 md:flex-nowrap md:justify-end">
            {campaign.discount_note?.trim() && (
              <span className="rounded-full bg-black/25 px-2.5 py-1 text-xs font-bold text-gold ring-1 ring-gold/40">
                {campaign.discount_note}
              </span>
            )}

            {isFlash && (
              <div
                role="timer"
                aria-label="Thời gian còn lại của khuyến mãi"
                className="flex items-center gap-1.5 text-gold"
              >
                <Clock className="h-4 w-4 shrink-0" aria-hidden />
                <div className="flex items-end gap-1" aria-hidden>
                  {parts && parts.days > 0 && (
                    <>
                      <TimeCell value={pad(parts.days)} label="Ngày" />
                      <Separator />
                    </>
                  )}
                  <TimeCell value={parts ? pad(parts.hours) : "--"} label="Giờ" />
                  <Separator />
                  <TimeCell value={parts ? pad(parts.minutes) : "--"} label="Phút" />
                  <Separator />
                  <TimeCell value={parts ? pad(parts.seconds) : "--"} label="Giây" />
                </div>
              </div>
            )}

            <a
              href={ctaUrl}
              {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gold px-4 py-2 text-sm font-bold text-black shadow-sm transition-colors hover:bg-gold-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              {ctaLabel}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </a>
          </div>

          <button
            type="button"
            onClick={dismiss}
            aria-label="Đóng thông báo khuyến mãi"
            className="absolute right-1.5 top-1.5 rounded-md p-1 text-white/70 transition-colors hover:bg-black/25 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-white md:right-2 md:top-2"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function TimeCell({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="min-w-[2ch] rounded-md bg-black/35 px-1.5 py-0.5 text-center text-sm font-bold tabular-nums text-gold md:text-base">
        {value}
      </span>
      <span className="mt-0.5 text-[9px] uppercase leading-none tracking-wide text-white/70">
        {label}
      </span>
    </div>
  );
}

function Separator() {
  return <span className="pb-3 text-sm font-bold text-white/50">:</span>;
}
