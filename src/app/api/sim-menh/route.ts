import type { NextRequest } from "next/server";
import { getServerSims } from "@/lib/serverSimData";
import { formatGia, parseGia } from "@/lib/giaParam";
import { locSimMenhGia, type KieuTrangMenh, type MenhGiaItem } from "@/lib/menhGia";
import { hanhFromSlug } from "@/app/sim-hop-menh/_lib/menhSimRanking";
import type { NguHanh } from "@/lib/simHopTuoi";

/**
 * GET /api/sim-menh?hanh=tho&kieu=theo&gia=5-10&limit=60&offset=0
 *
 * Số hợp mệnh trong khoảng giá, lọc trên TOÀN kho, xếp theo điểm phong thủy cao
 * nhất (định nghĩa từng trang: xem src/lib/menhGia.ts).
 *  - hanh: slug kim|moc|thuy|hoa|tho (hoặc tên hành có dấu)
 *  - kieu: theo (/sim-theo-menh, mặc định) | hop (/sim-hop-menh)
 *  - gia:  slug khoảng giá, nhiều khoảng nối dấu phẩy (src/lib/giaParam.ts)
 * Trả { items: NormalizedSIM[], scores: number[], total }.
 */
export const revalidate = 300;

const MAX_LIMIT = 120;
const CACHE_TTL_MS = 300_000;
const HANH_NAMES: NguHanh[] = ["Kim", "Mộc", "Thủy", "Hỏa", "Thổ"];

// Cache danh sách đã xếp theo (kiểu | hành | giá) để "Xem thêm" không chấm lại
// cả kho. Gắn với đúng mảng kho đang cache: kho đổi (getServerSims làm tươi) là
// tính lại, không trả số đã bán.
const cache = new Map<string, { at: number; src: unknown; list: MenhGiaItem[] }>();

const clampInt = (raw: string | null, fallback: number, min: number, max: number): number => {
  if (raw === null || raw.trim() === "") return fallback;
  const n = Math.floor(Number(raw));
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
};

const parseHanh = (raw: string | null): NguHanh | null => {
  if (!raw) return null;
  return hanhFromSlug(raw.trim().toLowerCase()) ?? HANH_NAMES.find((h) => h === raw.trim()) ?? null;
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const hanh = parseHanh(searchParams.get("hanh"));
  if (!hanh) {
    return Response.json({ error: "hanh không hợp lệ (kim|moc|thuy|hoa|tho)" }, { status: 400 });
  }
  const kieu: KieuTrangMenh = searchParams.get("kieu") === "hop" ? "hop" : "theo";
  const ranges = parseGia(searchParams.get("gia"));
  const limit = clampInt(searchParams.get("limit"), 60, 1, MAX_LIMIT);
  const offset = clampInt(searchParams.get("offset"), 0, 0, Number.MAX_SAFE_INTEGER);

  const sims = await getServerSims();
  const key = `${kieu}|${hanh}|${formatGia(ranges) ?? ""}`;
  let hit = cache.get(key);
  if (!hit || hit.src !== sims || Date.now() - hit.at >= CACHE_TTL_MS) {
    hit = { at: Date.now(), src: sims, list: locSimMenhGia(sims, kieu, hanh, ranges) };
    cache.set(key, hit);
  }

  const page = hit.list.slice(offset, offset + limit);
  return Response.json(
    { items: page.map((x) => x.sim), scores: page.map((x) => x.diem), total: hit.list.length },
    { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } },
  );
}
