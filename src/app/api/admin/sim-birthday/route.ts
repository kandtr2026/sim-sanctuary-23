import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/shopee/admin";
import { errorResponse, jsonNoStore, requireAdmin } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";

/**
 * Dự án "Sim Birthday" — ghép khách có ngày sinh với sim mang đúng ngày sinh đó.
 *
 * ⚠️ Dự án RIÊNG chạy song song: hai bảng `sim_birthday_*` không dính gì tới
 * `sims` (kho đang bán trên web) và không được merge vào đó cho tới khi A Khoa
 * lệnh. Mọi phép đếm ở đây chỉ chạy trong phạm vi hai bảng đó.
 *
 * Toàn bộ phép ghép nằm trong SQL (xem migration 20260917130000) nên mỗi lần đổi
 * bộ lọc chỉ là một RPC trả về vài KB JSON — Supabase chonso đang sát quota nên
 * không kéo cả bảng về client.
 */

const KICH_BAN = new Set(["ddmmyy", "yymmdd", "giua6", "ddmm", "mmyy", "yyyy"]);

interface BoLoc {
  p_nguong_lo: number;
  p_nam_tu: number;
  p_nam_den: number;
  p_bo_0101: boolean;
  p_dau_so: string[];
}

function docBoLoc(sp: URLSearchParams): BoLoc {
  const so = (key: string, mac_dinh: number): number => {
    const v = Number(sp.get(key));
    return Number.isFinite(v) ? Math.trunc(v) : mac_dinh;
  };
  const dauSo = (sp.get("dau_so") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter((s) => /^\d{3}$/.test(s));

  const namTu = Math.min(Math.max(so("nam_tu", 1950), 1900), 2100);
  const namDen = Math.min(Math.max(so("nam_den", 2015), namTu), 2100);

  return {
    p_nguong_lo: Math.max(0, so("nguong_lo", 1000)),
    p_nam_tu: namTu,
    p_nam_den: namDen,
    p_bo_0101: sp.get("bo_0101") === "1",
    p_dau_so: dauSo,
  };
}

function docKichBan(sp: URLSearchParams): string {
  const kb = sp.get("kich_ban") ?? "ddmmyy";
  return KICH_BAN.has(kb) ? kb : "ddmmyy";
}

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const sp = new URL(req.url).searchParams;
    const boLoc = docBoLoc(sp);
    const db = createAdminClient();
    const view = sp.get("view") ?? "thong-ke";

    if (view === "top-sim") {
      const { data, error } = await db.rpc("sim_birthday_top_sim", {
        p_kich_ban: docKichBan(sp),
        ...boLoc,
        p_limit: Math.min(Math.max(Number(sp.get("limit")) || 50, 1), 500),
      });
      if (error) throw new Error(error.message);
      return jsonNoStore({ rows: data ?? [] });
    }

    if (view === "khach") {
      const { data, error } = await db.rpc("sim_birthday_khach_theo_kich_ban", {
        p_kich_ban: docKichBan(sp),
        ...boLoc,
        p_limit: Math.min(Math.max(Number(sp.get("limit")) || 50, 1), 500),
        p_offset: Math.max(Number(sp.get("offset")) || 0, 0),
        // Ô xem trước lấy mỗi ngày sinh một người: xếp thuần theo "số sim khớp"
        // thì cả bảng toàn người sinh cùng một ngày, nhìn không ra độ phủ.
        p_moi_ngay_mot_khach: sp.get("moi_ngay") === "1",
      });
      if (error) throw new Error(error.message);
      return jsonNoStore({ rows: data ?? [] });
    }

    const { data, error } = await db.rpc("sim_birthday_thong_ke", boLoc);
    if (error) throw new Error(error.message);
    return jsonNoStore(data ?? {});
  } catch (err) {
    return errorResponse(err);
  }
}
