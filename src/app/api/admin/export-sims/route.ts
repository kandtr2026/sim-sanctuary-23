import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/shopee/admin";
import { errorResponse, requireAdmin } from "@/lib/shopee/http";
import { buildXlsx, type XlsxCell, type XlsxColumn } from "@/lib/xlsx";
import { MAIN_SHEET_ID } from "@/lib/recentOrdersSheet";
import { parseCSVLine, stripQuotes } from "@/lib/cheapSimSheet";
import { parsePrice } from "@/lib/simUtils";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PAGE = 1000;
const CONCURRENCY = 10;

type Db = ReturnType<typeof createAdminClient>;

// Cột đọc từ bảng sims (đủ trường nghiệp vụ; bỏ prefix/last dẫn xuất cho gọn).
const SIMS_COLS =
  "id,raw_digits,display_number,original_price,final_price,effective_price,discount_type,discount_value,kho,tinh_trang,status,network,tags,beauty_score,is_vip,updated_at";

interface SimRow {
  id: string;
  raw_digits: string | null;
  display_number: string | null;
  original_price: number | null;
  final_price: number | null;
  effective_price: number | null;
  discount_type: string | null;
  discount_value: number | null;
  kho: string | null;
  tinh_trang: string | null;
  status: string | null;
  network: string | null;
  tags: unknown;
  beauty_score: number | null;
  is_vip: boolean | null;
  updated_at: string | null;
}

/** Trường phụ chỉ có ở Sheet1 (không có trong bảng sims), khớp theo SimID. */
interface SheetExtra {
  giaThuVe: number | null;
  giaThuDieuChinh: number | null;
  loOri: string;
  check: string;
  statusPost: string;
}

async function countRows(db: Db): Promise<number> {
  const { count, error } = await db
    .from("sims")
    .select("*", { count: "exact", head: true })
    .eq("status", "available");
  if (error) throw new Error(`Không đếm được sims: ${error.message}`);
  return count ?? 0;
}

async function fetchAllSims(db: Db, total: number): Promise<SimRow[]> {
  const pages = Math.ceil(total / PAGE);
  const out: SimRow[] = [];
  for (let i = 0; i < pages; i += CONCURRENCY) {
    const batch: PromiseLike<{ data: unknown; error: unknown }>[] = [];
    for (let p = i; p < Math.min(i + CONCURRENCY, pages); p++) {
      batch.push(
        db
          .from("sims")
          .select(SIMS_COLS)
          .eq("status", "available")
          .order("id", { ascending: true })
          .range(p * PAGE, p * PAGE + PAGE - 1),
      );
    }
    const results = await Promise.all(batch);
    for (const r of results) {
      if (r.error) throw new Error(`Không đọc được sims: ${String((r.error as { message?: string })?.message ?? r.error)}`);
      for (const row of (r.data ?? []) as SimRow[]) out.push(row);
    }
  }
  return out;
}

/**
 * Nạp trường phụ từ Sheet1 (giá thu về, giá thu điều chỉnh, Lo Ori, Check,
 * Status_Post) rồi lập map theo SimID. Best-effort: Sheet lỗi thì trả map rỗng,
 * vẫn xuất được phần dữ liệu bảng sims.
 *
 * Cột theo VỊ TRÍ (hợp đồng ở recentOrdersSheet.ts): A SimID · H GIÁ THU VỀ ·
 * L Giá Thu Điều Chỉnh · M Lo Ori · N Check · O Status_Post.
 */
async function fetchSheetExtras(): Promise<Map<string, SheetExtra>> {
  const map = new Map<string, SheetExtra>();
  try {
    const tq = encodeURIComponent("select A, H, L, M, N, O");
    const url = `https://docs.google.com/spreadsheets/d/${MAIN_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Sheet1&tq=${tq}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return map;
    const csv = await res.text();
    const lines = csv.trim().split("\n").filter((l) => l.trim());
    for (let i = 1; i < lines.length; i++) {
      const [simId, giaThuVe, giaThuDC, loOri, check, statusPost] = parseCSVLine(lines[i]).map(stripQuotes);
      if (!simId) continue;
      const gv = parsePrice(giaThuVe || "");
      const gdc = parsePrice(giaThuDC || "");
      map.set(simId, {
        giaThuVe: gv > 0 ? gv : null,
        giaThuDieuChinh: gdc > 0 ? gdc : null,
        loOri: loOri || "",
        check: check || "",
        statusPost: statusPost || "",
      });
    }
  } catch {
    // Best-effort — Sheet lỗi thì bỏ trường phụ.
  }
  return map;
}

function tagsToText(tags: unknown): string {
  if (Array.isArray(tags)) return tags.map((t) => String(t)).filter(Boolean).join(", ");
  if (typeof tags === "string") return tags;
  return "";
}

const money = (v: number | null | undefined): XlsxCell =>
  typeof v === "number" && Number.isFinite(v) && v > 0
    ? { v, kind: "money" }
    : { v: "", kind: "text" };

const text = (v: unknown): XlsxCell => ({ v: v == null ? "" : String(v), kind: "text" });

/**
 * Xuất Excel TOÀN BỘ SIM đang bán kèm ĐỦ TRƯỜNG (bảng sims + join Sheet1 lấy giá
 * thu về/điều chỉnh + Lo Ori/Check/Status_Post). Chỉ admin (requireAdmin).
 *
 * GET /api/admin/export-sims → file .xlsx.
 */
export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const db = createAdminClient();
    const total = await countRows(db);
    const [rows, extras] = await Promise.all([fetchAllSims(db, total), fetchSheetExtras()]);

    rows.sort((a, b) => (a.kho ?? "").localeCompare(b.kho ?? "", "vi") || (a.effective_price ?? 0) - (b.effective_price ?? 0));

    const columns: XlsxColumn[] = [
      { header: "STT", width: 7 },
      { header: "SimID", width: 14 },
      { header: "Số thuê bao", width: 16 },
      { header: "Số thô (10 số)", width: 15 },
      { header: "Nhà mạng", width: 12 },
      { header: "Giá bán (VND)", width: 14 },
      { header: "Giá gốc (VND)", width: 14 },
      { header: "Giá cuối (VND)", width: 14 },
      { header: "Giá thu về (VND)", width: 15 },
      { header: "Giá thu điều chỉnh (VND)", width: 18 },
      { header: "Loại giảm", width: 12 },
      { header: "Giá trị giảm", width: 12 },
      { header: "Kho", width: 20 },
      { header: "Tình trạng", width: 12 },
      { header: "Trạng thái", width: 12 },
      { header: "Loại số", width: 28 },
      { header: "Điểm đẹp", width: 9 },
      { header: "VIP", width: 6 },
      { header: "Lo Ori", width: 12 },
      { header: "Check", width: 10 },
      { header: "Status_Post", width: 12 },
      { header: "Cập nhật lúc", width: 20 },
    ];

    const data: XlsxCell[][] = rows.map((r, i) => {
      const ex = extras.get(r.id);
      return [
        { v: i + 1, kind: "int" },
        text(r.id),
        text(r.display_number || r.raw_digits || ""),
        text(r.raw_digits ?? ""),
        text(r.network ?? ""),
        money(r.effective_price),
        money(r.original_price),
        money(r.final_price),
        money(ex?.giaThuVe ?? null),
        money(ex?.giaThuDieuChinh ?? null),
        text(r.discount_type ?? ""),
        money(r.discount_value),
        text(r.kho ?? ""),
        text(r.tinh_trang ?? ""),
        text(r.status ?? ""),
        text(tagsToText(r.tags)),
        { v: r.beauty_score ?? 0, kind: "int" },
        text(r.is_vip ? "VIP" : ""),
        text(ex?.loOri ?? ""),
        text(ex?.check ?? ""),
        text(ex?.statusPost ?? ""),
        text(r.updated_at ?? ""),
      ];
    });

    const buf = buildXlsx("SIM đang bán", columns, data);
    const today = new Date().toISOString().slice(0, 10);
    const filename = `sim-data_day-du_${today}.xlsx`;

    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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
