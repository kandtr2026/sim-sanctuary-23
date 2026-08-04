import { Navigate, useParams } from "react-router-dom";
import NotFound from "@/pages/NotFound";

/**
 * Handles the single-segment catch-all `/:slug`.
 *
 * Only `/sim-nam-sinh-YYYY` is a real destination — it maps onto the homepage's
 * `#ns=YYYY` hash filter. Anything else must render a genuine 404 instead of
 * being bounced to `/`, otherwise users lose their place and crawlers see a
 * soft-404 for every mistyped URL.
 */
const BIRTH_YEAR_SLUG = /^sim-nam-sinh-(\d{4})$/;

export default function SimNamSinh() {
  const { slug } = useParams();
  const match = String(slug || "").trim().match(BIRTH_YEAR_SLUG);

  if (!match) return <NotFound />;

  const year = Number(match[1]);
  const currentYear = new Date().getFullYear();

  // Guard against nonsense years like /sim-nam-sinh-0000.
  if (year < 1900 || year > currentYear) return <NotFound />;

  // Router-level redirect — no full page reload, and `replace` keeps the
  // bad URL out of the back-button history.
  return <Navigate to={`/#ns=${match[1]}`} replace />;
}
