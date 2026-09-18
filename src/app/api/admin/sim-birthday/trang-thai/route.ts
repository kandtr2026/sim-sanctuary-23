import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/shopee/admin";
import { errorResponse, jsonNoStore, requireAdmin } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";

/**
 * Trạng thái check Zalo của khách Sim Birthday (#47) — 3 trạng thái: chưa check /
 * co_zalo (Zalo OK) / ko_zalo (Ko có Zalo). Gom về một route theo `loai`:
 *   GET    ?loai=ko_zalo|co_zalo → danh sách msisdn đã gắn cờ đó.
 *   POST   { msisdn, loai }      → gắn.
 *   DELETE { msisdn, loai }      → bỏ.
 */

const BANG: Record<string, string> = {
  ko_zalo: "sim_birthday_ko_zalo",
  co_zalo: "sim_birthday_co_zalo",
  da_mo: "sim_birthday_da_mo", // đã bấm Mở Zalo (đã tiếp xúc) — cờ độc lập (#52)
  da_nhan: "sim_birthday_da_nhan", // đã GỬI tin Zalo — log giờ + user bấm (#53)
};

const chuanMsisdn = (v: unknown): string => String(v ?? "").replace(/\s+/g, "").trim();
const bangCua = (loai: unknown): string | null => BANG[String(loai ?? "")] ?? null;

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;
  try {
    const sp = new URL(req.url).searchParams;
    const bang = bangCua(sp.get("loai"));
    if (!bang) return jsonNoStore({ error: "loai không hợp lệ" }, 400);
    const db = createAdminClient();
    // full=1: trả kèm thời điểm + user đã bấm (mục "đã gửi" #53 cần log).
    if (sp.get("full") === "1") {
      const { data, error } = await db.from(bang).select("msisdn,created_at,created_by");
      if (error) throw new Error(error.message);
      return jsonNoStore({ rows: data ?? [] });
    }
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
    // Ghi kèm thời điểm bấm (now) để mục "đã gửi" log giờ:phút:giây (#53); trả
    // về dòng vừa ghi để client hiện ngay "đã nhắn lúc … bởi …".
    const nowIso = new Date().toISOString();
    const { data, error } = await db
      .from(bang)
      .upsert({ msisdn, created_by: gate.user.email, created_at: nowIso }, { onConflict: "msisdn" })
      .select("msisdn,created_at,created_by")
      .single();
    if (error) throw new Error(error.message);
    return jsonNoStore({
      ok: true,
      msisdn,
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
