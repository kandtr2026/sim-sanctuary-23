import type { NextRequest } from "next/server";
import { getCreds } from "@/lib/shopee/credentials";
import { ShopeeProductClient } from "@/lib/shopee/client";
import { errorResponse, jsonNoStore, requireAdmin } from "@/lib/shopee/http";
import { parseIntSafe } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Chẩn đoán kết nối Product. Không ghi gì vào DB.
 *
 * GET /api/admin/shopee/diagnose → kiểm tra kết nối + item list
 * GET /api/admin/shopee/diagnose?itemId=52315056798 → dump raw base_info + model_list
 */
export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const creds = await getCreds();
    const base = {
      configured: !!creds,
      partnerId: creds?.partnerId ?? null,
      shopId: creds?.shopId ?? null,
      env: creds ? creds.host.includes("test-stable") ? "sandbox" : "live" : null,
      hasAccessToken: !!creds?.accessToken,
      hasRefreshToken: !!creds?.refreshToken,
    };
    if (!creds) {
      return jsonNoStore({ ...base, error: "Chưa khai báo credential Shopee." });
    }

    const client = new ShopeeProductClient(creds);
    const { searchParams } = new URL(req.url);
    const itemId = parseIntSafe(searchParams.get("itemId"));

    // ── Deep diagnose: dump raw cho 1 item ──
    if (itemId) {
      const baseInfoRaw = await client.getItemBaseInfo([itemId]);
      let modelListRaw: unknown = null;
      try {
        modelListRaw = await client.getModelList(itemId);
      } catch (e) {
        modelListRaw = { error: String(e) };
      }
      return jsonNoStore({ ...base, itemId, baseInfoRaw, modelListRaw });
    }

    // ── Nhanh: category + item list ──
    let categoryTest: Record<string, unknown>;
    try {
      const cats = await client.getCategories("VN");
      categoryTest = { ok: true, count: cats.length };
    } catch (err) {
      const e = err as { code?: string; message?: string };
      categoryTest = { ok: false, code: e?.code ?? null, message: e?.message ?? String(err) };
    }

    let itemTest: Record<string, unknown>;
    try {
      const resp = await client.getItemList(0, 5);
      const list = (resp?.item ?? []) as unknown[];
      itemTest = { ok: true, count: list.length, total: resp?.total_count ?? null };
    } catch (err) {
      const e = err as { code?: string; message?: string };
      itemTest = { ok: false, code: e?.code ?? null, message: e?.message ?? String(err) };
    }

    return jsonNoStore({ ...base, categoryTest, itemTest });
  } catch (err) {
    return errorResponse(err);
  }
}