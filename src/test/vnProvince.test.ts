import { describe, expect, it } from "vitest";
import { CHUA_XAC_DINH, NUOC_NGOAI, TINH_CU_THEO_MA, VN_CHUA_RO, gomTheoTinh, viTriCuaLuot } from "@/lib/vnProvince";

describe("quy vị trí IP về tỉnh/thành", () => {
  it("đủ 63 tỉnh cũ (+ Hà Tây) và quy về đúng 34 tỉnh/thành mới", () => {
    const maCu = Object.keys(TINH_CU_THEO_MA);
    expect(maCu).toHaveLength(64); // 63 + VN-15 Hà Tây
    const moi = new Set(maCu.map((m) => viTriCuaLuot("VN", m, null).tinh));
    expect(moi.size).toBe(34);
    expect(moi.has(CHUA_XAC_DINH)).toBe(false);
  });

  it("các ca sáp nhập tiêu biểu (NQ 202/2025/QH15)", () => {
    expect(viTriCuaLuot("VN", "SG", null)).toEqual({ tinh: "TP. Hồ Chí Minh", tinhCu: "TP. Hồ Chí Minh" });
    expect(viTriCuaLuot("VN", "57", null)).toEqual({ tinh: "TP. Hồ Chí Minh", tinhCu: "Bình Dương" });
    expect(viTriCuaLuot("VN", "43", null).tinh).toBe("TP. Hồ Chí Minh"); // Bà Rịa - Vũng Tàu
    expect(viTriCuaLuot("VN", "61", null).tinh).toBe("Hải Phòng"); // Hải Dương
    expect(viTriCuaLuot("VN", "27", null).tinh).toBe("Đà Nẵng"); // Quảng Nam
    expect(viTriCuaLuot("VN", "26", null).tinh).toBe("Huế");
    expect(viTriCuaLuot("VN", "15", null).tinh).toBe("Hà Nội"); // Hà Tây
    expect(viTriCuaLuot("VN", "58", null).tinh).toBe("Đồng Nai"); // Bình Phước
    expect(viTriCuaLuot("VN", "47", null).tinh).toBe("An Giang"); // Kiên Giang
    expect(viTriCuaLuot("VN", "21", null).tinh).toBe("Thanh Hóa"); // không sáp nhập
  });

  it("chấp nhận tiền tố VN- và chữ thường", () => {
    expect(viTriCuaLuot("vn", "vn-hn", null).tinh).toBe("Hà Nội");
  });

  it("mã vùng và thành phố mâu thuẫn thì tin thành phố (ca thật từ Vercel 30/09)", () => {
    expect(viTriCuaLuot("VN", "61", "Ho Chi Minh City")).toEqual({ tinh: "TP. Hồ Chí Minh", tinhCu: "TP. Hồ Chí Minh" });
    expect(viTriCuaLuot("VN", "61", "Some Unknown Town").tinh).toBe("Hải Phòng"); // city lạ → theo mã vùng
  });

  it("thiếu mã vùng thì đoán theo tên thành phố", () => {
    expect(viTriCuaLuot("VN", null, "Ho Chi Minh City").tinh).toBe("TP. Hồ Chí Minh");
    expect(viTriCuaLuot("VN", "", "Thu Dau Mot")).toEqual({ tinh: "TP. Hồ Chí Minh", tinhCu: "Bình Dương" });
    expect(viTriCuaLuot("VN", null, "Biên Hòa").tinh).toBe("Đồng Nai");
  });

  it("nước ngoài, VN-không-rõ-tỉnh và không-có-vị-trí tách riêng", () => {
    expect(viTriCuaLuot("US", "CA", "Los Angeles").tinh).toBe(NUOC_NGOAI);
    expect(viTriCuaLuot(null, null, null).tinh).toBe(CHUA_XAC_DINH);
    expect(viTriCuaLuot("VN", "99", "Nowhere").tinh).toBe(VN_CHUA_RO); // IP VN nhưng không rõ tỉnh
  });
});

describe("gomTheoTinh", () => {
  const { tong, tinh } = gomTheoTinh([
    { country: "VN", region: "SG", city: null, luot: 80, khach: 30 },
    { country: "VN", region: "57", city: null, luot: 12, khach: 5 },
    { country: "VN", region: "HN", city: null, luot: 40, khach: 20 },
    { country: null, region: null, city: null, luot: 100, khach: 0 },
    { country: "VN", region: null, city: null, luot: 7, khach: 4 },
    { country: "SG", region: "01", city: null, luot: 3, khach: 1 },
  ]);

  it("cộng lượt/khách theo tỉnh mới, giữ tỉnh cũ làm chi tiết", () => {
    expect(tong).toBe(242);
    const hcm = tinh.find((t) => t.tinh === "TP. Hồ Chí Minh")!;
    expect(hcm).toMatchObject({ luot: 92, khach: 35 });
    expect(hcm.chiTiet).toEqual([
      { tinhCu: "TP. Hồ Chí Minh", luot: 80 },
      { tinhCu: "Bình Dương", luot: 12 },
    ]);
  });

  it("xếp tỉnh theo lượt giảm dần, rồi VN-chưa-rõ, nước ngoài, không-có-vị-trí", () => {
    expect(tinh.map((t) => t.tinh)).toEqual(["TP. Hồ Chí Minh", "Hà Nội", VN_CHUA_RO, NUOC_NGOAI, CHUA_XAC_DINH]);
  });
});
