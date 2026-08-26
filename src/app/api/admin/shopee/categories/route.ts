import type { NextRequest } from "next/server";
import { getCreds } from "@/lib/shopee/credentials";
import { ShopeeProductClient } from "@/lib/shopee/client";
import { errorResponse, jsonNoStore, requireAdmin } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Cây danh mục sản phẩm trên Shopee (để admin chọn danh mục SIM khi cài đặt).
 * Gọi trực tiếp Shopee API mỗi lần — ít khi dùng nên không cần cache.
 */
export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const creds = await getCreds();
    if (!creds) throw new Error("Chưa khai báo thông số Shopee (partner_id/partner_key/shop_id).");
    if (!creds.accessToken) throw new Error("Chưa uỷ quyền shop — bấm \"Uỷ quyền shop\" trước.");

    const client = new ShopeeProductClient(creds);
    const categories = await client.getCategories("VN");
    return jsonNoStore({ categories });
  } catch (err) {
    return errorResponse(err);
  }
}