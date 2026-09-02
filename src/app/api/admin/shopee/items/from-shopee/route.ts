import type { NextRequest } from "next/server";
import { pullAllItems, saveSnapshot } from "@/lib/shopee/pull";
import { errorResponse, jsonNoStore, requireAdmin } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Kéo toàn bộ sản phẩm đang có trên Shopee về, lưu snapshot vào DB, trả kết quả.
 */
export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const result = await pullAllItems();
    await saveSnapshot(result, gate.user.email);
    return jsonNoStore({ ...result, saved: true, fetchedAt: new Date().toISOString() });
  } catch (err) {
    return errorResponse(err);
  }
}