"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPagePath, classifySource } from "@/lib/trackingUtils";
import { getAttribution } from "@/lib/attribution";
import { GADS_CONV_SEND_TO } from "@/lib/gadsTracking";
import { tagZaloHref } from "@/lib/zaloCampaignTag";
import { getCardZaloVariant } from "@/lib/experiment";

/**
 * A6 — gắn mã campaign vào link Zalo trước khi navigate (chi tiết + test:
 * `src/lib/zaloCampaignTag.ts`). Ở đây chỉ nối dây: trong capture-phase listener,
 * khi click rơi vào anchor zalo.me thì tag href ngay — không phụ thuộc isOwner
 * (admin cũng cần thấy mã khi test, nhưng không bị đếm lead).
 */

/**
 * Global conversion-click tracker.
 *
 * A "conversion" is a visitor clicking any contact CTA (Zalo / phone call /
 * Messenger). Instead of wiring an onClick onto every button across the site
 * (floating stack, mobile sticky bar, per-SIM popup, hero category buttons...),
 * a single capture-phase click listener classifies the clicked element:
 *
 *   - <a href^="tel:">            → "call"
 *   - <a href^="https://zalo.me"> → "zalo"
 *   - [data-conversion="messenger"] → "messenger" (Messenger button)
 *
 * Because every contact link on the site resolves to one of these three shapes,
 * one listener covers all of them with no per-component edits.
 *
 * Throttled to one click of each type per 5s per tab to avoid double-fires from
 * aggressive double-clicks. Failures are swallowed — tracking must never break
 * the page. Anonymous INSERT is allowed by RLS.
 */
const THROTTLE_MS = 5_000;

type ConversionType = "zalo" | "call" | "messenger";

const classifyClick = (target: EventTarget | null): ConversionType | null => {
  if (!(target instanceof Element)) return null;

  const el = target.closest("a[href^='tel:'], a[href^='https://zalo.me'], [data-conversion]");
  if (!el) return null;

  if (el.matches("a[href^='tel:']")) return "call";
  if (el.matches("a[href^='https://zalo.me']")) return "zalo";
  if (el.getAttribute("data-conversion") === "messenger") return "messenger";
  return null;
};

/** Đọc data-sim-number từ phần tử click hoặc cha (cho card Zalo link). */
const getSimNumber = (target: EventTarget | null): string | null => {
  if (!(target instanceof Element)) return null;
  const el = target.closest("[data-sim-number]") as HTMLElement | null;
  return el?.getAttribute("data-sim-number") ?? null;
};

/** Phát hiện vị trí CTA từ class/id của cha. */
const getPosition = (target: EventTarget | null): string => {
  if (!(target instanceof Element)) return "other";
  const el = target.closest("[data-sim-number], .floating-contact-stack, header, #sticky-cta-bottom, [role='dialog']") as HTMLElement | null;
  if (!el) return "other";
  if (el.closest(".floating-contact-stack")) return "floating";
  if (el.closest("#sticky-cta-bottom")) return "sticky-bar";
  if (el.closest("header")) return "header";
  if (el.closest("[role='dialog']")) return "dialog";
  if (el.getAttribute("data-sim-number")) return "card";
  return "other";
};

const getDevice = (): string => {
  if (typeof window === "undefined") return "unknown";
  const w = window.innerWidth;
  if (w < 768) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
};

export function useConversionTracker() {
  const lastLoggedRef = useRef<{ type: ConversionType; at: number } | null>(null);

  useEffect(() => {
    let isOwner = false;
    supabase.auth
      .getSession()
      .then(({ data }) => {
        isOwner = Boolean(data.session);
      })
      .catch(() => {});

    const onClick = (e: Event) => {
      const type = classifyClick(e.target);
      if (!type) return;

      // A6 — gắn mã campaign (chạy trước khi check isOwner)
      if (type === "zalo") {
        const anchor = (e.target as Element).closest<HTMLAnchorElement>("a[href^='https://zalo.me']");
        const tagged = anchor ? tagZaloHref(anchor) : undefined;
        if (anchor && tagged) anchor.setAttribute("href", tagged);
      }

      if (isOwner) return;

      const now = Date.now();
      const last = lastLoggedRef.current;
      if (last && last.type === type && now - last.at < THROTTLE_MS) return;
      lastLoggedRef.current = { type, at: now };

      const path = getPagePath(window.location.pathname, window.location.search);
      const { source } = classifySource(document.referrer);
      const attr = getAttribution();

      // T9/T11 — enrich
      const simNumber = getSimNumber(e.target);
      const position = getPosition(e.target);
      const device = getDevice();
      const variant = type === "zalo" ? (getCardZaloVariant() ?? null) : null;

      window.gtag?.("event", "generate_lead", {
        method: type,
        lead_source: source,
        page_path: path,
        sim_number: simNumber,
        position,
        device,
        ...attr,
      });
      if (GADS_CONV_SEND_TO) {
        window.gtag?.("event", "conversion", {
          send_to: GADS_CONV_SEND_TO,
          method: type,
        });
      }
      window.fbq?.("track", "Lead", { content_name: type });

      supabase
        .from("conversion_clicks")
        .insert({
          type,
          path,
          source,
          user_agent: navigator.userAgent,
          sim_number: simNumber,
          position,
          device,
          variant,
          ...attr,
        })
        .then(({ error }) => {
          if (error) console.debug("[conversion] not logged:", error.message);
        });
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
}
