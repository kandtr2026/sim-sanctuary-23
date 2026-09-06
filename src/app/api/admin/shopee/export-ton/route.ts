import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/shopee/admin";
import { errorResponse, requireAdmin } from "@/lib/shopee/http";
import { buildXlsx, type XlsxCell, type XlsxColumn } from "@/lib/xlsx";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PAGE = 1000;
const CONCURRENCY = 10;

type Db = ReturnType<typeof createAdminClient>;

interface SimRow {
  raw_digits: string | null;
  display_number: string | null;
  effective_price: number | null;
  network: string | null;
  kho: string | null;
  tags: unknown;
}

/** Đếm số SIM còn hàng (status=available, có gán kho) để biết cần bao trang. */
async function countRows(db: Db): Promise<number> {
  const { count, error } = await db
    .from("sims")
    .select("*", { count: "exact", head: true })
    .eq("status", "available")
    .not("kho", "is", null);
  if (error) throw new Error(`Không đếm được kho: ${error.message}`);
  return count ?? 0;
}

/** Lấy toàn bộ dòng — gọi SONG SONG theo lô để không mất cả phút với kho lớn. */
async function fetchAll(db: Db, total: number): Promise<SimRow[]> {
  const pages = Math.ceil(total / PAGE);
  const out: SimRow[] = [];
  for (let i = 0; i < pages; i += CONCURRENCY) {
    const batch: PromiseLike<{ data: unknown; error: unknown }>[] = [];
    for (let p = i; p < Math.min(i + CONCURRENCY, pages); p++) {
      batch.push(
        db
          .from("sims")
          .select("raw_digits, display_number, effective_price, network, kho, tags")
          .eq("status", "available")
          .not("kho", "is", null)
          .order("kho", { ascending: true })
          .order("effective_price", { ascending: true })
          .range(p * PAGE, p * PAGE + PAGE - 1),
      );
    }
    const results = await Promise.all(batch);
    for (const r of results) {
      if (r.error) {
        throw new Error(
          `Không đọc được kho: ${String((r.error as { message?: string })?.message ?? r.error)}`,
        );
      }
      for (const row of (r.data ?? []) as SimRow[]) out.push(row);
    }
  }
  return out;
}

/** tags jsonb → chuỗi "loại số" đọc được. */
function tagsToText(tags: unknown): string {
  if (Array.isArray(tags)) return tags.map((t) => String(t)).filter(Boolean).join(", ");
  if (typeof tags === "string") return tags;
  return "";
}

/**
 * Xuất Excel toàn bộ SIM tồn (còn hàng) của MỌI kho trong 1 file — bấm 1 phát.
 *
 * GET /api/admin/shopee/export-ton  → file .xlsx tải về.
 * Cần header Authorization: Bearer <supabase access token> của admin.
 */
export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const db = createAdminClient();
    const total = await countRows(db);
    const rows = await fetchAll(db, total);

    // Sắp lại ở app cho chắc (kho → giá tăng dần) vì dữ liệu gom từ nhiều trang.
    rows.sort((a, b) => {
      const ka = a.kho ?? "";
      const kb = b.kho ?? "";
      if (ka !== kb) return ka.localeCompare(kb, "vi");
      return (a.effective_price ?? 0) - (b.effective_price ?? 0);
    });

    const columns: XlsxColumn[] = [
      { header: "STT", width: 7 },
      { header: "Kho", width: 22 },
      { header: "Số SIM", width: 18 },
      { header: "Số thô (10 số)", width: 16 },
      { header: "Nhà mạng", width: 14 },
      { header: "Loại số", width: 30 },
      { header: "Giá (VND)", width: 14 },
    ];

    const data: XlsxCell[][] = rows.map((r, i) => [
      { v: i + 1, kind: "int" },
      { v: r.kho ?? "", kind: "text" },
      { v: r.display_number || r.raw_digits || "", kind: "text" },
      { v: r.raw_digits ?? "", kind: "text" },
      { v: r.network ?? "", kind: "text" },
      { v: tagsToText(r.tags), kind: "text" },
      { v: r.effective_price ?? 0, kind: "money" },
    ]);

    const buf = buildXlsx("SIM tồn", columns, data);

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const filename = `sim-ton_all-kho_${today}.xlsx`;

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(buf.length),
        "Cache-Control": "no-store",
        "X-Sim-Count": String(rows.length),
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
