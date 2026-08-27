/**
 * Nén ảnh blog về WebP cho /public/blog.
 *
 * Vì sao có script này: ảnh gốc do bộ gen ảnh trả về là JPG 1280–2048px, ~200–500KB
 * mỗi tấm. Trang bài dùng <img> thường (KHÔNG qua next/image) để không tốn quota
 * tối ưu ảnh của Vercel, nên ảnh phải được nén sẵn ở đây — nếu không, mỗi bài
 * viết sẽ tự tay phá điểm Core Web Vitals của chính nó.
 *
 * Dùng:
 *   node scripts/blog-images/optimize.mjs <file-hoặc-thư-mục> <slug> [--width 1200]
 *
 * Ví dụ:
 *   node scripts/blog-images/optimize.mjs generated-media/img-1.jpg kiem-tra-so-mobifone
 *     -> public/blog/kiem-tra-so-mobifone.webp (1200x675, WebP q78)
 *
 * Ảnh trong thân bài nên hẹp hơn:
 *   node scripts/blog-images/optimize.mjs anh.jpg ten-anh --width 900
 */

import { mkdirSync, readdirSync, statSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';
import sharp from 'sharp';

const OUT_DIR = resolve(process.cwd(), 'public/blog');

function flag(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  if (i !== -1 && process.argv[i + 1]) return process.argv[i + 1];
  return fallback;
}

const [, , inputArg, slugArg] = process.argv;
if (!inputArg) {
  console.error('Dùng: node scripts/blog-images/optimize.mjs <file|dir> [slug] [--width 1200] [--quality 78]');
  process.exit(1);
}

const width = Number(flag('width', 1200));
const quality = Number(flag('quality', 78));
// 16:9 là tỉ lệ ảnh bìa (khớp OG image 1200x630 đủ gần, không bị crop xấu trên
// Facebook/Zalo). Truyền --height 0 để giữ nguyên tỉ lệ gốc.
const heightFlag = flag('height', null);
const height = heightFlag === null ? Math.round((width * 9) / 16) : Number(heightFlag);

const inputPath = resolve(process.cwd(), inputArg);
const isDir = statSync(inputPath).isDirectory();
const files = isDir
  ? readdirSync(inputPath)
      .filter((f) => /\.(jpe?g|png|webp)$/i.test(f))
      .map((f) => join(inputPath, f))
  : [inputPath];

mkdirSync(OUT_DIR, { recursive: true });

for (const [index, file] of files.entries()) {
  const stem = slugArg
    ? files.length > 1
      ? `${slugArg}-${index + 1}`
      : slugArg
    : basename(file, extname(file));
  const out = join(OUT_DIR, `${stem}.webp`);

  const pipeline = sharp(file).rotate();
  if (height > 0) {
    pipeline.resize(width, height, { fit: 'cover', position: 'centre' });
  } else {
    pipeline.resize({ width, withoutEnlargement: true });
  }

  const info = await pipeline.webp({ quality, effort: 6 }).toFile(out);
  const kb = (info.size / 1024).toFixed(0);
  console.log(`${out}  ${info.width}x${info.height}  ${kb}KB`);
}
