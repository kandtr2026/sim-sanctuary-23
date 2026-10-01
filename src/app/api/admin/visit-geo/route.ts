import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/shopee/admin";
import { errorResponse, requireAdmin } from "@/lib/shopee/http";
import { parseAllFlag, refreshExclusionsThrottled } from "@/lib/trafficExclusions";
import { gomHomNayHomQua, gomTheoTinh, type DongGeo, type DongGeoHomNay } from "@/lib/vnProvince";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

/** Giờ:phút hiện tại theo giờ VN — mốc "cùng giờ" của view hôm nay. */
const gioVn = () =>
  new Intl.DateTimeFormat("vi-VN", { timeZone: "Asia/Ho_Chi_Minh", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date());

/**
 * Traffic theo TỈNH/THÀNH (A Khoa 30/09) — lượt xem + số khách (IP) gom về 34
 * tỉnh mới, kèm tỉnh cũ làm chi tiết.
 *
 * Gom thô trong DB bằng RPC (vài chục dòng), quy về tỉnh ở app
 * (src/lib/vnProvince.ts). Mặc định CHỈ KHÁCH THẬT như visit-stats; `?all=1`
 * gồm cả nội bộ/bot. Mốc ngày là NGÀY LỊCH giờ VN, khớp biểu đồ lượt mỗi ngày.
 *
 * GET /api/admin/visit-geo?days=14[&all=1]   → { days, tong, tinh: TinhThongKe[] }
 * GET /api/admin/visit-geo?view=today[&all=1] → { view: "today", gio: "HH:MM",
 *     tong: { homNay, homQuaCungGio, homQua }, tinh: TinhHomNay[] } (A Khoa 01/10)
 */
export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const sp = req.nextUrl.searchParams;
    const db = createAdminClient();

    await refreshExclusionsThrottled(db);

    if (sp.get("view") === "today") {
      const { data, error } = await db.rpc("geo_page_visits_today", { p_all: parseAllFlag(sp) });
      if (error) throw new Error(`RPC geo_page_visits_today lỗi: ${error.message}`);
      return Response.json({ view: "today", gio: gioVn(), ...gomHomNayHomQua((data ?? []) as DongGeoHomNay[]) });
    }

    const days = Math.min(Math.max(Math.round(Number(sp.get("days")) || 14), 1), 400);
    const { data, error } = await db.rpc("geo_page_visits", { p_days: days, p_all: parseAllFlag(sp) });
    if (error) throw new Error(`RPC geo_page_visits lỗi: ${error.message}`);

    return Response.json({ days, ...gomTheoTinh((data ?? []) as DongGeo[]) });
  } catch (err) {
    return errorResponse(err);
  }
}
