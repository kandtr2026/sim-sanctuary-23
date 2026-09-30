/**
 * Quy vị trí (theo IP) về TỈNH/THÀNH cho thống kê traffic theo địa bàn.
 *
 * Nguồn vị trí: header geo của Vercel lúc ghi lượt xem (`x-vercel-ip-country-region`
 * = phần sau "VN-" của mã ISO 3166-2, vd SG, HN, 57) — cùng chuẩn mã với GeoIP
 * offline dùng để điền bù dữ liệu cũ. Các CSDL GeoIP vẫn dùng 63 tỉnh cũ, nên ở
 * đây quy tiếp về 34 đơn vị mới (sáp nhập từ 01/07/2025, NQ 202/2025/QH15) và giữ
 * tỉnh cũ làm chi tiết.
 *
 * Độ chính xác: IP 4G của nhà mạng hay báo về cổng ở TP.HCM / Hà Nội, nên các
 * tỉnh khác có thể bị đếm thiếu — số liệu là tương đối, không phải tuyệt đối.
 */

/** Mã ISO 3166-2:VN (bỏ "VN-") → tỉnh cũ. VN-15 Hà Tây đã nhập Hà Nội 2008 nhưng CSDL cũ còn dùng. */
export const TINH_CU_THEO_MA: Record<string, string> = {
  HN: "Hà Nội", SG: "TP. Hồ Chí Minh", HP: "Hải Phòng", DN: "Đà Nẵng", CT: "Cần Thơ",
  "01": "Lai Châu", "02": "Lào Cai", "03": "Hà Giang", "04": "Cao Bằng", "05": "Sơn La",
  "06": "Yên Bái", "07": "Tuyên Quang", "09": "Lạng Sơn", "13": "Quảng Ninh", "14": "Hòa Bình",
  "15": "Hà Tây", "18": "Ninh Bình", "20": "Thái Bình", "21": "Thanh Hóa", "22": "Nghệ An",
  "23": "Hà Tĩnh", "24": "Quảng Bình", "25": "Quảng Trị", "26": "Thừa Thiên Huế", "27": "Quảng Nam",
  "28": "Kon Tum", "29": "Quảng Ngãi", "30": "Gia Lai", "31": "Bình Định", "32": "Phú Yên",
  "33": "Đắk Lắk", "34": "Khánh Hòa", "35": "Lâm Đồng", "36": "Ninh Thuận", "37": "Tây Ninh",
  "39": "Đồng Nai", "40": "Bình Thuận", "41": "Long An", "43": "Bà Rịa - Vũng Tàu", "44": "An Giang",
  "45": "Đồng Tháp", "46": "Tiền Giang", "47": "Kiên Giang", "49": "Vĩnh Long", "50": "Bến Tre",
  "51": "Trà Vinh", "52": "Sóc Trăng", "53": "Bắc Kạn", "54": "Bắc Giang", "55": "Bạc Liêu",
  "56": "Bắc Ninh", "57": "Bình Dương", "58": "Bình Phước", "59": "Cà Mau", "61": "Hải Dương",
  "63": "Hà Nam", "66": "Hưng Yên", "67": "Nam Định", "68": "Phú Thọ", "69": "Thái Nguyên",
  "70": "Vĩnh Phúc", "71": "Điện Biên", "72": "Đắk Nông", "73": "Hậu Giang",
};

/** Tỉnh cũ → 1 trong 34 tỉnh/thành từ 01/07/2025. Tỉnh không sáp nhập thì giữ tên. */
const SAP_NHAP: Record<string, string> = {
  "Hà Tây": "Hà Nội",
  "Thừa Thiên Huế": "Huế",
  "Hà Giang": "Tuyên Quang",
  "Yên Bái": "Lào Cai",
  "Bắc Kạn": "Thái Nguyên",
  "Vĩnh Phúc": "Phú Thọ", "Hòa Bình": "Phú Thọ",
  "Bắc Giang": "Bắc Ninh",
  "Thái Bình": "Hưng Yên",
  "Hải Dương": "Hải Phòng",
  "Hà Nam": "Ninh Bình", "Nam Định": "Ninh Bình",
  "Quảng Bình": "Quảng Trị",
  "Quảng Nam": "Đà Nẵng",
  "Kon Tum": "Quảng Ngãi",
  "Bình Định": "Gia Lai",
  "Ninh Thuận": "Khánh Hòa",
  "Đắk Nông": "Lâm Đồng", "Bình Thuận": "Lâm Đồng",
  "Phú Yên": "Đắk Lắk",
  "Bình Dương": "TP. Hồ Chí Minh", "Bà Rịa - Vũng Tàu": "TP. Hồ Chí Minh",
  "Bình Phước": "Đồng Nai",
  "Long An": "Tây Ninh",
  "Sóc Trăng": "Cần Thơ", "Hậu Giang": "Cần Thơ",
  "Bến Tre": "Vĩnh Long", "Trà Vinh": "Vĩnh Long",
  "Tiền Giang": "Đồng Tháp",
  "Bạc Liêu": "Cà Mau",
  "Kiên Giang": "An Giang",
};

/**
 * Khi thiếu mã vùng nhưng có tên thành phố (một số IP chỉ định vị tới city):
 * tên tiếng Anh GeoIP hay trả → tỉnh cũ. Chỉ các đô thị hay gặp; thiếu thì "Chưa xác định".
 */
const TINH_CU_THEO_THANH_PHO: Record<string, string> = {
  "ho chi minh city": "TP. Hồ Chí Minh", "ho chi minh": "TP. Hồ Chí Minh", saigon: "TP. Hồ Chí Minh",
  "thu duc": "TP. Hồ Chí Minh", hanoi: "Hà Nội", "ha noi": "Hà Nội", "da nang": "Đà Nẵng",
  danang: "Đà Nẵng", haiphong: "Hải Phòng", "hai phong": "Hải Phòng", "can tho": "Cần Thơ",
  "thu dau mot": "Bình Dương", "di an": "Bình Dương", "thuan an": "Bình Dương", "bien hoa": "Đồng Nai",
  "vung tau": "Bà Rịa - Vũng Tàu", "nha trang": "Khánh Hòa", hue: "Thừa Thiên Huế",
  "buon ma thuot": "Đắk Lắk", "da lat": "Lâm Đồng", dalat: "Lâm Đồng", "quy nhon": "Bình Định",
  vinh: "Nghệ An", "thanh hoa": "Thanh Hóa", "nam dinh": "Nam Định", "hai duong": "Hải Dương",
  "long xuyen": "An Giang", "rach gia": "Kiên Giang", "my tho": "Tiền Giang", "ca mau": "Cà Mau",
  "bac ninh": "Bắc Ninh", "thai nguyen": "Thái Nguyên", "viet tri": "Phú Thọ", "ha long": "Quảng Ninh",
  "phan thiet": "Bình Thuận", pleiku: "Gia Lai", "tay ninh": "Tây Ninh", "tan an": "Long An",
};

/** Có IP Việt Nam nhưng CSDL chỉ biết tới quốc gia (hay gặp ở IP 4G). */
export const VN_CHUA_RO = "Việt Nam – chưa rõ tỉnh";
export const NUOC_NGOAI = "Nước ngoài";
/** Lượt không có vị trí (trước 13/09 web chưa lưu IP, hoặc IP không tra được). */
export const CHUA_XAC_DINH = "Chưa có dữ liệu vị trí";
/** Các nhóm không phải tỉnh — UI làm mờ, xếp cuối bảng theo thứ tự này. */
export const NHOM_PHU = [VN_CHUA_RO, NUOC_NGOAI, CHUA_XAC_DINH] as const;

const khongDau = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D").toLowerCase().trim();

export interface ViTri {
  /** 1 trong 34 tỉnh/thành mới, hoặc NUOC_NGOAI / CHUA_XAC_DINH. */
  tinh: string;
  /** Tỉnh cũ (63) theo CSDL GeoIP, nếu xác định được. */
  tinhCu: string | null;
}

export function viTriCuaLuot(country: string | null, region: string | null, city: string | null): ViTri {
  const c = (country ?? "").trim().toUpperCase();
  if (c && c !== "VN") return { tinh: NUOC_NGOAI, tinhCu: null };
  const ma = (region ?? "").trim().toUpperCase().replace(/^VN-/, "");
  // Tên thành phố nhận ra được thì TIN TRƯỚC mã vùng: 30/09 Vercel trả
  // region "61" (Hải Dương) kèm city "Ho Chi Minh City" cho IP ở Q.7 — city
  // đúng, region sai. City chi tiết hơn; không có city mới dùng mã vùng.
  const tinhCu = TINH_CU_THEO_THANH_PHO[khongDau(city ?? "")] ?? TINH_CU_THEO_MA[ma] ?? null;
  if (!tinhCu) return { tinh: c === "VN" ? VN_CHUA_RO : CHUA_XAC_DINH, tinhCu: null };
  return { tinh: SAP_NHAP[tinhCu] ?? tinhCu, tinhCu };
}

export interface DongGeo {
  country: string | null;
  region: string | null;
  city: string | null;
  luot: number;
  khach: number;
}

export interface TinhThongKe {
  tinh: string;
  luot: number;
  /** Số IP khác nhau (≈ số khách). */
  khach: number;
  /** Tỉnh cũ gộp vào tỉnh này, lượt giảm dần. */
  chiTiet: { tinhCu: string; luot: number }[];
}

/** Gom các dòng (country, region, city) của RPC geo_page_visits thành bảng theo tỉnh mới. */
export function gomTheoTinh(rows: DongGeo[]): { tong: number; tinh: TinhThongKe[] } {
  const map = new Map<string, TinhThongKe & { cu: Map<string, number> }>();
  let tong = 0;
  for (const r of rows) {
    const luot = Number(r.luot) || 0;
    const khach = Number(r.khach) || 0;
    tong += luot;
    const { tinh, tinhCu } = viTriCuaLuot(r.country, r.region, r.city);
    const e = map.get(tinh) ?? { tinh, luot: 0, khach: 0, chiTiet: [], cu: new Map<string, number>() };
    e.luot += luot;
    e.khach += khach;
    if (tinhCu) e.cu.set(tinhCu, (e.cu.get(tinhCu) ?? 0) + luot);
    map.set(tinh, e);
  }
  const cuoi = (t: string) => (NHOM_PHU as readonly string[]).indexOf(t) + 1; // tỉnh = 0 → lên đầu
  const tinh = [...map.values()]
    .map(({ cu, ...e }) => ({ ...e, chiTiet: [...cu].map(([tinhCu, luot]) => ({ tinhCu, luot })).sort((a, b) => b.luot - a.luot) }))
    .sort((a, b) => cuoi(a.tinh) - cuoi(b.tinh) || b.luot - a.luot);
  return { tong, tinh };
}
