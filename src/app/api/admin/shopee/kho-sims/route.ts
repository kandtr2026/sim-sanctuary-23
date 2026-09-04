import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/shopee/admin";
import { errorResponse, jsonNoStore, parseIntSafe, requireAdmin } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";

/**
 * Danh sách SIM có sẵn của Sheet tổng (bảng sims), lọc theo Kho + mạng + giá.
 *
 * GET /api/admin/shopee/kho-sims?kho=KHO%20SONG%20KHOA&search=*678&network=Mobifone&priceMax=5000000
 * Trả { sims: [{id, rawDigits, displayNumber, price, network, kho}] }
 */
export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const { searchParams } = new URL(req.url);
    const kho = searchParams.get("kho");
    const search = searchParams.get("search") ?? "";
    const network = searchParams.get("network");
    const priceMax = parseIntSafe(searchParams.get("priceMax"));

    const db = createAdminClient();
    let query = db
      .from("sims")
      .select("id, raw_digits, display_number, effective_price, network, kho, status")
      .eq("status", "available")
      .order("effective_price", { ascending: true })
      .limit(200);

    if (kho) query = query.eq("kho", kho);

    // Network nếu có
    if (network && network !== "all") query = query.eq("network", network);

    const { data, error } = await query;
    if (error) throw new Error(`Không đọc được kho sims: ${error.message}`);

    // Lọc theo search wildcard (phía client cũng có thể, nhưng lọc bên đây cho gọn)
    const rows = (data ?? []) as {
      id: string;
      raw_digits: string;
      display_number: string;
      effective_price: number;
      network: string | null;
      kho: string | null;
    }[];

    const searchNorm = search.trim().replace(/[^0-9*]/g, "");
    const digits = searchNorm.replace(/\*/g, "");
    const khop = (raw: string): boolean => {
      if (!digits) return true;
      const d = raw.replace(/\D/g, "").padStart(10, "0").slice(-10);
      if (digits.length === 10 && !searchNorm.includes("*")) return d === digits;
      if (searchNorm.includes("*")) {
        const s = searchNorm.startsWith("*");
        const e = searchNorm.endsWith("*");
        const parts = searchNorm.split("*").filter(Boolean);
        if (e && !s && parts.length >= 1) return d.startsWith(parts[0]);
        if (s && !e && parts.length >= 1) return d.endsWith(parts[parts.length - 1]);
        if (!s && !e && parts.length === 2) return d.startsWith(parts[0]) && d.endsWith(parts[1]);
        if (digits.length >= 2) return d.includes(digits);
        return true;
      }
      return d.includes(digits);
    };

    const sims = rows
      .filter((r) => {
        if (priceMax && r.effective_price > priceMax) return false;
        if (!khop(r.raw_digits)) return false;
        return r.effective_price > 0;
      })
      .slice(0, 100)
      .map((r) => ({
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