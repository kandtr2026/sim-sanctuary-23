import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/shopee/admin";
import { clientIp } from "@/lib/trafficExclusions";

export const dynamic = "force-dynamic";

const str = (v: unknown, max: number): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
};

/**
 * Ghi 1 lượt xem trang kèm IP đọc PHÍA SERVER (trình duyệt không biết IP công
 * cộng của mình). Thay cho việc client insert thẳng page_visits, để mục "Khách
 * theo IP" trên /admin gom mỗi IP = 1 khách (góp ý A Khoa 13/09).
 *
 * Công khai (khách vãng lai) — đúng như policy anon insert cũ của page_visits;
 * ghi bằng service role để IP do server đặt chứ không nhận từ body. Best-effort:
 * mọi lỗi nuốt êm, không bao giờ làm hỏng trải nghiệm khách.
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    const path = str(body?.path, 500);
    if (!path) return new NextResponse(null, { status: 204 });

    const row = {
      path,
      referrer: str(body?.referrer, 500),
      source: str(body?.source, 40),
      user_agent: str(body?.user_agent, 500),
      ip: clientIp(req.headers),
      utm_source: str(body?.utm_source, 200),
      utm_medium: str(body?.utm_medium, 200),
      utm_campaign: str(body?.utm_campaign, 200),
      utm_term: str(body?.utm_term, 200),
      utm_content: str(body?.utm_content, 200),
      gclid: str(body?.gclid, 300),
      fbclid: str(body?.fbclid, 300),
    };

    const db = createAdminClient();
    await db.from("page_visits").insert(row);
    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 204 });
  }
}
