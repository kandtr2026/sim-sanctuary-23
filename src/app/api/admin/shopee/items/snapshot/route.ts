import type { NextRequest } from "next/server";
import { getSnapshot } from "@/lib/shopee/pull";
import { errorResponse, jsonNoStore, requireAdmin } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";

/**
 * Đọc snapshot Shopee gần nhất từ DB (cache) — KHÔNG gọi Shopee. Để admin login
 * vào thấy ngay bảng sản phẩm, chỉ bấm "Lấy danh sách" mới fetch mới.
 */
export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    return jsonNoStore(await getSnapshot());
  } catch (err) {
    return errorResponse(err);
  }
}