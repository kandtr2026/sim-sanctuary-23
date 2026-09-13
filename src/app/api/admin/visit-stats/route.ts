import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/shopee/admin";
import { errorResponse, requireAdmin } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

// Cửa sổ 180 ngày — đủ cho cả xem 14 ngày và 6 tháng của biểu đồ.
const WINDOW_DAYS = 180;

/**
 * Thống kê TỔNG lượt truy cập theo NGÀY (góp ý #20 — "mỗi ngày bao nhiêu lượt
 * visit, tổng quan").
 *
 * Gom bằng RPC `daily_page_visits(p_days)` (GROUP BY ngày giờ VN) thay vì kéo cả
 * chục nghìn dòng page_visits về rồi đếm ở app — chỉ trả ~1 dòng/ngày, nhẹ
 * egress (Supabase chonso đang sát quota). Bảng page_visits chỉ admin đọc được
 * nên đọc bằng service role + chặn requireAdmin.
 *
 * GET /api/admin/visit-stats → { total, daily: [{day:'YYYY-MM-DD', count}] }
 */
export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const db = createAdminClient();
    const { data, error } = await db.rpc("daily_page_visits", { p_days: WINDOW_DAYS });
    if (error) throw new Error(`RPC daily_page_visits lỗi: ${error.message}`);

    const rows = (data ?? []) as { d: string; n: number | string }[];
    const daily = rows.map((r) => ({ day: r.d, count: Number(r.n) }));
    const total = daily.reduce((s, x) => s + x.count, 0);

    return Response.json({ total, daily });
  } catch (err) {
    return errorResponse(err);
  }
}
