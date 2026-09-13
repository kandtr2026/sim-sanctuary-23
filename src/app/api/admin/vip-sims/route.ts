import { getServerSims } from "@/lib/serverSimData";
import { VIP_TAGS } from "@/lib/simUtils";

/**
 * Nhãn nhóm VIP nhờ giá — PHẢI trùng chữ với `VIP_BY_PRICE_LABEL` ở
 * `/api/admin/stats`, vì dashboard dùng chính nhãn này làm khoá tra nhóm khi
 * bấm vào chip breakdown. Lệch một ký tự là bấm chip "Giá ≥ 50 triệu" ra rỗng.
 */
const VIP_BY_PRICE_LABEL = "Giá ≥ 50 triệu";

// Danh sách công khai như /api/admin/stats — số + giá vốn đã hiện đầy trên
// storefront, không có gì nhạy cảm; cache 5 phút, dùng chung module-cache của
// getServerSims nên không thêm tải lên Supabase.
export const revalidate = 300;

interface SimLite {
  id: string;
  /** 10 chữ số sạch — để link sang trang /sim/[digits]. */
  digits: string;
  /** Số hiển thị (đã nhóm) cho người xem. */
  number: string;
  price: number;
  network: string;
}

/**
 * Trả VIP SIM đã gom theo TỪNG nhóm phân rã (Lục quý · Ngũ quý · Tứ quý · Tam
 * hoa kép · Giá ≥ 50 triệu) — cùng LUẬT phân rã với /api/admin/stats: mỗi SIM
 * VIP vào đúng một nhóm (ưu tiên dạng cao cấp theo VIP_TAGS, còn lại là nhóm
 * giá). Nhờ vậy độ dài danh sách khớp con số trên chip breakdown.
 *
 * GET /api/admin/vip-sims → { groups: Record<label, SimLite[]> }
 */
export async function GET() {
  const sims = await getServerSims();

  const groups: Record<string, SimLite[]> = {};
  for (const t of VIP_TAGS) groups[t] = [];
  groups[VIP_BY_PRICE_LABEL] = [];

  for (const s of sims) {
    if (s.price <= 0 || !s.isVIP) continue;
    const tag = VIP_TAGS.find((t) => s.tags.includes(t));
    const key = tag ?? VIP_BY_PRICE_LABEL;
    groups[key].push({
      id: s.id,
      digits: s.rawDigits,
      number: s.displayNumber || s.formattedNumber,
      price: s.price,
      network: s.network,
    });
  }

  // Số đắt nhất lên đầu — VIP view thì giá cao là cái đáng nhìn trước.
  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => b.price - a.price);
  }

  return Response.json({ groups });
}
