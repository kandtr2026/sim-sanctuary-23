import type { NextRequest } from "next/server";
import { getSnapshotSummary } from "@/lib/shopee/pull";
import { errorResponse, jsonNoStore, requireAdmin } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";

/**
 * Tóm tắt Shopee cho dashboard (góp ý #30): số listing / đang bán / hết hàng,
 * đọc từ snapshot cache — KHÔNG gọi Shopee, payload chỉ vài con số.
 */
export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    return jsonNoStore(await getSnapshotSummary());
  } catch (err) {
    return errorResponse(err);
  }
}
