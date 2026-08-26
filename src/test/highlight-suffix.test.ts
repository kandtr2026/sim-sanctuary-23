import { describe, it, expect } from "vitest";
import type { ReactElement } from "react";
import { createHighlightedNumber, createQuyHighlightedNumber } from "@/lib/highlightUtils";

type HlSpan = ReactElement<{ className?: string; children?: string }>;

describe("createQuyHighlightedNumber — tứ quý liền cụm", () => {
  it("gom 4 số đuôi thành một cụm thay vì để 4-3-3 cắt", () => {
    const result = createQuyHighlightedNumber("0778.670.000", "0778670000", "Tứ quý");
    const text = result.map((n) => (typeof n === "string" ? n : (n as HlSpan).props.children)).join("");
    expect(text).toBe("077.867.0000");

    const lastSpan = result[result.length - 1] as HlSpan;
    expect(lastSpan.props.className).toContain("text-gold");
    expect(lastSpan.props.children).toBe("0000");
  });

  it("không phải tứ quý thì để nguyên", () => {
    const result = createQuyHighlightedNumber("0703.756.879", "0703756879", "Tứ quý");
    expect(result).toEqual(["0703.756.879"]);
  });
});

describe("createHighlightedNumber â€” suffix wildcard reformat", () => {
  it("reformats *6879 so 6879 is a contiguous group at the end", () => {
    const displayNumber = "0703.756.879";
    const rawDigits = "0703756879";
    const result = createHighlightedNumber(displayNumber, rawDigits, "*6879");

    // Should have 3 spans: prefix (opacity-80), suffix (gold), or parts
    expect(result.length).toBeGreaterThanOrEqual(2);

    // The last span should contain "6879" with font-extrabold text-gold class
    const lastSpan = result[result.length - 1] as HlSpan;
    expect(lastSpan.props.className).toContain("text-gold");
    expect(lastSpan.props.children).toBe("6879");
  });

  it("reformats *79 so 79 is contiguous at the end", () => {
    const displayNumber = "0703.756.879";
    const rawDigits = "0703756879";
    const result = createHighlightedNumber(displayNumber, rawDigits, "*79");

    const lastSpan = result[result.length - 1] as HlSpan;
    expect(lastSpan.props.className).toContain("text-gold");
    expect(lastSpan.props.children).toBe("79");
  });

  it("does not reformat when suffix does not match", () => {
    const displayNumber = "0703.756.879";
    const rawDigits = "0703756879";
    const result = createHighlightedNumber(displayNumber, rawDigits, "*8888");

    // No match â†’ returns [displayNumber] as-is
    expect(result.length).toBe(1);
    expect(result[0]).toBe(displayNumber);
  });
});
