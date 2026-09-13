import { NextRequest } from "next/server";
import { getServerSims } from "@/lib/serverSimData";
import { countTags, PRICE_RANGES, VIP_TAGS, VIP_PRICE_THRESHOLD } from "@/lib/simUtils";

/** Nhãn nhóm VIP nhờ giá (không thuộc 4 dạng cao cấp). */
const VIP_BY_PRICE_LABEL = "Giá ≥ 50 triệu";

export const revalidate = 300;

/**
 * `priceCounts` trả về theo ĐÚNG thứ tự `PRICE_RANGES` của simUtils — cùng bảng
 * mà chip lọc, facet count và query PostgREST dùng.
 *
 * Trước đây file này giữ HAI bản copy bảng khoảng giá (một để tạo mảng đếm, một
 * để tìm index). Biên khi đó trùng nên số chưa sai, nhưng đúng kiểu trùng lặp này
 * đã gây lỗi bậc "200 - 500 triệu" (b6b9872): một bản được sửa, bản kia thì
 * không, và không ai thấy vì mảng chỉ mang số.
 */
export async function GET(_req: NextRequest) {
  const sims = await getServerSims();

  const emptyVipBreakdown = (): Record<string, number> => {
    const b: Record<string, number> = {};
    for (const t of VIP_TAGS) b[t] = 0;
    b[VIP_BY_PRICE_LABEL] = 0;
    return b;
  };

  if (sims.length === 0)
    return Response.json({
      total: 0,
      totalValue: 0,
      vipCount: 0,
      vipBreakdown: emptyVipBreakdown(),
      networkCounts: {},
      tagCounts: {},
      priceCounts: [],
    });

  const networkCounts: Record<string, number> = {};
  const priceCounts: number[] = PRICE_RANGES.map(() => 0);
  // Phân rã VIP thành từng nhóm (mỗi SIM VIP tính đúng 1 lần): ưu tiên dạng cao
  // cấp, còn lại là VIP nhờ giá. Tổng = vipCount.
  const vipBreakdown = emptyVipBreakdown();

  let totalValue = 0;
  let total = 0;
  let vipCount = 0;

  for (const s of sims) {
    if (s.price <= 0) continue;
    total++;
    totalValue += s.price;
    if (s.isVIP) {
      vipCount++;
      const tag = VIP_TAGS.find((t) => s.tags.includes(t));
      vipBreakdown[tag ?? VIP_BY_PRICE_LABEL]++;
    }
    networkCounts[s.network] = (networkCounts[s.network] ?? 0) + 1;
    const idx = PRICE_RANGES.findIndex((r) => s.price >= r.min && s.price <= r.max);
    if (idx !== -1) priceCounts[idx]++;
  }

  const tagCounts = countTags(sims);

  return Response.json({
    total,
    totalValue,
    vipCount,
    vipBreakdown,
    networkCounts,
    tagCounts,
    priceCounts,
  });
}