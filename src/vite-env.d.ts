/// <reference types="vite/client" />

/**
 * Google Analytics is loaded by a plain <script> tag in index.html, so `gtag`
 * exists on `window` at runtime but has no type. Declaring it here removes seven
 * separate `(window as any).gtag` casts across Header.tsx and
 * FloatingContactButtons.tsx.
 *
 * It stays optional: the analytics script is third-party and can be blocked by an
 * ad blocker or fail to load, so every call site must still guard before invoking
 * it. Typing it as non-optional would let `window.gtag(...)` typecheck and then
 * throw in production for a meaningful share of visitors.
 */
declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'set' | 'consent',
      targetOrEventName: string,
      params?: Record<string, unknown>,
    ) => void;
  }
}

export {};
