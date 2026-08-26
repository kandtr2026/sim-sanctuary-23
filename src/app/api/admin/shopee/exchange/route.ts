import type { NextRequest } from "next/server";
import { exchangeCode } from "@/lib/shopee/credentials";
import { errorResponse, jsonNoStore, parseIntSafe, requireAdmin } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";

/**
 * Đổi `code` uỷ quyền thành access_token.
 *
 * `code` dùng MỘT LẦN và hết hạn ~10 phút, nên route này phải được gọi ngay khi
 * nhận được code (từ trang callback). Gọi lại với cùng code sẽ bị Shopee từ chối.
 */
export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return jsonNoStore({ error: "Body không hợp lệ" }, 400);

    const code = String(body.code || "").trim();
    if (!code) return jsonNoStore({ error: "Thiếu code uỷ quyền" }, 400);

    const shopId = parseIntSafe(body.shopId);
    const result = await exchangeCode(code, shopId ?? undefined);
    return jsonNoStore(result);
  } catch (err) {
    return errorResponse(err);
  }
}