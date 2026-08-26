import type { NextRequest } from "next/server";
import { status } from "@/lib/shopee/credentials";
import { getSettings } from "@/lib/shopee/credentials";
import { listSyncedItems } from "@/lib/shopee/sync";
import { errorResponse, jsonNoStore, requireAdmin } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const [cred, settings, items] = await Promise.all([
      status(),
      getSettings(),
      listSyncedItems(),
    ]);
    return jsonNoStore({
      cred,
      settings,
      items,
      itemCounts: {
        total: items.length,
        live: items.filter((i: { status?: string }) => i.status === "live").length,
        failed: items.filter((i: { status?: string }) => i.status === "failed").length,
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
