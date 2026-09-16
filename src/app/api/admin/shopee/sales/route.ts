import type { NextRequest } from "next/server";
import { getShopeeSalesByItem } from "@/lib/shopee/sales";
import { errorResponse, jsonNoStore, requireAdmin } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Doanh thu Shopee theo listing (góp ý #34): ?days=30 → mỗi mã đã bán bao nhiêu
 * đơn / cái / doanh thu. Gọi thẳng Shopee Order API (không cache) nên hơi lâu —
 * frontend nạp theo yêu cầu (có nút chọn 7/30/90 ngày).
 */
export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const { searchParams } = new URL(req.url);
    const days = Math.min(Math.max(Number(searchParams.get("days")) || 30, 1), 90);
    return jsonNoStore(await getShopeeSalesByItem(days));
  } catch (err) {
    return errorResponse(err);
  }
}
