import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
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
