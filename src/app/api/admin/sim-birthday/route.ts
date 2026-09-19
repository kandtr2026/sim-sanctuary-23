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

// A Khoa đã bỏ `mmyy`, `yyyy`, `giua6` (17/09): quá loãng hoặc không ghép được số
// nào. Còn lại ba kịch bản khách nhìn phát nhận ra ngày sinh mình.
const KICH_BAN = new Set(["ddmmyy", "yymmdd", "ddmm"]);

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

    if (view === "tu-trung") {
      // Khách đang dùng số có đuôi là chính ngày sinh của mình (#41). Không dùng
      // bộ lọc kịch bản — chỉ so khớp ngay trên số của khách (view đã bỏ 0121).
      const { data, error } = await db.rpc("sim_birthday_khach_tu_trung", {
        p_limit: Math.min(Math.max(Number(sp.get("limit")) || 100, 1), 1000),
        p_offset: Math.max(Number(sp.get("offset")) || 0, 0),
      });
      if (error) throw new Error(error.message);
      return jsonNoStore({ rows: data ?? [] });
    }

    if (view === "khach-loc") {
      // Khách theo trạng thái Zalo cho màn 1 (chưa lọc) / màn 2 (có Zalo) (#55,#56).
      const locTt = sp.get("loc_tt") === "co_zalo" ? "co_zalo" : "chua";
      const { data, error } = await db.rpc("sim_birthday_khach_loc", {
        p_kich_ban: docKichBan(sp),
        ...boLoc,
        p_loc_tt: locTt,
        p_limit: Math.min(Math.max(Number(sp.get("limit")) || 100, 1), 500),
        p_offset: Math.max(Number(sp.get("offset")) || 0, 0),
      });
      if (error) throw new Error(error.message);
      return jsonNoStore({ rows: data ?? [] });
    }

    if (view === "trung-kho") {
      // Khách có 6 số đuôi SĐT trùng đúng số trong kho chonso (cả kho sinh nhật
      // lẫn kho web). Lọc lô theo nguong_lo như các view khác.
      const { data, error } = await db.rpc("sim_birthday_khach_trung_kho", {
        p_nguong_lo: boLoc.p_nguong_lo,
        p_limit: Math.min(Math.max(Number(sp.get("limit")) || 100, 1), 500),
        p_offset: Math.max(Number(sp.get("offset")) || 0, 0),
      });
      if (error) throw new Error(error.message);
      return jsonNoStore({ rows: data ?? [] });
    }

    if (view === "kho-khop") {
      // Đối chiếu đuôi (ngày sinh theo kịch bản) của khách với KHO WEB đang bán
      // (`public.sims`, ~50k số) — chỉ số còn `available` + có giá (góp ý #50).
      // Trả về các số THẬT, bán được, đuôi trùng để nhét vào tin cho Sale copy.
      // ⚠️ Đây là ĐỌC tra cứu một chiều từ kho bán sang, KHÔNG trộn dữ liệu dự án
      // sinh nhật ngược vào kho bán (ranh giới dự án vẫn giữ).
      const duoi = [
        ...new Set(
          (sp.get("duoi") ?? "")
            .split(",")
            .map((s) => s.trim())
            .filter((s) => /^\d{4,6}$/.test(s)),
        ),
      ].slice(0, 150);
      if (duoi.length === 0) return jsonNoStore({ khop: {} });

      // Đuôi trong CÙNG một lần gọi luôn cùng độ dài (client gửi theo 1 kịch bản),
      // nên mỗi số kho web khớp đúng một đuôi — endsWith là đủ. Gom theo lô để
      // chuỗi `or=(...)` không quá dài; mỗi đuôi giữ tối đa 6 số rẻ nhất.
      const CHUNK = 40;
      const PER_DUOI = 6;
      const khop: Record<string, string[]> = {};
      for (let i = 0; i < duoi.length; i += CHUNK) {
        const lot = duoi.slice(i, i + CHUNK);
        const { data, error } = await db
          .from("sims")
          .select("raw_digits,effective_price")
          .eq("status", "available")
          .gt("effective_price", 0)
          .or(lot.map((d) => `raw_digits.like.*${d}`).join(","))
          .order("effective_price", { ascending: true })
          .limit(2000);
        if (error) throw new Error(error.message);
        for (const row of (data ?? []) as { raw_digits: string }[]) {
          const rd = row.raw_digits;
          const hit = lot.find((d) => rd.endsWith(d));
          if (!hit) continue;
          const arr = (khop[hit] ??= []);
          if (arr.length < PER_DUOI && !arr.includes(rd)) arr.push(rd);
        }
      }
      return jsonNoStore({ khop });
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
