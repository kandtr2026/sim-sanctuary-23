import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/shopee/admin";
import { errorResponse, jsonNoStore, requireAdmin } from "@/lib/shopee/http";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PAGE = 1000;
const CONCURRENCY = 10;

type Db = ReturnType<typeof createAdminClient>;

/** Đếm số dòng khớp điều kiện (để biết cần bao nhiêu trang). */
async function countRows(db: Db, kho?: string): Promise<number> {
  let q = db.from("sims").select("*", { count: "exact", head: true }).eq("status", "available");
  q = kho ? q.eq("kho", kho) : q.not("kho", "is", null);
  const { count, error } = await q;
  if (error) throw new Error(`Không đếm được kho: ${error.message}`);
  return count ?? 0;
}

/**
 * Lấy các cột cần thiết của toàn bộ trang — GỌI SONG SONG theo lô (thay vì nối
 * đuôi 51 lượt) để không mất cả phút. Trả về mảng row thô.
 */
async function fetchAllParallel(
  db: Db,
  columns: string,
  total: number,
  kho?: string,
): Promise<Record<string, unknown>[]> {
  const pages = Math.ceil(total / PAGE);
  const out: Record<string, unknown>[] = [];
  for (let i = 0; i < pages; i += CONCURRENCY) {
    const batch: PromiseLike<{ data: unknown; error: unknown }>[] = [];
    for (let p = i; p < Math.min(i + CONCURRENCY, pages); p++) {
      let q = db.from("sims").select(columns).eq("status", "available");
      q = kho ? q.eq("kho", kho) : q.not("kho", "is", null);
      batch.push(q.range(p * PAGE, p * PAGE + PAGE - 1));
    }
    const results = await Promise.all(batch);
    for (const r of results) {
      if (r.error) throw new Error(`Không đọc được kho: ${String((r.error as { message?: string })?.message ?? r.error)}`);
      for (const row of (r.data ?? []) as Record<string, unknown>[]) out.push(row);
    }
  }
  return out;
}

/**
 * Danh sách kho + tập số (raw_digits còn hàng) của 1 kho — cho dropdown "Kho nguồn".
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

    // ── Có chỉ định kho: chỉ lấy digits của kho đó (song song) ──
    if (khoParam) {
      const total = await countRows(db, khoParam);
      const rows = await fetchAllParallel(db, "raw_digits", total, khoParam);
      const digits = rows.map((r) => String(r.raw_digits ?? "")).filter(Boolean);
      return jsonNoStore({ khoList: [], selectedKho: khoParam, digits, count: digits.length });
    }

    // ── Không chỉ định: quét song song (kho, raw_digits), gom theo kho ──
    const total = await countRows(db);
    const rows = await fetchAllParallel(db, "kho, raw_digits", total);
    const byKho = new Map<string, string[]>();
    for (const r of rows) {
      const kho = String(r.kho ?? "");
      const d = String(r.raw_digits ?? "");
      if (!kho || !d) continue;
      let arr = byKho.get(kho);
      if (!arr) {
        arr = [];
        byKho.set(kho, arr);
      }
      arr.push(d);
    }

    const khoList = Array.from(byKho.keys()).sort();
    const selectedKho = khoList.find((k) => /song\s*khoa/i.test(k)) ?? khoList[0] ?? "";
    const digits = selectedKho ? (byKho.get(selectedKho) ?? []) : [];

    return jsonNoStore({ khoList, selectedKho, digits, count: digits.length });
  } catch (err) {
    return errorResponse(err);
  }
}
