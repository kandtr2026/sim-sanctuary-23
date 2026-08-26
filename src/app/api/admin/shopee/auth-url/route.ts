import type { NextRequest } from "next/server";
import { buildAuthUrl } from "@/lib/shopee/credentials";
import { errorResponse, jsonNoStore, requireAdmin } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";

/**
 * Link uỷ quyền để chủ shop bấm đồng ý.
 *
 * `redirect` KHÔNG nhận URL từ client: nếu để client truyền vào thì đây thành
 * open redirect và `code` của Shopee có thể bị đẩy sang domain lạ — ai giữ được
 * code đó là chiếm được quyền đọc dữ liệu shop.
 *
 * URL luôn suy từ header host của request.
 */
export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const h = req.headers;
    const proto = (h.get("x-forwarded-proto") || "https").split(",")[0].trim();
    const host = (h.get("x-forwarded-host") || h.get("host") || "")
      .split(",")[0]
      .trim();
    if (!host) {
      return jsonNoStore({ error: "Không xác định được domain để làm redirect URL." }, 400);
    }
    const redirect = `${proto}://${host}/admin/shopee/callback`;

    const url = await buildAuthUrl(redirect);
    return jsonNoStore({ url, redirect });
  } catch (err) {
    return errorResponse(err);
  }
}