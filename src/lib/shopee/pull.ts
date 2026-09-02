/**
 * Kéo toàn bộ listing đang có trên Shopee về để quản lý trên web.
 *
 * TẠI SAO: bảng shopee_item_map chỉ biết những SIM do tool này đẩy lên. Những
 * sản phẩm đăng tay hoặc từ nơi khác trên cùng shop thì admin không thấy. Module
 * này gọi get_item_list phân trang để lấy HẾT item đang live trên Shopee, rồi
 * ghép với map để biết sản phẩm nào là của SIM nào.
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
    default:
      return status || "—";
  }
}

/**
 * Lấy toàn bộ item đang NORMAL trên Shopee (phân trang đến khi hết).
 * Trả về danh sách đã ghép sim_id từ shopee_item_map (theo item_id).
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

  const items: ShopeeListing[] = [];
  let page = 0;
  let total = -1;

  // get_item_list trả tối đa 100 item/lần; quét tới khi hết tổng hoặc hết trang.
  for (;;) {
    const resp = await client.getItemList(page, ITEM_LIST_PAGE_SIZE);
    const list = (resp?.item_list ?? []) as Record<string, unknown>[];
    if (resp?.total_count !== undefined) total = Number(resp.total_count);

    for (const it of list) {
      const itemId = Number(it?.item_id || 0);
      if (!itemId) continue;
      const imgObj = (it?.image ?? {}) as Record<string, unknown>;
      const imgList = (imgObj?.image_url_list ?? []) as string[];
      items.push({
        item_id: itemId,
        item_name: String(it?.item_name ?? ""),
        price: Number(it?.price ?? 0),
        stock: Number(it?.stock ?? 0),
        status: String(it?.status ?? it?.item_status ?? ""),
        image: imgList[0] ?? null,
        sim_id: simByItem.get(itemId) ?? null,
      });
    }

    const soCo = (resp?.item_list as unknown[] | undefined)?.length ?? 0;
    if (soCo === 0) break;
    if (total > 0 && items.length >= total) break;
    page++;
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
