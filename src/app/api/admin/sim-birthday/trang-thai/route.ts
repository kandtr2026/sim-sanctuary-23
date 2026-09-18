import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/shopee/admin";
import { errorResponse, jsonNoStore, requireAdmin } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";

/**
 * Trạng thái khách của dự án Sim Birthday (#43 Ko Zalo, #46 Đã gửi) — gom về một
 * route theo `loai`:
 *   GET    ?loai=ko_zalo|da_gui → danh sách msisdn đã gắn.
 *   POST   { msisdn, loai }     → gắn.
 *   DELETE { msisdn, loai }     → bỏ.
 */

const BANG: Record<string, string> = {
  ko_zalo: "sim_birthday_ko_zalo",
  da_gui: "sim_birthday_da_gui",
};

const chuanMsisdn = (v: unknown): string => String(v ?? "").replace(/\s+/g, "").trim();
const bangCua = (loai: unknown): string | null => BANG[String(loai ?? "")] ?? null;

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;
  try {
    const bang = bangCua(new URL(req.url).searchParams.get("loai"));
    if (!bang) return jsonNoStore({ error: "loai không hợp lệ" }, 400);
    const db = createAdminClient();
    const { data, error } = await db.from(bang).select("msisdn");
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
    const body = (await req.json().catch(() => ({}))) as { msisdn?: string; loai?: string };
    const bang = bangCua(body.loai);
    const msisdn = chuanMsisdn(body.msisdn);
    if (!bang || !msisdn) return jsonNoStore({ error: "Thiếu msisdn / loai" }, 400);
    const db = createAdminClient();
    const { error } = await db.from(bang).upsert({ msisdn, created_by: gate.user.email }, { onConflict: "msisdn" });
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
    const body = (await req.json().catch(() => ({}))) as { msisdn?: string; loai?: string };
    const bang = bangCua(body.loai);
    const msisdn = chuanMsisdn(body.msisdn);
    if (!bang || !msisdn) return jsonNoStore({ error: "Thiếu msisdn / loai" }, 400);
    const db = createAdminClient();
    const { error } = await db.from(bang).delete().eq("msisdn", msisdn);
    if (error) throw new Error(error.message);
    return jsonNoStore({ ok: true, msisdn });
  } catch (err) {
    return errorResponse(err);
  }
}
