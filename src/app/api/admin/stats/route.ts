import { NextRequest } from "next/server";
import { getServerSims } from "@/lib/serverSimData";
import { countTags, PRICE_RANGES, VIP_TAGS, VIP_PRICE_THRESHOLD } from "@/lib/simUtils";
import { diemTongHop } from "@/lib/phongThuy";

/** Nhãn nhóm VIP nhờ giá (không thuộc 4 dạng cao cấp). */
const VIP_BY_PRICE_LABEL = "Giá ≥ 50 triệu";

/**
 * Dải điểm phong thủy (Bát Cực + quẻ) để thống kê chất lượng kho — góp ý #22
 * "thống kê SL số theo điểm phong thủy". Xếp cao → thấp để BarList hiện số điểm
 * cao trước. Nhãn khớp cách chip điểm tô màu ngoài storefront (≥7 tốt, ≥5.5 khá).
 */
const PT_BANDS = ["9 – 10 điểm", "8 – 8.9 điểm", "7 – 7.9 điểm", "6 – 6.9 điểm", "5 – 5.9 điểm", "Dưới 5 điểm"];
const ptBand = (d: number): number =>
  d >= 9 ? 0 : d >= 8 ? 1 : d >= 7 ? 2 : d >= 6 ? 3 : d >= 5 ? 4 : 5;

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
      phongThuyCounts: [],
    });

  const networkCounts: Record<string, number> = {};
  const priceCounts: number[] = PRICE_RANGES.map(() => 0);
  // Phân bố theo dải điểm phong thủy (góp ý #22) — chỉ số đang bán (price>0).
  const ptCounts: number[] = PT_BANDS.map(() => 0);
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
    ptCounts[ptBand(diemTongHop(s.rawDigits).diem)]++;
  }

  const tagCounts = countTags(sims);
  const phongThuyCounts = PT_BANDS.map((label, i) => ({ label, count: ptCounts[i] }));

  return Response.json({
    total,
    totalValue,
    vipCount,
    vipBreakdown,
    networkCounts,
    tagCounts,
    priceCounts,
    phongThuyCounts,
  });
}