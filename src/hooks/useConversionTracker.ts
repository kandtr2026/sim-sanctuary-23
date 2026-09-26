"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPagePath, classifySource } from "@/lib/trackingUtils";
import { getAttribution, getFirstTouchSource } from "@/lib/attribution";
import { GADS_CONV_SEND_TO } from "@/lib/gadsTracking";
import { getCardZaloVariant } from "@/lib/experiment";
import { isNoiBoDevice, markNoiBoDevice } from "@/lib/noiBoDevice";

/**
 * Zalo KHÔNG hỗ trợ prefill tin nhắn qua URL (?text=) như wa.me — link zalo.me có
 * query bị Zalo báo "This page doesn't exist" (góp ý #24, rõ nhất trên Zalo web).
 * Vì vậy A6 (chèn mã campaign vào ?text) đã được gỡ; listener này còn DỌN SẠCH
 * query của mọi link zalo.me ngay trước khi điều hướng, để dù còn sót link cũ nào
 * mang ?text thì cú bấm vẫn mở đúng cửa sổ chat.
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
 * the page.
 *
 * Ghi qua route POST /api/track/click (khuôn y /api/track/visit) để SERVER gắn IP
 * khách vào conversion_clicks — nhờ đó lọc được click nội bộ/bot theo IP. Máy nội
 * bộ (cờ localStorage của src/lib/noiBoDevice.ts, hoặc đang có phiên đăng nhập)
 * không ghi click và không bắn gtag/fbq Lead.
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
        // Có phiên đăng nhập = máy nội bộ → gắn cờ vĩnh viễn (đăng xuất vẫn giữ).
        if (isOwner) markNoiBoDevice();
      })
      .catch(() => {});

    const onClick = (e: Event) => {
      const type = classifyClick(e.target);
      if (!type) return;

      // Dọn ?text (và mọi query) khỏi link zalo.me trước khi điều hướng — Zalo
      // không nhận prefill nên query làm link ra lỗi "page doesn't exist" (#24).
      if (type === "zalo") {
        const anchor = (e.target as Element).closest<HTMLAnchorElement>("a[href^='https://zalo.me']");
        if (anchor) {
          try {
            const u = new URL(anchor.href);
            if (u.search) {
              u.search = "";
              anchor.setAttribute("href", u.toString());
            }
          } catch {
            /* href lạ thì giữ nguyên */
          }
        }
      }

      // Cờ đọc lúc bấm (không chốt lúc mount) — usePageVisitTracker có thể vừa
      // bật cờ từ ?noibo=1 sau khi listener này đã gắn.
      if (isOwner || isNoiBoDevice()) return;

      const now = Date.now();
      const last = lastLoggedRef.current;
      if (last && last.type === type && now - last.at < THROTTLE_MS) return;
      lastLoggedRef.current = { type, at: now };

      const path = getPagePath(window.location.pathname, window.location.search);
      // Ưu tiên nguồn lần vào đầu (do usePageVisitTracker chốt) để chuyển đổi bám
      // đúng nơi khách vào web, không lấy referrer lúc bấm (dễ rớt thành Nội bộ).
      const source = (getFirstTouchSource() ?? classifySource(document.referrer)).source;
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

      // Đi qua route để SERVER đọc IP khách rồi mới ghi (client không biết IP
      // công cộng của mình). keepalive để request sống sót khi trang chuyển sang
      // zalo.me / trình gọi điện ngay sau cú bấm. Mọi lỗi nuốt êm.
      try {
        void fetch("/api/track/click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type,
            path,
            source,
            user_agent: navigator.userAgent,
            sim_number: simNumber,
            position,
            device,
            variant,
            ...attr,
          }),
          keepalive: true,
        }).catch(() => {
          /* best-effort: theo dõi không bao giờ làm hỏng trang */
        });
      } catch {
        /* fetch ném đồng bộ (trình duyệt quá cũ / body quá lớn cho keepalive) — bỏ qua */
      }
    };

    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
}
