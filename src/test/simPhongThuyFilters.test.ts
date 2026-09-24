import { describe, it, expect } from "vitest";
import {
  buildProfile,
  diemMucTieuCat,
  evaluateSingleSim,
  scoreInventoryAdvanced,
  scoreSim,
  tinhCungPhi,
  xepLoaiHopTuoi,
  MUC_TIEU_MIN_CAP,
  type HopTuoiProfile,
} from "@/lib/simHopTuoi";
import { namAmLich } from "@/lib/amLich";
import { normalizeSIM, PRICE_RANGES, type NormalizedSIM } from "@/lib/simUtils";

/**
 * Khoá logic lọc / nhãn của /sim-phong-thuy (engine src/lib/simHopTuoi.ts).
 * Các lỗi đã từng lên prod: chip "> 50 triệu" giấu số ≥ 100 triệu, wildcard
 * "09*79" hiểu thành "chứa 0979", mục tiêu chỉ cần 1 cặp (kể cả Lục Sát hung),
 * nhãn "Tương khắc" trên số điểm ngũ hành cao, cung phi sai cho năm ≥ 2000,
 * người sinh trước Tết bị tính sai tuổi.
 */

const sim = (digits: string, price = 1_000_000): NormalizedSIM => normalizeSIM(digits, null, price, digits);
const P1990: HopTuoiProfile = buildProfile(1990, 5, "nam");
const digitsOf = (r: { sims: { digits: string }[] }) => r.sims.map((s) => s.digits);

describe("cung phi Bát Trạch", () => {
  // Công thức quen thuộc cho năm 19xx (2 số cuối) — bản cũ, đúng cho thế kỷ 20.
  const cungCu19xx = (year: number, gt: "nam" | "nu"): number => {
    const yy = year % 100;
    let s = Math.floor(yy / 10) + (yy % 10);
    while (s > 9) s = String(s).split("").reduce((a, d) => a + Number(d), 0);
    let so = gt === "nam" ? 10 - s : 5 + s;
    if (so === 10) so = 1;
    while (so > 9) so -= 9;
    return so;
  };

  it("1950–1999 giữ nguyên kết quả cũ", () => {
    for (let y = 1950; y <= 1999; y++) {
      expect(tinhCungPhi(y, "nam").so, `nam ${y}`).toBe(cungCu19xx(y, "nam"));
      expect(tinhCungPhi(y, "nu").so, `nữ ${y}`).toBe(cungCu19xx(y, "nu"));
    }
  });

  it.each([
    [2000, "Ly", "Càn"],
    [2001, "Cấn", "Đoài"],
    [2004, "Khôn", "Khảm"],
    [2005, "Tốn", "Khôn"],
    [2008, "Khảm", "Cấn"],
    [1999, "Khảm", "Cấn"],
  ])("năm %i: nam %s, nữ %s", (nam, cungNam, cungNu) => {
    expect(tinhCungPhi(nam, "nam").cung).toBe(cungNam);
    expect(tinhCungPhi(nam, "nu").cung).toBe(cungNu);
  });

  it("nam 2000 là Ly (Âm), không phải Khảm (Dương)", () => {
    expect(tinhCungPhi(2000, "nam")).toMatchObject({ cung: "Ly", amDuong: "Âm" });
  });
});

describe("hồ sơ theo năm âm lịch", () => {
  it("15/01/1990 dương lịch (trước Tết) → Kỷ Tỵ, mệnh Mộc", () => {
    const p = buildProfile(namAmLich(15, 1, 1990), 5, "nam");
    expect(p).toMatchObject({ thienCan: "Kỷ", diaChi: "Tỵ", menh: "Mộc", napAm: "Đại Lâm Mộc" });
    expect(p.cungPhi.cung).toBe("Khôn");
  });

  it("15/02/1990 dương lịch (sau Tết) → Canh Ngọ, mệnh Thổ", () => {
    const p = buildProfile(namAmLich(15, 2, 1990), 5, "nam");
    expect(p).toMatchObject({ thienCan: "Canh", diaChi: "Ngọ", menh: "Thổ", napAm: "Lộ Bàng Thổ" });
    expect(p.cungPhi.cung).toBe("Khảm");
  });
});

describe("nhãn trên thẻ SIM khớp với điểm", () => {
  it("hành của số đếm theo đúng bảng chấm điểm", () => {
    const s = scoreSim(sim("0899852828"), P1990); // 7 chữ số Thổ (2,5,8)
    expect(s.simHanh).toBe("Thổ");
    expect(s.quanHe).toBe("Tương hòa — hợp");
  });

  it("điểm ngũ hành ≥ 7.5 thì không bao giờ ghi 'Tương khắc'", () => {
    const profiles = [1984, 1986, 1988, 1990, 1996, 2000].map((y) => buildProfile(y, 0, "nam"));
    let seed = 7;
    const rnd = () => {
      seed = (seed * 1103515245 + 12345) % 2147483648;
      return seed / 2147483648;
    };
    for (let i = 0; i < 3000; i++) {
      const d = "09" + Array.from({ length: 8 }, () => Math.floor(rnd() * 10)).join("");
      for (const p of profiles) {
        const s = scoreSim(sim(d), p);
        if (s.nguHanhScore >= 7.5) expect(s.quanHe, `${d} / ${p.menh}`).not.toMatch(/Tương khắc/);
      }
    }
  });

  it("xếp loại theo ngưỡng 8.5 / 7 / 5.5", () => {
    expect(xepLoaiHopTuoi(8.5)).toEqual({ verdict: "Rất hợp tuổi", tone: "gold" });
    expect(xepLoaiHopTuoi(8.4).verdict).toBe("Hợp tuổi");
    expect(xepLoaiHopTuoi(7).verdict).toBe("Hợp tuổi");
    expect(xepLoaiHopTuoi(6.9).verdict).toBe("Trung bình");
    expect(xepLoaiHopTuoi(5.5).verdict).toBe("Trung bình");
    expect(xepLoaiHopTuoi(5.4)).toEqual({ verdict: "Không hợp", tone: "red" });
  });

  it("thẻ SIM và phần bói số cùng một tầng xếp loại", () => {
    for (const d of ["0902598898", "0899852828", "0903714793", "0968686868", "0777782668"]) {
      const s = scoreSim(sim(d), P1990);
      const ev = evaluateSingleSim(d, P1990);
      expect(ev.tone, d).toBe(s.tone);
      expect(s.verdict).toBe(xepLoaiHopTuoi(s.score).verdict);
    }
  });

  it("lời khuyên bói số không khẳng định 'tương sinh' khi thực tế là tương khắc", () => {
    const p2000 = buildProfile(2000, 0, "nam"); // mệnh Kim
    // Số toàn chữ số Hỏa (9) → Hỏa khắc Kim.
    const ev = evaluateSingleSim("0999999999", p2000);
    expect(ev.quanHe).toBe("Tương khắc — cân nhắc");
    expect(ev.advice).not.toMatch(/tương sinh/i);
    expect(ev.advice).toMatch(/khắc mệnh Kim/);
  });
});

describe("scoreInventoryAdvanced — bộ lọc", () => {
  const KHO = [
    sim("0909111979", 500_000),
    sim("0909798926", 2_000_000),
    sim("0979123456", 4_000_000),
    sim("0901234568", 30_000_000),
    sim("0968123456", 60_000_000),
    sim("0908080888", 150_000_000),
    sim("0938868868", 1_000_000_000),
    sim("0775551234", 800_000),
    sim("0931234568", 1_500_000),
  ];

  it("PRICE_RANGES 5..8 phủ liền từ 50 triệu tới vô cực", () => {
    expect(PRICE_RANGES[5].min).toBe(50_000_000);
    for (let i = 5; i < 8; i++) expect(PRICE_RANGES[i + 1].min).toBe(PRICE_RANGES[i].max + 1);
    expect(PRICE_RANGES[8].max).toBe(Infinity);
  });

  it("chip '> 50 triệu' (5,6,7,8) giữ cả số ≥ 100 triệu", () => {
    const r = scoreInventoryAdvanced(KHO, P1990, { priceRange: "5,6,7,8", limit: 50 });
    expect(digitsOf(r).sort()).toEqual(["0908080888", "0938868868", "0968123456"]);
  });

  it("priceRange '5,' không kéo thêm mức '< 1 triệu'", () => {
    const r = scoreInventoryAdvanced(KHO, P1990, { priceRange: "5,", limit: 50 });
    expect(digitsOf(r)).toEqual(["0968123456"]);
  });

  it("prefix '090,' chỉ khớp đầu 090", () => {
    const r = scoreInventoryAdvanced(KHO, P1990, { prefix: "090,", limit: 50 });
    expect(digitsOf(r).every((d) => d.startsWith("090"))).toBe(true);
    expect(r.total).toBe(4);
  });

  it.each([
    ["09*79", ["0909111979"]],
    ["*8*8", ["0908080888", "0938868868"]],
    ["07*555*", ["0775551234"]],
    ["090*", ["0901234568", "0908080888", "0909111979", "0909798926"]],
    ["*79", ["0909111979"]],
    ["1234", ["0979123456", "0901234568", "0968123456", "0775551234", "0931234568"]],
    ["8868", ["0938868868"]],
  ])("ô số '%s' lọc đúng (wildcard neo hai đầu / chứa)", (q, expected) => {
    const r = scoreInventoryAdvanced(KHO, P1990, { searchQuery: q, limit: 50 });
    expect(digitsOf(r).sort()).toEqual([...expected].sort());
  });

  it("mục tiêu chỉ đếm cặp CÁT và loại số bị sao hung chi phối", () => {
    // 0902598898: 1 Phục Vị + 3 Họa Hại (chủ đạo hung) → không phải số Tài lộc.
    expect(diemMucTieuCat("0902598898", "TaiLoc")).toBeNull();
    // 0916161616: 7 cặp Lục Sát (hung) → không phải số Tình duyên.
    expect(diemMucTieuCat("0916161616", "TinhDuyen")).toBeNull();
    // 0968686868: 7 cặp Thiên Y → Tài lộc mạnh.
    expect(diemMucTieuCat("0968686868", "TaiLoc")).toBe(7);

    const kho = [sim("0902598898"), sim("0916161616"), sim("0968686868"), sim("0913131313")];
    const taiLoc = scoreInventoryAdvanced(kho, P1990, { mucTieu: "TaiLoc", limit: 50 });
    expect(digitsOf(taiLoc)).not.toContain("0902598898");
    expect(digitsOf(taiLoc)).toContain("0968686868");
    const tinhDuyen = scoreInventoryAdvanced(kho, P1990, { mucTieu: "TinhDuyen", limit: 50 });
    expect(digitsOf(tinhDuyen)).not.toContain("0916161616");
    for (const d of digitsOf(tinhDuyen)) {
      expect(diemMucTieuCat(d, "TinhDuyen") ?? 0).toBeGreaterThanOrEqual(MUC_TIEU_MIN_CAP);
    }
  });

  it("mục tiêu làm đổi thứ tự: xếp theo điểm + 0.3 × số cặp cát của mục tiêu", () => {
    const kho = ["0968686868", "0913131313", "0988668866", "0932727272", "0911223344"].map((d) => sim(d));
    const r = scoreInventoryAdvanced(kho, P1990, { mucTieu: "TaiLoc", limit: 50 });
    const keys = r.sims.map((s) => s.score + 0.3 * (diemMucTieuCat(s.digits, "TaiLoc") ?? 0));
    for (let i = 1; i < keys.length; i++) expect(keys[i - 1]).toBeGreaterThanOrEqual(keys[i] - 1e-9);
  });

  it("minScore bỏ số dưới ngưỡng; mặc định (0) giữ nguyên cả kho", () => {
    const tatCa = scoreInventoryAdvanced(KHO, P1990, { limit: 50 });
    expect(tatCa.total).toBe(KHO.length);
    const loc = scoreInventoryAdvanced(KHO, P1990, { limit: 50, minScore: 5.5 });
    expect(loc.sims.every((s) => s.score >= 5.5)).toBe(true);
    expect(loc.total).toBe(tatCa.sims.filter((s) => s.score >= 5.5).length);
  });

  it("offset vượt tổng trả danh sách rỗng (không lặp trang cuối)", () => {
    const r = scoreInventoryAdvanced(KHO, P1990, { limit: 5, offset: 100 });
    expect(r.sims).toEqual([]);
    expect(r.total).toBe(KHO.length);
  });
});
