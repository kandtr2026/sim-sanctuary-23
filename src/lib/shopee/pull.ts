/**
 * Kéo toàn bộ listing đang có trên Shopee về để quản lý trên web.
 *
 * TẠI SAO: bảng shopee_item_map chỉ biết những SIM do tool này đẩy lên. Những
 * sản phẩm đăng tay hoặc từ nơi khác trên cùng shop thì admin không thấy. Module
 * này gọi get_item_list phân trang để lấy HẾT item đang live trên Shopee, rồi
 * gọi get_item_base_info (lô tối đa 50) để lấy tên/giá/kho/ảnh, ghép với map để
 * biết sản phẩm nào là của SIM nào.
 */

import { createAdminClient } from "./admin";
import { getCreds, persistRefreshedTokens } from "./credentials";
import { ShopeeProductClient } from "./client";
import { ITEM_LIST_PAGE_SIZE } from "./config";

export interface ShopeeListing {
  item_id: number;
  item_name: string;
  price: number;
  stock: number;
  status: string;
  image: string | null;
  sim_id: string | null;
}

export interface PullResult {
  items: ShopeeListing[];
  total: number;
  fetched: number;
  pages: number;
  syncedCount: number;
}

/** Số item tối đa mỗi lần get_item_base_info (Shopee giới hạn 50). */
const BASE_INFO_BATCH = 50;

/** Đổi tên status Shopee sang nhãn dễ đọc trên panel. */
export function hienThiTrangThai(status: string): string {
  switch (String(status || "").toUpperCase()) {
    case "NORMAL":
      return "Đang bán";
    case "DELETED":
      return "Đã xoá";
    case "BANNED":
      return "Bị khoá";
    case "UNLIST":
    case "UNLISTED":
      return "Ngừng bán";
    case "REVIEWING":
      return "Đang duyệt";
    default:
      return status || "—";
  }
}

/**
 * Lấy toàn bộ item đang NORMAL trên Shopee (phân trang theo has_next_page/
 * next_offset), rồi lấy chi tiết theo lô 50.
 */
export async function pullAllItems(): Promise<PullResult> {
  const creds = await getCreds();
  if (!creds) throw new Error("Chưa khai báo thông số Shopee (partner_id/partner_key/shop_id).");
  if (!creds.accessToken) throw new Error("Chưa uỷ quyền shop. Bấm \"Uỷ quyền shop\" trước.");

  const client = new ShopeeProductClient(creds);
  const db = createAdminClient();

  // Đọc map một lần để ghép item_id -> sim_id.
  const { data: mapRows, error: mapError } = await db
    .from("shopee_item_map")
    .select("item_id, sim_id")
    .not("item_id", "is", null);
  if (mapError) throw new Error(`Không đọc được map SIM->Shopee: ${mapError.message}`);

  const simByItem = new Map<number, string>();
  for (const r of (mapRows ?? []) as { item_id: number; sim_id: string }[]) {
    simByItem.set(Number(r.item_id), r.sim_id);
  }

  // Bước 1: quét get_item_list để lấy item_id + status (phân trang).
  const summary: { item_id: number; status: string }[] = [];
  let offset = 0;
  let total = -1;
  let page = 0;

  for (;;) {
    const resp = await client.getItemList(offset, ITEM_LIST_PAGE_SIZE);
    const list = (resp?.item ?? []) as Record<string, unknown>[];
    if (resp?.total_count !== undefined) total = Number(resp.total_count);

    for (const it of list) {
      const itemId = Number(it?.item_id || 0);
      if (!itemId) continue;
      summary.push({
        item_id: itemId,
        status: String(it?.item_status ?? it?.status ?? ""),
      });
    }

    const hasNext = resp?.has_next_page === true;
    const nextOffset = Number(resp?.next_offset ?? -1);
    if (!hasNext || list.length === 0) break;
    if (nextOffset >= 0 && nextOffset !== offset) {
      offset = nextOffset;
    } else {
      offset += ITEM_LIST_PAGE_SIZE;
    }
    page++;
    // Phòng khi Shopee trả lặp: dừng nếu đã quét hết total.
    if (total > 0 && summary.length >= total) break;
  }

  // Bước 2: lấy chi tiết (tên/giá/kho/ảnh) theo lô 50.
  const items: ShopeeListing[] = [];
  for (let i = 0; i < summary.length; i += BASE_INFO_BATCH) {
    const batch = summary.slice(i, i + BASE_INFO_BATCH);
    const resp = await client.getItemBaseInfo(batch.map((b) => b.item_id));
    const infoList = (resp?.item_list ?? []) as Record<string, unknown>[];
    const infoById = new Map<number, Record<string, unknown>>();
    for (const it of infoList) {
      const itemId = Number(it?.item_id || 0);
      if (itemId) infoById.set(itemId, it);
    }

    for (const b of batch) {
      const info = infoById.get(b.item_id) ?? {};
      const priceInfo = (info?.price_info ?? []) as Record<string, unknown>[];
      const price = Number(priceInfo[0]?.current_price ?? 0) || Number(info?.price ?? 0) || 0;
      const sellerStock = (info?.seller_stock ?? []) as Record<string, unknown>[];
      const stock = Number(info?.stock ?? 0) || Number(sellerStock[0]?.stock ?? 0) || 0;
      const imgObj = (info?.image ?? {}) as Record<string, unknown>;
      const imgList = (imgObj?.image_url_list ?? []) as string[];
      const realStatus = String(info?.item_status ?? b.status ?? "");

      items.push({
        item_id: b.item_id,
        item_name: String(info?.item_name ?? ""),
        price,
        stock,
        status: realStatus || b.status,
        image: imgList[0] ?? null,
        sim_id: simByItem.get(b.item_id) ?? null,
      });
    }
  }

  // Lưu token mới (nếu auto-refresh xảy ra trong lúc quét).
  if (client.refreshedTokens) {
    await persistRefreshedTokens(client.refreshedTokens);
  }

  return {
    items,
    total: total > 0 ? total : items.length,
    fetched: items.length,
    pages: page + 1,
    syncedCount: items.filter((i) => i.sim_id).length,
  };
}
