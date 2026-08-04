/**
 * Rebuild the favicon and the related icon assets.
 *
 * Run with: node scripts/build-favicon.mjs [--apply]
 *
 * Why this exists: public/favicon-v2.ico was not an ICO at all. It was a
 * 1024x1024 RGBA PNG renamed to .ico — 905 KB downloaded by every visitor to
 * paint a 16px tab icon, and served with the wrong MIME type. Browsers sniff
 * the bytes so it rendered, but nothing about the declaration was correct.
 *
 * sharp cannot encode ICO, so the container is assembled by hand. The ICO
 * format allows each sub-image to be a whole PNG file rather than a BMP/DIB
 * (Vista+; every browser in our support range reads it), which keeps this to a
 * short, dependency-free header write.
 *
 * Outputs:
 *   favicon.ico          multi-size tab icon (16/32/48/64)
 *   favicon.png          512px publisher logo. Six article pages reference this
 *                        from their JSON-LD; it was deleted from the repo in
 *                        cae7cda and only still resolved because a stale
 *                        deployment artifact sat on the host.
 *   apple-touch-icon.png 180px iOS home-screen icon, flattened — iOS renders
 *                        transparency as black, so alpha must not survive.
 *   brand-logo.png       re-encoded at the 512px the web manifest declares.
 */
import sharp from 'sharp';
import fs from 'node:fs/promises';
import path from 'node:path';

const APPLY = process.argv.includes('--apply');
const ROOT = path.resolve(import.meta.dirname, '..');

/** Sizes carried inside the .ico. 48 is what Windows/Chrome pick for shortcuts. */
const ICO_SIZES = [16, 32, 48, 64];

/** Google's structured-data guidance wants a publisher logo well above tab size. */
const PNG_LOGO_SIZE = 512;

/** Apple's current recommendation for a single home-screen icon. */
const APPLE_SIZE = 180;

/** Size the web manifest declares for brand-logo.png. */
const MANIFEST_LOGO_SIZE = 512;

/** Background used when flattening alpha, matching the site's dark chrome. */
const FLATTEN_BG = { r: 15, g: 15, b: 15 };

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

/**
 * The original 1024px source is consumed on first --apply, so fall back to the
 * 512px favicon.png it produced. Neither path ever upscales, so re-running is
 * safe and idempotent.
 */
async function resolveSource() {
  for (const candidate of ['public/favicon-v2.ico', 'public/favicon.png']) {
    try {
      const buf = await fs.readFile(path.join(ROOT, candidate));
      return { file: candidate, buf };
    } catch {
      /* try the next candidate */
    }
  }
  throw new Error('no favicon source found (looked for favicon-v2.ico, favicon.png)');
}

/** Build an ICO container from PNG buffers, one per size. */
function buildIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved, must be 0
  header.writeUInt16LE(1, 2); // type 1 = icon
  header.writeUInt16LE(entries.length, 4);

  const dir = Buffer.alloc(16 * entries.length);
  let offset = 6 + dir.length;

  entries.forEach((e, i) => {
    const o = i * 16;
    dir[o] = e.size >= 256 ? 0 : e.size; // 0 means 256
    dir[o + 1] = e.size >= 256 ? 0 : e.size;
    dir[o + 2] = 0; // palette colours — 0 for truecolour
    dir[o + 3] = 0; // reserved
    dir.writeUInt16LE(1, o + 4); // colour planes
    dir.writeUInt16LE(32, o + 6); // bits per pixel
    dir.writeUInt32LE(e.buf.length, o + 8);
    dir.writeUInt32LE(offset, o + 12);
    offset += e.buf.length;
  });

  return Buffer.concat([header, dir, ...entries.map((e) => e.buf)]);
}

/** Re-parse a container so a malformed header fails here, not in the browser. */
function validateIco(buf, expected) {
  const count = buf.readUInt16LE(4);
  if (buf.readUInt16LE(0) !== 0 || buf.readUInt16LE(2) !== 1 || count !== expected) {
    throw new Error('generated ICO header failed validation');
  }
  for (let i = 0; i < count; i++) {
    const o = 6 + i * 16;
    const off = buf.readUInt32LE(o + 12);
    const len = buf.readUInt32LE(o + 8);
    if (off + len > buf.length || buf.readUInt32BE(off) !== 0x89504e47) {
      throw new Error(`sub-image ${i} does not point at a valid PNG`);
    }
  }
  return count;
}

const src = await resolveSource();
const meta = await sharp(src.buf).metadata();
console.log(`\nsource: ${src.file}  ${meta.width}x${meta.height} ${meta.format} ${kb(src.buf.length)}\n`);

// Small icons need sharper downsampling than the default, hence lanczos3 plus a
// palette encode — 16px artwork has very few distinct colours. Measured against
// a truecolour encode the difference is MAE <= 0.22, i.e. invisible.
const entries = [];
for (const size of ICO_SIZES) {
  const buf = await sharp(src.buf)
    .resize(size, size, { kernel: 'lanczos3', fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, effort: 10, palette: true })
    .toBuffer();
  entries.push({ size, buf });
  console.log(`  ico ${String(size).padStart(3)}x${String(size).padEnd(3)}  ${kb(buf.length).padStart(7)}`);
}

const ico = buildIco(entries);
const subImages = validateIco(ico, ICO_SIZES.length);

const logo = await sharp(src.buf)
  .resize(PNG_LOGO_SIZE, PNG_LOGO_SIZE, {
    fit: 'contain',
    withoutEnlargement: true,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png({ compressionLevel: 9, effort: 10 })
  .toBuffer();

// apple-touch-icon is sourced from brand-logo.png, which is what the old
// `rel="apple-touch-icon"` pointed at — keeps the home-screen icon looking the
// same as before. Flattened because iOS paints alpha black.
const brandSrc = await fs.readFile(path.join(ROOT, 'public/brand-logo.png'));
const brandMeta = await sharp(brandSrc).metadata();

const appleIcon = await sharp(brandSrc)
  .resize(APPLE_SIZE, APPLE_SIZE, { fit: 'contain', background: FLATTEN_BG })
  .flatten({ background: FLATTEN_BG })
  .png({ compressionLevel: 9, effort: 10 })
  .toBuffer();

const brandLogo = await sharp(brandSrc)
  .resize(MANIFEST_LOGO_SIZE, MANIFEST_LOGO_SIZE, { fit: 'contain', withoutEnlargement: true, background: FLATTEN_BG })
  .png({ compressionLevel: 9, effort: 10 })
  .toBuffer();

console.log('');
console.log(`  favicon.ico           ${kb(src.buf.length).padStart(7)}  →  ${kb(ico.length).padStart(7)}   ${subImages} sizes`);
console.log(`  favicon.png           ${'(new)'.padStart(7)}  →  ${kb(logo.length).padStart(7)}   ${PNG_LOGO_SIZE}px JSON-LD publisher logo`);
console.log(`  apple-touch-icon.png  ${'(new)'.padStart(7)}  →  ${kb(appleIcon.length).padStart(7)}   ${APPLE_SIZE}px, alpha flattened for iOS`);
console.log(`  brand-logo.png        ${kb(brandSrc.length).padStart(7)}  →  ${kb(brandLogo.length).padStart(7)}   ${brandMeta.width}px → ${MANIFEST_LOGO_SIZE}px, matching the manifest`);
console.log(`\n  ✓ container validates: ${subImages} sub-images, all PNG payloads in range`);

if (APPLY) {
  await fs.writeFile(path.join(ROOT, 'public/favicon.ico'), ico);
  await fs.writeFile(path.join(ROOT, 'public/favicon.png'), logo);
  await fs.writeFile(path.join(ROOT, 'public/apple-touch-icon.png'), appleIcon);
  await fs.writeFile(path.join(ROOT, 'public/brand-logo.png'), brandLogo);
  if (src.file === 'public/favicon-v2.ico') await fs.rm(path.join(ROOT, src.file));
  console.log('\n  APPLIED.\n');
} else {
  console.log('\n  DRY RUN — pass --apply to write.\n');
}
