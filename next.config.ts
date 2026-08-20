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
      // "Sim năm sinh" cluster is retired — fold every /sim-nam-sinh-YYYY back
      // into the homepage.
      {
        source: "/sim-nam-sinh-:year(\\d{4})",
        destination: "/",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
