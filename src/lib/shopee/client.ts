/**
 * Client Shopee Open API v2 (module Product): ký HMAC-SHA256, tự refresh
 * access_token, retry, throttle. Chỉ dùng thư viện có sẵn (crypto + fetch của Node).
 */

import { createHmac } from "crypto";
import {
  PATH_ADD_ITEM,
  PATH_ADD_MODEL,
  PATH_DELETE_ITEM,
  PATH_DELETE_MODEL,
  PATH_GET_ATTRIBUTES,
  PATH_GET_CATEGORY,
  PATH_GET_ITEM_BASE_INFO,
  PATH_GET_ITEM_LIST,
  PATH_GET_MODEL_LIST,
  PATH_GET_ORDER_LIST,
  PATH_GET_ORDER_DETAIL,
  PATH_GET_LOGISTICS,
  PATH_INIT_TIER_VARIATION,
  PATH_UPDATE_TIER_VARIATION,
  PATH_TOKEN_REFRESH,
  PATH_UPDATE_ITEM,
  PATH_UPDATE_STOCK,
  PATH_UPDATE_PRICE,
} from "./config";

/** Error code Shopee trả về khi access_token hết hạn/sai. */
const TOKEN_ERRORS = new Set([
  "error_auth",
  "error_token",
  "invalid_access_token",
  "access_token_error",
]);

/**
 * Shopee hay trả code viết SAI CHÍNH TẢ (vd `invalid_acceess_token` — 2 chữ c)
 * khi token hết hạn. Khớp cứng theo danh sách sẽ bỏ sót, làm auto-refresh không
 * chạy dù refresh_token vẫn còn sống. Nên ngoài khớp code còn dò thêm message.
 */
function isTokenError(err: ShopeeApiError): boolean {
  if (TOKEN_ERRORS.has(err.code)) return true;
  const text = `${err.code} ${err.message}`.toLowerCase();
  return (
    text.includes("access_token") ||
    text.includes("token expired") ||
    text.includes("token invalid") ||
    text.includes("invalid token") ||
    text.includes("authorization")
  );
}

const RETRYABLE_ERRORS = new Set(["error_server", "error_busy", "error_inner"]);

export class ShopeeApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly path: string,
  ) {
    super(`[${code}] ${message} (path=${path})`);
    this.name = "ShopeeApiError";
  }
}

export interface ShopeeCreds {
  partnerId: number;
  partnerKey: string;
  shopId: number;
  accessToken: string;
  refreshToken: string;
  host: string;
}

export class ShopeeProductClient {
  private lastCall = 0;
  public callCount = 0;

  /** Token mới sau khi refresh — caller lưu lại để lần sync sau dùng. */
  public refreshedTokens: { accessToken: string; refreshToken: string } | null = null;

  constructor(
    private creds: ShopeeCreds,
    private readonly minIntervalMs = 350, // ~3 req/s
    private readonly timeoutMs = 15000,
  ) {}

  private sign(path: string, ts: number): string {
    let base = `${this.creds.partnerId}${path}${ts}`;
    if (this.creds.accessToken) base += `${this.creds.accessToken}${this.creds.shopId}`;
    return createHmac("sha256", this.creds.partnerKey).update(base).digest("hex");
  }

  private async throttle(): Promise<void> {
    const gap = Date.now() - this.lastCall;
    if (gap < this.minIntervalMs) {
      await new Promise((r) => setTimeout(r, this.minIntervalMs - gap));
    }
    this.lastCall = Date.now();
  }

  private buildUrl(path: string, query: Record<string, unknown> = {}): string {
    const ts = Math.floor(Date.now() / 1000);
    const params = new URLSearchParams({
      partner_id: String(this.creds.partnerId),
      timestamp: String(ts),
      sign: this.sign(path, ts),
    });
    if (this.creds.accessToken) {
      params.set("access_token", this.creds.accessToken);
      params.set("shop_id", String(this.creds.shopId));
    }
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      if (Array.isArray(v)) {
        for (const item of v) {
          params.append(k, String(item));
        }
      } else {
        params.set(k, String(v));
      }
    }
    return `${this.creds.host}${path}?${params.toString()}`;
  }

  private async rawCall(
    path: string,
    body: Record<string, unknown> = {},
    query: Record<string, unknown> = {},
    method: "GET" | "POST" = "POST",
  ): Promise<Record<string, unknown>> {
    await this.throttle();
    this.callCount++;

    const url = this.buildUrl(path, query);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        ...(method === "POST" ? { body: JSON.stringify(body) } : {}),
        signal: controller.signal,
      });
      const text = await res.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new ShopeeApiError(
          "bad_json",
          `HTTP ${res.status}: ${text.slice(0, 200)}`,
          path,
        );
      }
      const json = parsed as Record<string, unknown>;
      // Shopee trả HTTP 200 kèm field `error` khi thất bại.
      const code = String(json?.error || "");
      if (code) {
        throw new ShopeeApiError(code, String(json?.message || "unknown"), path);
      }
      return (json?.response as Record<string, unknown>) ?? json ?? {};
    } finally {
      clearTimeout(timer);
    }
  }

  /** Gọi API, tự refresh token 1 lần nếu hết hạn, retry backoff cho lỗi server. */
  async call(
    path: string,
    body: Record<string, unknown> = {},
    query: Record<string, unknown> = {},
    method: "GET" | "POST" = "POST",
  ): Promise<Record<string, unknown>> {
    let refreshed = false;
    let lastErr: unknown;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        return await this.rawCall(path, body, query, method);
      } catch (err) {
        lastErr = err;

        if (err instanceof ShopeeApiError && isTokenError(err) && !refreshed) {
          refreshed = true;
          await this.refreshAccessToken();
          continue; // thử lại ngay với token mới, không tính vào backoff
        }

        const retryable =
          (err instanceof ShopeeApiError && RETRYABLE_ERRORS.has(err.code)) ||
          (err as { name?: string })?.name === "AbortError" ||
          (err as { code?: string })?.code === "ECONNRESET";

        if (retryable && attempt < 3) {
          await new Promise((r) => setTimeout(r, 500 * attempt));
          continue;
        }
        throw err;
      }
    }
    throw lastErr;
  }

  private async refreshAccessToken(): Promise<void> {
    if (!this.creds.refreshToken) {
      throw new ShopeeApiError(
        "no_refresh_token",
        "access_token hết hạn và không có refresh_token để làm mới — cần uỷ quyền lại shop",
        PATH_TOKEN_REFRESH,
      );
    }

    const ts = Math.floor(Date.now() / 1000);
    const sign = createHmac("sha256", this.creds.partnerKey)
      .update(`${this.creds.partnerId}${PATH_TOKEN_REFRESH}${ts}`)
      .digest("hex");
    const url =
      `${this.creds.host}${PATH_TOKEN_REFRESH}` +
      `?partner_id=${this.creds.partnerId}&timestamp=${ts}&sign=${sign}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refresh_token: this.creds.refreshToken,
        partner_id: this.creds.partnerId,
        shop_id: this.creds.shopId,
      }),
    });
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (body?.error || !body?.access_token) {
      throw new ShopeeApiError(
        String(body?.error || "refresh_failed"),
        String(body?.message || "không làm mới được token"),
        PATH_TOKEN_REFRESH,
      );
    }

    this.creds.accessToken = String(body.access_token);
    if (body.refresh_token) this.creds.refreshToken = String(body.refresh_token);
    this.refreshedTokens = {
      accessToken: this.creds.accessToken,
      refreshToken: this.creds.refreshToken,
    };
  }

  // ── Product methods ──────────────────────────────────────────────────────────

  async addItem(payload: Record<string, unknown>): Promise<{ item_id: number }> {
    const resp = await this.call(PATH_ADD_ITEM, payload);
    const itemId = Number(resp?.item_id || 0);
    if (!itemId) {
      throw new ShopeeApiError("missing_item_id", "Shopee không trả item_id", PATH_ADD_ITEM);
    }
    return { item_id: itemId };
  }

  async updateItem(payload: Record<string, unknown>): Promise<void> {
    await this.call(PATH_UPDATE_ITEM, payload);
  }

  async getItemList(page: number, pageSize: number): Promise<Record<string, unknown>> {
    const resp = await this.call(
      PATH_GET_ITEM_LIST,
      {},
      { offset: page * pageSize, page_size: pageSize, item_status: "NORMAL" },
      "GET",
    );
    return resp ?? {};
  }

  async getItemBaseInfo(itemIds: number[]): Promise<Record<string, unknown>> {
    return this.call(PATH_GET_ITEM_BASE_INFO, {}, { item_id_list: itemIds }, "GET");
  }

  /** Lấy danh sách model (biến thể) của một item — để có giá/kho khi item có model. */
  async getModelList(itemId: number): Promise<Record<string, unknown>> {
    return this.call(PATH_GET_MODEL_LIST, {}, { item_id: itemId }, "GET");
  }

  /**
   * Danh sách đơn trong khoảng [timeFrom, timeTo] (epoch GIÂY, cửa sổ ≤15 ngày).
   * Chỉ trả order_sn + order_status → phải gọi getOrderDetail để có sản phẩm/tiền.
   * Phân trang bằng cursor: đọc more/next_cursor ở response.
   */
  async getOrderList(params: {
    timeFrom: number;
    timeTo: number;
    cursor?: string;
    pageSize?: number;
  }): Promise<Record<string, unknown>> {
    return this.call(
      PATH_GET_ORDER_LIST,
      {},
      {
        time_range_field: "create_time",
        time_from: params.timeFrom,
        time_to: params.timeTo,
        page_size: params.pageSize ?? 100,
        cursor: params.cursor ?? "",
        response_optional_fields: "order_status",
      },
      "GET",
    );
  }

  /**
   * Chi tiết đơn theo lô ≤50 order_sn. order_sn_list phải là CHUỖI nối dấu phẩy
   * (không để buildUrl bung mảng thành key trùng). Phải xin response_optional_fields
   * = item_list mới có danh sách sản phẩm.
   */
  async getOrderDetail(orderSnList: string[]): Promise<Record<string, unknown>> {
    return this.call(
      PATH_GET_ORDER_DETAIL,
      {},
      {
        order_sn_list: orderSnList.join(","),
        response_optional_fields: "item_list,order_status",
      },
      "GET",
    );
  }

  /**
   * Thêm model (biến thể) mới vào item ĐÃ có tier_variation.
   * Option tương ứng phải được đăng ký trước qua updateTierVariation.
   */
  async addModel(itemId: number, model: Record<string, unknown>): Promise<void> {
    await this.call(PATH_ADD_MODEL, {
      item_id: itemId,
      model_list: [model],
    });
  }

  /** Thêm NHIỀU model (biến thể) trong một lần gọi — dùng cho đồng bộ lô. */
  async addModels(itemId: number, modelList: Record<string, unknown>[]): Promise<void> {
    await this.call(PATH_ADD_MODEL, {
      item_id: itemId,
      model_list: modelList,
    });
  }

  /**
   * Khởi tạo biến thể LẦN ĐẦU cho item chưa có biến thể (standard → tiered).
   * Item đã có biến thể mà gọi lại sẽ bị Shopee chặn "The level of tier-variation
   * not change" — trường hợp đó dùng updateTierVariation + addModel.
   */
  async initTierVariation(payload: {
    item_id: number;
    tier_variation: Record<string, unknown>[];
    model: Record<string, unknown>[];
  }): Promise<{ error: string | null }> {
    await this.call(PATH_INIT_TIER_VARIATION, payload);
    return { error: null };
  }

  /**
   * Cập nhật cây biến thể của item đã có biến thể: thêm/sửa option trong
   * tier_variation, đồng thời khai lại map model_id ↔ tier_index của các model
   * hiện có (Shopee bắt buộc). KHÔNG tạo model mới — model mới thêm qua addModel.
   */
  async updateTierVariation(payload: {
    item_id: number;
    tier_variation: Record<string, unknown>[];
    model: Record<string, unknown>[];
  }): Promise<void> {
    await this.call(PATH_UPDATE_TIER_VARIATION, payload);
  }

  /** Đổi giá gốc của một model (biến thể) cụ thể. */
  async updatePrice(itemId: number, modelId: number, originalPrice: number): Promise<void> {
    await this.call(PATH_UPDATE_PRICE, {
      item_id: itemId,
      price_list: [{ model_id: modelId, original_price: originalPrice }],
    });
  }

  async updateStock(itemId: number, stock: number): Promise<void> {
    await this.call(PATH_UPDATE_STOCK, {
      item_id: itemId,
      stock_list: [{ stock, seller_stock: [{ stock, location_id: "" }] }],
    });
  }

  /** Set stock cho một model cụ thể. stock=0 (mặc định) = xoá khỏi danh sách mua được. */
  async updateModelStock(itemId: number, modelId: number, stock = 0): Promise<void> {
    await this.call(PATH_UPDATE_STOCK, {
      item_id: itemId,
      stock_list: [{ model_id: modelId, seller_stock: [{ stock, location_id: "" }] }],
    });
  }

  async deleteItem(itemId: number, unlist = true): Promise<void> {
    await this.call(PATH_DELETE_ITEM, { item_id: itemId, unlist });
  }

  /** Xoá hẳn một model (biến thể/số) khỏi item. Khác updateModelStock (chỉ set kho=0). */
  async deleteModel(itemId: number, modelId: number): Promise<void> {
    // Shopee delete_model nhận model_id (số ít), không phải model_id_list.
    await this.call(PATH_DELETE_MODEL, {
      item_id: itemId,
      model_id: modelId,
    });
  }

  async getCategories(country = "VN"): Promise<Record<string, unknown>[]> {
    const resp = await this.call(PATH_GET_CATEGORY, {}, { country }, "GET");
    const list = (resp?.category_list ?? []) as Record<string, unknown>[];
    return list ?? [];
  }

  async getAttributes(categoryId: number, country = "VN"): Promise<Record<string, unknown>[]> {
    const resp = await this.call(PATH_GET_ATTRIBUTES, {}, { category_id: categoryId, country }, "GET");
    const list = (resp?.attribute_list ?? []) as Record<string, unknown>[];
    return list ?? [];
  }

  async getLogistics(country = "VN"): Promise<Record<string, unknown>[]> {
    const resp = await this.call(PATH_GET_LOGISTICS, {}, { country }, "GET");
    const list = (resp?.logistics_list ?? []) as Record<string, unknown>[];
    return list ?? [];
  }
}
