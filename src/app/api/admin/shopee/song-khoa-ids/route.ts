import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/shopee/admin";
import { errorResponse, jsonNoStore, requireAdmin } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Trả về DANH SÁCH SỐ (raw_digits) thuộc kho "Song Khoa" và còn hàng.
 *
 * Shopee chỉ bán SIM của kho Song Khoa, nhưng màn "Chọn lô" đọc từ Google Sheet
 * (không có cột kho). Endpoint này đọc thẳng bảng `sims` (đã có cột `kho`) để
 * client lọc danh sách chỉ còn số Song Khoa. Khớp kho theo ILIKE '%song khoa%'
 * nên không lệ thuộc cách viết hoa/thường của tên kho.
 *
 * GET /api/admin/shopee/song-khoa-ids  →  { digits: string[], count }
 */
export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const db = createAdminClient();
    const digits: string[] = [];
    const PAGE = 1000;

    // PostgREST giới hạn số dòng/response → phải phân trang bằng range() để lấy hết.
    for (let from = 0; from <= 100000; from += PAGE) {
      const { data, error } = await db
        .from("sims")
        .select("raw_digits")
        .eq("status", "available")
        .ilike("kho", "%song khoa%")
        .range(from, from + PAGE - 1);
      if (error) throw new Error(`Không đọc được kho Song Khoa: ${error.message}`);
      const rows = (data ?? []) as { raw_digits: string | null }[];
      for (const r of rows) if (r.raw_digits) digits.push(r.raw_digits);
      if (rows.length < PAGE) break;
    }

    return jsonNoStore({ digits, count: digits.length });
  } catch (err) {
    return errorResponse(err);
  }
}
