/**
 * TikTok Shop Partner Open API client (order/revenue reporting).
 *
 * Server-side only — never import from a client component. Credentials stay
 * in process.env (set in Vercel/CI) and fall back to the gitignored
 * `.env.tiktok-shop` at the repo root for local development.
 *
 * Auth: access_token minted via the section-3a OAuth flow; requests are
 * signed with HMAC-SHA256 using app_secret (see OpenCode.md PHẦN 2).
 */

import { createHmac } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

export const TIKTOK_API_BASE = "https://open-api.tiktokglobalshop.com";
export const TIKTOK_ORDER_VERSION = "202309";

export class TikTokShopError extends Error {
  code: string | number | null;
  constructor(message: string, code: string | number | null = null) {
    super(message);
    this.name = "TikTokShopError";
    this.code = code;
  }
}

interface TikTokCreds {
  appKey: string;
  appSecret: string;
  accessToken: string;
  shopCipher: string;
}

function parseDotEnv(file: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    out[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return out;
}

/** Đọc credentials: ưu tiên process.env (Vercel/CI), fallback `.env.tiktok-shop`. */
export function loadCreds(env: NodeJS.ProcessEnv = process.env): TikTokCreds {
  const fromFile = !env.TIKTOK_APP_KEY
    ? parseDotEnv(join(process.cwd(), ".env.tiktok-shop"))
    : {};

  const get = (name: string) => (env[name] && env[name]!.trim()) || fromFile[name] || "";

  const appKey = get("TIKTOK_APP_KEY");
  const appSecret = get("TIKTOK_APP_SECRET");
  const accessToken = get("TIKTOK_ACCESS_TOKEN");
  const shopCipher = get("TIKTOK_SHOP_CIPHER");

  if (!appKey || !appSecret) {
    throw new TikTokShopError("Thiếu TIKTOK_APP_KEY / TIKTOK_APP_SECRET (xem .env.tiktok-shop).");
  }
  if (!accessToken || !shopCipher) {
    throw new TikTokShopError(
      "Thiếu TIKTOK_ACCESS_TOKEN / TIKTOK_SHOP_CIPHER — chưa hoàn tất bước 3a (ủy quyền OAuth).",
    );
  }
  return { appKey, appSecret, accessToken, shopCipher };
}

/** Chỉ lấy static credentials (appKey, appSecret, shopCipher), không cần accessToken. Dùng cho route refresh token. */
export function loadStaticCreds(env: NodeJS.ProcessEnv = process.env): Pick<TikTokCreds, "appKey" | "appSecret" | "shopCipher"> {
  const fromFile = !env.TIKTOK_APP_KEY
    ? parseDotEnv(join(process.cwd(), ".env.tiktok-shop"))
    : {};
  const get = (name: string) => (env[name] && env[name]!.trim()) || fromFile[name] || "";
  const appKey = get("TIKTOK_APP_KEY");
  const appSecret = get("TIKTOK_APP_SECRET");
  const shopCipher = get("TIKTOK_SHOP_CIPHER");
  if (!appKey || !appSecret) throw new TikTokShopError("Thiếu TIKTOK_APP_KEY / TIKTOK_APP_SECRET.");
  if (!shopCipher) throw new TikTokShopError("Thiếu TIKTOK_SHOP_CIPHER.");
  return { appKey, appSecret, shopCipher };
}

interface SignedUrl {
  url: string;
  headers: Record<string, string>;
  body: string | null;
}

/**
 * Tạo request đã ký theo thuật toán chính thức:
 * string_to_sign = app_secret + path + {queryKey}{queryValue}(đã sort) + [body] + app_secret
 * sign = HMAC-SHA256(string_to_sign, app_secret)
 */
export function signRequest(
  creds: TikTokCreds,
  method: string,
  path: string,
  queryParams: Record<string, string | number> = {},
  bodyObj: unknown = null,
): SignedUrl {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const params: Record<string, string> = {
    app_key: creds.appKey,
    timestamp,
    shop_cipher: creds.shopCipher,
    ...Object.fromEntries(Object.entries(queryParams).map(([k, v]) => [k, String(v)])),
  };

  const body = bodyObj === null ? null : JSON.stringify(bodyObj);

  let stringToSign = path;
  for (const key of Object.keys(params).sort()) {
    stringToSign += `${key}${params[key]}`;
  }
  if (body) stringToSign += body;
  stringToSign = creds.appSecret + stringToSign + creds.appSecret;

  const sign = createHmac("sha256", creds.appSecret).update(stringToSign).digest("hex");

  const qs = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join("&");

  return {
    url: `${TIKTOK_API_BASE}${path}?${qs}&sign=${sign}`,
    headers: {
      "Content-Type": "application/json",
      "x-tts-access-token": creds.accessToken,
    },
    body,
  };
}

/** Gọi API đã ký, kiểm tra code != 0 và ném lỗi rõ ràng. */
export async function callApi<T = unknown>(
  req: SignedUrl,
  method: string,
): Promise<T> {
  const res = await fetch(req.url, {
    method,
    headers: req.headers,
    body: req.body,
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as {
    code?: number;
    message?: string;
    data?: T;
    request_id?: string;
  };

  if (json.code !== 0) {
    throw new TikTokShopError(
      json.message || `Lỗi TikTok Shop (code ${json.code})`,
      json.code ?? null,
    );
  }
  return json.data as T;
}

// ---------- Order ----------

interface OrderSearchItem {
  id?: string;
  /** Trạng thái đơn: COMPLETED, AWAITING_SHIPMENT, IN_TRANSIT, CANCELLED, UNPAID… */
  status?: string;
  create_time?: number;
  currency?: string;
  payment?: { total_amount?: string | number; currency?: string };
  is_cod?: boolean;
  cancel_time?: number;
  cancel_reason?: string;
  cancellation_initiator?: string;
}

interface OrderSearchData {
  orders?: OrderSearchItem[];
  next_page_token?: string;
  total_count?: number;
}

/**
 * Lấy đơn hàng rồi lọc theo khoảng [from, to] (unix seconds) phía client.
 * TikTok API đôi khi bỏ qua create_time_from/to nên ta tự lọc để đảm bảo số
 * liệu đúng theo ngày được chọn. Tự phân trang tới khi hết hoặc đủ `maxOrders`.
 */
export async function getOrderList(
  from: number,
  to: number,
  opts: { maxOrders?: number; creds?: TikTokCreds } = {},
): Promise<OrderSearchItem[]> {
  const { maxOrders = 500 } = opts;
  const creds = opts.creds ?? loadCreds();
  const orders: OrderSearchItem[] = [];
  let pageToken: string | undefined;

  for (;;) {
    const body: Record<string, unknown> = {
      create_time_from: from,
      create_time_to: to,
      time_range_field: "CREATE_TIME",
    };

    const query: Record<string, string | number> = { page_size: 100 };
    if (pageToken) query.page_token = pageToken;

    const req = signRequest(
      creds,
      "POST",
      `/order/${TIKTOK_ORDER_VERSION}/orders/search`,
      query,
      body,
    );
    const data = await callApi<OrderSearchData>(req, "POST");

    const list = data?.orders ?? [];
    orders.push(...list);
    if (!data?.next_page_token || list.length === 0 || orders.length >= maxOrders) break;
    pageToken = data.next_page_token;
  }

  return orders
    .filter((o) => {
      const t = Number(o.create_time);
      return Number.isFinite(t) && t >= from && t <= to;
    })
    .slice(0, maxOrders);
}

/** Tổng hợp doanh thu/đơn: loại trừ đơn đã huỷ và chưa thanh toán. */
export function summarizeOrders(orders: OrderSearchItem[]) {
  const CANCELLED = "CANCELLED";
  const UNPAID = "UNPAID";

  const paidOrders = orders.filter((o) => o.status !== CANCELLED && o.status !== UNPAID);

  const toNum = (v: string | number | undefined): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const amountOf = (o: OrderSearchItem): number =>
    toNum(o.payment?.total_amount);

  const currency =
    paidOrders.find((o) => o.payment?.currency)?.payment?.currency ||
    paidOrders.find((o) => o.currency)?.currency ||
    "VND";

  const totalRevenue = paidOrders.reduce((s, o) => s + amountOf(o), 0);

  const byDay = new Map<string, { revenue: number; orders: number }>();
  for (const o of paidOrders) {
    const date = new Date((o.create_time ?? 0) * 1000);
    const key = isNaN(date.getTime())
      ? "không xác định"
      : `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const bucket = byDay.get(key) ?? { revenue: 0, orders: 0 };
    bucket.revenue += amountOf(o);
    bucket.orders += 1;
    byDay.set(key, bucket);
  }

  const daily = [...byDay.entries()]
    .map(([date, v]) => ({ date, ...v }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    total_orders: paidOrders.length,
    total_revenue: Math.round(totalRevenue * 100) / 100,
    currency,
    avg_order_value: paidOrders.length > 0 ? Math.round((totalRevenue / paidOrders.length) * 100) / 100 : 0,
    daily,
  };
}
