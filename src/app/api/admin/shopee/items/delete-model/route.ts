import type { NextRequest } from "next/server";
import { getCreds, persistRefreshedTokens } from "@/lib/shopee/credentials";
import { ShopeeProductClient } from "@/lib/shopee/client";
import { errorResponse, jsonNoStore, parseIntSafe, requireAdmin } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Xoá HẲN một số (model/biến thể) khỏi listing — dùng để dọn nhanh số đã hết.
 * Khác "Tắt"/set-stock (chỉ đặt kho=0, số vẫn còn): xoá là gỡ biến thể khỏi item.
 *
 * Body: { itemId, modelId }
 */
export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return jsonNoStore({ error: "Body không hợp lệ" }, 400);

    const itemId = parseIntSafe(body.itemId);
    const modelId = parseIntSafe(body.modelId);
    if (!itemId) return jsonNoStore({ error: "Thiếu itemId" }, 400);
    if (!modelId) return jsonNoStore({ error: "Thiếu modelId" }, 400);

    const creds = await getCreds();
    if (!creds || !creds.accessToken) return jsonNoStore({ error: "Chưa uỷ quyền shop" }, 400);

    const client = new ShopeeProductClient(creds);
    await client.deleteModel(itemId as number, modelId as number);

    if (client.refreshedTokens) {
      await persistRefreshedTokens(client.refreshedTokens);
    }

    return jsonNoStore({ ok: true, itemId, modelId });
  } catch (err) {
    return errorResponse(err);
  }
}
