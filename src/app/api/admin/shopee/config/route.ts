import type { NextRequest } from "next/server";
import { saveConfig, ShopeeConfigError } from "@/lib/shopee/credentials";
import { errorResponse, jsonNoStore, requireAdmin } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";

/**
 * Lưu partner_id / partner_key / shop_id. Đây là route NHẬN BÍ MẬT nên chỉ
 * admin đăng nhập mới gọi được (không có service token nào mở cửa này).
 * Partner key được mã hoá AES-256-GCM trước khi ghi DB — không bao giờ lưu thô.
 */
export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return jsonNoStore({ error: "Body không hợp lệ" }, 400);

    const partnerId = Number(body.partnerId || 0);
    const partnerKey = String(body.partnerKey || "").trim();
    // shop_id có thể chưa biết: để 0, lúc uỷ quyền Shopee trả shop_id thật kèm
    // trong redirect rồi hệ thống tự ghi đè.
    const shopId = Number(body.shopId || 0);
    const env = body.env === "sandbox" ? "sandbox" : "live";

    if (!partnerId || !partnerKey) {
      throw new ShopeeConfigError("Thiếu partner_id hoặc partner_key.");
    }
    if (partnerKey.length < 10) {
      throw new ShopeeConfigError("partner_key trông không hợp lệ (quá ngắn).");
    }

    const result = await saveConfig({
      partnerId,
      partnerKey,
      shopId,
      env,
      updatedBy: gate.user.email,
    });
    return jsonNoStore(result);
  } catch (err) {
    return errorResponse(err);
  }
}
