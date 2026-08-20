import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  // src/lib/buildInfo.ts reads globals that vite.config.ts injects at build time.
  // Vitest does not load that config, so they must be defined here too or any test
  // touching buildInfo fails on an undefined identifier. Fixed values keep the
  // assertions deterministic — the tests pass timestamps in explicitly.
  define: {
    __BUILD_TIME__: JSON.stringify("2026-01-01T00:00:00.000Z"),
    __BUILD_COMMIT__: JSON.stringify("testing"),
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
