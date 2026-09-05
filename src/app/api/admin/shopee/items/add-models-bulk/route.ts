import type { NextRequest } from "next/server";
import { getCreds, persistRefreshedTokens } from "@/lib/shopee/credentials";
import { ShopeeProductClient } from "@/lib/shopee/client";
import { errorResponse, jsonNoStore, parseIntSafe, requireAdmin } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/** Trần biến thể/listing của Shopee (single-tier). */
const MAX_VARIANTS = 50;

/**
 * Đồng bộ LÔ: đẩy nhiều SIM đã chọn vào 1 listing biến thể có sẵn (dạng "Số VIP"),
 * mỗi số thành 1 biến thể — thay vì tạo mỗi số 1 sản phẩm rời.
 *
 * Chỉ 2 lần gọi Shopee cho cả lô: update_tier_variation (đăng ký hết option mới) +
 * add_model (thêm hết model mới). Khớp kho / SKU dùng chữ số sạch; nhãn hiển thị
 * (có chấm) chỉ nằm ở option → không làm sai giá trị SIM.
 *
 * Body: { itemId, sims: [{ label, display?, price }] }
 */
export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return jsonNoStore({ error: "Body không hợp lệ" }, 400);

    const itemId = parseIntSafe(body.itemId);
    const rawSims = Array.isArray(body.sims) ? (body.sims as Record<string, unknown>[]) : [];
    if (!itemId) return jsonNoStore({ error: "Thiếu listing đích (itemId)" }, 400);
    if (rawSims.length === 0) return jsonNoStore({ error: "Chưa chọn SIM nào để đồng bộ" }, 400);

    // Chuẩn hoá: digits = giá trị thật; option = nhãn hiển thị (ưu tiên bản có chấm).
    const incoming = rawSims
      .map((s) => {
        const label = String(s?.label ?? "").trim();
        const display = String(s?.display ?? "").trim();
        const price = Number(s?.price ?? 0);
        const digits = (label || display).replace(/\D/g, "");
        return { digits, option: display || label, price };
      })
      .filter((s) => s.digits && s.price > 0);

    if (incoming.length === 0) {
      return jsonNoStore({ error: "Không có SIM hợp lệ (thiếu số hoặc giá)" }, 400);
    }

    const creds = await getCreds();
    if (!creds || !creds.accessToken) return jsonNoStore({ error: "Chưa uỷ quyền shop" }, 400);

    const client = new ShopeeProductClient(creds);
    const itemIdNum = itemId as number;

    // Bước 1: lấy tier + model hiện tại của listing đích.
    const current = await client.getModelList(itemIdNum);
    const currentTier = (current?.tier_variation ?? []) as Record<string, unknown>[];
    const currentModels = (current?.model ?? []) as Record<string, unknown>[];
    if (currentTier.length === 0) {
      return jsonNoStore(
        { error: "Listing đích không có biến thể — chọn listing dạng nhiều số (như 'Số VIP')." },
        400,
      );
    }

    const firstOpts = (currentTier[0]?.option_list ?? []) as Record<string, unknown>[];
    const existingDigits = new Set(firstOpts.map((o) => String(o?.option ?? "").replace(/\D/g, "")));

    // Bước 2: bỏ số đã có sẵn trong listing + bỏ trùng trong chính lô.
    const seen = new Set<string>();
    const toAdd: { option: string; digits: string; price: number }[] = [];
    let skipped = 0;
    for (const s of incoming) {
      if (existingDigits.has(s.digits) || seen.has(s.digits)) {
        skipped++;
        continue;
      }
      seen.add(s.digits);
      toAdd.push(s);
    }

    if (toAdd.length === 0) {
      return jsonNoStore({ ok: true, added: 0, skipped, total: incoming.length });
    }

    if (firstOpts.length + toAdd.length > MAX_VARIANTS) {
      return jsonNoStore(
        {
          error: `Listing đang có ${firstOpts.length} số, thêm ${toAdd.length} nữa sẽ vượt trần ${MAX_VARIANTS} biến thể của Shopee. Chọn ít số hơn hoặc dùng listing khác.`,
        },
        400,
      );
    }

    const baseIndex = firstOpts.length;

    // Bước 3: update_tier_variation — nối tất cả option mới vào tier đầu, giữ map cũ.
    const newTier = currentTier.map((tv, ti) => {
      const opts = ((tv?.option_list ?? []) as Record<string, unknown>[]).map((o) => ({
        option: String(o?.option ?? ""),
      }));
      if (ti === 0) for (const s of toAdd) opts.push({ option: s.option });
      return { name: String(tv?.name ?? ""), option_list: opts };
    });
    const modelMap = currentModels.map((m) => ({
      model_id: m?.model_id,
      tier_index: m?.tier_index,
    }));
    await client.updateTierVariation({
      item_id: itemIdNum,
      tier_variation: newTier,
      model: modelMap,
    });

    // Bước 4: add_model — thêm tất cả model mới trong 1 lần.
    const modelList = toAdd.map((s, k) => ({
      tier_index: [baseIndex + k],
      original_price: s.price,
      model_sku: s.digits,
      seller_stock: [{ stock: 1, location_id: "" }],
    }));
    await client.addModels(itemIdNum, modelList);

    if (client.refreshedTokens) {
      await persistRefreshedTokens(client.refreshedTokens);
    }

    return jsonNoStore({ ok: true, added: toAdd.length, skipped, total: incoming.length });
  } catch (err) {
    return errorResponse(err);
  }
}
