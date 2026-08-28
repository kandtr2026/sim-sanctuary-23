/**
 * Seed token TikTok Shop từ .env.tiktok-shop vào bảng `tiktok_tokens` (Supabase).
 *
 * Yêu cầu trước: bảng đã được tạo trong Supabase SQL Editor (xem
 * `supabase/migrations/20260828120000_tiktok_tokens.sql`).
 *
 * Chạy:  node scripts/seed-tiktok-token.mjs
 * Đọc creds từ .env.opencode-bot (BOT_* để login admin) + .env.tiktok-shop (token).
 */

import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, "..");

function loadEnvFile(file) {
  const out = {};
  if (!existsSync(file)) return out;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    out[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
  }
  return out;
}

const bot = loadEnvFile(join(ROOT, ".env.opencode-bot"));
const tts = loadEnvFile(join(ROOT, ".env.tiktok-shop"));

const url = bot.BOT_SUPABASE_URL;
const apikey = bot.BOT_SUPABASE_APIKEY;
const email = bot.BOT_EMAIL;
const password = bot.BOT_PASSWORD;

if (!url || !apikey || !email || !password) {
  console.error("Thiếu BOT_* trong .env.opencode-bot");
  process.exit(1);
}
const required = [
  "TIKTOK_ACCESS_TOKEN",
  "TIKTOK_ACCESS_TOKEN_EXPIRE_AT",
  "TIKTOK_REFRESH_TOKEN",
  "TIKTOK_REFRESH_TOKEN_EXPIRE_AT",
];
for (const k of required) {
  if (!tts[k]) {
    console.error(`Thiếu ${k} trong .env.tiktok-shop`);
    process.exit(1);
  }
}

const auth = await fetch(`${url}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey, "Content-Type": "application/json" },
  body: JSON.stringify({ email, password }),
}).then((r) => r.json());

if (!auth.access_token) {
  console.error("Đăng nhập admin thất bại:", auth.error_description || auth.msg);
  process.exit(1);
}

const body = {
  id: 1,
  access_token: tts.TIKTOK_ACCESS_TOKEN,
  refresh_token: tts.TIKTOK_REFRESH_TOKEN,
  access_token_expire_at: Number(tts.TIKTOK_ACCESS_TOKEN_EXPIRE_AT),
  refresh_token_expire_at: Number(tts.TIKTOK_REFRESH_TOKEN_EXPIRE_AT),
};

const res = await fetch(`${url}/rest/v1/tiktok_tokens`, {
  method: "POST",
  headers: {
    apikey,
    Authorization: `Bearer ${auth.access_token}`,
    "Content-Type": "application/json",
    Prefer: "resolution=merge-duplicates",
  },
  body: JSON.stringify(body),
});

if (res.status === 201 || res.status === 200 || res.status === 204) {
  console.log("Đã seed token vào bảng tiktok_tokens (id=1).");
} else {
  console.error("Seed thất bại:", res.status, await res.text());
  process.exit(1);
}
