import { describe, it, expect } from "vitest";
import { getBirthYearLifeStage } from "@/lib/birthYearLifeStage";

// Năm hiện tại cố định để test không phụ thuộc ngày chạy.
const NOW = 2026;

describe("getBirthYearLifeStage — tư vấn theo giai đoạn đời", () => {
  it("dưới 22 tuổi → học hành (study)", () => {
    const r = getBirthYearLifeStage(2010, NOW); // 16 tuổi
    expect(r.age).toBe(16);
    expect(r.stage).toBe("study");
    expect(r.cta).toContain("học hành");
  });

  it("biên 21 tuổi vẫn là study", () => {
    expect(getBirthYearLifeStage(2005, NOW).stage).toBe("study"); // 21
  });

  it("biên 22 tuổi → công việc (career)", () => {
    const r = getBirthYearLifeStage(2004, NOW); // 22
    expect(r.age).toBe(22);
    expect(r.stage).toBe("career");
    expect(r.cta).toContain("công việc");
  });

  it("biên 30 tuổi vẫn là career", () => {
    expect(getBirthYearLifeStage(1996, NOW).stage).toBe("career"); // 30
  });

  it("31 tuổi trở lên → thăng tiến (advancement)", () => {
    const r = getBirthYearLifeStage(1995, NOW); // 31
    expect(r.age).toBe(31);
    expect(r.stage).toBe("advancement");
    expect(r.cta).toContain("thăng tiến");
  });

  it("nhận cả chuỗi 'YYYY'", () => {
    expect(getBirthYearLifeStage("1980", NOW).stage).toBe("advancement");
  });

  it("năm ở tương lai → tuổi kẹp về 0, vẫn ra study", () => {
    const r = getBirthYearLifeStage(2030, NOW);
    expect(r.age).toBe(0);
    expect(r.stage).toBe("study");
  });

  it("luôn có title/body/cta không rỗng", () => {
    for (const y of [2012, 2000, 1970]) {
      const r = getBirthYearLifeStage(y, NOW);
      expect(r.title.length).toBeGreaterThan(0);
      expect(r.body.length).toBeGreaterThan(0);
      expect(r.cta.length).toBeGreaterThan(0);
    }
  });

  it("copy không hứa hẹn tuyệt đối (không 'chắc chắn/cam kết/đảm bảo')", () => {
    for (const y of [2012, 2000, 1970]) {
      const { body } = getBirthYearLifeStage(y, NOW);
      expect(body).not.toMatch(/chắc chắn|cam kết|đảm bảo/i);
    }
  });
});
