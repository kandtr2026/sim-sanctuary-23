import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/shopee/admin";
import { errorResponse, jsonNoStore, requireAdmin } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Danh sách kho + tập số (raw_digits còn hàng) của 1 kho — cho dropdown "Kho nguồn".
 *
 * Màn "Chọn lô" đọc từ Google Sheet (không có cột kho). Endpoint này đọc thẳng
 * bảng `sims` (có cột `kho`) để client (1) đổ dropdown chọn kho và (2) lọc danh
 * sách chỉ còn số của kho đang chọn.
 *
 * - Không có ?kho: quét 1 lượt toàn kho → trả khoList + tự chọn kho khớp "song khoa"
 *   (Shopee bán kho này) + digits của kho đó.
 * - Có ?kho=<tên chính xác>: chỉ trả digits của kho đó (khoList rỗng, client giữ list cũ).
 *
 * GET /api/admin/shopee/song-khoa-ids[?kho=...] → { khoList, selectedKho, digits, count }
 */
export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const { searchParams } = new URL(req.url);
    const khoParam = (searchParams.get("kho") ?? "").trim();
    const db = createAdminClient();
    const PAGE = 1000;

    // ── Có chỉ định kho: chỉ lấy digits của kho đó (khỏi quét toàn bảng) ──
    if (khoParam) {
      const digits: string[] = [];
      for (let from = 0; from <= 100000; from += PAGE) {
        const { data, error } = await db
          .from("sims")
          .select("raw_digits")
          .eq("status", "available")
          .eq("kho", khoParam)
          .range(from, from + PAGE - 1);
        if (error) throw new Error(`Không đọc được kho ${khoParam}: ${error.message}`);
        const rows = (data ?? []) as { raw_digits: string | null }[];
        for (const r of rows) if (r.raw_digits) digits.push(r.raw_digits);
        if (rows.length < PAGE) break;
      }
      return jsonNoStore({ khoList: [], selectedKho: khoParam, digits, count: digits.length });
    }

    // ── Không chỉ định: quét 1 lượt, gom digits theo từng kho ──
    const byKho = new Map<string, string[]>();
    for (let from = 0; from <= 100000; from += PAGE) {
      const { data, error } = await db
        .from("sims")
        .select("kho, raw_digits")
        .eq("status", "available")
        .not("kho", "is", null)
        .range(from, from + PAGE - 1);
      if (error) throw new Error(`Không đọc được kho: ${error.message}`);
      const rows = (data ?? []) as { kho: string | null; raw_digits: string | null }[];
      for (const r of rows) {
        if (!r.kho || !r.raw_digits) continue;
        let arr = byKho.get(r.kho);
        if (!arr) {
          arr = [];
          byKho.set(r.kho, arr);
        }
        arr.push(r.raw_digits);
      }
      if (rows.length < PAGE) break;
    }

    const khoList = Array.from(byKho.keys()).sort();
    // Mặc định chọn kho khớp "song khoa"; không có thì kho đầu tiên.
    const selectedKho = khoList.find((k) => /song\s*khoa/i.test(k)) ?? khoList[0] ?? "";
    const digits = selectedKho ? (byKho.get(selectedKho) ?? []) : [];

    return jsonNoStore({ khoList, selectedKho, digits, count: digits.length });
  } catch (err) {
    return errorResponse(err);
  }
}
