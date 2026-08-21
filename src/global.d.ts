/**
 * Global browser globals shared across the app.
 *
 * Migrated from `src/vite-env.d.ts` (gtag) plus the inline `declare global`
 * block that previously lived in `MessengerQuickTemplates.tsx`
 * (__showMessengerTemplates). The old Facebook Customer Chat SDK surface
 * (FB / fbAsyncInit / __openMessengerChat / __messengerReady) was dropped along
 * with the orphan MessengerChatPlugin component. Keeping every window
 * augmentation here in one place, and dropping the old
 * `/// <reference types="vite/client" />` Vite bootstrap.
 */

declare global {
  interface Window {
    /**
     * Google Analytics (gtag.js / GTM) is loaded by a plain `<script>` tag in
     * `app/layout.tsx`, so `gtag` exists on `window` at runtime but has no type.
     * It stays optional: the analytics script is third-party and can be blocked
     * by an ad blocker or fail to load, so every call site must still guard
     * before invoking it.
     */
    gtag?: (
      command: 'event' | 'config' | 'set' | 'consent',
      targetOrEventName: string,
      params?: Record<string, unknown>,
    ) => void;

    /** Global opener for the quick-message template panel. */
    __showMessengerTemplates?: () => void;
  }
}

export {};
