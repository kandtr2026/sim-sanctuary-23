import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/shopee/admin";
import { errorResponse, jsonNoStore, requireAdmin } from "@/lib/shopee/http";
import {
  mapExclusionReport,
  refreshExclusionsThrottled,
  validateExclusionPatch,
  validateExclusionPost,
} from "@/lib/trafficExclusions";

export const dynamic = "force-dynamic";
export const maxDuration = 20;

/** Số ngày của các tổng "14 ngày" trên màn (visits14d / totals.*14d). */
const REPORT_DAYS = 14;

const ROW_COLUMNS = "id, ip, reason, note, active, auto, valid_from, valid_to";

/**
 * Danh sách IP bị LOẠI khỏi thống kê khách (bảng traffic_exclusions — A Khoa
 * 26/09) + tổng 14 ngày khách thật / nội bộ / bot. Gom ở SQL (RPC
 * traffic_exclusions_report) → client chỉ nhận JSON nhỏ, nhẹ egress.
 *
 * GET  → { items:[{id, ip, reason, note, active, auto, valid_from, valid_to,
 *          visits14d, lastVisit}], totals:{ internalVisits14d, botVisits14d,
 *          customerVisits14d } }
 * POST { ip, note? } → thêm IP tay (reason 'manual', loại cả lịch sử).
 * PATCH { id, active } → bật/tắt 1 dòng; { ip, active } → mọi dòng của IP. Đặt auto=false để lượt quét tự động
 *          không bao giờ bật/sửa lại dòng đó.
 */
export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const db = createAdminClient();
    await refreshExclusionsThrottled(db);

    const { data, error } = await db.rpc("traffic_exclusions_report", { p_days: REPORT_DAYS });
    if (error) throw new Error(`RPC traffic_exclusions_report lỗi: ${error.message}`);
    return jsonNoStore(mapExclusionReport(data));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const parsed = validateExclusionPost(await req.json().catch(() => null));
    if (!parsed.ok) return jsonNoStore({ error: parsed.error }, 400);

    const db = createAdminClient();
    // Thêm mới hoặc bật lại dòng 'manual' cũ của IP này. Không gửi note thì giữ
    // ghi chú cũ (upsert chỉ ghi đè cột có trong payload).
    const row: Record<string, unknown> = {
      ip: parsed.ip,
      reason: "manual",
      valid_from: null,
      valid_to: null,
      active: true,
      auto: false,
      updated_at: new Date().toISOString(),
    };
    if (parsed.note) row.note = parsed.note;

    const { data, error } = await db
      .from("traffic_exclusions")
      .upsert(row, { onConflict: "ip,reason" })
      .select(ROW_COLUMNS)
      .single();
    if (error) throw new Error(`Lưu IP lỗi: ${error.message}`);
    return jsonNoStore({ item: data }, 201);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const parsed = validateExclusionPatch(await req.json().catch(() => null));
    if (!parsed.ok) return jsonNoStore({ error: parsed.error }, 400);

    const db = createAdminClient();
    const patch = { active: parsed.active, auto: false, updated_at: new Date().toISOString() };
    if (parsed.ip) {
      // Cả IP: mọi lý do (admin/staff/heavy/…) cùng bật hoặc cùng tắt.
      const { data, error } = await db
        .from("traffic_exclusions")
        .update(patch)
        .eq("ip", parsed.ip)
        .select(ROW_COLUMNS);
      if (error) throw new Error(`Cập nhật lỗi: ${error.message}`);
      if (!data?.length) return jsonNoStore({ error: "Không tìm thấy IP này" }, 404);
      return jsonNoStore({ items: data });
    }
    const { data, error } = await db
      .from("traffic_exclusions")
      .update(patch)
      .eq("id", parsed.id!)
      .select(ROW_COLUMNS)
      .maybeSingle();
    if (error) throw new Error(`Cập nhật lỗi: ${error.message}`);
    if (!data) return jsonNoStore({ error: "Không tìm thấy dòng này" }, 404);
    return jsonNoStore({ item: data });
  } catch (err) {
    return errorResponse(err);
  }
}
