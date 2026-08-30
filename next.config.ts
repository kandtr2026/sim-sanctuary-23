import type { NextConfig } from "next";
import { execSync } from "child_process";

// Short git SHA of the code being built, so a deployed bundle can be traced back
// to a commit. Vercel builds from a checkout that may lack full git history, so
// fall back to its own env var, then to 'unknown' — a missing SHA must never
// fail the build. Mirrors the old vite.config.ts `resolveCommit`.
const resolveCommit = (): string => {
  const vercelSha = process.env.VERCEL_GIT_COMMIT_SHA;
  if (vercelSha) return vercelSha.slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD", {
      stdio: ["ignore", "pipe", "ignore"],
    })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
};

const nextConfig: NextConfig = {
  // Build stamp, previously injected by vite.config.ts `define` and read by
  // src/lib/buildInfo.ts. `NEXT_PUBLIC_` so the values are inlined into the
  // client bundle exactly once at build time.
  env: {
    NEXT_PUBLIC_BUILD_TIME: new Date().toISOString(),
    NEXT_PUBLIC_BUILD_COMMIT: resolveCommit(),
  },
  async redirects() {
    return [
      // non-www → www (permanent, 308). Production will additionally set this
      // at the Vercel domain level; this covers the app-level fallback.
      {
        source: "/:path*",
        has: [{ type: "host", value: "chonsomobifone.com" }],
        destination: "https://www.chonsomobifone.com/:path*",
        permanent: true,
      },
      // Legacy "sim năm sinh" URLs used a single hyphenated segment
      // (/sim-nam-sinh-1990). The cluster is now a proper nested route
      // (/sim-nam-sinh/1990), so redirect the old form to the new one to
      // preserve link equity. `permanent: true` → 308 (method-preserving); for
      // SEO this passes equity identically to a 301. The new route accepts any
      // in-range year (dynamicParams), so redirected years resolve; out-of-range
      // years 404 (acceptable — no real inbound links to those). Note the source
      // has a hyphen (…-:year) while the destination has a slash (…/:year), so
      // the new nested route is NOT swallowed by this redirect.
      {
        source: "/sim-nam-sinh-:year(\\d{4})",
        destination: "/sim-nam-sinh/:year",
        permanent: true,
      },
      /**
       * `/dinh-gia-sim` đã bị xoá (30/08/2026 — chủ dự án chốt trang sai định
       * hướng, không dùng). Nhưng URL đó từng ở Footer, trang chủ, trang 404, 7 chỗ
       * trong 5 bài blog, và ĐÃ nộp trong sitemap cho Google — nên phải 301 chứ
       * không được để 404: link ngoài và link Google đang giữ vẫn phải tới đâu đó
       * có ích.
       *
       * Đích là `/sim-gia` (chọn SIM theo tầm giá) vì đó là ý định gần nhất còn
       * tồn tại: khách vào trang định giá để biết một số đáng bao nhiêu, giờ xem
       * được các tầm giá thật trong kho.
       */
      {
        source: "/dinh-gia-sim",
        destination: "/sim-gia",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
