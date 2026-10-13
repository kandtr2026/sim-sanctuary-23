import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { gzipSync } from 'node:zlib';
import {
  decodeSnapshot,
  encodeSnapshot,
  readSnapshotRows,
  SNAPSHOT_MAX_AGE_MS,
  writeSnapshot,
} from '@/lib/simsSnapshot';
import type { SimsDbRow } from '@/lib/serverSimData';

const row = (i: number, over: Partial<SimsDbRow> = {}): SimsDbRow => ({
  id: `SIM${String(i).padStart(6, '0')}`,
  raw_digits: `09${String(30000000 + i)}`,
  display_number: `09${String(30000000 + i)}`,
  original_price: 1_000_000 + i,
  final_price: i % 2 ? 900_000 + i : null,
  effective_price: i % 2 ? 900_000 + i : 1_000_000 + i,
  network: i % 3 ? 'Mobifone' : null,
  beauty_score: i % 100,
  is_vip: i % 7 === 0,
  ...over,
});

const NOW = 1_800_000_000_000;

describe('snapshot encode/decode', () => {
  it('khứ hồi giữ nguyên từng trường của từng hàng (kể cả null và is_vip)', () => {
    const rows = Array.from({ length: 50 }, (_, i) => row(i));
    const out = decodeSnapshot(encodeSnapshot(rows, NOW), NOW + 1000);
    expect(out?.generatedAt).toBe(NOW);
    expect(out?.rows).toEqual(rows);
  });

  it('bản quá cũ → null (cron hỏng không được phục vụ kho cũ mãi)', () => {
    const buf = encodeSnapshot([row(1)], NOW);
    expect(decodeSnapshot(buf, NOW + SNAPSHOT_MAX_AGE_MS - 1)).not.toBeNull();
    expect(decodeSnapshot(buf, NOW + SNAPSHOT_MAX_AGE_MS + 1)).toBeNull();
  });

  it('sai phiên bản / hỏng / hàng sai độ dài → null, không ném', () => {
    const bad = (obj: unknown) => gzipSync(Buffer.from(JSON.stringify(obj)));
    expect(decodeSnapshot(bad({ v: 99, generatedAt: NOW, rows: [] }), NOW)).toBeNull();
    expect(decodeSnapshot(bad({ v: 1, generatedAt: NOW, rows: [['x']] }), NOW)).toBeNull();
    expect(decodeSnapshot(Buffer.from('không phải gzip'), NOW)).toBeNull();
  });

  it('kích thước nén thực tế: 81.622 hàng < 2 MB (Data Cache của Next giới hạn 2 MB/mục)', () => {
    const rows = Array.from({ length: 81_622 }, (_, i) => row(i));
    expect(encodeSnapshot(rows).length).toBeLessThan(2 * 1024 * 1024);
  });
});

describe('readSnapshotRows / writeSnapshot', () => {
  const saved = process.env.BLOB_READ_WRITE_TOKEN;
  beforeEach(() => {
    delete process.env.BLOB_READ_WRITE_TOKEN;
  });
  afterEach(() => {
    if (saved === undefined) delete process.env.BLOB_READ_WRITE_TOKEN;
    else process.env.BLOB_READ_WRITE_TOKEN = saved;
  });

  it('không có token Blob → null và không gọi mạng', async () => {
    const f = vi.fn();
    vi.stubGlobal('fetch', f);
    expect(await readSnapshotRows()).toBeNull();
    expect(f).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('từ chối publish snapshot nhỏ bất thường (DB rỗng/sync hỏng)', async () => {
    await expect(writeSnapshot([row(1), row(2)])).rejects.toThrow(/quá nhỏ/);
  });
});
