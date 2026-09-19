import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/shopee/admin";
import { errorResponse, jsonNoStore, requireAdmin } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";

/**
 * Bảng Kanban theo dõi khách Sim Birthday (#54).
 *   GET    ?limit&offset → khách đã có tác động (mọi mốc + kết quả), xếp mới nhất.
 *   POST   { msisdn, ket_qua } → đặt kết quả (level 3).
 *   DELETE { msisdn }          → xoá kết quả (kéo về level 2).
 */

const chuanMsisdn = (v: unknown): string => String(v ?? "").replace(/\s+/g, "").trim();

// Kết quả cho phép — chốt danh sách để tránh dữ liệu rác; A Khoa muốn đổi thì mở thêm.
const KET_QUA = new Set(["Quan tâm", "Đã chốt", "Từ chối", "Hẹn lại"]);

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;
  try {
    const sp = new URL(req.url).searchParams;
    const db = createAdminClient();
    const { data, error } = await db.rpc("sim_birthday_kanban", {
      p_limit: Math.min(Math.max(Number(sp.get("limit")) || 200, 1), 500),
      p_offset: Math.max(Number(sp.get("offset")) || 0, 0),
    });
    if (error) throw new Error(error.message);
    return jsonNoStore({ rows: data ?? [] });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;
  try {
    const body = (await req.json().catch(() => ({}))) as { msisdn?: string; ket_qua?: string };
    const msisdn = chuanMsisdn(body.msisdn);
    const ketQua = String(body.ket_qua ?? "").trim();
    if (!msisdn || !KET_QUA.has(ketQua)) return jsonNoStore({ error: "Thiếu msisdn / kết quả không hợp lệ" }, 400);
    const db = createAdminClient();
    const nowIso = new Date().toISOString();
    const { data, error } = await db
      .from("sim_birthday_ket_qua")
      .upsert({ msisdn, ket_qua: ketQua, created_by: gate.user.email, created_at: nowIso }, { onConflict: "msisdn" })
      .select("msisdn,ket_qua,created_at,created_by")
      .single();
    if (error) throw new Error(error.message);
    return jsonNoStore({
      ok: true,
      msisdn,
      ket_qua: ketQua,
      created_at: data?.created_at ?? nowIso,
      created_by: data?.created_by ?? gate.user.email,
    });
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
    const { error } = await db.from("sim_birthday_ket_qua").delete().eq("msisdn", msisdn);
    if (error) throw new Error(error.message);
    return jsonNoStore({ ok: true, msisdn });
  } catch (err) {
    return errorResponse(err);
  }
}
