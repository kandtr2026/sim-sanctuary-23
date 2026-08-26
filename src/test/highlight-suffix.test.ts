import { describe, it, expect } from "vitest";
import { createHighlightedNumber } from "@/lib/highlightUtils";

describe("createHighlightedNumber — suffix wildcard reformat", () => {
  it("reformats *6879 so 6879 is a contiguous group at the end", () => {
    const displayNumber = "0703.756.879";
    const rawDigits = "0703756879";
    const result = createHighlightedNumber(displayNumber, rawDigits, "*6879");

    // Should have 3 spans: prefix (opacity-80), suffix (gold), or parts
    expect(result.length).toBeGreaterThanOrEqual(2);

    // The last span should contain "6879" with font-extrabold text-gold class
    const lastSpan = result[result.length - 1] as React.ReactElement;
    expect(lastSpan.props.className).toContain("text-gold");
    expect(lastSpan.props.children).toBe("6879");
  });

  it("reformats *79 so 79 is contiguous at the end", () => {
    const displayNumber = "0703.756.879";
    const rawDigits = "0703756879";
    const result = createHighlightedNumber(displayNumber, rawDigits, "*79");

    const lastSpan = result[result.length - 1] as React.ReactElement;
    expect(lastSpan.props.className).toContain("text-gold");
    expect(lastSpan.props.children).toBe("79");
  });

  it("does not reformat when suffix does not match", () => {
    const displayNumber = "0703.756.879";
    const rawDigits = "0703756879";
    const result = createHighlightedNumber(displayNumber, rawDigits, "*8888");

    // No match → returns [displayNumber] as-is
    expect(result.length).toBe(1);
    expect(result[0]).toBe(displayNumber);
  });
});