import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/shopee/admin";
import { buildClickRow, clientIp } from "@/lib/trafficExclusions";

export const dynamic = "force-dynamic";

/**
 * Ghi 1 cú bấm liên hệ (Zalo / Gọi / Messenger) vào conversion_clicks kèm IP đọc
 * PHÍA SERVER — khuôn y /api/track/visit. Có IP thì view conversion_clicks_khach
 * mới lọc được click nội bộ/bot theo IP (A Khoa 26/09). Trước đây client insert
 * thẳng bảng nên không có IP.
 *
 * Công khai (khách vãng lai) — đúng như policy anon insert của conversion_clicks;
 * ghi bằng service role để IP do server đặt chứ không nhận từ body. Best-effort:
 * mọi lỗi nuốt êm, luôn trả 204, không bao giờ làm hỏng cú bấm của khách.
 *
 * POST /api/track/click { type, path, source, user_agent, sim_number, position,
 *   device, variant, utm_*, gclid, fbclid } → 204
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const row = buildClickRow(body, clientIp(req.headers));
    if (!row) return new NextResponse(null, { status: 204 });

    const db = createAdminClient();
    const { error } = await db.from("conversion_clicks").insert(row);
    // Cột ip chưa có (migration lọc nội bộ chưa áp) → vẫn ghi click, bỏ IP.
    if (error?.code === "PGRST204" && /'ip'/.test(error.message ?? "")) {
      const { ip: _ip, ...withoutIp } = row;
      void _ip;
      await db.from("conversion_clicks").insert(withoutIp);
    }
    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
