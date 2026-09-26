"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { getPagePath, classifySource } from "@/lib/trackingUtils";
import { captureAttribution, getAttribution, captureFirstTouchSource, getFirstTouchSource } from "@/lib/attribution";
import { applyNoiBoFromUrl, isNoiBoDevice, markNoiBoDevice, stripNoiBoParam } from "@/lib/noiBoDevice";

/**
 * Logs every page navigation to `public.page_visits` so the admin dashboard
 * can show which pages visitors actually look at (newest first), and — from
 * the referrer — where they came from (Facebook / TikTok / Google / Zalo /
 * direct / internal).
 *
 * Throttling: one insert per path per 5 seconds per tab. The purpose is a
 * signal for the admin ("this page is being looked at"), not precise
 * analytics — 50 visitors refreshing once each should not produce 50 rows
 * every second. Deduping by path keeps the log readable.
 *
 * All failures are swallowed: tracking must never break the page. The RLS
 * policy allows anonymous INSERT, so this works for logged-out visitors.
 *
 * Máy NỘI BỘ (src/lib/noiBoDevice.ts) không bao giờ được đếm: máy từng vào
 * /admin hoặc từng có phiên đăng nhập bị gắn cờ VĨNH VIỄN (kể cả sau khi đăng
 * xuất); `?noibo=1` trên URL bất kỳ bật cờ, `?noibo=0` tắt cờ.
 */
const THROTTLE_MS = 5_000;

export function usePageVisitTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastLoggedRef = useRef<{ path: string; at: number } | null>(null);

  useEffect(() => {
    // `?noibo=1` / `?noibo=0` — A Khoa mở 1 lần trên máy nhân viên để bật/tắt cờ
    // nội bộ. Lượt mở kèm tham số này là thao tác nội bộ nên không đếm; gỡ tham
    // số khỏi URL để link đang mở có lỡ bị gửi cho khách thì khách không dính cờ
    // (gỡ xong useSearchParams đổi → effect chạy lại với URL sạch).
    if (applyNoiBoFromUrl(searchParams.toString())) {
      stripNoiBoParam();
      return;
    }

    // Admin panel is the owner's own tooling, not customer traffic. Máy đã vào
    // /admin = máy nội bộ → gắn cờ vĩnh viễn để cả trang công khai cũng thôi đếm.
    if (pathname.startsWith("/admin")) {
      markNoiBoDevice();
      return;
    }
    if (isNoiBoDevice()) return;

    let cancelled = false;

    void (async () => {
      // A logged-in owner browsing their own public site must not be counted as
      // a customer visit either — their testing would flood the dashboard the
      // same way their /admin visits did. Có phiên = máy nội bộ → gắn cờ vĩnh
      // viễn, đăng xuất rồi vẫn không đếm.
      try {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) {
          markNoiBoDevice();
          return;
        }
      } catch {
        // Session check is best-effort; fall through to tracking on failure.
      }

      // First-touch UTM/gclid capture — runs on first mount and is a no-op after
      // (sessionStorage guard), so later internal navigations keep the original.
      captureAttribution();

      const path = getPagePath(pathname, searchParams.toString());
      const now = Date.now();

      const last = lastLoggedRef.current;
      if (last && last.path === path && now - last.at < THROTTLE_MS) return;

      lastLoggedRef.current = { path, at: now };

      // Chốt nguồn lần vào đầu rồi ưu tiên dùng nó: khách vào từ Google/Facebook…
      // rồi bấm loanh quanh vẫn giữ đúng nguồn, không rớt thành Nội bộ/Trực tiếp.
      const live = classifySource(document.referrer);
      captureFirstTouchSource(live.source, live.referrer);
      const ft = getFirstTouchSource() ?? live;

      const payload = {
        path,
        referrer: ft.referrer,
        source: ft.source,
        user_agent: navigator.userAgent,
        ...getAttribution(),
      };

      if (cancelled) return;
      // Đi qua route để SERVER đọc IP khách (x-forwarded-for) rồi mới ghi —
      // client không biết IP công cộng của mình. keepalive để request sống sót
      // khi khách vừa bấm sang trang khác. Mọi lỗi nuốt êm.
      try {
        await fetch("/api/track/visit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive: true,
        });
      } catch {
        // best-effort: theo dõi không bao giờ làm hỏng trang
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, searchParams]);
}
