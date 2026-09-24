import type { NextRequest } from "next/server";
import { getServerSims } from "@/lib/serverSimData";
import {
  buildProfile,
  scoreInventoryAdvanced,
  evaluateSingleSim,
  NGUONG_HOP_TUOI,
  type GioiTinh,
  type HopTuoiProfile,
} from "@/lib/simHopTuoi";
import { namAmLich } from "@/lib/amLich";
import {
  NANG_LUONG_LIST,
  phanTichCCCD,
  type BatCucFilter,
  type NangLuong,
} from "@/lib/batCuc";

// API tìm SIM hợp tuổi — /sim-phong-thuy.
// Nhận: ngay, thang, nam, gio (0–11), gioitinh (nam|nu), lich (dl|al, mặc định dl)
//       + soCanXem (10 số → bói; có '*' hoặc 2–9 chữ số → lọc kho), search
//       + mucTieu, priceRange (chỉ số PRICE_RANGES, dấu phẩy), prefix (dấu phẩy),
//         sortBy, minScore (mặc định 5.5), limit, offset
//       + cccd (12 số), nlChuDao, nlPhaiCo (dấu phẩy), nlLoaiTru (dấu phẩy)
// Trả: profile phong thủy + phân tích CCCD (nếu có) + top SIM hợp nhất kèm điểm.
// Tính toán ngay trên server (tái dùng cache getServerSims) để không kéo
// toàn bộ kho ~14k SIM xuống client.
export const revalidate = 0;

const clampInt = (raw: string | null, min: number, max: number, fallback: number): number => {
  if (raw === null || raw.trim() === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(Math.round(n), min), max);
};

// Như clampInt nhưng GIỮ số lẻ (minScore 5.5 không bị làm tròn thành 6).
const clampNum = (raw: string | null, min: number, max: number, fallback: number): number => {
  if (raw === null || raw.trim() === "") return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, min), max);
};

const SORT_KEYS = new Set(["score_desc", "price_asc", "price_desc"] as const);
type SortKey = "score_desc" | "price_asc" | "price_desc";

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

  // Cận trên không thấp hơn năm hiện tại — client cho chọn tới năm hiện tại (YEAR_MAX).
  const nam = clampInt(searchParams.get("nam"), 1940, Math.max(2029, new Date().getFullYear()), 1990);
  const thang = clampInt(searchParams.get("thang"), 1, 12, 1);
  const ngay = clampInt(searchParams.get("ngay"), 1, 31, 1);
  const gio = clampInt(searchParams.get("gio"), 0, 11, 0);
  const gioiTinh: GioiTinh = searchParams.get("gioitinh") === "nu" ? "nu" : "nam";
  const lich: "dl" | "al" = searchParams.get("lich") === "al" ? "al" : "dl";

  // Âm lịch: tháng âm có 29 hoặc 30 ngày (30/2 âm là ngày có thật) → chỉ chặn > 30.
  // Dương lịch: kiểm tra ngày có thật trong tháng.
  const ngayHopLe = lich === "al" ? ngay >= 1 && ngay <= 30 : isRealDate(ngay, thang, nam);
  if (!ngayHopLe) {
    return Response.json(
      {
        error:
          lich === "al"
            ? "Ngày âm lịch chỉ từ mùng 1 đến 30."
            : `Ngày sinh không hợp lệ: tháng ${thang}/${nam} không có ngày ${ngay}.`,
      },
      { status: 400 },
    );
  }

  // Can Chi / nạp âm / cung phi tính theo NĂM ÂM LỊCH: sinh dương lịch trước Tết
  // thì thuộc tuổi năm trước (vd 20/01/1990 → Kỷ Tỵ 1989, Tết Canh Ngọ 27/01/1990).
  const namAm = lich === "dl" ? namAmLich(ngay, thang, nam) : nam;
  const profile: HopTuoiProfile = buildProfile(namAm, gio, gioiTinh);

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

  // ── Chấm điểm số khách nhập (phễu bói sim đang dùng) ───────────────────
  const soCanXemRaw = (searchParams.get("soCanXem") ?? "").trim();
  const coSao = soCanXemRaw.includes("*");
  let soCanXemDigits = soCanXemRaw.replace(/\D/g, "");
  // +84 / 84xxxxxxxxx → 0xxxxxxxxx
  if (soCanXemDigits.length === 11 && soCanXemDigits.startsWith("84")) {
    soCanXemDigits = "0" + soCanXemDigits.slice(2);
  }
  const singleEvaluation =
    !coSao && soCanXemDigits.length === 10 ? evaluateSingleSim(soCanXemDigits, profile) : null;

  // ── Bộ lọc nâng cao theo mong cầu phong thủy ───────────────────────────
  const mucTieu = searchParams.get("mucTieu") || undefined;
  const priceRange = searchParams.get("priceRange") || undefined;
  const prefix = searchParams.get("prefix") || undefined;
  // Ô số: có '*' → wildcard; 2–9 chữ số trơn → lọc "chứa"; đủ 10 số → chỉ bói.
  const searchQuery =
    searchParams.get("search") ||
    (coSao
      ? soCanXemRaw
      : soCanXemDigits.length >= 2 && soCanXemDigits.length < 10
        ? soCanXemDigits
        : undefined);
  const sortRaw = searchParams.get("sortBy");
  const sortBy: SortKey = sortRaw && SORT_KEYS.has(sortRaw as SortKey) ? (sortRaw as SortKey) : "score_desc";
  const limit = clampInt(searchParams.get("limit"), 1, 100, 30);
  // Cả kho đã được chấm trước khi cắt trang nên không cần kẹp offset thấp (trước
  // đây kẹp 10.000 → từ trang 335 trở đi lặp lại cùng 30 số).
  const offset = clampInt(searchParams.get("offset"), 0, 1_000_000, 0);
  // Ngưỡng điểm cho "Kho SIM hợp tuổi": mặc định bỏ số dưới mức Trung bình (< 5.5).
  // Khách đang TÌM một dạng số cụ thể (*6868, 6868) thì hiện đủ mọi số khớp — ẩn
  // bớt sẽ khiến khách tưởng hết hàng; thẻ số đã có nhãn xếp loại để khách tự cân.
  const minScore = clampNum(
    searchParams.get("minScore"),
    0,
    10,
    searchQuery ? 0 : NGUONG_HOP_TUOI.binhHoa,
  );

  // ── Chấm điểm + lọc toàn kho ───────────────────────────────────────────
  const sims = await getServerSims();
  const inventoryResult =
    sims.length > 0
      ? scoreInventoryAdvanced(sims, profile, {
          limit,
          offset,
          batCucFilter: hasBatCucFilter ? batCucFilter : undefined,
          searchQuery,
          mucTieu,
          priceRange,
          prefix,
          sortBy,
          minScore,
        })
      : { total: 0, sims: [] };

  return Response.json(
    {
      profile,
      birth: { ngay, thang, nam, namAm, lich },
      minScore,
      gioiTinh,
      singleEvaluation,
      total: inventoryResult.total,
      sims: inventoryResult.sims,
      limit,
      offset,
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
