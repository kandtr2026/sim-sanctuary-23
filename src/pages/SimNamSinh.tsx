import { useEffect } from "react";
import { useParams } from "react-router-dom";

export default function SimNamSinh() {
  const { slug } = useParams();

  useEffect(() => {
    const s = String(slug || "").trim();
    const m = s.match(/^sim-nam-sinh-(\d{4})$/);

    if (!m) {
      window.location.replace("/");
      return;
    }

    const year = m[1];
    window.location.replace(`/#ns=${encodeURIComponent(year)}`);
  }, [slug]);

  return null;
}
