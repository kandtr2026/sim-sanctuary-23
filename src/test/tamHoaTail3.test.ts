import { describe, it, expect } from "vitest";
import { groupTagByTail3 } from "@/lib/simDangSo";
import type { NormalizedSIM } from "@/lib/simUtils";

const sim = (rawDigits: string, price: number, tags: string[] = ["Tam hoa"]) =>
  ({ id: rawDigits, rawDigits, price, tags }) as unknown as NormalizedSIM;

describe("groupTagByTail3 — bảng cụm tam hoa", () => {
  it("gom theo 3 số cuối, đúng thứ tự 000→999, giá thấp nhất + số mẫu rẻ nhất", () => {
    const rows = groupTagByTail3(
      [
        sim("0906839222", 3_000_000),
        sim("0938366000", 1_200_000),
        sim("0703111222", 2_000_000),
        sim("0909123888", 9_000_000),
      ],
      "Tam hoa",
    );
    expect(rows.map((r) => r.tail)).toEqual(["000", "222", "888"]);
    const r222 = rows.find((r) => r.tail === "222")!;
    expect(r222.count).toBe(2);
    expect(r222.min).toBe(2_000_000);
    expect(r222.sample).toBe("0703111222");
  });

  it("bỏ số giá 0, số không có tag, và số mà đuôi 3 không thật sự giống nhau", () => {
    const rows = groupTagByTail3(
      [
        sim("0906839222", 0),
        sim("0906839555", 1_000_000, ["Lặp kép"]),
        sim("0906839123", 1_000_000),
      ],
      "Tam hoa",
    );
    expect(rows).toEqual([]);
  });
});
