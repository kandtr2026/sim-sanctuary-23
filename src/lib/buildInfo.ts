/**
 * Build stamp injected at compile time by vite.config.ts (`define`).
 *
 * These are replaced with literals during the build, so there is no runtime cost
 * and no request — the values are baked into the bundle that got deployed. That
 * is exactly what makes them trustworthy for answering "which code is live right
 * now?": a stale bundle carries a stale stamp.
 */

// Injected by vite.config.ts. Declared here so TypeScript knows the globals.
declare const __BUILD_TIME__: string;
declare const __BUILD_COMMIT__: string;

/** ISO-8601 UTC timestamp of the moment the bundle was built. */
export const BUILD_TIME = __BUILD_TIME__;

/** Short git SHA the bundle was built from, or 'unknown' outside a git checkout. */
export const BUILD_COMMIT = __BUILD_COMMIT__;

/**
 * Formats the build time in Vietnam time (UTC+7) as `HH:mm DD/MM/YYYY`.
 *
 * The timezone is pinned to Asia/Ho_Chi_Minh rather than the viewer's locale so
 * the number always means the same thing regardless of where it is read from.
 */
export const formatBuildTime = (iso: string = BUILD_TIME): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return 'unknown';

  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('hour')}:${get('minute')} ${get('day')}/${get('month')}/${get('year')}`;
};

/** Relative age, e.g. "5 phút trước" — answers "is this the deploy I just made?" */
export const formatBuildAge = (iso: string = BUILD_TIME, now: number = Date.now()): string => {
  const built = new Date(iso).getTime();
  if (Number.isNaN(built)) return '';

  const seconds = Math.floor((now - built) / 1000);
  if (seconds < 0) return 'vừa xong';
  if (seconds < 60) return `${seconds} giây trước`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} phút trước`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;

  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
};
