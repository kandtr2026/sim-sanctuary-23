/**
 * Snapshot kho SIM — một file nén thay cho 82 request PostgREST.
 *
 * VÌ SAO: mọi chỗ cần cả kho (`getServerSims`) trước đây kéo bảng `sims` qua 82
 * request × 1000 hàng (~16 MB JSON). Đo 13/10/2026: ~172 lần crawl/24h, chiếm
 * ~83% dòng log API và gần như toàn bộ egress Supabase, vì Data Cache của Next
 * miss liên tục. Kho chỉ đổi khi cron `sync-sims` chạy, nên sau mỗi lần đồng bộ
 * ta dựng MỘT file rồi mọi nơi đọc file đó — logic tính toán giữ nguyên, chỉ đổi
 * nguồn dữ liệu.
 *
 * LƯU Ý THIẾT KẾ
 *  - Mỗi bản ghi nằm ở pathname DUY NHẤT (`sims-snapshot/<timestamp>.json.gz`),
 *    nên CDN/Data Cache không bao giờ trả bản cũ của cùng một URL; người đọc
 *    `list` để lấy bản mới nhất.
 *  - Bản quá cũ (> MAX_AGE_MS) bị bỏ qua → rơi về crawl DB, để cron hỏng không
 *    âm thầm phục vụ kho cũ mãi.
 *  - Không có `BLOB_READ_WRITE_TOKEN` (dev/test) → đọc trả null → crawl như cũ.
 */
import { gunzipSync, gzipSync } from "node:zlib";
import { del, list, put } from "@vercel/blob";
import type { SimsDbRow } from "@/lib/serverSimData";

export const SNAPSHOT_PREFIX = "sims-snapshot/";
const SNAPSHOT_VERSION = 1;
/** Cron chạy 6 giờ/lần; quá 18 giờ coi như cron đã hỏng. */
export const SNAPSHOT_MAX_AGE_MS = 18 * 60 * 60 * 1000;
/** Không bao giờ publish snapshot nhỏ bất thường (DB rỗng/sync hỏng). */
export const SNAPSHOT_MIN_ROWS = 1000;
/** Giữ lại bấy nhiêu bản mới nhất, xoá phần còn lại. */
const KEEP_VERSIONS = 2;

type Tuple = [string, string, string, number, number | null, number, string | null, number, 0 | 1];

interface SnapshotFile {
  v: number;
  generatedAt: number;
  rows: Tuple[];
}

export const encodeSnapshot = (rows: SimsDbRow[], generatedAt = Date.now()): Buffer => {
  const file: SnapshotFile = {
    v: SNAPSHOT_VERSION,
    generatedAt,
    rows: rows.map((r) => [
      r.id,
      r.raw_digits,
      r.display_number,
      r.original_price,
      r.final_price,
      r.effective_price,
      r.network,
      r.beauty_score,
      r.is_vip ? 1 : 0,
    ]),
  };
  return gzipSync(Buffer.from(JSON.stringify(file)));
};

/** Trả null khi file hỏng / sai phiên bản / quá cũ — không bao giờ ném. */
export const decodeSnapshot = (
  buf: Buffer,
  now = Date.now(),
): { rows: SimsDbRow[]; generatedAt: number } | null => {
  try {
    const file = JSON.parse(gunzipSync(buf).toString("utf8")) as SnapshotFile;
    if (file.v !== SNAPSHOT_VERSION || !Array.isArray(file.rows)) return null;
    if (typeof file.generatedAt !== "number") return null;
    if (now - file.generatedAt > SNAPSHOT_MAX_AGE_MS) return null;
    const rows: SimsDbRow[] = [];
    for (const t of file.rows) {
      if (!Array.isArray(t) || t.length !== 9) return null;
      rows.push({
        id: t[0],
        raw_digits: t[1],
        display_number: t[2],
        original_price: t[3],
        final_price: t[4],
        effective_price: t[5],
        network: t[6],
        beauty_score: t[7],
        is_vip: t[8] === 1,
      });
    }
    return { rows, generatedAt: file.generatedAt };
  } catch {
    return null;
  }
};

/**
 * Đọc bản mới nhất kèm mốc dựng (`generatedAt`) — caller so mốc này với lượt
 * sync gần nhất để biết snapshot đã cũ chưa. Mọi lỗi → null để caller rơi về
 * crawl DB.
 */
export const readSnapshot = async (): Promise<{ rows: SimsDbRow[]; generatedAt: number } | null> => {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return null;
  try {
    const { blobs } = await list({ prefix: SNAPSHOT_PREFIX, limit: 20 });
    const latest = [...blobs].sort(
      (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime(),
    )[0];
    if (!latest) return null;

    // URL duy nhất theo bản → cache dài là an toàn.
    const res = await fetch(latest.url, { next: { revalidate: 86_400 } });
    if (!res.ok) return null;
    return decodeSnapshot(Buffer.from(await res.arrayBuffer()));
  } catch (e) {
    console.warn("[simsSnapshot] đọc snapshot lỗi, rơi về crawl DB:", e);
    return null;
  }
};

/** Như `readSnapshot` nhưng chỉ trả hàng. */
export const readSnapshotRows = async (): Promise<SimsDbRow[] | null> =>
  (await readSnapshot())?.rows ?? null;

/** Ghi bản mới rồi dọn bản cũ. Ném lỗi để cron báo được trạng thái. */
export const writeSnapshot = async (
  rows: SimsDbRow[],
): Promise<{ url: string; rows: number; bytes: number }> => {
  if (rows.length < SNAPSHOT_MIN_ROWS) {
    throw new Error(`snapshot quá nhỏ (${rows.length} < ${SNAPSHOT_MIN_ROWS}) — không publish`);
  }
  const buf = encodeSnapshot(rows);
  const blob = await put(`${SNAPSHOT_PREFIX}${Date.now()}.json.gz`, buf, {
    access: "public",
    contentType: "application/gzip",
    addRandomSuffix: false,
  });

  try {
    const { blobs } = await list({ prefix: SNAPSHOT_PREFIX, limit: 100 });
    const old = [...blobs]
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
      .slice(KEEP_VERSIONS);
    if (old.length) await del(old.map((b) => b.url));
  } catch (e) {
    console.warn("[simsSnapshot] dọn bản cũ lỗi (bỏ qua):", e);
  }

  return { url: blob.url, rows: rows.length, bytes: buf.length };
};
