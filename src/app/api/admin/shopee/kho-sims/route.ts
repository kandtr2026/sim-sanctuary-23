import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/shopee/admin";
import { errorResponse, jsonNoStore, parseIntSafe, requireAdmin } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";

/**
 * Danh sách SIM có sẵn của Sheet tổng (bảng sims), lọc theo Kho + mạng + giá + tìm.
 *
 * QUAN TRỌNG: mọi điều kiện (kho, network, search, giá) được đẩy XUỐNG SQL
 * (PostgREST) chứ KHÔNG tải 200 dòng rồi lọc ở client — nếu không thì không tìm
 * được số ở giữa/lớn của kho (vd *77777* hoặc số giá 990k chỉ có ở vùng giá cao).
 *
 * GET /api/admin/shopee/kho-sims?kho=KHO%20SONG%20KHOA&search=*77777*&network=Mobifone&priceMin=900000&priceMax=1000000
 */
export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const { searchParams } = new URL(req.url);
    const kho = searchParams.get("kho");
    const network = searchParams.get("network");
    const priceMin = parseIntSafe(searchParams.get("priceMin"));
    const priceMax = parseIntSafe(searchParams.get("priceMax"));
    const searchRaw = (searchParams.get("search") ?? "").trim();

    // ── Parse search wildcard → pattern SQL LIKE (trên raw_digits 10 số) ──
    // Luật giống web chính: *77777* = chứa, *678 = đuôi, 090* = đầu, 090*6666 = đầu+đuôi,
    // 10 số = chính xác, gõ trần = chứa.
    const searchNorm = searchRaw.replace(/[^0-9*]/g, "");
    const digits = searchNorm.replace(/\*/g, "");
    let likePattern: string | null = null;
    let exactDigits: string | null = null;

    if (digits) {
      if (digits.length === 10 && !searchNorm.includes("*")) {
        exactDigits = digits;
      } else if (searchNorm.includes("*")) {
        const s = searchNorm.startsWith("*");
        const e = searchNorm.endsWith("*");
        const parts = searchNorm.split("*").filter(Boolean);
        if (e && !s && parts.length >= 1) likePattern = `${parts[0]}%`; // 090* → đầu 090
        else if (s && !e && parts.length >= 1) likePattern = `%${parts[parts.length - 1]}`; // *678 → đuôi 678
        else if (!s && !e && parts.length === 2) likePattern = `${parts[0]}%${parts[1]}`; // 090*6666
        else likePattern = `%${digits}%`; // *77777* → chứa
      } else {
        likePattern = `%${digits}%`; // gõ trần → chứa
      }
    }

    const db = createAdminClient();

    // ── Truy vấn chính: đẩy hết điều kiện xuống PostgREST ──
    let query = db
      .from("sims")
      .select("id, raw_digits, display_number, effective_price, network, kho, status")
      .eq("status", "available")
      .gt("effective_price", 0)
      .order("effective_price", { ascending: true })
      .limit(200);

    if (kho && kho !== "all") query = query.eq("kho", kho);
    if (network && network !== "all") query = query.eq("network", network);
    if (priceMin) query = query.gte("effective_price", priceMin);
    if (priceMax) query = query.lte("effective_price", priceMax);
    if (exactDigits) query = query.eq("raw_digits", exactDigits);
    else if (likePattern) query = query.like("raw_digits", likePattern);

    const { data, error } = await query;
    if (error) throw new Error(`Không đọc được kho sims: ${error.message}`);

    const sims = ((data ?? []) as {
      id: string;
      raw_digits: string;
      display_number: string;
      effective_price: number;
      network: string | null;
      kho: string | null;
    }[]).slice(0, 100).map((r) => ({
      id: r.id,
      rawDigits: r.raw_digits,
      displayNumber: r.display_number || r.raw_digits,
      price: r.effective_price || 0,
      network: r.network || "",
      kho: r.kho || "",
    }));

    // Danh sách Kho để đổ menu con (nếu không lọc theo kho)
    let danhSachKho: string[] = [];
    if (!kho) {
      const { data: khoRows } = await db
        .from("sims")
        .select("kho")
        .eq("status", "available")
        .not("kho", "is", null);
      const set = new Set<string>();
      for (const r of (khoRows ?? []) as { kho: string }[]) {
        if (r.kho) set.add(r.kho);
      }
      danhSachKho = Array.from(set).sort();
    }

    return jsonNoStore({ sims, danhSachKho });
  } catch (err) {
    return errorResponse(err);
  }
}