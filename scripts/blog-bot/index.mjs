/**
 * Daily blog-draft bot — writes one SEO draft (published = false) into
 * `blog_posts` on the admin Supabase project. See OpenCode.md.
 *
 * Usage (Node 18+):
 *   node scripts/blog-bot/index.mjs
 *
 * Reads config from env (or from `.env.opencode-bot` at the repo root when
 * run locally). Required: BOT_SUPABASE_URL, BOT_SUPABASE_APIKEY, BOT_EMAIL,
 * BOT_PASSWORD. Content source: either BOT_CONTENT_FILE (manual test) or
 * LLM_* vars (production).
 */

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { SupabaseBotClient } from './supabase.mjs';
import { generateContent } from './generate.mjs';
import { TOPIC_BANK, nextYearTopic } from './topics.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const ROOT = join(here, '..', '..');

function loadDotEnvFile(env = process.env) {
  const file = env.BOT_ENV_FILE || join(ROOT, '.env.opencode-bot');
  if (!existsSync(file)) return env;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (key && env[key] === undefined) env[key] = value;
  }
  return env;
}

function requireEnv(env, key) {
  const value = env[key];
  if (!value) throw new Error(`Thiếu biến môi trường ${key}.`);
  return value;
}

function pickTopic(existingSlugs) {
  const used = new Set(existingSlugs);
  const candidate = TOPIC_BANK.find((t) => !used.has(t.slug)) || nextYearTopic(used);
  return { topic: candidate, used };
}

export async function main(env = process.env) {
  const cfg = loadDotEnvFile(env);

  const client = new SupabaseBotClient({
    url: requireEnv(cfg, 'BOT_SUPABASE_URL'),
    apikey: requireEnv(cfg, 'BOT_SUPABASE_APIKEY'),
    email: requireEnv(cfg, 'BOT_EMAIL'),
    password: requireEnv(cfg, 'BOT_PASSWORD'),
  });

  console.log('[blog-bot] Đăng nhập Supabase Auth…');
  await client.login();
  console.log('[blog-bot] Đăng nhập thành công.');

  const slugs = await client.getSlugs();
  const { topic } = pickTopic(slugs);
  console.log(`[blog-bot] Slug hiện có: ${slugs.length} bài. Chọn chủ đề: ${topic.slug}`);

  const content = await generateContent(topic, cfg);
  console.log(`[blog-bot] Nội dung ~${content.words} từ. meta_title (${content.meta_title.length} ký tự), meta_description (${content.meta_description.length} ký tự).`);

  // Mặc định: TỰ ĐĂNG (published=true) — OpenCode.md v3.
// Chỉ tạo nháp khi BOT_DRAFT=true (hoặc BOT_AUTO_PUBLISH=false).
  const draftOnly =
    cfg.BOT_DRAFT === 'true' ||
    cfg.BOT_DRAFT === '1' ||
    cfg.BOT_AUTO_PUBLISH === 'false' ||
    cfg.BOT_AUTO_PUBLISH === '0';
  const autoPublish = !draftOnly;

  const post = {
    slug: topic.slug,
    title: content.title,
    meta_title: content.meta_title,
    meta_description: content.meta_description,
    content_html: content.content_html,
    category: topic.category,
    published: autoPublish,
  };

  const saved = await client.insertPost(post);
  console.log(
    `[blog-bot] Đã lưu ${autoPublish ? 'bài ĐÃ ĐĂNG (published=true)' : 'NHÁP (published=false)'}: ${saved.slug} — ${saved.title} (id ${saved.id})`,
  );
  return saved;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then(
    () => process.exit(0),
    (err) => {
      console.error(`[blog-bot] THẤT BẠI: ${err?.message || err}`);
      if (err?.body) console.error(JSON.stringify(err.body, null, 2));
      process.exit(1);
    },
  );
}
