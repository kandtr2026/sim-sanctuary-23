import type { NextRequest } from "next/server";
import { syncSims } from "@/lib/shopee/sync";
import { MAX_ITEMS_PER_SYNC } from "@/lib/shopee/config";
import { errorResponse, jsonNoStore, requireAdmin } from "@/lib/shopee/http";
import type { NormalizedSIM } from "@/lib/simUtils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Đồng bộ lô SIM đã chọn lên Shopee.
 *
 * Client (admin) gửi đúng danh sách sim đã tick trên trang — server KHÔNG tự
 * quét kho, để admin kiểm soát lô nào lên Shopee. Giới hạn mỗi lần sync để
 * không vượt thời gian chạy của serverless function (throttle ~3 req/s).
 *
 * Body: { sims: NormalizedSIM[] }
 */
export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return jsonNoStore({ error: "Body không hợp lệ" }, 400);

    const sims = Array.isArray(body.sims) ? (body.sims as NormalizedSIM[]) : [];
    if (sims.length === 0) {
      return jsonNoStore({ error: "Chưa chọn SIM nào để đồng bộ" }, 400);
    }
    if (sims.length > MAX_ITEMS_PER_SYNC) {
      return jsonNoStore(
        { error: `Mỗi lần chỉ đồng bộ tối đa ${MAX_ITEMS_PER_SYNC} SIM — hãy chia nhỏ lô.` },
        400,
      );
    }

    const result = await syncSims(sims, gate.user.email);
    return jsonNoStore(result);
  } catch (err) {
    return errorResponse(err);
  }
}