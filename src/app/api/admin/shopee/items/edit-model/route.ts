import type { NextRequest } from "next/server";
import { getCreds, persistRefreshedTokens } from "@/lib/shopee/credentials";
import { ShopeeProductClient } from "@/lib/shopee/client";
import { errorResponse, jsonNoStore, parseIntSafe, requireAdmin } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Sửa TẠI CHỖ một biến thể đã có trên listing Shopee (giữ nguyên model_id):
 * - Đổi nhãn hiển thị (số có chấm) → update_tier_variation (đổi option tại đúng index).
 * - Đổi giá → update_price.
 *
 * Cho phép đổi hẳn value sang số khác: chỉ cần nhập số mới + nhãn hiển thị mới.
 * Khớp kho (inKho) chạy theo nhãn option (đã strip chấm) nên tự khớp số mới.
 *
 * Body: { itemId, modelId, label: "0775190678", display?: "077.51.90678", price?: 1100000 }
 */
export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return jsonNoStore({ error: "Body không hợp lệ" }, 400);

    const itemId = parseIntSafe(body.itemId);
    const modelId = parseIntSafe(body.modelId);
    const label = String(body.label ?? "").trim();
    const display = String(body.display ?? "").trim();
    const price = Number(body.price ?? 0);

    // Chữ số sạch = GIÁ TRỊ THẬT của SIM. Dấu chấm chỉ ở nhãn hiển thị, không lọt vào đây.
    const rawDigits = (label || display).replace(/\D/g, "");
    const optionLabel = display || label;

    if (!itemId) return jsonNoStore({ error: "Thiếu itemId" }, 400);
    if (!modelId) return jsonNoStore({ error: "Thiếu modelId" }, 400);
    if (!rawDigits) return jsonNoStore({ error: "Thiếu số SIM" }, 400);

    const creds = await getCreds();
    if (!creds || !creds.accessToken) return jsonNoStore({ error: "Chưa uỷ quyền shop" }, 400);

    const client = new ShopeeProductClient(creds);
    const itemIdNum = itemId as number;
    const modelIdNum = modelId as number;

    // Bước 1: lấy model list + tier hiện tại.
    const current = await client.getModelList(itemIdNum);
    const currentTier = (current?.tier_variation ?? []) as Record<string, unknown>[];
    const currentModels = (current?.model ?? []) as Record<string, unknown>[];

    if (currentTier.length === 0) {
      return jsonNoStore({ error: "Listing này không có biến thể để sửa" }, 400);
    }

    // Bước 2: tìm model cần sửa để biết nó nằm ở option index nào (tier đầu).
    const target = currentModels.find((m) => Number(m?.model_id ?? 0) === modelIdNum);
    if (!target) {
      return jsonNoStore({ error: `Không tìm thấy biến thể model_id=${modelIdNum} trong listing` }, 400);
    }
    const targetTierIndex = (target?.tier_index ?? []) as number[];
    const optionIndex = Number(targetTierIndex[0] ?? -1);
    if (optionIndex < 0) {
      return jsonNoStore({ error: "Biến thể không có tier_index hợp lệ" }, 400);
    }

    // Bước 3: chống trùng — số mới không được đụng option KHÁC (khác index đang sửa).
    const firstOpts = (currentTier[0]?.option_list ?? []) as Record<string, unknown>[];
    for (let i = 0; i < firstOpts.length; i++) {
      if (i === optionIndex) continue;
      if (String(firstOpts[i]?.option ?? "").replace(/\D/g, "") === rawDigits) {
        return jsonNoStore({ error: `Số "${optionLabel}" đã tồn tại ở biến thể khác của listing này` }, 400);
      }
    }

    // Bước 4: dựng lại tier — chỉ đổi option tại đúng index, giữ nguyên phần còn lại.
    const newTier = currentTier.map((tv, ti) => {
      const opts = ((tv?.option_list ?? []) as Record<string, unknown>[]).map((o, oi) => ({
        option: ti === 0 && oi === optionIndex ? optionLabel : String(o?.option ?? ""),
      }));
      return { name: String(tv?.name ?? ""), option_list: opts };
    });

    // Model map giữ nguyên model_id ↔ tier_index (Shopee bắt buộc).
    const modelMap = currentModels.map((m) => ({
      model_id: m?.model_id,
      tier_index: m?.tier_index,
    }));

    // Bước 5: cập nhật nhãn option (đổi số hiển thị / đổi value).
    await client.updateTierVariation({
      item_id: itemIdNum,
      tier_variation: newTier,
      model: modelMap,
    });

    // Bước 6: đổi giá nếu có nhập.
    if (price > 0) {
      await client.updatePrice(itemIdNum, modelIdNum, price);
    }

    if (client.refreshedTokens) {
      await persistRefreshedTokens(client.refreshedTokens);
    }

    return jsonNoStore({
      ok: true,
      itemId: itemIdNum,
      modelId: modelIdNum,
      label: optionLabel,
      rawDigits,
      price: price > 0 ? price : null,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
