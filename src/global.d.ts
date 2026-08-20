/**
 * Global browser globals shared across the app.
 *
 * Migrated from `src/vite-env.d.ts` (gtag) plus the inline `declare global`
 * blocks that previously lived in `MessengerChatPlugin.tsx` (FB / messenger) and
 * `MessengerQuickTemplates.tsx` (__showMessengerTemplates). Consolidating them
 * here keeps every window augmentation in one place and drops the old
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

    /** Facebook Messenger Customer Chat SDK surface. */
    FB?: {
      init: (config: { xfbml: boolean; version: string }) => void;
      CustomerChat?: {
        show: (shouldOpen?: boolean) => void;
        hide: () => void;
      };
      XFBML?: {
        parse: () => void;
      };
    };
    fbAsyncInit?: () => void;
    __openMessengerChat?: () => boolean;
    __messengerReady?: boolean;

    /** Global opener for the quick-message template panel. */
    __showMessengerTemplates?: () => void;
  }
}

export {};
