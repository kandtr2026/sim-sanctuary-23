import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/shopee/admin";
import { errorResponse, requireAdmin } from "@/lib/shopee/http";
import {
  isMissingDbObject,
  parseAllFlag,
  refreshExclusionsThrottled,
  subtractDaily,
  sumDaily,
  toDaily,
} from "@/lib/trafficExclusions";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

// Cửa sổ 180 ngày — đủ cho cả xem 14 ngày và 6 tháng của biểu đồ.
const WINDOW_DAYS = 180;

/**
 * Thống kê TỔNG lượt truy cập theo NGÀY (góp ý #20 — "mỗi ngày bao nhiêu lượt
 * visit, tổng quan").
 *
 * Gom bằng RPC `daily_page_visits(p_days, p_all)` (GROUP BY ngày giờ VN) thay vì
 * kéo cả chục nghìn dòng page_visits về rồi đếm ở app — chỉ trả ~1 dòng/ngày, nhẹ
 * egress (Supabase chonso đang sát quota). Bảng page_visits chỉ admin đọc được
 * nên đọc bằng service role + chặn requireAdmin.
 *
 * Mặc định CHỈ KHÁCH THẬT (bỏ nội bộ + bot — A Khoa 26/09); `?all=1` gồm tất cả.
 * `excluded` luôn là phần bị loại (tất cả − khách thật) để UI ghi "đã loại N lượt".
 * Trước khi đếm, đồng bộ danh sách IP nội bộ (refresh_traffic_exclusions,
 * ≤1 lần/10 phút/instance, lỗi thì bỏ qua).
 *
 * GET /api/admin/visit-stats[?all=1] →
 *   { total, daily: [{day:'YYYY-MM-DD', count}], excluded: { total, daily } }
 */
export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const includeAll = parseAllFlag(req.nextUrl.searchParams);
    const db = createAdminClient();

    await refreshExclusionsThrottled(db);

    const [khach, all] = await Promise.all([
      db.rpc("daily_page_visits", { p_days: WINDOW_DAYS, p_all: false }),
      db.rpc("daily_page_visits", { p_days: WINDOW_DAYS, p_all: true }),
    ]);

    if (khach.error || all.error) {
      const err = khach.error ?? all.error;
      // Migration lọc nội bộ chưa áp (RPC còn bản 1 tham số) → trả số thô như cũ.
      if (!isMissingDbObject(err)) throw new Error(`RPC daily_page_visits lỗi: ${err?.message}`);
      const legacy = await db.rpc("daily_page_visits", { p_days: WINDOW_DAYS });
      if (legacy.error) throw new Error(`RPC daily_page_visits lỗi: ${legacy.error.message}`);
      const daily = toDaily(legacy.data);
      return Response.json({ total: sumDaily(daily), daily, excluded: { total: 0, daily: [] } });
    }

    const khachDaily = toDaily(khach.data);
    const allDaily = toDaily(all.data);
    const excludedDaily = subtractDaily(allDaily, khachDaily);
    const daily = includeAll ? allDaily : khachDaily;

    return Response.json({
      total: sumDaily(daily),
      daily,
      excluded: { total: sumDaily(excludedDaily), daily: excludedDaily },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
