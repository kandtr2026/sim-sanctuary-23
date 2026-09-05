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
    if (currentTier.length > 1) {
      return jsonNoStore(
        { error: "Listing này có 2 tầng biến thể — chưa hỗ trợ đẩy lô. Dùng 'Thêm số' lẻ." },
        400,
      );
    }

    const firstOpts = (currentTier[0]?.option_list ?? []) as Record<string, unknown>[];
    // digits của từng option (theo index)
    const optionDigits = firstOpts.map((o) => String(o?.option ?? "").replace(/\D/g, ""));
    // Option index → digits map (giữ index đầu tiên nếu trùng)
    const idxByDigits = new Map<string, number>();
    optionDigits.forEach((d, i) => {
      if (d && !idxByDigits.has(d)) idxByDigits.set(d, i);
    });
    // Option index nào ĐÃ có model (biến thể thật, bán được).
    const modeledIdx = new Set<number>();
    for (const m of currentModels) {
      const ti = (m?.tier_index ?? []) as number[];
      const i = Number(ti[0] ?? -1);
      if (i >= 0) modeledIdx.add(i);
    }

    // Bước 2: phân loại — bỏ trùng thật, gắn model cho option "mồ côi" (có option
    // nhưng chưa có model, do lần đẩy trước lỗi giữa chừng), tạo mới phần còn lại.
    const seen = new Set<string>();
    let skipped = 0;
    const needNewOption: { option: string; digits: string; price: number }[] = [];
    const fillOrphan: { option: string; digits: string; price: number }[] = [];
    for (const s of incoming) {
      if (seen.has(s.digits)) {
        skipped++;
        continue;
      }
      seen.add(s.digits);
      const existIdx = idxByDigits.get(s.digits);
      if (existIdx !== undefined && modeledIdx.has(existIdx)) {
        skipped++; // đã là biến thể thật → bỏ qua
      } else if (existIdx !== undefined) {
        fillOrphan.push(s); // có option nhưng thiếu model → chỉ cần add_model
      } else {
        needNewOption.push(s); // chưa có option → tạo option + model
      }
    }

    const totalToAdd = needNewOption.length + fillOrphan.length;
    if (totalToAdd === 0) {
      return jsonNoStore({ ok: true, added: 0, failed: 0, skipped, total: incoming.length, errors: [] });
    }

    if (firstOpts.length + needNewOption.length > MAX_VARIANTS) {
      return jsonNoStore(
        {
          error: `Listing đang có ${firstOpts.length} số, thêm ${needNewOption.length} số mới nữa sẽ vượt trần ${MAX_VARIANTS} biến thể của Shopee. Chọn ít số hơn hoặc dùng listing khác.`,
        },
        400,
      );
    }

    // Bước 3: update_tier_variation — chỉ nối các option MỚI (mồ côi đã có option).
    if (needNewOption.length > 0) {
      const newTier = currentTier.map((tv, ti) => {
        const opts = ((tv?.option_list ?? []) as Record<string, unknown>[]).map((o) => ({
          option: String(o?.option ?? ""),
        }));
        if (ti === 0) for (const s of needNewOption) opts.push({ option: s.option });
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
    }

    // Bước 4: ĐỌC LẠI tier để lấy CHỈ SỐ OPTION THẬT (Shopee có thể gán index khác
    // baseIndex+k → đó là lỗi "tier_index error : model in position [N]").
    const after = await client.getModelList(itemIdNum);
    const afterOpts = (((after?.tier_variation ?? []) as Record<string, unknown>[])[0]?.option_list ??
      []) as Record<string, unknown>[];
    const digitsToIndex = new Map<string, number>();
    afterOpts.forEach((o, idx) => {
      const d = String(o?.option ?? "").replace(/\D/g, "");
      if (d && !digitsToIndex.has(d)) digitsToIndex.set(d, idx);
    });

    // Bước 5: add_model TỪNG SỐ với index thật — lỗi 1 số không kéo sập cả lô.
    let added = 0;
    let failed = 0;
    const errors: { number: string; error: string }[] = [];
    for (const s of [...fillOrphan, ...needNewOption]) {
      const idx = digitsToIndex.get(s.digits);
      if (idx === undefined) {
        failed++;
        errors.push({ number: s.option, error: "Shopee chưa tạo được option cho số này" });
        continue;
      }
      try {
        await client.addModel(itemIdNum, {
          tier_index: [idx],
          original_price: s.price,
          model_sku: s.digits,
          seller_stock: [{ stock: 1, location_id: "" }],
        });
        added++;
      } catch (e) {
        failed++;
        errors.push({ number: s.option, error: (e as Error).message });
      }
    }

    if (client.refreshedTokens) {
      await persistRefreshedTokens(client.refreshedTokens);
    }

    return jsonNoStore({ ok: true, added, failed, skipped, total: incoming.length, errors });
  } catch (err) {
    return errorResponse(err);
  }
}
