/**
 * Sync engine: đẩy lô SIM đã chọn từ Google Sheet (NormalizedSIM) lên Shopee.
 *
 * Mỗi SIM = một sản phẩm. `item_sku` gán bằng sim_id (cột SIMID của Sheet) để
 * lần sync sau tra được bản ghi đã tạo qua bảng shopee_item_map, không cần quét
 * item_list của Shopee.
 *
 * Không bao giờ đẩy hết kho: admin chọn lô trên trang (bộ lọc + tick), truyền
 * vào đúng danh sách sim_id. Trang giới hạn mỗi lần sync (MAX_ITEMS_PER_SYNC).
 */

import { createAdminClient } from "./admin";
import { getCreds, getSettings, persistRefreshedTokens } from "./credentials";
import { ShopeeProductClient } from "./client";
import {
  DEFAULT_IMAGE_URL,
  ITEM_CONDITION,
  ITEM_DESCRIPTION,
  ITEM_WEIGHT,
  MAX_ITEMS_PER_SYNC,
} from "./config";
import type { NormalizedSIM } from "@/lib/simUtils";

export interface SyncResult {
  batchId: string;
  total: number;
  created: number;
  updated: number;
  failed: number;
  skipped: number;
  errors: { simId: string; number: string; error: string }[];
}

interface ItemMapRow {
  sim_id: string;
  item_id: number | null;
}

const TABLE_MAP = "shopee_item_map";
const TABLE_LOG = "shopee_sync_log";

export async function syncSims(sims: NormalizedSIM[], createdBy: string): Promise<SyncResult> {
  const batchId = `sync-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const result: SyncResult = {
    batchId,
    total: sims.length,
    created: 0,
    updated: 0,
    failed: 0,
    skipped: 0,
    errors: [],
  };

  if (sims.length === 0) return result;
  const list = sims.slice(0, MAX_ITEMS_PER_SYNC);

  const creds = await getCreds();
  if (!creds) {
    throw new Error("Chưa khai báo thông số Shopee (partner_id/partner_key/shop_id).");
  }
  if (!creds.accessToken) {
    throw new Error("Chưa uỷ quyền shop. Bấm \"Uỷ quyền shop\" trước khi sync.");
  }

  const settings = await getSettings();
  if (!settings.categoryId) {
    throw new Error("Chưa chọn danh mục sản phẩm trên Shopee (mục \"Cài đặt đăng bán\").");
  }
  const imageUrl = settings.imageUrl?.trim() || DEFAULT_IMAGE_URL;

  const client = new ShopeeProductClient(creds);

  // Đọc map hiện có một lượt để biết cái nào đã tạo rồi (update) hay chưa (add).
  const db = createAdminClient();
  const simIds = list.map((s) => s.id);
  const { data: rows, error: mapError } = await db
    .from(TABLE_MAP)
    .select("sim_id, item_id")
    .in("sim_id", simIds);
  if (mapError) throw new Error(`Không đọc được map SIM->Shopee: ${mapError.message}`);

  const existingMap = new Map<string, number | null>();
  for (const r of (rows ?? []) as ItemMapRow[]) {
    existingMap.set(r.sim_id, r.item_id);
  }

  const now = new Date().toISOString();
  const upserts: Record<string, unknown>[] = [];
  const errorsBySim: { simId: string; number: string; error: string }[] = [];

  for (const sim of list) {
    const existingItemId = existingMap.get(sim.id) ?? null;

    // SIM đã có item nhưng item_id rỗng (lần trước lỗi giữa chừng): coi như chưa
    // tạo, thử add lại. Shopee có thể báo trùng item_sku — khi đó bỏ qua.
    try {
      const payload = buildItemPayload(sim, settings.categoryId, imageUrl);

      if (existingItemId) {
        await client.updateItem({ item_id: existingItemId, ...payload });
        result.updated++;
        upserts.push({
          sim_id: sim.id,
          item_id: existingItemId,
          item_sku: sim.id,
          status: "live",
          price: sim.price,
          stock: 1,
          last_synced_at: now,
          last_success_at: now,
          last_error: null,
        });
      } else {
        const { item_id } = await client.addItem(payload);
        result.created++;
        upserts.push({
          sim_id: sim.id,
          item_id,
          item_sku: sim.id,
          status: "live",
          price: sim.price,
          stock: 1,
          last_synced_at: now,
          last_success_at: now,
          last_error: null,
        });
      }
    } catch (err) {
      result.failed++;
      const message =
        (err as { message?: unknown })?.message
          ? String((err as { message?: unknown }).message)
          : "Lỗi không xác định";
      errorsBySim.push({ simId: sim.id, number: sim.displayNumber, error: message });
      upserts.push({
        sim_id: sim.id,
        item_id: existingItemId ?? null,
        item_sku: sim.id,
        status: "failed",
        price: sim.price,
        stock: 1,
        last_synced_at: now,
        last_error: message.slice(0, 500),
      });
    }
  }

  // Lưu kết quả + log một lượt (không ghi DB cho từng SIM để đỡ round-trip).
  if (upserts.length > 0) {
    const { error: upsertError } = await db.from(TABLE_MAP).upsert(upserts, {
      onConflict: "sim_id",
    });
    if (upsertError) {
      throw new Error(`Sync xong nhưng không lưu được map: ${upsertError.message}`);
    }
  }

  const { error: logError } = await db.from(TABLE_LOG).insert({
    batch_id: batchId,
    kind: "sync",
    finished_at: now,
    total: result.total,
    created: result.created,
    updated: result.updated,
    failed: result.failed,
    skipped: result.skipped,
    errors: errorsBySim,
    created_by: createdBy,
  });
  if (logError) {
    // Không chặn kết quả: log lỗi không làm mất kết quả sync.
    console.error("[shopee-sync] Không ghi được log:", logError.message);
  }

  // Lưu token mới (nếu có) để lần sau không phải refresh lại.
  if (client.refreshedTokens) {
    await persistRefreshedTokens(client.refreshedTokens);
  }

  result.errors = errorsBySim;
  return result;
}

/** Dựng payload add_item/update_item cho một SIM. */
function buildItemPayload(
  sim: NormalizedSIM,
  categoryId: number,
  imageUrl: string,
): Record<string, unknown> {
  const name = `Sim số đẹp ${sim.displayNumber}`;

  return {
    category_id: categoryId,
    item_name: name,
    description: ITEM_DESCRIPTION,
    item_sku: sim.id,
    price: sim.price,
    stock: 1,
    image: { image_url_list: [imageUrl] },
    weight: String(ITEM_WEIGHT),
    condition: ITEM_CONDITION,
    attribute_list: [],
    item_status: "NORMAL",
    dimension: {
      package_length: 15,
      package_width: 10,
      package_height: 0.2,
    },
  };
}

/** Lấy danh sách item đã sync (kèm tình trạng) cho trang admin. */
export async function listSyncedItems() {
  const db = createAdminClient();
  const { data, error } = await db
    .from(TABLE_MAP)
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(500);
  if (error) throw new Error(`Không đọc được danh sách đã sync: ${error.message}`);
  return data ?? [];
}
