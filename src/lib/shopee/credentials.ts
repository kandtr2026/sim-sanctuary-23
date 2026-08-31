/**
 * Nơi duy nhất lấy/lưu credential + cài đặt đăng bán Shopee.
 *
 * TẠI SAO NẰM Ở DB CHỨ KHÔNG PHẢI ENV:
 * access_token của Shopee hết hạn sau 4 tiếng. Vercel là serverless nên không
 * ghi lại được biến môi trường của chính nó — nếu chỉ dựa vào env thì mỗi lần
 * function khởi động lạnh lại phải refresh, và tệ hơn là refresh_token mới do
 * Shopee cấp sẽ mất, đến lúc refresh_token cũ hết hạn thì phải uỷ quyền lại tay.
 * Lưu vào DB thì token sống qua các lần gọi và tự làm mới được.
 *
 * ENV vẫn được đọc như phương án dự phòng để tương thích cách cấu hình cũ, còn
 * bản trong DB luôn thắng.
 *
 * Mọi truy vấn ở đây đi bằng service role: các bảng shopee_* bật RLS mà không
 * có policy nào nên authenticated cũng không đọc được.
 */

import { createHmac } from "crypto";
import { createAdminClient } from "./admin";
import { decryptSecret, encryptSecret, maskSecret } from "./crypto";
import { PATH_AUTH_PARTNER, PATH_TOKEN_GET, SHOPEE_HOSTS } from "./config";
import { ShopeeApiError, type ShopeeCreds } from "./client";

/** Bản ghi duy nhất: shop này chỉ nối một shop Shopee. */
const ROW_ID = "default";

const TABLE_CRED = "shopee_credential";
const TABLE_SETTINGS = "shopee_settings";

export interface CredentialStatus {
  configured: boolean;
  authorized: boolean;
  partnerId: string | null;
  shopId: string | null;
  env: string;
  partnerKeyMasked: string;
  tokenExpiresAt: string | null;
  tokenExpired: boolean;
  authorizedAt: string | null;
  updatedBy: string | null;
  source: "db" | "env" | "none";
}

export interface ShopeeSettings {
  categoryId: number | null;
  imageUrl: string | null;
  logisticId: number | null;
}

interface CredentialRow {
  id: string;
  partner_id: number | string;
  shop_id: number | string;
  partner_key_enc: string;
  access_token_enc: string | null;
  refresh_token_enc: string | null;
  env: string;
  token_expires_at: string | null;
  authorized_at: string | null;
  updated_by: string | null;
}

/** Lỗi cấu hình/nhập liệu — route handler map thành HTTP 400. */
export class ShopeeConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ShopeeConfigError";
  }
}

async function readRow(): Promise<CredentialRow | null> {
  const db = createAdminClient();
  const { data, error } = await db
    .from(TABLE_CRED)
    .select("*")
    .eq("id", ROW_ID)
    .maybeSingle();
  if (error) throw new Error(`Không đọc được credential Shopee: ${error.message}`);
  return (data as CredentialRow | null) ?? null;
}

function credsFromEnvRaw(): ShopeeCreds | null {
  const partnerId = Number(process.env.SHOPEE_PARTNER_ID || 0);
  const partnerKey = process.env.SHOPEE_PARTNER_KEY || "";
  if (!partnerId || !partnerKey) return null;
  return {
    partnerId,
    partnerKey,
    // Chưa biết shop_id thì dùng 0 tạm — uỷ quyền sẽ ghi shop_id thật vào DB.
    shopId: Number(process.env.SHOPEE_SHOP_ID || 0),
    accessToken: process.env.SHOPEE_ACCESS_TOKEN || "",
    refreshToken: process.env.SHOPEE_REFRESH_TOKEN || "",
    host: SHOPEE_HOSTS[process.env.SHOPEE_ENV || "live"] || SHOPEE_HOSTS.live,
  };
}

/** Credential dùng để gọi API. null = chưa cấu hình. */
export async function getCreds(): Promise<ShopeeCreds | null> {
  const row = await readRow();
  if (row) {
    try {
      return {
        partnerId: Number(row.partner_id),
        partnerKey: decryptSecret(row.partner_key_enc),
        shopId: Number(row.shop_id),
        accessToken: row.access_token_enc ? decryptSecret(row.access_token_enc) : "",
        refreshToken: row.refresh_token_enc ? decryptSecret(row.refresh_token_enc) : "",
        host: SHOPEE_HOSTS[row.env] || SHOPEE_HOSTS.live,
      };
    } catch {
      // Sai key giải mã (thường do xoay SUPABASE_SERVICE_ROLE_KEY). Không rơi
      // ngầm về env vì như vậy sẽ khó hiểu tại sao lại đang dùng shop khác.
      throw new ShopeeConfigError(
        "Không giải mã được credential Shopee đã lưu (SUPABASE_SERVICE_ROLE_KEY/SHOPEE_CRED_KEY có thể đã đổi). Hãy khai báo và uỷ quyền lại.",
      );
    }
  }
  return credsFromEnvRaw();
}

export async function status(): Promise<CredentialStatus> {
  const row = await readRow();
  if (row) {
    let partnerKeyMasked = "****";
    try {
      partnerKeyMasked = maskSecret(decryptSecret(row.partner_key_enc));
    } catch {
      partnerKeyMasked = "(không giải mã được)";
    }
    const expired =
      !!row.token_expires_at && new Date(row.token_expires_at).getTime() < Date.now();
    const shopIdNum = Number(row.shop_id);
    return {
      configured: true,
      authorized: !!row.access_token_enc,
      partnerId: String(row.partner_id),
      shopId: shopIdNum ? String(shopIdNum) : null,
      env: row.env,
      partnerKeyMasked,
      tokenExpiresAt: row.token_expires_at,
      // Hết hạn không có nghĩa là mất quyền: còn refresh_token là tự làm mới được.
      tokenExpired: expired,
      authorizedAt: row.authorized_at,
      updatedBy: row.updated_by,
      source: "db",
    };
  }

  const env = credsFromEnvRaw();
  if (env) {
    return {
      configured: true,
      authorized: !!env.accessToken,
      partnerId: String(env.partnerId),
      shopId: String(env.shopId),
      env: process.env.SHOPEE_ENV || "live",
      partnerKeyMasked: maskSecret(env.partnerKey),
      tokenExpiresAt: null,
      tokenExpired: false,
      authorizedAt: null,
      updatedBy: null,
      source: "env",
    };
  }

  return {
    configured: false,
    authorized: false,
    partnerId: null,
    shopId: null,
    env: "live",
    partnerKeyMasked: "",
    tokenExpiresAt: null,
    tokenExpired: false,
    authorizedAt: null,
    updatedBy: null,
    source: "none",
  };
}

/**
 * Lưu partner_id / partner_key / shop_id. Chưa có token — phải uỷ quyền sau.
 * Đổi partner_key hoặc shop_id thì token cũ vô nghĩa nên xoá luôn.
 */
export async function saveConfig(input: {
  partnerId: number;
  partnerKey: string;
  shopId: number;
  env: string;
  updatedBy: string;
}): Promise<CredentialStatus> {
  const env = input.env === "sandbox" ? "sandbox" : "live";
  const existing = await readRow();

  const identityChanged =
    !existing ||
    Number(existing.shop_id) !== input.shopId ||
    Number(existing.partner_id) !== input.partnerId ||
    existing.env !== env;

  // Bỏ trống partnerKey = giữ nguyên key cũ. Trường hợp chưa từng có key ở đâu
  // (không có DB lẫn env) thì phải nhập — không được ghi key rỗng vào DB vì sẽ
  // làm hỏng cấu hình đang chạy (env thắng không còn nữa khi có dòng DB).
  let partnerKey = input.partnerKey;
  if (!partnerKey) {
    if (existing) {
      try {
        partnerKey = decryptSecret(existing.partner_key_enc);
      } catch {
        throw new ShopeeConfigError("Key hiện tại không giải mã được — hãy nhập lại Partner Key.");
      }
    } else {
      const fromEnv = process.env.SHOPEE_PARTNER_KEY || "";
      if (fromEnv) partnerKey = fromEnv;
      else throw new ShopeeConfigError("Phải nhập Partner Key lần đầu.");
    }
  }

  const row = {
    id: ROW_ID,
    partner_id: input.partnerId,
    shop_id: input.shopId,
    partner_key_enc: encryptSecret(partnerKey),
    env,
    updated_by: input.updatedBy,
    updated_at: new Date().toISOString(),
    ...(identityChanged
      ? {
          access_token_enc: null,
          refresh_token_enc: null,
          token_expires_at: null,
          authorized_at: null,
        }
      : {}),
  };

  const db = createAdminClient();
  const { error } = await db.from(TABLE_CRED).upsert(row, { onConflict: "id" });
  if (error) throw new Error(`Không lưu được cấu hình Shopee: ${error.message}`);

  return status();
}

/** Ghi token mới sau khi uỷ quyền hoặc refresh. */
export async function saveTokens(input: {
  accessToken: string;
  refreshToken: string;
  expiresInSec?: number | null;
  markAuthorized?: boolean;
}): Promise<void> {
  const expiresAt =
    input.expiresInSec && input.expiresInSec > 0
      ? new Date(Date.now() + input.expiresInSec * 1000).toISOString()
      : null;

  const patch: Record<string, unknown> = {
    access_token_enc: encryptSecret(input.accessToken),
    refresh_token_enc: input.refreshToken ? encryptSecret(input.refreshToken) : null,
    updated_at: new Date().toISOString(),
  };
  if (expiresAt) patch.token_expires_at = expiresAt;
  if (input.markAuthorized) patch.authorized_at = new Date().toISOString();

  const db = createAdminClient();
  const { error } = await db.from(TABLE_CRED).update(patch).eq("id", ROW_ID);
  if (error) throw new Error(`Không lưu được token Shopee: ${error.message}`);
}

/**
 * Lưu token vừa refresh. Bọc try/catch: sync đã lấy được số liệu rồi, không để
 * lỗi ghi DB làm hỏng cả lượt sync — lần sau chỉ tốn thêm một lần refresh.
 */
export async function persistRefreshedTokens(tokens: {
  accessToken: string;
  refreshToken: string;
}): Promise<void> {
  try {
    const row = await readRow();
    if (!row) {
      // Đang đọc từ env: không có dòng nào để ghi vào.
      return;
    }
    // Shopee không trả expire_in ở refresh: mặc định 4 tiếng theo tài liệu.
    await saveTokens({ ...tokens, expiresInSec: 4 * 3600 });
  } catch {
    // Cố tình bỏ qua: không chặn kết quả sync vì lỗi ghi token.
  }
}

export async function clearCreds(): Promise<void> {
  const db = createAdminClient();
  const { error } = await db.from(TABLE_CRED).delete().eq("id", ROW_ID);
  if (error) throw new Error(`Không xoá được credential Shopee: ${error.message}`);
}

/**
 * Link để chủ shop bấm đồng ý. Sau khi đồng ý Shopee chuyển về `redirect`
 * kèm ?code=...&shop_id=...
 *
 * `redirect` phải trùng domain đã khai trên Shopee Open Platform, nếu không
 * Shopee từ chối. Giá trị này luôn do server dựng (domain của chính app),
 * KHÔNG lấy từ body client — nếu không thì ai cũng đổi được redirect và lấy
 * mất `code` uỷ quyền.
 */
export async function buildAuthUrl(redirect: string): Promise<string> {
  const creds = await getCreds();
  if (!creds) {
    throw new ShopeeConfigError("Chưa khai báo partner_id/partner_key/shop_id.");
  }
  const ts = Math.floor(Date.now() / 1000);
  const sign = createHmac("sha256", creds.partnerKey)
    .update(`${creds.partnerId}${PATH_AUTH_PARTNER}${ts}`)
    .digest("hex");
  const params = new URLSearchParams({
    partner_id: String(creds.partnerId),
    timestamp: String(ts),
    sign,
    redirect,
  });
  return `${creds.host}${PATH_AUTH_PARTNER}?${params.toString()}`;
}

/** Đổi `code` thành access_token + refresh_token rồi lưu. */
export async function exchangeCode(
  code: string,
  shopIdOverride?: number,
): Promise<CredentialStatus> {
  const creds = await getCreds();
  if (!creds) {
    throw new ShopeeConfigError("Chưa khai báo partner_id/partner_key/shop_id.");
  }
  const shopId = shopIdOverride || creds.shopId;

  const ts = Math.floor(Date.now() / 1000);
  const sign = createHmac("sha256", creds.partnerKey)
    .update(`${creds.partnerId}${PATH_TOKEN_GET}${ts}`)
    .digest("hex");
  const url =
    `${creds.host}${PATH_TOKEN_GET}` +
    `?partner_id=${creds.partnerId}&timestamp=${ts}&sign=${sign}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code, shop_id: shopId, partner_id: creds.partnerId }),
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (body?.error || !body?.access_token) {
    throw new ShopeeApiError(
      String(body?.error || "token_get_failed"),
      String(body?.message || "không lấy được access_token từ code"),
      PATH_TOKEN_GET,
    );
  }

  const db = createAdminClient();
  const row = await readRow();
  if (!row) {
    // Chưa có bản ghi DB (đang dùng env): tạo mới để token có chỗ lưu.
    const { error } = await db.from(TABLE_CRED).insert({
      id: ROW_ID,
      partner_id: creds.partnerId,
      shop_id: shopId,
      partner_key_enc: encryptSecret(creds.partnerKey),
      env: process.env.SHOPEE_ENV === "sandbox" ? "sandbox" : "live",
    });
    if (error) throw new Error(`Không tạo được credential Shopee: ${error.message}`);
  } else if (Number(row.shop_id) !== shopId) {
    const { error } = await db
      .from(TABLE_CRED)
      .update({ shop_id: shopId })
      .eq("id", ROW_ID);
    if (error) throw new Error(`Không cập nhật được shop_id: ${error.message}`);
  }

  await saveTokens({
    accessToken: String(body.access_token),
    refreshToken: String(body.refresh_token || ""),
    expiresInSec: Number(body.expire_in || 0) || 4 * 3600,
    markAuthorized: true,
  });

  return status();
}

// ── Cài đặt đăng bán ──────────────────────────────────────────────────────────

export async function getSettings(): Promise<ShopeeSettings> {
  const db = createAdminClient();
  const { data, error } = await db
    .from(TABLE_SETTINGS)
    .select("*")
    .eq("id", ROW_ID)
    .maybeSingle();
  if (error) throw new Error(`Không đọc được cài đặt Shopee: ${error.message}`);
  const row = (data as (ShopeeSettings & { id: string }) | null) ?? null;
  return row
    ? {
        categoryId: row.categoryId ?? null,
        imageUrl: row.imageUrl ?? null,
        logisticId: row.logisticId ?? null,
      }
    : { categoryId: null, imageUrl: null, logisticId: null };
}

export async function saveSettings(input: Partial<ShopeeSettings>): Promise<ShopeeSettings> {
  const db = createAdminClient();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.categoryId !== undefined) patch.category_id = input.categoryId;
  if (input.imageUrl !== undefined) patch.image_url = input.imageUrl;
  if (input.logisticId !== undefined) patch.logistic_id = input.logisticId;

  const { error } = await db.from(TABLE_SETTINGS).upsert({ id: ROW_ID, ...patch });
  if (error) throw new Error(`Không lưu được cài đặt Shopee: ${error.message}`);
  return getSettings();
}
