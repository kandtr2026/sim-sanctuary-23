import { useEffect } from "react";
import { useParams } from "react-router-dom";

export default function SimNamSinh() {
  const { year } = useParams();

  useEffect(() => {
    const y = String(year || "").trim();
    if (!/^\d{4}$/.test(y)) {
      window.location.replace("/");
      return;
    }
    window.location.replace(`/#ns=${encodeURIComponent(y)}`);
  }, [year]);

  return null;
}
