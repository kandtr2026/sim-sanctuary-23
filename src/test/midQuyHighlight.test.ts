import { describe, it, expect } from "vitest";
import React from "react";
import { createMidQuyHighlightedNumber, findMidQuyRun, midQuyDisplayNumber } from "@/lib/highlightUtils";
import { CATEGORY_RULES } from "@/lib/simCategories";

/** Chữ số đang được tô vàng (span font-extrabold) trong kết quả. */
const goldText = (nodes: React.ReactNode[]): string =>
  nodes
    .filter((n) => React.isValidElement<{ className?: string; children?: string }>(n) && n.props.className?.includes("text-gold"))
    .map((n) => (n as React.ReactElement<{ children?: string }>).props.children ?? "")
    .join("|");

describe("tô cụm tứ quý giữa (/sim-tu-quy-giua)", () => {
  it("cụm 1111 của 0879111166 hiện liền một khối và được tô", () => {
    expect(midQuyDisplayNumber("0879.111.166", "0879111166", 4)).toBe("0879.1111.66");
    expect(goldText(createMidQuyHighlightedNumber("0879.111.166", "0879111166", 4))).toBe("1111");
  });

  it("chấm lại đúng các ví dụ trên trang", () => {
    expect(midQuyDisplayNumber("0928.000.060", "0928000060", 4)).toBe("0928.0000.60");
    expect(midQuyDisplayNumber("0789.999.700", "0789999700", 4)).toBe("078.9999.700");
    expect(midQuyDisplayNumber("0929.500.002", "0929500002", 4)).toBe("0929.5.0000.2");
  });

  it("không tô tứ quý đuôi hay cụm dính đầu số — trả nguyên display", () => {
    expect(createMidQuyHighlightedNumber("093.368.6666", "0933686666", 4)).toEqual(["093.368.6666"]);
    expect(createMidQuyHighlightedNumber("0911.113.503", "0911113503", 4)).toEqual(["0911.113.503"]);
  });

  it("khớp đúng luật danh mục CATEGORY_RULES['Tứ quý giữa']", () => {
    const samples = [
      "0879111166", "0928000060", "0789999700", "0929500002", "0876466664", "0798888206",
      "0926111170", "0911113503", "0333366775", "0933686666", "0876000003", "0983000000",
      "0955556666", "0901234567",
    ];
    for (const d of samples) {
      expect(findMidQuyRun(d, 4) !== null, d).toBe(CATEGORY_RULES["Tứ quý giữa"](d));
    }
  });
});
