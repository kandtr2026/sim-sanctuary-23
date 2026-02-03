import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function SimNamSinh() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname; // "/sim-nam-sinh-1999"
    const m = path.match(/\/sim-nam-sinh-(\d{4})$/);

    if (!m) {
      window.location.replace("/");
      return;
    }

    const year = m[1];
    window.location.replace(`/#ns=${encodeURIComponent(year)}`);
  }, [location.pathname]);

  return null;
}
