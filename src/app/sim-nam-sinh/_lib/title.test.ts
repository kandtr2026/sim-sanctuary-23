import { describe, expect, it } from "vitest";
import { buildBaseTitle, buildNamSinhTitle } from "./title";

describe("buildNamSinhTitle", () => {
  it("nêu giá từ + số lượng thật", () => {
    const t = buildNamSinhTitle("1980", 450_000, 37);
    expect(t).toBe("Sim Năm Sinh 1980 MobiFone Giá Từ 450 nghìn — 37 Số Có 1980");
    expect(t.length).toBeLessThanOrEqual(65);
  });

  it("định dạng số lượng hàng nghìn kiểu VN", () => {
    expect(buildNamSinhTitle("1990", 1_500_000, 1234)).toContain("1.234 Số Có 1990");
  });

  it("không có giá hoặc không có số → title cũ, không hứa giá", () => {
    expect(buildNamSinhTitle("1980", 0, 10)).toBe(buildBaseTitle("1980"));
    expect(buildNamSinhTitle("1980", 500_000, 0)).toBe(buildBaseTitle("1980"));
  });

  it("luôn ≤ 65 ký tự trên toàn dải năm", () => {
    for (let y = 1955; y <= 2025; y++) {
      expect(buildNamSinhTitle(String(y), 12_345_678, 99_999).length).toBeLessThanOrEqual(65);
    }
  });
});
