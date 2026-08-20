"use client";

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { BUILD_COMMIT, formatBuildAge, formatBuildTime } from '@/lib/buildInfo';

/**
 * Shows which build is currently live: deploy time (Vietnam time), relative age,
 * and the git SHA it came from.
 *
 * Deliberately hidden from customers. This is a shop where visitors transfer money
 * to a bank account, and a permanent "deployed 20:15 04/08/2026" chip reads as a
 * debug artifact left on by mistake — it undercuts trust on exactly the pages that
 * need it most. So visibility is opt-in and sticky:
 *
 *   https://www.chonsomobifone.com/?build     -> show, and remember
 *   https://www.chonsomobifone.com/?build=0   -> hide, and forget
 *
 * The stamp itself is always verifiable without the badge — see the
 * `<meta name="build-time">` tag injected in main.tsx, which is readable by anyone
 * who looks but invisible to anyone who doesn't.
 */

const STORAGE_KEY = 'show_build_badge';
const QUERY_PARAM = 'build';

const readInitialVisibility = (): boolean => {
  if (typeof window === 'undefined') return false;

  // A query param is an explicit instruction, so it wins over stored state and
  // updates it. `?build` with no value counts as "on"; `?build=0` as "off".
  const param = new URLSearchParams(window.location.search).get(QUERY_PARAM);
  if (param !== null) {
    const on = param !== '0' && param !== 'false';
    try {
      if (on) window.localStorage.setItem(STORAGE_KEY, '1');
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* private mode or storage disabled — fall back to this pageview only */
    }
    return on;
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

const BuildBadge = () => {
  const [visible, setVisible] = useState(readInitialVisibility);
  // Recomputed on a timer so "5 phút trước" doesn't freeze on a long-open tab.
  const [age, setAge] = useState(() => formatBuildAge());
  // The mobile sticky CTA occupies the bottom edge on some routes only. Rather than
  // duplicating its route list and breakpoint here (two places to keep in sync), we
  // measure whatever is actually rendered and lift the badge clear of it.
  const [liftPx, setLiftPx] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    if (!visible) return;
    const id = window.setInterval(() => setAge(formatBuildAge()), 30_000);
    return () => window.clearInterval(id);
  }, [visible]);

  useEffect(() => {
    if (!visible) return;

    const measure = () => {
      const bar = document.getElementById('sticky-cta-bottom');
      if (!bar) return setLiftPx(0);
      const { height } = bar.getBoundingClientRect();
      // getBoundingClientRect returns 0 when the bar is display:none above the
      // md breakpoint, which is exactly the "no lift needed" case.
      setLiftPx(height > 0 ? Math.round(height) + 8 : 0);
    };

    // The CTA bar mounts a tick after this effect (its useIsMobile resolves in an
    // effect of its own), so a single measurement would always read "absent".
    // Observing the DOM catches it whenever it appears, disappears, or resizes.
    measure();
    const observer = new MutationObserver(measure);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', measure);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [visible, pathname]);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* nothing to clean up if storage is unavailable */
    }
  };

  return (
    <div
      // Bottom-left: the right edge is taken by the floating contact stack (z-80)
      // and the bottom edge by the mobile sticky CTA (z-70). z-50 keeps this under
      // both so it can never sit on top of a buy button, and `bottom` is offset by
      // the measured CTA height so it stays visible instead of hiding behind it.
      className="fixed left-2 z-50 flex items-center gap-2 rounded-md border border-white/15 bg-black/80 px-2.5 py-1.5 font-mono text-[11px] leading-tight text-white/90 shadow-lg backdrop-blur-sm"
      style={{ bottom: 8 + liftPx }}
      role="status"
    >
      <span className="flex flex-col">
        <span className="text-gold">{formatBuildTime()}</span>
        <span className="text-white/60">
          {age} · {BUILD_COMMIT}
        </span>
      </span>
      <button
        onClick={dismiss}
        aria-label="Ẩn thông tin bản build"
        className="ml-1 rounded px-1 text-white/50 transition-colors hover:text-white"
        title="Ẩn (mở lại bằng ?build)"
      >
        ×
      </button>
    </div>
  );
};

export default BuildBadge;
