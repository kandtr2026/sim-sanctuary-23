import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/shopee/admin";
import { errorResponse, requireAdmin } from "@/lib/shopee/http";
import { isMissingDbObject, parseAllFlag } from "@/lib/trafficExclusions";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const PAGE = 1000;
// Cửa sổ đọc: 180 ngày đủ cho cả 2 chế độ xem (14 ngày / 6 tháng) của biểu đồ,
// mà vẫn chặn không quét cả bảng page_visits khi blog nhiều lượt đọc về sau.
const WINDOW_DAYS = 180;
// Trần an toàn số trang (page_visits có thể phình): 60 × 1000 = 60k lượt đọc
// /tin-tuc trong cửa sổ vẫn gom hết; quá thì dừng và cắm cờ truncated.
const MAX_PAGES = 60;

const PREFIX = "/tin-tuc/";

type Db = ReturnType<typeof createAdminClient>;

interface VisitRow {
  path: string;
  visited_at: string;
}

/** Ngày theo giờ VN (UTC+7) dạng YYYY-MM-DD — gom lượt đọc theo ngày địa phương. */
function vnDay(iso: string): string {
  return new Date(Date.parse(iso) + 7 * 3600 * 1000).toISOString().slice(0, 10);
}

/**
 * Thống kê LƯỢT ĐỌC bài viết (path `/tin-tuc/<slug>`) — mặc định từ view
 * `page_visits_khach` (đã bỏ nội bộ + bot, A Khoa 26/09); `?all=1` đọc bảng gốc
 * `page_visits`. Chỉ authenticated/service role đọc được (không có policy anon),
 * nên đọc bằng service role + chặn requireAdmin. Gom phía server → client chỉ
 * nhận JSON nhỏ dù bảng có lớn.
 *
 * GET /api/admin/post-reads[?all=1] →
 *   { total, daily: [{day:'YYYY-MM-DD', count}], byPost: [{slug, count}], truncated }
 */
export async function GET(req: NextRequest) {
  const gate = await requireAdmin(req);
  if ("response" in gate) return gate.response;

  try {
    const db: Db = createAdminClient();
    const since = new Date(Date.now() - WINDOW_DAYS * 86_400_000).toISOString();
    let source = parseAllFlag(req.nextUrl.searchParams) ? "page_visits" : "page_visits_khach";

    const rows: VisitRow[] = [];
    let truncated = false;
    for (let page = 0; page < MAX_PAGES; page++) {
      const from = page * PAGE;
      const read = () =>
        db
          .from(source)
          .select("path, visited_at")
          .like("path", `${PREFIX}%`)
          .gte("visited_at", since)
          .order("visited_at", { ascending: true })
          .range(from, from + PAGE - 1);
      let { data, error } = await read();
      // View chưa có (migration lọc nội bộ chưa áp) → lùi về bảng gốc như cũ.
      if (error && page === 0 && source !== "page_visits" && isMissingDbObject(error)) {
        source = "page_visits";
        ({ data, error } = await read());
      }
      if (error) throw new Error(`Đọc ${source} lỗi: ${error.message}`);
      const batch = (data ?? []) as VisitRow[];
      for (const r of batch) rows.push(r);
      if (batch.length < PAGE) break;
      if (page === MAX_PAGES - 1) truncated = true;
    }

    const dailyMap = new Map<string, number>();
    const postMap = new Map<string, number>();
    for (const r of rows) {
      // slug = phần sau /tin-tuc/, cắt mọi thứ sau dấu / ? # (phòng path lạ).
      const slug = r.path.slice(PREFIX.length).split(/[/?#]/)[0];
      if (!slug) continue; // bỏ trang danh sách /tin-tuc (không phải 1 bài)
      postMap.set(slug, (postMap.get(slug) ?? 0) + 1);
      const day = vnDay(r.visited_at);
      dailyMap.set(day, (dailyMap.get(day) ?? 0) + 1);
    }

    const daily = [...dailyMap.entries()]
      .map(([day, count]) => ({ day, count }))
      .sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));
    const byPost = [...postMap.entries()]
      .map(([slug, count]) => ({ slug, count }))
      .sort((a, b) => b.count - a.count);

    return Response.json({ total: rows.length, daily, byPost, truncated });
  } catch (err) {
    return errorResponse(err);
  }
}
