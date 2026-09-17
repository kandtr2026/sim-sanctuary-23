import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/shopee/admin";
import { errorResponse, requireAdmin } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";

/**
 * Xuất CSV danh sách khách nên chào theo kịch bản đang chọn (dự án Sim Birthday).
 *
 * BOM UTF-8 ở đầu file để Excel trên Windows không đọc tiếng Việt thành ký tự lạ
 * — cùng lối với các chỗ xuất CSV khác trong repo.
 */

const KICH_BAN: Record<string, string> = {
  ddmmyy: "trung-tron-ngay-sinh",
  yymmdd: "trung-tron-ngay-sinh-nguoc",
  giua6: "ngay-sinh-giua-day",
  ddmm: "trung-ngay-thang",
  mmyy: "trung-thang-nam",
  yyyy: "trung-nam-sinh",
};

const MAX_DONG = 200000;

const TIEU_DE = ["SĐT khách", "Ngày sinh", "Số sim khớp", "Sim gợi ý"];

export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const sp = new URL(req.url).searchParams;
    const kbRaw = sp.get("kich_ban") ?? "ddmmyy";
    const kichBan = kbRaw in KICH_BAN ? kbRaw : "ddmmyy";

    const so = (key: string, macDinh: number): number => {
      const v = Number(sp.get(key));
      return Number.isFinite(v) ? Math.trunc(v) : macDinh;
    };
    const namTu = Math.min(Math.max(so("nam_tu", 1950), 1900), 2100);
    const namDen = Math.min(Math.max(so("nam_den", 2015), namTu), 2100);

    const db = createAdminClient();
    // Hàm trả nguyên khối CSV trong MỘT giá trị text — nếu trả nhiều hàng thì
    // PostgREST cắt ở 1000 dòng và file tải về thiếu gần hết mà không báo gì.
    const { data, error } = await db.rpc("sim_birthday_xuat_csv", {
      p_kich_ban: kichBan,
      p_nguong_lo: Math.max(0, so("nguong_lo", 1000)),
      p_nam_tu: namTu,
      p_nam_den: namDen,
      p_bo_0101: sp.get("bo_0101") === "1",
      p_dau_so: (sp.get("dau_so") ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter((s) => /^\d{3}$/.test(s)),
      p_limit: MAX_DONG,
    });
    if (error) throw new Error(error.message);

    const than = typeof data === "string" ? data : "";
    const rows = than ? than.split("\n").length : 0;

    const ten = `sim-birthday_${KICH_BAN[kichBan]}_${new Date().toISOString().slice(0, 10)}.csv`;
    return new Response("﻿" + [TIEU_DE.join(","), than].filter(Boolean).join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${ten}"`,
        "X-Row-Count": String(rows),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
