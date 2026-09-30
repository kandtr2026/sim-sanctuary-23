import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/shopee/admin";
import { errorResponse, requireAdmin } from "@/lib/shopee/http";
import { parseAllFlag, refreshExclusionsThrottled } from "@/lib/trafficExclusions";
import { gomTheoTinh, type DongGeo } from "@/lib/vnProvince";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

/**
 * Traffic theo TỈNH/THÀNH (A Khoa 30/09) — lượt xem + số khách (IP) gom về 34
 * tỉnh mới, kèm tỉnh cũ làm chi tiết.
 *
 * Gom thô trong DB bằng RPC `geo_page_visits(p_days, p_all)` (vài chục dòng),
 * quy về tỉnh ở app (src/lib/vnProvince.ts). Mặc định CHỈ KHÁCH THẬT như
 * visit-stats; `?all=1` gồm cả nội bộ/bot.
 *
 * GET /api/admin/visit-geo?days=14[&all=1] → { days, tong, tinh: TinhThongKe[] }
 */
export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const sp = req.nextUrl.searchParams;
    const days = Math.min(Math.max(Math.round(Number(sp.get("days")) || 14), 1), 400);
    const db = createAdminClient();

    await refreshExclusionsThrottled(db);

    const { data, error } = await db.rpc("geo_page_visits", { p_days: days, p_all: parseAllFlag(sp) });
    if (error) throw new Error(`RPC geo_page_visits lỗi: ${error.message}`);

    return Response.json({ days, ...gomTheoTinh((data ?? []) as DongGeo[]) });
  } catch (err) {
    return errorResponse(err);
  }
}
