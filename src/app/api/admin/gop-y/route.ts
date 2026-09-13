import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/shopee/admin";
import { errorResponse, jsonNoStore, requireAdmin } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";

/**
 * Nhận "Góp ý cho Claude" từ ô nổi trên khu /admin — A Khoa mentor ngay trên màn
 * đang xem, Claude đọc bảng `public.sim_gop_y` (qua `supabase db query --linked`
 * hoặc scripts/gop-y.mjs) rồi sửa mã. Cùng lối với koi_gop_y bên KOI.
 *
 * Hàng rào y hệt khu quản trị: requireAdmin xác thực Bearer token Supabase +
 * profiles.is_admin. Qua cửa rồi mới chèn bằng service role (bỏ qua RLS — bảng
 * bật RLS, không policy nào, nên khoá anon lộ ở trình duyệt không ghi được gì).
 */

const NOI_DUNG_MAX = 4000;
const DUONG_DAN_MAX = 500;
const TIEU_DE_MAX = 300;
const PHIEN_BAN_MAX = 40;

export async function POST(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const body = (await req.json().catch(() => null)) as {
      noiDung?: unknown;
      duongDan?: unknown;
      tieuDe?: unknown;
      phienBan?: unknown;
    } | null;

    const noiDung = typeof body?.noiDung === "string" ? body.noiDung.trim() : "";
    if (!noiDung) return jsonNoStore({ error: "Chưa gõ gì cả." }, 400);
    if (noiDung.length > NOI_DUNG_MAX) {
      return jsonNoStore({ error: `Góp ý dài quá ${NOI_DUNG_MAX} ký tự.` }, 400);
    }

    const str = (v: unknown, max: number): string =>
      (typeof v === "string" ? v : "").slice(0, max);

    const db = createAdminClient();
    const { error } = await db.from("sim_gop_y").insert({
      nguoi: (gate.user.email || "A Khoa").slice(0, 100),
      duong_dan: str(body?.duongDan, DUONG_DAN_MAX),
      tieu_de: str(body?.tieuDe, TIEU_DE_MAX),
      phien_ban: str(body?.phienBan, PHIEN_BAN_MAX),
      noi_dung: noiDung,
    });
    if (error) throw new Error(`Không lưu được góp ý: ${error.message}`);

    return jsonNoStore({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
