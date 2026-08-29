import { describe, expect, it } from "vitest";
import { ALL_YEARS, buildDescription, buildIntro, buildTitle, getYearInfo } from "./yearContent";
import { HANH_META } from "@/app/sim-hop-menh/_lib/hanhMeta";

/**
 * Chốt ngưỡng meta cho cụm /sim-hop-tuoi + /sim-hop-menh.
 *
 * Vì sao cần test chứ không tin mắt: 61 trang năm sinh meta ra từ 4 khuôn có
 * biến (can chi 6–9 ký tự, nạp âm 7–16, danh sách chữ số 1–7), nên chỉ cần đổi
 * một chữ trong khuôn là vài năm rơi ra ngoài 140–165 mà không ai thấy. Đây là
 * đúng lỗi "meta gần trùng / lệch độ dài" mà cụm này phải tránh.
 */
describe("meta cụm sim hợp tuổi", () => {
  it("title ≤ 60 ký tự cho cả 61 năm", () => {
    const viPham = ALL_YEARS.map((y) => buildTitle(getYearInfo(y))).filter((t) => t.length > 60);
    expect(viPham).toEqual([]);
  });

  it("description 140–165 ký tự cho cả 61 năm", () => {
    const viPham = ALL_YEARS.map((y) => buildDescription(getYearInfo(y))).filter(
      (d) => d.length < 140 || d.length > 165,
    );
    expect(viPham).toEqual([]);
  });

  it("xoay đủ 4 khuôn title / description / mở bài", () => {
    const nam = [1960, 1961, 1962, 1963]; // %4 = 0,1,2,3
    for (const build of [buildTitle, buildDescription, buildIntro]) {
      const ra = new Set(nam.map((y) => build(getYearInfo(y))));
      expect(ra.size).toBe(4);
    }
  });

  it("không dùng lối xưng hô 'bạn' / 'mình'", () => {
    const chu = ALL_YEARS.flatMap((y) => {
      const info = getYearInfo(y);
      return [buildTitle(info), buildDescription(info), buildIntro(info)];
    }).join(" ");
    expect(chu).not.toMatch(/\bbạn\b/i);
    expect(chu).not.toMatch(/\bmình\b/i);
  });
});

describe("meta 5 trang hợp mệnh", () => {
  it("title ≤ 60 và description 140–165", () => {
    for (const meta of Object.values(HANH_META)) {
      expect(meta.title.length, meta.title).toBeLessThanOrEqual(60);
      expect(meta.description.length, meta.description).toBeGreaterThanOrEqual(140);
      expect(meta.description.length, meta.description).toBeLessThanOrEqual(165);
    }
  });

  it("5 mệnh ra 5 title khác nhau", () => {
    const titles = new Set(Object.values(HANH_META).map((m) => m.title));
    expect(titles.size).toBe(5);
  });
});
