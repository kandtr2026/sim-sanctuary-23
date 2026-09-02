/**
 * Client Shopee Open API v2 (module Product): ký HMAC-SHA256, tự refresh
 * access_token, retry, throttle. Chỉ dùng thư viện có sẵn (crypto + fetch của Node).
 */

import { createHmac } from "crypto";
import {
  PATH_ADD_ITEM,
  PATH_DELETE_ITEM,
  PATH_GET_ATTRIBUTES,
  PATH_GET_CATEGORY,
  PATH_GET_ITEM_BASE_INFO,
  PATH_GET_ITEM_LIST,
  PATH_GET_MODEL_LIST,
  PATH_GET_LOGISTICS,
  PATH_TOKEN_REFRESH,
  PATH_UPDATE_ITEM,
  PATH_UPDATE_STOCK,
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

  async updateStock(itemId: number, stock: number): Promise<void> {
    await this.call(PATH_UPDATE_STOCK, {
      item_id: itemId,
      stock_list: [{ stock, seller_stock: [{ stock, location_id: "" }] }],
    });
  }

  async deleteItem(itemId: number, unlist = true): Promise<void> {
    await this.call(PATH_DELETE_ITEM, { item_id: itemId, unlist });
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
