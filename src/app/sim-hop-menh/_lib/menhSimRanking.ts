/**
 * XẾP HẠNG SIM THEO MỆNH — dùng chung cho cụm /sim-hop-menh/[hanh] và
 * /sim-hop-tuoi/[nam].
 *
 * Vì sao file này nằm trong `src/app/sim-hop-menh/_lib` chứ không phải `src/lib`:
 * đợt việc này chỉ được phép tạo file trong hai cây route mới (có agent khác
 * chạy song song trên `src/lib`). Nếu về sau cụm này ổn định, HaDT có thể dời
 * sang `src/lib/menhSimRanking.ts` — nội dung không phụ thuộc gì vào routing.
 *
 * Nguyên tắc: KHÔNG tự chấm điểm lại. Toàn bộ điểm đến từ `scoreInventory`
 * trong `src/lib/simHopTuoi.ts` (engine của /sim-phong-thuy), nên trang tĩnh và
 * công cụ tương tác không bao giờ nói hai con số khác nhau về cùng một SIM.
 *
 * Hai điều đã kiểm chứng trên kho thật (49.093 SIM, 29/08/2026):
 *  1. Với giờ sinh + giới tính cố định, điểm của một SIM chỉ phụ thuộc
 *     (mệnh nạp âm, âm/dương của cung phi) — xem `scoreSim`: mệnh chảy vào trụ
 *     ngũ hành, cung phi chỉ dùng `amDuong`. 61 năm 1950–2010 rút về đúng 10 tổ
 *     hợp, nên cache theo khoá đó biến 61 lần quét kho thành 10 lần (~260ms/lần).
 *  2. Hệ quả: hai năm khác nhau nhưng cùng tổ hợp (vd 1963 và 2000, đều mệnh Kim
 *     + cung Khảm Dương) được engine trả về DANH SÁCH GIỐNG HỆT. Đó là lý do có
 *     `pickRotated`: mỗi năm lấy một lát khác nhau trong nhóm điểm cao nhất để
 *     61 trang không in cùng một bảng số.
 */

import { getServerSims } from "@/lib/serverSimData";
import {
  buildProfile,
  scoreInventory,
  tinhCanChi,
  type GioiTinh,
  type HopTuoiProfile,
  type NguHanh,
  type ScoredSim,
} from "@/lib/simHopTuoi";
import type { NormalizedSIM } from "@/lib/simUtils";

/** Giờ sinh mặc định khi trang không hỏi giờ: Tý — khớp mặc định của /api/sim-hop-tuoi. */
export const DEFAULT_GIO_INDEX = 0;
/** Giới tính mặc định — cũng khớp mặc định của /api/sim-hop-tuoi. */
export const DEFAULT_GIOI_TINH: GioiTinh = "nam";
/** Nhóm điểm cao nhất được giữ lại để các trang lấy lát khác nhau. */
export const POOL_SIZE = 48;
/** Số dòng mỗi trang in ra — khớp trần 8 dòng của CategorySimPriceList. */
export const ROWS_PER_PAGE = 8;

/** Một SIM đã chấm điểm, kèm bản gốc để đưa vào CategorySimPriceList. */
export interface RankedSim {
  sim: NormalizedSIM;
  score: ScoredSim;
}

// ── Cache theo (mệnh | âm-dương cung phi) ───────────────────────────────────
// TTL 300s cho khớp `revalidate = 300` của các route tiêu thụ, cùng khuôn với
// `serverSimData.getServerSims`. KHÔNG cache vĩnh viễn: module cache sống theo
// tuổi tiến trình lambda, giữ mãi thì giá và SIM đã bán trong bảng sẽ cũ dần.
const CACHE_TTL_MS = 300_000;
const poolCache = new Map<string, RankedSim[]>();
let poolCachedAt = 0;

const cacheKey = (menh: NguHanh, cungPhiAmDuong: string): string => `${menh}|${cungPhiAmDuong}`;

const sweepCache = (): void => {
  if (Date.now() - poolCachedAt >= CACHE_TTL_MS) {
    poolCache.clear();
    poolCachedAt = Date.now();
  }
};

/**
 * Nhóm SIM điểm cao nhất cho một hồ sơ phong thủy. Trả [] khi kho không đọc
 * được (getServerSims đã tự chịu lỗi) — trang gọi phải tự xử lý rỗng.
 */
export const getRankedPool = async (profile: HopTuoiProfile): Promise<RankedSim[]> => {
  sweepCache();
  const key = cacheKey(profile.menh, profile.cungPhi.amDuong);
  const hit = poolCache.get(key);
  if (hit) return hit;

  const sims = await getServerSims();
  if (sims.length === 0) return [];

  const byId = new Map(sims.map((s) => [s.id, s]));
  const scored = scoreInventory(sims, profile, POOL_SIZE);

  const ranked: RankedSim[] = [];
  for (const sc of scored) {
    const sim = byId.get(sc.id);
    if (sim) ranked.push({ sim, score: sc });
  }

  poolCache.set(key, ranked);
  return ranked;
};

/**
 * Lấy `take` phần tử trong `pool` theo một lát phụ thuộc `seed` (năm sinh).
 * Bước nhảy nguyên tố cùng nhau với 48 nên không lặp phần tử trong 8 lượt đầu.
 * Deterministic: cùng seed → cùng kết quả ở mọi lần SSR/ISR, không lệch hydration.
 */
export const pickRotated = (pool: RankedSim[], seed: number, take = ROWS_PER_PAGE): RankedSim[] => {
  if (pool.length <= take) return [...pool];
  const strides = [5, 7, 11, 13];
  const stride = strides[Math.abs(seed) % strides.length];
  const offset = Math.abs(seed) % pool.length;

  const picked: RankedSim[] = [];
  const used = new Set<number>();
  for (let i = 0; picked.length < take && i < pool.length * 2; i++) {
    const idx = (offset + i * stride) % pool.length;
    if (used.has(idx)) continue;
    used.add(idx);
    picked.push(pool[idx]);
  }
  // In ra theo điểm giảm dần để bảng đọc thuận, giá thấp lên trước khi bằng điểm.
  picked.sort((a, b) => b.score.score - a.score.score || a.sim.price - b.sim.price);
  return picked;
};

// ── 5 hành ──────────────────────────────────────────────────────────────────

export type HanhSlug = "kim" | "moc" | "thuy" | "hoa" | "tho";

export const HANH_SLUGS: HanhSlug[] = ["kim", "moc", "thuy", "hoa", "tho"];

const SLUG_TO_HANH: Record<HanhSlug, NguHanh> = {
  kim: "Kim",
  moc: "Mộc",
  thuy: "Thủy",
  hoa: "Hỏa",
  tho: "Thổ",
};

export const hanhFromSlug = (slug: string): NguHanh | null =>
  (SLUG_TO_HANH as Record<string, NguHanh | undefined>)[slug] ?? null;

export const slugFromHanh = (hanh: NguHanh): HanhSlug => {
  const found = HANH_SLUGS.find((s) => SLUG_TO_HANH[s] === hanh);
  return found ?? "kim";
};

/**
 * Năm đại diện (nạp âm ra đúng hành đó) để dựng hồ sơ cho trang hợp mệnh —
 * trang này không hỏi năm sinh nên phải chốt một năm để engine có mệnh mà chấm.
 * Dò từ 1950 nên kết quả cố định, không phải bảng gõ tay dễ sai.
 */
export const repYearForHanh = (hanh: NguHanh): number => {
  for (let y = 1950; y <= 2010; y++) {
    if (tinhCanChi(y).menh === hanh) return y;
  }
  return 1950;
};

/** Hồ sơ dùng chấm điểm cho trang hợp mệnh (mệnh đúng, giờ + giới tính mặc định). */
export const profileForHanh = (hanh: NguHanh): HopTuoiProfile =>
  buildProfile(repYearForHanh(hanh), DEFAULT_GIO_INDEX, DEFAULT_GIOI_TINH);

/** Hồ sơ dùng chấm điểm cho trang hợp tuổi (năm thật, giờ + giới tính mặc định). */
export const profileForYear = (nam: number): HopTuoiProfile =>
  buildProfile(nam, DEFAULT_GIO_INDEX, DEFAULT_GIOI_TINH);
