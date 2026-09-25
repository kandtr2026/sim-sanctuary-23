import type { NextRequest } from "next/server";
import { getCreds, persistRefreshedTokens } from "@/lib/shopee/credentials";
import { ShopeeProductClient } from "@/lib/shopee/client";
import { errorResponse, jsonNoStore, parseIntSafe, requireAdmin } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Đặt lại KHO cho một biến thể đã có (không đổi số / giá).
 *
 * Dùng cho ô "số ngẫu nhiên" (chỉnh số lượng bán theo lô) và để bật lại một số
 * đang Hết mà vẫn giữ đúng số đó (stock > 0), hoặc tắt (stock = 0). Khác với
 * edit-model ở chỗ không cần dãy số — nên chạy được cả biến thể không phải số.
 *
 * Body: { itemId, modelId, stock }
 */
export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return jsonNoStore({ error: "Body không hợp lệ" }, 400);

    const itemId = parseIntSafe(body.itemId);
    const modelId = parseIntSafe(body.modelId);
    const stockParsed = parseIntSafe(body.stock);

    if (!itemId) return jsonNoStore({ error: "Thiếu itemId" }, 400);
    if (!modelId) return jsonNoStore({ error: "Thiếu modelId" }, 400);
    if (stockParsed == null) return jsonNoStore({ error: "Thiếu số lượng kho" }, 400);
    const stock = Math.max(0, stockParsed);

    const creds = await getCreds();
    if (!creds || !creds.accessToken) return jsonNoStore({ error: "Chưa uỷ quyền shop" }, 400);

    const client = new ShopeeProductClient(creds);
    await client.updateModelStock(itemId as number, modelId as number, stock);

    if (client.refreshedTokens) {
      await persistRefreshedTokens(client.refreshedTokens);
    }

    return jsonNoStore({ ok: true, itemId, modelId, stock });
  } catch (err) {
    return errorResponse(err);
  }
}
