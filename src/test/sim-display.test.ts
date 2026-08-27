import { describe, it, expect } from "vitest";
import { formatSimQuyAware, planSimDisplay } from "@/lib/simDisplay";
import { formatCheapNumber } from "@/lib/cheapSimSheet";

describe("formatSimQuyAware", () => {
  it("formats tứ quý as 3-3-4 (093.368.6666)", () => {
    expect(formatSimQuyAware("0933686666")).toBe("093.368.6666");
  });

  it("formats normal number as 4-3-3 (0703.756.879)", () => {
    expect(formatSimQuyAware("0703756879")).toBe("0703.756.879");
  });

  it("formats thần tài 79 as 4-3-3 (0923.912.979)", () => {
    expect(formatSimQuyAware("0923912979")).toBe("0923.912.979");
  });
});

describe("formatCheapNumber", () => {
  it("keeps tứ quý contiguous (070.378.9999)", () => {
    expect(formatCheapNumber("0703789999")).toBe("070.378.9999");
  });

  it("keeps 4-3-3 for normal cheap sim", () => {
    expect(formatCheapNumber("0901942752")).toBe("0901.942.752");
  });
});

describe("planSimDisplay — tứ quý preferred display", () => {
  it("keeps 3-3-4 display for tứ quý when no query", () => {
    const plan = planSimDisplay("0933686666", "", "0933.686.666");
    expect(plan.display).toBe("0933.686.666");
  });

  it("keeps suffix contiguous for *6879", () => {
    const plan = planSimDisplay("0703756879", "*6879", "0703.756.879");
    expect(plan.display).toBe("070.375.6879");
  });
});