/**
 * One-off image optimizer.
 *
 * Run with: node scripts/optimize-images.mjs [--apply]
 * Without --apply it only reports what it *would* do (dry run).
 *
 * Design constraints, deliberately chosen:
 *  - Never upscale, and derive each target width from the real rendered CSS box
 *    times a ~3x DPR allowance.
 *  - Format is chosen per image, not globally. See the `format` note on each
 *    target for why. In particular the og:image stays PNG: some Zalo/Facebook
 *    scrapers still mishandle WebP, and a broken social preview costs more than
 *    the bytes it would save.
 *  - Every output is compared against its source with a mean-absolute-error
 *    check, so a bad encode fails loudly instead of silently shipping.
 */
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const APPLY = process.argv.includes('--apply');
const ROOT = path.resolve(import.meta.dirname, '..');

/** Max acceptable mean-absolute-error (0-255 scale) vs the original. */
const MAE_LIMIT = 6;

const TARGETS = [
  {
    file: 'public/flash-sale.png',
    // Rendered into a 56px box (w-14) on discounted SIM cards — 1920px of
    // source was ~34x oversampled.
    width: 168,
    displayWidth: 56,
    format: 'png', // real partial transparency over varying card backgrounds
    keepAlpha: true,
    note: 'badge at 56px CSS; PNG kept for alpha',
  },
  {
    file: 'src/assets/sim-card-gold.png',
    // Rendered into w-36 h-24 (144x96) in the contact popup.
    width: 432,
    displayWidth: 144,
    format: 'webp', // referenced only from our own JSX import
    keepAlpha: false, // measured: alpha min = 255, fully opaque
    quality: 90,
    note: 'popup illustration at 144x96 CSS; opaque, so WebP',
  },
  {
    file: 'public/home-banner.png',
    // Homepage LCP image. Photographic content, so PNG was the wrong container
    // entirely — re-encoding as PNG saved under 1%.
    width: 1920,
    displayWidth: 512,
    format: 'webp',
    keepAlpha: true, // measured: alpha min = 112, genuinely used
    quality: 88,
    note: 'LCP banner; photographic, so WebP',
  },
  {
    file: 'public/share-banner.png',
    // og:image. 1200x630 is the canonical Open Graph size and scrapers
    // downsample to roughly that anyway.
    width: 1200,
    displayWidth: 512,
    format: 'png', // MUST stay PNG — scraper compatibility, see header comment
    keepAlpha: false, // measured: no alpha channel at all
    note: 'og:image at canonical OG size; PNG for scraper compatibility',
  },
];

/**
 * Mean absolute error between two images.
 *
 * Both are flattened onto an identical background first. This matters: in a
 * fully-transparent pixel the RGB values are arbitrary, and resampling
 * reshuffles them with zero visible effect — comparing raw RGB there reports
 * huge differences no user can see. flash-sale.png is ~45% transparent, which
 * is exactly that trap.
 *
 * Comparison happens at `atWidth`, the size the image is actually displayed at.
 * A badge shown in a 56px box need not survive inspection at 1920px.
 */
async function mae(bufA, bufB, atWidth) {
  const w = Math.max(16, Math.min(atWidth, 512));
  const opts = { width: w, height: w, fit: 'fill' };
  const prep = (buf) =>
    sharp(buf)
      .resize(opts)
      .flatten({ background: { r: 18, g: 18, b: 18 } }) // site background
      .raw()
      .toBuffer();
  const [a, b] = await Promise.all([prep(bufA), prep(bufB)]);
  if (a.length !== b.length) throw new Error('comparison buffers differ in length');
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum / a.length;
}

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

let before = 0;
let after = 0;
const results = [];
const renames = [];

for (const t of TARGETS) {
  const absIn = path.join(ROOT, t.file);
  const src = await fs.readFile(absIn);
  const meta = await sharp(src).metadata();

  const width = Math.min(t.width, meta.width); // never upscale
  let pipe = sharp(src).resize({ width, withoutEnlargement: true });
  if (!t.keepAlpha) pipe = pipe.removeAlpha();

  const out =
    t.format === 'webp'
      ? await pipe.webp({ quality: t.quality ?? 88, effort: 6 }).toBuffer()
      : await pipe.png({ compressionLevel: 9, effort: 10, palette: false }).toBuffer();

  const error = await mae(src, out, t.displayWidth);
  const outMeta = await sharp(out).metadata();

  before += src.length;
  after += out.length;

  const outFile = t.format === 'webp' ? t.file.replace(/\.png$/, '.webp') : t.file;
  if (outFile !== t.file) renames.push({ from: t.file, to: outFile });

  if (error > MAE_LIMIT) {
    console.error(`\n✖ ABORT: ${t.file} MAE ${error.toFixed(2)} exceeds limit ${MAE_LIMIT}`);
    process.exit(1);
  }

  results.push({
    file: t.file,
    outFile,
    from: `${meta.width}x${meta.height} ${kb(src.length)}`,
    to: `${outMeta.width}x${outMeta.height} ${kb(out.length)}`,
    saved: kb(src.length - out.length),
    pct: `${(100 * (1 - out.length / src.length)).toFixed(1)}%`,
    mae: error.toFixed(2),
    note: t.note,
  });

  if (APPLY) {
    await fs.writeFile(path.join(ROOT, outFile), out);
    // Remove the stale .png when the format changed.
    if (outFile !== t.file) await fs.rm(absIn);
  }
}

console.log(APPLY ? '\nAPPLIED:\n' : '\nDRY RUN (pass --apply to write):\n');
for (const r of results) {
  const arrow = r.outFile !== r.file ? `  →  ${r.outFile}` : '';
  console.log(`  ${r.file}${arrow}`);
  console.log(`    ${r.from}  →  ${r.to}   saved ${r.saved} (${r.pct})   MAE ${r.mae}`);
  console.log(`    ${r.note}`);
}
console.log(
  `\n  TOTAL: ${kb(before)} → ${kb(after)}   saved ${kb(before - after)} (${(100 * (1 - after / before)).toFixed(1)}%)`
);
if (renames.length) {
  console.log('\n  REFERENCES TO UPDATE:');
  for (const r of renames) console.log(`    ${r.from}  →  ${r.to}`);
}
console.log('');
