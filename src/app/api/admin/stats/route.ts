import { NextRequest } from "next/server";
import { getServerSims } from "@/lib/serverSimData";
import { countTags, PRICE_RANGES } from "@/lib/simUtils";

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
  if (sims.length === 0)
    return Response.json({ total: 0, totalValue: 0, networkCounts: {}, tagCounts: {}, priceCounts: [] });

  const networkCounts: Record<string, number> = {};
  const priceCounts: number[] = PRICE_RANGES.map(() => 0);

  let totalValue = 0;
  let total = 0;

  for (const s of sims) {
    if (s.price <= 0) continue;
    total++;
    totalValue += s.price;
    networkCounts[s.network] = (networkCounts[s.network] ?? 0) + 1;
    const idx = PRICE_RANGES.findIndex((r) => s.price >= r.min && s.price <= r.max);
    if (idx !== -1) priceCounts[idx]++;
  }

  const tagCounts = countTags(sims);

  return Response.json({
    total,
    totalValue,
    networkCounts,
    tagCounts,
    priceCounts,
  });
}