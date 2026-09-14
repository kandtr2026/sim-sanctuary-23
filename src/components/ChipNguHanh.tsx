import { cn } from "@/lib/utils";
import { nguHanhCuaSo, HANH_MAU } from "@/lib/phongThuy";

// Badge NGŨ HÀNH của số (A Khoa 14/09) — Kim/Mộc/Thủy/Hỏa/Thổ, tô đúng màu hành,
// cùng cỡ/nhịp với badge mạng + điểm cho hàng badge hài hòa. Chấm màu ở đầu để
// nhận diện nhanh kể cả khi chữ nhỏ.
export default function ChipNguHanh({ digits, className }: { digits: string; className?: string }) {
  const d = (digits || "").replace(/\D/g, "");
  if (d.length < 9) return null;
  const hanh = nguHanhCuaSo(d).chinh;
  const mau = HANH_MAU[hanh];
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded px-1.5 py-px font-semibold leading-none", className)}
      style={{ fontSize: "clamp(8px, 1.8vw, 11px)", lineHeight: 1.4, background: `${mau}22`, color: mau }}
      title={`Ngũ hành của số: ${hanh}`}
      aria-label={`Ngũ hành ${hanh}`}
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: mau }} />
      {hanh}
    </span>
  );
}
