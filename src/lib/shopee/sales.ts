/**
 * Doanh thu Shopee theo listing (góp ý #34): mỗi mã sản phẩm đã bán bao nhiêu
 * đơn / bao nhiêu cái / doanh thu bao nhiêu, trong N ngày gần đây.
 *
 * Cách làm (theo doc Shopee Open API v2 — module Order):
 *  1) get_order_list trả order_sn theo cửa sổ ≤15 ngày, phân trang cursor →
 *     chia N ngày thành các đoạn 15 ngày rồi gộp. Chỉ trả order_sn + order_status,
 *     KHÔNG có sản phẩm/tiền.
 *  2) Loại đơn chưa bán (UNPAID / CANCELLED / IN_CANCEL).
 *  3) get_order_detail theo lô ≤50 order_sn (xin item_list) → gom theo item_id:
 *     số cái = Σ model_quantity_purchased; doanh thu = Σ (model_discounted_price ×
 *     quantity); số đơn = đếm order_sn distinct chứa item đó. Dùng GMV từ order,
 *     KHÔNG gọi escrow (tránh tốn 1 request/đơn).
 */

import { getCreds, persistRefreshedTokens } from "./credentials";
import { ShopeeProductClient } from "./client";

/** 15 ngày (giây) — cửa sổ tối đa của get_order_list. */
const WINDOW_SEC = 15 * 24 * 3600;
/** Chặn vòng lặp bất thường: dừng gom order_sn khi vượt mức này. */
const MAX_ORDERS = 3000;
/** Đơn coi là CHƯA bán → bỏ khỏi thống kê doanh thu. */
const EXCLUDED_STATUS = new Set(["UNPAID", "CANCELLED", "IN_CANCEL"]);

export interface ShopeeSalesItem {
  item_id: number;
  item_name: string;
  orders: number;
  quantity: number;
  revenue: number;
}

export interface ShopeeSalesResult {
  rangeDays: number;
  totalOrders: number;
  totalRevenue: number;
  currency: string;
  byItem: ShopeeSalesItem[];
  /** true nếu chạm trần MAX_ORDERS (số liệu chưa gồm hết đơn). */
  capped: boolean;
}

const toNum = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

export async function getShopeeSalesByItem(days: number): Promise<ShopeeSalesResult> {
  const creds = await getCreds();
  if (!creds) throw new Error("Chưa khai báo thông số Shopee (partner_id/partner_key/shop_id).");
  if (!creds.accessToken) throw new Error('Chưa uỷ quyền shop. Vào trang Shopee bấm "Uỷ quyền shop" trước.');

  const client = new ShopeeProductClient(creds);
  const now = Math.floor(Date.now() / 1000);
  const from = now - days * 24 * 3600;

  // Bước 1: gom order_sn (đã bán) qua từng cửa sổ ≤15 ngày.
  const soldSns: string[] = [];
  let capped = false;
  for (let start = from; start < now && !capped; start += WINDOW_SEC) {
    const end = Math.min(start + WINDOW_SEC - 1, now);
    let cursor = "";
    for (;;) {
      const resp = await client.getOrderList({ timeFrom: start, timeTo: end, cursor, pageSize: 100 });
      const list = (resp?.order_list ?? []) as Record<string, unknown>[];
      for (const o of list) {
        const status = String(o?.order_status ?? "").toUpperCase();
        if (EXCLUDED_STATUS.has(status)) continue;
        const sn = String(o?.order_sn ?? "");
        if (sn) soldSns.push(sn);
      }
      if (soldSns.length >= MAX_ORDERS) {
        capped = true;
        break;
      }
      const more = resp?.more === true;
      const next = String(resp?.next_cursor ?? "");
      if (!more || !next || next === cursor) break;
      cursor = next;
    }
  }

  // Bước 2: chi tiết theo lô 50 → gom theo item_id.
  const byItem = new Map<number, ShopeeSalesItem>();
  const paidOrders = new Set<string>();
  let totalRevenue = 0;
  let currency = "VND";

  for (let i = 0; i < soldSns.length; i += 50) {
    const batch = soldSns.slice(i, i + 50);
    const resp = await client.getOrderDetail(batch);
    const orders = (resp?.order_list ?? []) as Record<string, unknown>[];
    for (const ord of orders) {
      const status = String(ord?.order_status ?? "").toUpperCase();
      if (EXCLUDED_STATUS.has(status)) continue;
      if (ord?.currency) currency = String(ord.currency);
      const sn = String(ord?.order_sn ?? "");
      const items = (ord?.item_list ?? []) as Record<string, unknown>[];
      const seenItems = new Set<number>();
      for (const it of items) {
        const itemId = Number(it?.item_id ?? 0);
        if (!itemId) continue;
        const qty = toNum(it?.model_quantity_purchased);
        const price = toNum(it?.model_discounted_price);
        const rev = price * qty;
        const name = String(it?.item_name ?? "") || `Item #${itemId}`;
        const row = byItem.get(itemId) ?? { item_id: itemId, item_name: name, orders: 0, quantity: 0, revenue: 0 };
        row.quantity += qty;
        row.revenue += rev;
        if (!row.item_name || row.item_name.startsWith("Item #")) row.item_name = name;
        if (!seenItems.has(itemId)) {
          row.orders += 1;
          seenItems.add(itemId);
        }
        byItem.set(itemId, row);
        totalRevenue += rev;
      }
      if (sn && items.length > 0) paidOrders.add(sn);
    }
  }

  if (client.refreshedTokens) {
    await persistRefreshedTokens(client.refreshedTokens);
  }

  const list = [...byItem.values()]
    .map((r) => ({ ...r, revenue: Math.round(r.revenue * 100) / 100 }))
    .sort((a, b) => b.revenue - a.revenue || b.orders - a.orders || b.quantity - a.quantity);

  return {
    rangeDays: days,
    totalOrders: paidOrders.size,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    currency,
    byItem: list,
    capped,
  };
}
