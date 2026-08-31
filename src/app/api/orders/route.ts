import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/shopee/admin";

/**
 * A6 — Nhận đơn bán về từ AppSheet qua webhook.
 *
 * Vòng đo: campaign đi nhờ tin nhắn Zalo ("[Mã: gg-search-tuquy]") → chuyên viên
 * chốt đơn → ghi dòng trên AppSheet → automation POST đơn về đây → bảng `orders`
 * (dedup theo external_id = id dòng AppSheet) → dashboard /admin ghép với
 * conversion_clicks theo campaign_code để ra Đơn/Doanh thu/Tỉ lệ lead→đơn.
 *
 * BẢO MẬT: chỉ nhận khi header `x-orders-secret` khớp `ORDERS_WEBHOOK_SECRET`
 * (fail-closed — chưa đặt biến thì từ chối hết). Ghi bảng qua service role, bảng
 * bật RLS force nên anon/authenticated không đọc/ghi được (xem migration
 * 20260831100000_orders.sql).
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

const secretMatches = (req: NextRequest): boolean => {
  const secret = process.env.ORDERS_WEBHOOK_SECRET;
  if (!secret) return false;
  return req.headers.get("x-orders-secret") === secret;
};

export async function POST(req: NextRequest) {
  if (!secretMatches(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: unknown = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "Body không hợp lệ" }, { status: 400 });
  }

  const b = body as Record<string, unknown>;
  const phone = String(b.phone ?? "").trim();
  const price = Number(b.price);
  if (!phone || !Number.isFinite(price) || price <= 0) {
    return Response.json(
      { error: "Cần phone (text) và price (int > 0)" },
      { status: 400 },
    );
  }

  // Chuẩn hoá campaign_code: trim + lowercase, rỗng → null. Khớp cách
  // utm_campaign được ghi trong conversion_clicks (slug thường đã lowercase).
  const campaignRaw = String(b.campaign_code ?? "").trim().toLowerCase();
  const campaignCode = campaignRaw || null;

  const externalIdRaw = String(b.external_id ?? "").trim();
  const externalId = externalIdRaw || null;

  const soldAtRaw = String(b.sold_at ?? "").trim();
  const soldAt = soldAtRaw && !Number.isNaN(Date.parse(soldAtRaw))
    ? new Date(soldAtRaw).toISOString()
    : null;

  const row = {
    phone,
    price: Math.trunc(price),
    sim: b.sim ? String(b.sim).trim() || null : null,
    campaign_code: campaignCode,
    source: b.source ? String(b.source).trim() || null : null,
    external_id: externalId,
    sold_at: soldAt,
    raw: body,
  };

  try {
    const db = createAdminClient();
    let data: { id: number }[];

    if (externalId) {
      // AppSheet có thể gửi lại cùng dòng — upsert theo external_id để không đẻ bản ghi trùng.
      const res = await db
        .from("orders")
        .upsert(row, { onConflict: "external_id" })
        .select("id");
      data = (res.data ?? []) as { id: number }[];
      if (res.error) throw res.error;
    } else {
      const res = await db.from("orders").insert(row).select("id");
      data = (res.data ?? []) as { id: number }[];
      if (res.error) throw res.error;
    }

    return Response.json({ ok: true, id: data[0]?.id ?? null }, { status: 200 });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[orders] ghi đơn thất bại:", msg);
    return Response.json({ error: "Không lưu được đơn" }, { status: 500 });
  }
}
