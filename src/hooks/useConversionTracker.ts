"use client";

import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPagePath, classifySource } from "@/lib/trackingUtils";

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

  // Walk up from the clicked element to the anchor/button that owns the click.
  const el = target.closest("a[href^='tel:'], a[href^='https://zalo.me'], [data-conversion]");
  if (!el) return null;

  if (el.matches("a[href^='tel:']")) return "call";
  if (el.matches("a[href^='https://zalo.me']")) return "zalo";
  if (el.getAttribute("data-conversion") === "messenger") return "messenger";
  return null;
};

export function useConversionTracker() {
  const lastLoggedRef = useRef<{ type: ConversionType; at: number } | null>(null);

  useEffect(() => {
    const onClick = (e: Event) => {
      const type = classifyClick(e.target);
      if (!type) return;

      const now = Date.now();
      const last = lastLoggedRef.current;
      if (last && last.type === type && now - last.at < THROTTLE_MS) return;
      lastLoggedRef.current = { type, at: now };

      const path = getPagePath(window.location.pathname, window.location.search);
      const { source } = classifySource(document.referrer);

      supabase
        .from("conversion_clicks")
        .insert({
          type,
          path,
          source,
          user_agent: navigator.userAgent,
        })
        .then(({ error }) => {
          if (error) console.debug("[conversion] not logged:", error.message);
        });
    };

    // Capture phase: runs before any component onClick / link navigation, so
    // the click is counted even when the browser navigates away immediately.
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
}
