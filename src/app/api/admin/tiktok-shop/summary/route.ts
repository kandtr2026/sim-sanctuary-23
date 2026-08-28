import type { NextRequest } from "next/server";
import { getOrderList, summarizeOrders, loadStaticCreds, TikTokShopError } from "@/lib/tiktokShop/client";
import { getFreshAccessToken } from "@/lib/tiktokShop/tokenStore";
import { requireAdmin, jsonNoStore, errorResponse } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/admin/tiktok-shop/summary?days=30
 *
 * Returns total revenue, order count, and daily breakdown for the given
 * number of days (default 30). Admins only — gated by requireAdmin.
 *
 * Access token được lấy từ bảng tiktok_tokens (Supabase) và TỰ ĐỘNG refresh
 * khi sắp hết hạn (refresh_token sống lâu hơn nhiều).
 */
export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const { searchParams } = new URL(req.url);
    const days = Math.min(Math.max(Number(searchParams.get("days")) || 30, 1), 365);
    const now = Math.floor(Date.now() / 1000);
    const from = now - days * 86400;

    const auth = req.headers.get("authorization");
    const adminToken = auth?.startsWith("Bearer ") ? auth.slice(7) : "";
    const staticCreds = loadStaticCreds();
    const creds = await getFreshAccessToken(adminToken, staticCreds);

    const orders = await getOrderList(from, now, { maxOrders: 500, creds });
    const summary = summarizeOrders(orders);

    return jsonNoStore({
      ...summary,
      range_days: days,
      orders_count_raw: orders.length, // tổng đơn trước lọc (bao gồm huỷ/chưa thanh toán)
    });
  } catch (err) {
    if (err instanceof TikTokShopError) {
      return jsonNoStore(
        { error: err.message, code: err.code, hint: hintForCode(err.code) },
        502,
      );
    }
    return errorResponse(err);
  }
}

function hintForCode(code: string | number | null): string | null {
  if (code === 105005 || code === "105005") {
    return "Token chưa có quyền đọc đơn hàng. Vào Partner Center → App & Service → Manage → Manage API, bật quyền Order, rồi ủy quyền lại (xem OpenCode.md PHẦN 2 mục 3a).";
  }
  if (code === 105001 || code === "105001") {
    return "Token hết hạn và không refresh được. Kiểm tra refresh_token trong bảng tiktok_tokens.";
  }
  return null;
}