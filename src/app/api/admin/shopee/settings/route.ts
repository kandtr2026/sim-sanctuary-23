import type { NextRequest } from "next/server";
import { getSettings, saveSettings } from "@/lib/shopee/credentials";
import { errorResponse, jsonNoStore, parseIntSafe, requireAdmin } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    return jsonNoStore({ settings: await getSettings() });
  } catch (err) {
    return errorResponse(err);
  }
}

/** Lưu category_id / image_url / logistic_id cho việc đăng bán. */
export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return jsonNoStore({ error: "Body không hợp lệ" }, 400);

    const patch: Record<string, unknown> = {};
    if ("categoryId" in body) patch.categoryId = parseIntSafe(body.categoryId);
    if ("imageUrl" in body) patch.imageUrl = String(body.imageUrl || "").trim();
    if ("logisticId" in body) patch.logisticId = parseIntSafe(body.logisticId);

    const settings = await saveSettings(patch);
    return jsonNoStore({ settings });
  } catch (err) {
    return errorResponse(err);
  }
}
