/**
 * Lưu trữ + tự refresh token TikTok Shop trong Supabase (`tiktok_tokens`).
 *
 * API route dùng `requireAdmin` để có session token của admin, rồi gọi các hàm
 * này để đọc/ghi token TikTok Shop qua Supabase REST (RLS chỉ admin mới truy
 * cập). Khi access_token sắp hết hạn, gọi endpoint refresh của TikTok và ghi
 * bộ token mới vào DB — không cần sửa `.env.tiktok-shop` bằng tay.
 */

import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/config";
import { TikTokShopError } from "./client";

export interface StoredTokens {
  access_token: string;
  refresh_token: string;
  access_token_expire_at: number;
  refresh_token_expire_at: number;
}

interface Row extends StoredTokens {
  id: number;
  updated_at?: string;
}

function restHeaders(adminToken: string) {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${adminToken}`,
    "Content-Type": "application/json",
  };
}

async function readRow(adminToken: string): Promise<Row | null> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/tiktok_tokens?id=eq.1&select=*`, {
    headers: restHeaders(adminToken),
    cache: "no-store",
  });
  if (!res.ok) throw new TikTokShopError(`Không đọc được token TikTok từ DB (${res.status})`);
  const rows = (await res.json().catch(() => [])) as Row[];
  return rows[0] ?? null;
}

async function writeRow(adminToken: string, tokens: StoredTokens): Promise<void> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/tiktok_tokens?id=eq.1`, {
    method: "PATCH",
    headers: restHeaders(adminToken),
    body: JSON.stringify({ ...tokens, updated_at: new Date().toISOString() }),
  });
  if (res.status !== 204) {
    throw new TikTokShopError(`Không cập nhật được token TikTok trong DB (${res.status})`);
  }
}

interface RefreshResponseData {
  access_token: string;
  access_token_expire_in: number;
  refresh_token: string;
  refresh_token_expire_in: number;
}

/** Refresh token qua endpoint chính thức của TikTok. */
async function refreshTokens(creds: {
  appKey: string;
  appSecret: string;
  refreshToken: string;
}): Promise<StoredTokens> {
  const url =
    `https://auth.tiktok-shops.com/api/v2/token/refresh` +
    `?app_key=${encodeURIComponent(creds.appKey)}` +
    `&app_secret=${encodeURIComponent(creds.appSecret)}` +
    `&refresh_token=${encodeURIComponent(creds.refreshToken)}` +
    `&grant_type=refresh_token`;

  const res = await fetch(url, { cache: "no-store" });
  const json = (await res.json().catch(() => ({}))) as {
    code?: number;
    message?: string;
    data?: RefreshResponseData;
  };

  if (json.code !== 0 || !json.data?.access_token) {
    throw new TikTokShopError(
      `Refresh token thất bại: ${json.message || "không rõ lỗi"}`,
      json.code ?? null,
    );
  }

  const d = json.data;
  return {
    access_token: d.access_token,
    refresh_token: d.refresh_token,
    access_token_expire_at: d.access_token_expire_in,
    refresh_token_expire_at: d.refresh_token_expire_in,
  };
}

export interface TikTokCredsWithToken {
  appKey: string;
  appSecret: string;
  shopCipher: string;
  accessToken: string;
}

/**
 * Trả về access_token còn hiệu lực (tự refresh nếu hết hạn / sắp hết hạn).
 * Nhận app_key/app_secret/shop_cipher từ loadCreds() để không phụ thuộc DB.
 */
export async function getFreshAccessToken(
  adminToken: string,
  staticCreds: { appKey: string; appSecret: string; shopCipher: string },
): Promise<TikTokCredsWithToken> {
  const nowSec = Math.floor(Date.now() / 1000);
  const row = await readRow(adminToken);

  if (!row) {
    throw new TikTokShopError(
      "Chưa có token TikTok Shop trong DB — seed lần đầu bằng script seed-tiktok-token (xem OpenCode.md PHẦN 2 mục 3a).",
    );
  }

  // Hạn 5 phút trước khi thật sự hết hạn để tránh race.
  if (row.access_token_expire_at - 300 > nowSec) {
    return { ...staticCreds, accessToken: row.access_token };
  }

  const fresh = await refreshTokens({
    appKey: staticCreds.appKey,
    appSecret: staticCreds.appSecret,
    refreshToken: row.refresh_token,
  });
  await writeRow(adminToken, fresh);
  return { ...staticCreds, accessToken: fresh.access_token };
}
