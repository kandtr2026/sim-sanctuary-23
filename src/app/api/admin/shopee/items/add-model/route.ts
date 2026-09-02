import type { NextRequest } from "next/server";
import { getCreds, persistRefreshedTokens } from "@/lib/shopee/credentials";
import { ShopeeProductClient } from "@/lib/shopee/client";
import { errorResponse, jsonNoStore, parseIntSafe, requireAdmin } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Thêm số SIM mới vào biến thể của 1 listing có sẵn trên Shopee.
 * Body: { itemId, label: "0775190678", price: 1100000, stock?: 1 }
 *
 * Dùng init_tier_variation: đọc model list hiện tại, thêm option + model mới,
 * dựng lại toàn bộ tier. Giữ nguyên các model cũ.
 */
export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return jsonNoStore({ error: "Body không hợp lệ" }, 400);

    const itemId = parseIntSafe(body.itemId);
    const label = String(body.label ?? "").trim();
    const price = Number(body.price ?? 0);
    const stock = Math.max(0, Number(body.stock ?? 1));

    if (!itemId) return jsonNoStore({ error: "Thiếu itemId" }, 400);
    if (!label) return jsonNoStore({ error: "Thiếu label (số SIM)" }, 400);
    if (price <= 0) return jsonNoStore({ error: "Giá phải > 0" }, 400);

    const creds = await getCreds();
    if (!creds || !creds.accessToken) return jsonNoStore({ error: "Chưa uỷ quyền shop" }, 400);

    const client = new ShopeeProductClient(creds);
    const itemIdNum = itemId as number;

    // Bước 1: lấy model list hiện tại + tier_variation
    const current = await client.getModelList(itemIdNum);
    const currentTier = (current?.tier_variation ?? []) as Record<string, unknown>[];
    const currentModels = (current?.model ?? []) as Record<string, unknown>[];

    // Bước 2: nếu label đã tồn tại → báo lỗi trước
    for (const tv of currentTier) {
      const opts = (tv?.option_list ?? []) as Record<string, unknown>[];
      for (const o of opts) {
        if (String(o?.option ?? "") === label) {
          return jsonNoStore({ error: `Số "${label}" đã tồn tại trong biến thể của listing này` }, 400);
        }
      }
    }

    if (currentTier.length === 0) {
      // Item không có tier → dùng add_item? Hoặc không hỗ trợ.
      return jsonNoStore({ error: "Listing này không có biến thể (no model) — dùng Đồng bộ lên Shopee để tạo item mới" }, 400);
    }

    // Bước 3: xây dựng tier_variation mới (thêm option mới vào tier đầu tiên)
    const newOption = { option: label, image: null };
    const newTier = currentTier.map((tv, ti) => {
      const opts = [...((tv?.option_list ?? []) as Record<string, unknown>[])];
      if (ti === 0) opts.push(newOption); // thêm vào tier đầu (thường là "Chọn số")
      return { name: tv?.name ?? "", option_list: opts };
    });

    // Bước 4: xây dựng model list mới (giữ nguyên cũ + thêm model mới)
    const newModels: Record<string, unknown>[] = currentModels.map((m) => {
      const pi = (m?.price_info ?? []) as Record<string, unknown>[];
      return {
        tier_index: m?.tier_index,
        original_price: Number(pi[0]?.original_price ?? 0) || Number(pi[0]?.current_price ?? 0),
        model_sku: m?.model_sku ?? undefined,
        seller_stock: [{ stock: Number((m as Record<string, unknown>)?.stock ?? 1), location_id: "" }],
      };
    });

    // Thêm model mới
    const newModelTierIndex = [currentModels.length]; // index = số lượng model hiện tại
    newModels.push({
      tier_index: newModelTierIndex,
      original_price: price,
      model_sku: label,
      seller_stock: [{ stock, location_id: "" }],
    });

    // Bước 5: gọi init_tier_variation
    await client.initTierVariation({
      item_id: itemIdNum,
      tier_variation: newTier,
      model: newModels,
    });

    if (client.refreshedTokens) {
      await persistRefreshedTokens(client.refreshedTokens);
    }

    return jsonNoStore({
      ok: true,
      itemId: itemIdNum,
      label,
      price,
      totalModels: newModels.length,
    });
  } catch (err) {
    return errorResponse(err);
  }
}