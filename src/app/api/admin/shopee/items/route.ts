import type { NextRequest } from "next/server";
import { listSyncedItems } from "@/lib/shopee/sync";
import { errorResponse, jsonNoStore, requireAdmin } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    return jsonNoStore({ items: await listSyncedItems() });
  } catch (err) {
    return errorResponse(err);
  }
}