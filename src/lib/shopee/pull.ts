/**
 * Kéo toàn bộ listing đang có trên Shopee về để quản lý trên web.
 *
 * TẠI SAO: bảng shopee_item_map chỉ biết những SIM do tool này đẩy lên. Những
 * sản phẩm đăng tay hoặc từ nơi khác trên cùng shop thì admin không thấy. Module
 * này gọi get_item_list phân trang để lấy HẾT item đang live trên Shopee, rồi
 * gọi get_item_base_info (lô tối đa 50) để lấy tên/giá/kho/ảnh, ghép với map để
 * biết sản phẩm nào là của SIM nào. Nếu item có model (has_model=true) thì gọi
 * thêm get_model_list để lấy giá/kho thực tế.
 */

import { createAdminClient } from "./admin";
import { getCreds, persistRefreshedTokens } from "./credentials";
import { ShopeeProductClient } from "./client";
import { ITEM_LIST_PAGE_SIZE } from "./config";

export interface ShopeeVariant {
  model_id: number;
  /** Số SIM (nhãn option từ tier_variation). */
  label: string;
  sku: string | null;
  price: number;
  stock: number;
}

export interface ShopeeListing {
  item_id: number;
  item_name: string;
  price: number;
  stock: number;
  status: string;
  image: string | null;
  sim_id: string | null;
  /** Ghi chú giá khi item có model: "từ 199.000₫" hoặc rỗng nếu 1 giá. */
  priceNote?: string;
  /** Danh sách biến thể (mỗi số SIM) — chỉ khi item có model. */
  variants?: ShopeeVariant[];
}

export interface PullResult {
  items: ShopeeListing[];
  total: number;
  fetched: number;
  pages: number;
  syncedCount: number;
}

const BASE_INFO_BATCH = 50;

export function hienThiTrangThai(status: string): string {
  switch (String(status || "").toUpperCase()) {
    case "NORMAL": return "Đang bán";
    case "DELETED": return "Đã xoá";
    case "BANNED": return "Bị khoá";
    case "UNLIST": case "UNLISTED": return "Ngừng bán";
    case "REVIEWING": return "Đang duyệt";
    default: return status || "—";
  }
}

function formatTien(n: number): string {
  if (!n || n <= 0) return "";
  return n.toLocaleString("vi-VN") + "₫";
}

export async function pullAllItems(): Promise<PullResult> {
  const creds = await getCreds();
  if (!creds) throw new Error("Chưa khai báo thông số Shopee (partner_id/partner_key/shop_id).");
  if (!creds.accessToken) throw new Error("Chưa uỷ quyền shop. Bấm \"Uỷ quyền shop\" trước.");

  const client = new ShopeeProductClient(creds);
  const db = createAdminClient();

  const { data: mapRows, error: mapError } = await db
    .from("shopee_item_map")
    .select("item_id, sim_id")
    .not("item_id", "is", null);
  if (mapError) throw new Error(`Không đọc được map SIM->Shopee: ${mapError.message}`);

  const simByItem = new Map<number, string>();
  for (const r of (mapRows ?? []) as { item_id: number; sim_id: string }[]) {
    simByItem.set(Number(r.item_id), r.sim_id);
  }

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
      summary.push({ item_id: itemId, status: String(it?.item_status ?? it?.status ?? "") });
    }

    const hasNext = resp?.has_next_page === true;
    const nextOffset = Number(resp?.next_offset ?? -1);
    if (!hasNext || list.length === 0) break;
    offset = nextOffset >= 0 && nextOffset !== offset ? nextOffset : offset + ITEM_LIST_PAGE_SIZE;
    page++;
    if (total > 0 && summary.length >= total) break;
  }

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
      const hasModel = info?.has_model === true;
      const priceInfo = (info?.price_info ?? []) as Record<string, unknown>[];
      const sellerStock = (info?.seller_stock ?? []) as Record<string, unknown>[];
      const imgObj = (info?.image ?? {}) as Record<string, unknown>;
      const imgList = (imgObj?.image_url_list ?? []) as string[];
      const realStatus = String(info?.item_status ?? b.status ?? "");
      const sellerStockArr = (info?.seller_stock ?? []) as Record<string, unknown>[];

      let price = Number(priceInfo[0]?.current_price ?? 0) || Number(info?.price ?? 0) || 0;
      let stock = Number(info?.stock ?? 0) || Number(sellerStockArr[0]?.stock ?? 0) || 0;
      let priceNote = "";
      let variants: { model_id: number; label: string; sku: string | null; price: number; stock: number }[] | undefined;

      // Item có model: price_info không được trả → gọi get_model_list.
      if (hasModel || (!price && !stock)) {
        try {
          const raw = (await client.getModelList(b.item_id)) as Record<string, unknown>;
          const modelList = (raw?.model ?? []) as Record<string, unknown>[];
          const tierVariations = (raw?.tier_variation ?? []) as Record<string, unknown>[];

          if (modelList.length > 0) {
            const prices: number[] = [];
            let totalStock = 0;
            const vs: typeof variants = [];

            for (const m of modelList) {
              const mp = (m?.price_info ?? []) as Record<string, unknown>[];
              const p = Number(mp[0]?.current_price ?? 0);
              if (p > 0) prices.push(p);
              const sv2 = (m?.stock_info_v2 ?? {}) as Record<string, unknown>;
              const sum = (sv2?.summary_info ?? {}) as Record<string, unknown>;
              const ss = (sv2?.seller_stock ?? []) as Record<string, unknown>;
              const st = Number(sum?.total_available_stock ?? 0) || Number((ss[0] as Record<string, unknown>)?.stock ?? 0);
              totalStock += st;

              const ti = (m?.tier_index ?? []) as number[];
              const labelParts = ti.map((idx, vi) => {
                const tv = tierVariations[vi] as Record<string, unknown> | undefined;
                const opts = (tv?.option_list ?? []) as Record<string, unknown>[];
                return String(opts[idx]?.option ?? "");
              });
              const label = labelParts.join(" / ").trim();

              vs.push({
                model_id: Number(m?.model_id ?? 0),
                label,
                sku: String(m?.model_sku ?? "") || null,
                price: p,
                stock: st,
              });
            }

            if (prices.length > 0) {
              price = Math.min(...prices);
              if (prices.length > 1) priceNote = `từ ${formatTien(price)}`;
            }
            stock = totalStock;
            if (vs.some((v) => v.label.length > 0)) variants = vs;
          }
        } catch {
          // Không lấy được model → giữ price/stock cũ (có thể vẫn 0).
        }
      }

      items.push({
        item_id: b.item_id,
        item_name: String(info?.item_name ?? ""),
        price,
        stock,
        status: realStatus || b.status,
        image: imgList[0] ?? null,
        sim_id: simByItem.get(b.item_id) ?? null,
        priceNote: priceNote || undefined,
        ...(variants ? { variants } : {}),
      });
    }
  }

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

const TABLE_SNAPSHOT = "shopee_listing_snapshot";

/** Lưu kết quả pull vào bảng snapshot để login lần sau hiện ngay không phải fetch Shopee. */
export async function saveSnapshot(result: PullResult, createdBy: string): Promise<void> {
  const db = createAdminClient();
  const { error } = await db.from(TABLE_SNAPSHOT).upsert({
    id: 1,
    items: result.items,
    total: result.total,
    pages: result.pages,
    synced_count: result.syncedCount,
    fetched_at: new Date().toISOString(),
    created_by: createdBy,
  });
  if (error) throw new Error(`Không lưu được snapshot Shopee: ${error.message}`);
}

export interface SnapshotResult {
  items: ShopeeListing[];
  total: number;
  pages: number;
  syncedCount: number;
  fetchedAt: string | null;
  isStale: boolean;
}

/** Đọc snapshot gần nhất (cache) — không gọi Shopee. isStale=true nếu quá 6 giờ. */
export async function getSnapshot(): Promise<SnapshotResult> {
  const db = createAdminClient();
  const { data, error } = await db
    .from(TABLE_SNAPSHOT)
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error) throw new Error(`Không đọc được snapshot Shopee: ${error.message}`);
  const row = data as
    | { items: ShopeeListing[]; total: number; pages: number; synced_count: number; fetched_at: string | null }
    | null;
  if (!row) return { items: [], total: 0, pages: 0, syncedCount: 0, fetchedAt: null, isStale: false };

  const fetchedMs = row.fetched_at ? new Date(row.fetched_at).getTime() : 0;
  return {
    items: Array.isArray(row.items) ? row.items : [],
    total: Number(row.total || 0),
    pages: Number(row.pages || 0),
    syncedCount: Number(row.synced_count || 0),
    fetchedAt: row.fetched_at ?? null,
    isStale: Date.now() - fetchedMs > 6 * 3600 * 1000,
  };
}