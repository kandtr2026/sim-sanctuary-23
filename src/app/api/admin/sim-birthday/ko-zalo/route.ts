import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/shopee/admin";
import { errorResponse, jsonNoStore, requireAdmin } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";

/**
 * Cờ "số không có Zalo" cho dự án Sim Birthday (#43).
 * GET    → danh sách msisdn đã gắn cờ (để màn đánh dấu).
 * POST   { msisdn } → gắn cờ.
 * DELETE { msisdn } → bỏ cờ.
 */

const chuanMsisdn = (v: unknown): string => String(v ?? "").replace(/\s+/g, "").trim();

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;
  try {
    const db = createAdminClient();
    const { data, error } = await db.from("sim_birthday_ko_zalo").select("msisdn");
    if (error) throw new Error(error.message);
    return jsonNoStore({ rows: (data ?? []).map((r: { msisdn: string }) => r.msisdn) });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;
  try {
    const body = (await req.json().catch(() => ({}))) as { msisdn?: string };
    const msisdn = chuanMsisdn(body.msisdn);
    if (!msisdn) return jsonNoStore({ error: "Thiếu msisdn" }, 400);
    const db = createAdminClient();
    const { error } = await db
      .from("sim_birthday_ko_zalo")
      .upsert({ msisdn, created_by: gate.user.email }, { onConflict: "msisdn" });
    if (error) throw new Error(error.message);
    return jsonNoStore({ ok: true, msisdn });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;
  try {
    const body = (await req.json().catch(() => ({}))) as { msisdn?: string };
    const msisdn = chuanMsisdn(body.msisdn);
    if (!msisdn) return jsonNoStore({ error: "Thiếu msisdn" }, 400);
    const db = createAdminClient();
    const { error } = await db.from("sim_birthday_ko_zalo").delete().eq("msisdn", msisdn);
    if (error) throw new Error(error.message);
    return jsonNoStore({ ok: true, msisdn });
  } catch (err) {
    return errorResponse(err);
  }
}
