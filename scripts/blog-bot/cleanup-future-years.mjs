/**
 * Dọn các bài "sim hợp tuổi <năm>" mà bot CŨ tự đẻ cho năm TƯƠNG LAI vô nghĩa
 * (2027, 2039, 2044, 2045… trong khi mới 2026). Rule sinh ra chúng đã bỏ trong
 * topics.mjs/index.mjs; script này dọn các bài ĐÃ đăng còn sót trong blog_posts.
 *
 * Chạy TAY, KHÔNG nằm trong cron. AN TOÀN: mặc định chỉ LIỆT KÊ (dry-run) — phải
 * thêm cờ --yes mới xoá thật.
 *
 * Dùng (Node 18+), ở thư mục gốc repo (cần .env.opencode-bot như blog-bot):
 *   node scripts/blog-bot/cleanup-future-years.mjs                 # liệt kê bài năm > năm hiện tại
 *   node scripts/blog-bot/cleanup-future-years.mjs --yes           # XOÁ bài năm > năm hiện tại
 *   node scripts/blog-bot/cleanup-future-years.mjs --after=2000 --yes   # XOÁ mọi năm > 2000 (giữ 1989–2000)
 *
 * Env: giống index.mjs — BOT_SUPABASE_URL, BOT_SUPABASE_APIKEY, BOT_EMAIL, BOT_PASSWORD.
 */

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { SupabaseBotClient } from './supabase.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '..', '..');

function loadDotEnvFile(env = process.env) {
  const file = env.BOT_ENV_FILE || join(ROOT, '.env.opencode-bot');
  if (!existsSync(file)) return env;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const eq = t.indexOf('=');
    if (eq === -1) continue;
    const k = t.slice(0, eq).trim();
    const v = t.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (k && env[k] === undefined) env[k] = v;
  }
  return env;
}

function requireEnv(env, key) {
  const v = env[key];
  if (!v) throw new Error(`Thiếu biến môi trường ${key}.`);
  return v;
}

async function main(env = process.env) {
  const cfg = loadDotEnvFile(env);
  const args = process.argv.slice(2);
  const confirm = args.includes('--yes') || cfg.CONFIRM === '1';
  const afterArg = args.find((a) => a.startsWith('--after='));
  const after = afterArg ? parseInt(afterArg.slice('--after='.length), 10) : new Date().getFullYear();
  if (!Number.isFinite(after)) throw new Error('--after phải là một năm, vd --after=2026');

  const client = new SupabaseBotClient({
    url: requireEnv(cfg, 'BOT_SUPABASE_URL'),
    apikey: requireEnv(cfg, 'BOT_SUPABASE_APIKEY'),
    email: requireEnv(cfg, 'BOT_EMAIL'),
    password: requireEnv(cfg, 'BOT_PASSWORD'),
  });
  console.log('[cleanup] Đăng nhập Supabase…');
  await client.login();

  const res = await fetch(`${client.url}/rest/v1/blog_posts?select=id,slug,title`, { headers: client.headers() });
  const rows = await res.json().catch(() => []);
  if (!res.ok || !Array.isArray(rows)) throw new Error(`Không đọc được blog_posts (${res.status})`);

  const targets = rows
    .map((r) => {
      const m = /^sim-hop-tuoi-(\d{4})$/.exec(r.slug || '');
      return m ? { ...r, year: parseInt(m[1], 10) } : null;
    })
    .filter((r) => r && r.year > after)
    .sort((a, b) => a.year - b.year);

  if (targets.length === 0) {
    console.log(`[cleanup] Không có bài "sim hợp tuổi <năm>" nào có năm > ${after}. Không cần xoá.`);
    return;
  }

  console.log(`[cleanup] Tìm thấy ${targets.length} bài có năm > ${after}:`);
  for (const t of targets) console.log(`   - ${t.slug}  (id ${t.id})`);

  if (!confirm) {
    console.log(`\n[cleanup] DRY-RUN — chưa xoá gì. Chạy lại kèm cờ --yes để xoá thật.`);
    return;
  }

  let deleted = 0;
  for (const t of targets) {
    const d = await fetch(`${client.url}/rest/v1/blog_posts?id=eq.${t.id}`, {
      method: 'DELETE',
      headers: client.headers({ Prefer: 'return=minimal' }),
    });
    if (d.ok) {
      deleted += 1;
      console.log(`   đã xoá ${t.slug}`);
    } else {
      console.error(`   LỖI xoá ${t.slug}: HTTP ${d.status}`);
    }
  }
  console.log(`\n[cleanup] Xong: đã xoá ${deleted}/${targets.length} bài.`);
}

main().then(
  () => process.exit(0),
  (err) => {
    console.error(`[cleanup] THẤT BẠI: ${err?.message || err}`);
    process.exit(1);
  },
);
