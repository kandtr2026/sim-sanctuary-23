import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import { BUILD_COMMIT, BUILD_TIME, formatBuildTime } from "./lib/buildInfo";
import "./index.css";

// Always-available build stamp, independent of the opt-in BuildBadge overlay.
// A meta tag is used rather than a console line because vite.config.ts strips
// console.log/info/debug from production bundles, and warn/error would be wrong
// for a routine stamp. This survives every transform and is readable from View
// Source or `document.querySelector('meta[name="build-time"]').content` — so the
// live build is always verifiable without showing customers anything.
const stamp = document.createElement("meta");
stamp.name = "build-time";
stamp.content = `${formatBuildTime()} (${BUILD_TIME}) commit ${BUILD_COMMIT}`;
document.head.appendChild(stamp);

createRoot(document.getElementById("root")!).render(
  <HelmetProvider>
    <App />
  </HelmetProvider>
);
