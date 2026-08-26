import type { NextRequest } from "next/server";
import { getCreds } from "@/lib/shopee/credentials";
import { createAdminClient } from "@/lib/shopee/admin";
import { ShopeeProductClient } from "@/lib/shopee/client";
import { errorResponse, jsonNoStore, parseIntSafe, requireAdmin } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";

/**
 * Gỡ sản phẩm khỏi Shopee (unlist) và cập nhật map.
 * Body: { simId: string, itemId: number }
 */
export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return jsonNoStore({ error: "Body không hợp lệ" }, 400);

    const simId = String(body.simId || "").trim();
    const itemId = parseIntSafe(body.itemId);
    if (!simId || !itemId) {
      return jsonNoStore({ error: "Thiếu simId hoặc itemId" }, 400);
    }

    const creds = await getCreds();
    if (!creds || !creds.accessToken) {
      return jsonNoStore({ error: "Chưa uỷ quyền shop" }, 400);
    }

    const client = new ShopeeProductClient(creds);
    await client.deleteItem(itemId, true);

    const db = createAdminClient();
    const { error } = await db
      .from("shopee_item_map")
      .update({ status: "removed", updated_at: new Date().toISOString() })
      .eq("sim_id", simId);
    if (error) {
      console.error("[shopee-remove] Xoá item trên Shopee xong nhưng không update map:", error.message);
    }

    return jsonNoStore({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}