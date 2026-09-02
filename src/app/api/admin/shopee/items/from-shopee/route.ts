import type { NextRequest } from "next/server";
import { pullAllItems } from "@/lib/shopee/pull";
import { errorResponse, jsonNoStore, requireAdmin } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Kéo toàn bộ sản phẩm đang có trên Shopee (get_item_list phân trang) về để
 * admin theo dõi. Chỉ đọc từ Shopee + đọc map, KHÔNG ghi gì vào DB.
 */
export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const result = await pullAllItems();
    return jsonNoStore(result);
  } catch (err) {
    return errorResponse(err);
  }
}
