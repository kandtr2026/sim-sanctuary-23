import type { NextRequest } from "next/server";
import { getServerSims } from "@/lib/serverSimData";
import {
  buildProfile,
  scoreInventory,
  type GioiTinh,
  type HopTuoiProfile,
  type ScoredSim,
} from "@/lib/simHopTuoi";
import {
  NANG_LUONG_LIST,
  phanTichCCCD,
  type BatCucFilter,
  type NangLuong,
} from "@/lib/batCuc";

// API tìm SIM hợp tuổi — /sim-phong-thuy.
// Nhận: ngay, thang, nam, gio (0–11), gioitinh (nam|nu)
//       + cccd (12 số), nlChuDao, nlPhaiCo (dấu phẩy), nlLoaiTru (dấu phẩy)
// Trả: profile phong thủy + phân tích CCCD (nếu có) + top SIM hợp nhất kèm điểm.
// Tính toán ngay trên server (tái dùng cache getServerSims) để không kéo
// toàn bộ kho ~14k SIM xuống client.
export const revalidate = 0;

const clampInt = (raw: string | null, min: number, max: number, fallback: number): number => {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.round(n), min), max);
};

const NGAY_TRONG_THANG = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const laNamNhuan = (y: number): boolean =>
  (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;

const isRealDate = (d: number, m: number, y: number): boolean => {
  if (m < 1 || m > 12) return false;
  const maxDay = NGAY_TRONG_THANG[m - 1] + (m === 2 && laNamNhuan(y) ? 1 : 0);
  return d >= 1 && d <= maxDay;
};

const VALID_NL = new Set<NangLuong>(NANG_LUONG_LIST.map((n) => n.id));

const parseNlList = (raw: string | null): NangLuong[] => {
  if (!raw) return [];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is NangLuong => VALID_NL.has(s as NangLuong))
    .slice(0, 5);
};

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const nam = clampInt(searchParams.get("nam"), 1950, 2029, 1990);
  const thang = clampInt(searchParams.get("thang"), 1, 12, 1);
  const ngay = clampInt(searchParams.get("ngay"), 1, 31, 1);
  const gio = clampInt(searchParams.get("gio"), 0, 11, 0);
  const gioiTinh: GioiTinh = searchParams.get("gioitinh") === "nu" ? "nu" : "nam";

  if (!isRealDate(ngay, thang, nam)) {
    return Response.json(
      { error: "Ngày sinh không hợp lệ." },
      { status: 400 },
    );
  }

  const profile: HopTuoiProfile = buildProfile(nam, gio, gioiTinh);

  // ── Bát Cực Linh Số + CCCD ─────────────────────────────────────────────
  const cccdRaw = (searchParams.get("cccd") ?? "").replace(/\D/g, "");
  const cccdHoaGiai = cccdRaw.length === 12 ? phanTichCCCD(cccdRaw) : null;

  const nlChuDaoRaw = searchParams.get("nlChuDao");
  const nlChuDao: NangLuong | null =
    nlChuDaoRaw && VALID_NL.has(nlChuDaoRaw as NangLuong)
      ? (nlChuDaoRaw as NangLuong)
      : null;
  const nlPhaiCo = parseNlList(searchParams.get("nlPhaiCo"));
  const nlLoaiTru = parseNlList(searchParams.get("nlLoaiTru"));

  const hasBatCucFilter =
    Boolean(nlChuDao) || nlPhaiCo.length > 0 || nlLoaiTru.length > 0 || Boolean(cccdHoaGiai);

  const batCucFilter: BatCucFilter = {
    nlChuDao,
    nlPhaiCo,
    nlLoaiTru,
    hoaGiaiCccd: cccdHoaGiai ? cccdHoaGiai.hoaGiai : [],
  };

  // ── Chấm điểm + lọc ────────────────────────────────────────────────────
  const sims = await getServerSims();
  const topSims: ScoredSim[] =
    sims.length > 0 ? scoreInventory(sims, profile, 12, batCucFilter) : [];

  return Response.json(
    {
      profile,
      birth: { ngay, thang, nam },
      total: topSims.length,
      sims: topSims,
      batCuc: hasBatCucFilter
        ? {
            filter: batCucFilter,
            cccd: cccdHoaGiai
              ? {
                  cccd: cccdHoaGiai.cccd,
                  nangLuongHung: cccdHoaGiai.nangLuongHung,
                  hoaGiai: cccdHoaGiai.hoaGiai,
                  capCuc: cccdHoaGiai.capCuc,
                }
              : null,
          }
        : null,
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
