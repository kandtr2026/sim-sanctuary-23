import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { execSync } from "child_process";
import { componentTagger } from "lovable-tagger";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/supabase/vite";

// Short git SHA of the code being built, so a deployed bundle can be traced back
// to a commit. Vercel builds from a checkout that may lack full git history, so
// fall back to its own env var, then to 'unknown' — a missing SHA must never
// fail the build.
const resolveCommit = (): string => {
  const vercelSha = process.env.VERCEL_GIT_COMMIT_SHA;
  if (vercelSha) return vercelSha.slice(0, 7);
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "unknown";
  }
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Baked into the bundle at build time and surfaced by src/lib/buildInfo.ts.
  // JSON.stringify is required: `define` performs raw text substitution, so the
  // replacement has to include its own quotes.
  define: {
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    __BUILD_COMMIT__: JSON.stringify(resolveCommit()),
  },
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mcpPlugin(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  // Strip debug logging from production bundles only — the data-loading hooks
  // and sheet parsers log heavily on purpose, which is useful in `npm run dev`
  // but leaks sheet URLs and row contents to the browser console in prod.
  // `console.error` / `console.warn` are kept so real failures stay visible.
  esbuild:
    mode === "production"
      ? { drop: ["debugger"], pure: ["console.log", "console.info", "console.debug"] }
      : undefined,
  build: {
    rollupOptions: {
      output: {
        // Split the heaviest shared dependencies out of the entry chunk so the
        // homepage doesn't pay for the whole vendor tree up front.
        manualChunks: {
          "react-vendor": ["react", "react-dom", "react-router-dom"],
          "query-vendor": ["@tanstack/react-query"],
        },
      },
    },
  },
}));
