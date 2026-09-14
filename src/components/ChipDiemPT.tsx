import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { diemTongHop } from "@/lib/phongThuy";

// Badge điểm phong thủy hiện ngay trên chip số (A Khoa 14/09) — cùng cỡ/nhịp với
// badge mạng để hàng badge hài hòa. Cao (≥7) xanh, khá (≥5.5) vàng, còn lại xám.
export default function ChipDiemPT({ digits, className }: { digits: string; className?: string }) {
  const d = (digits || "").replace(/\D/g, "");
  if (d.length < 9) return null;
  const pt = diemTongHop(d).diem;
  const tone =
    pt >= 7
      ? "bg-emerald-500/15 text-emerald-400"
      : pt >= 5.5
        ? "bg-gold/20 text-gold-dark"
        : "bg-white/10 text-muted-foreground";
  return (
    <span
      className={cn("inline-flex items-center rounded px-1.5 py-px font-semibold leading-none", tone, className)}
      style={{ fontSize: "clamp(8px, 1.8vw, 11px)", lineHeight: 1.4 }}
      title={`Điểm phong thủy ${pt.toFixed(1)}/10`}
      aria-label={`Điểm phong thủy ${pt.toFixed(1)} trên 10`}
    >
      <Sparkles className="mr-0.5 h-3 w-3 shrink-0" /> {pt.toFixed(1)}
    </span>
  );
}
