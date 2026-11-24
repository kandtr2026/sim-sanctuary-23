import { describe, it, expect } from "vitest";
import { groupTagByTail4, isLapKepTail4 } from "@/lib/simDangSo";
import type { NormalizedSIM } from "@/lib/simUtils";

const sim = (rawDigits: string, price: number, tags: string[] = ["Lặp kép"]) =>
  ({ id: rawDigits, rawDigits, price, tags }) as unknown as NormalizedSIM;

describe("isLapKepTail4", () => {
  it("nhận AABB và ABAB, loại tứ quý và đuôi thường", () => {
    expect(isLapKepTail4("2288")).toBe(true);
    expect(isLapKepTail4("2929")).toBe(true);
    expect(isLapKepTail4("8888")).toBe(false);
    expect(isLapKepTail4("2837")).toBe(false);
    expect(isLapKepTail4("288")).toBe(false);
  });
});

describe("groupTagByTail4 — bảng đuôi lặp kép", () => {
  it("xếp đuôi nhiều hàng trước, giá thấp nhất + số mẫu rẻ nhất, giới hạn limit", () => {
    const rows = groupTagByTail4(
      [
        sim("0703222288", 2_000_000),
        sim("0909112288", 1_500_000),
        sim("0934005500", 1_000_000),
        sim("0909578585", 3_000_000),
      ],
      "Lặp kép",
      2,
    );
    expect(rows.map((r) => r.tail)).toEqual(["2288", "5500"]);
    expect(rows[0].count).toBe(2);
    expect(rows[0].min).toBe(1_500_000);
    expect(rows[0].sample).toBe("0909112288");
  });

  it("bỏ số giá 0, số không có tag, và đuôi không đúng dạng", () => {
    const rows = groupTagByTail4(
      [sim("0703222288", 0), sim("0703222288", 1_000_000, ["Tam hoa"]), sim("0703228888", 1_000_000)],
      "Lặp kép",
    );
    expect(rows).toEqual([]);
  });
});
