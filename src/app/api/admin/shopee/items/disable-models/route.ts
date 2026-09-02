import type { NextRequest } from "next/server";
import { getCreds, persistRefreshedTokens } from "@/lib/shopee/credentials";
import { ShopeeProductClient } from "@/lib/shopee/client";
import { errorResponse, jsonNoStore, parseIntSafe, requireAdmin } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Tắt (set stock=0) các biến thể đã chọn trên Shopee — biến thể không còn bán
 * được nữa nhưng model vẫn giữ trong listing. Body: { models: [{ item_id, model_id }] }
 */
export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const list = Array.isArray(body?.models) ? body.models : [];
    if (list.length === 0) return jsonNoStore({ error: "Chưa chọn biến thể nào" }, 400);
    if (list.length > 50) {
      return jsonNoStore({ error: "Mỗi lần tối đa 50 biến thể" }, 400);
    }

    const models = list.map((m) => ({
      itemId: parseIntSafe((m as Record<string, unknown>).item_id),
      modelId: parseIntSafe((m as Record<string, unknown>).model_id),
    }));
    if (models.some((m) => !m.itemId || !m.modelId)) {
      return jsonNoStore({ error: "Thiếu item_id hoặc model_id" }, 400);
    }

    const creds = await getCreds();
    if (!creds || !creds.accessToken) return jsonNoStore({ error: "Chưa uỷ quyền shop" }, 400);

    const client = new ShopeeProductClient(creds);
    const errors: { itemId: number; modelId: number; error: string }[] = [];
    let ok = 0;

    for (const m of models) {
      try {
        await client.updateModelStock(m.itemId as number, m.modelId as number);
        ok++;
      } catch (err) {
        const e = err as { message?: string };
        errors.push({ itemId: m.itemId as number, modelId: m.modelId as number, error: e?.message || String(err) });
      }
    }

    if (client.refreshedTokens) {
      await persistRefreshedTokens(client.refreshedTokens);
    }

    return jsonNoStore({ ok, failed: errors.length, errors });
  } catch (err) {
    return errorResponse(err);
  }
}