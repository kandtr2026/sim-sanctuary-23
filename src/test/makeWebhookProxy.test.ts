import { describe, it, expect } from "vitest";
import { safeLogProjection, validatePayload, PII_FIELDS } from "../../supabase/functions/make-webhook-proxy/_validators";

const validPayload = {
  orderCode: "DH260821-1234",
  simId: "SIM036227",
  fullName: "Nguyễn Văn A",
  phone: "0909123456",
  address: "123 Đường ABC, Quận 1, TP. Hồ Chí Minh",
  note: "Giao giờ hành chính",
  priceVnd: 3500000,
  originalPriceVnd: 4000000,
};

describe("make-webhook-proxy _validators", () => {
  it("accepts a valid payload", () => {
    expect(validatePayload(validPayload)).toBeNull();
  });

  it("rejects missing orderCode", () => {
    expect(validatePayload({ ...validPayload, orderCode: "" })).toMatch(/orderCode/);
  });

  it("rejects missing simId", () => {
    expect(validatePayload({ ...validPayload, simId: "  " })).toMatch(/simId/);
  });

  it("rejects short fullName", () => {
    expect(validatePayload({ ...validPayload, fullName: "ABC" })).toMatch(/fullName/);
  });

  it("rejects non-10-digit phone", () => {
    expect(validatePayload({ ...validPayload, phone: "0901234" })).toMatch(/phone/);
  });

  it("rejects short address", () => {
    expect(validatePayload({ ...validPayload, address: "Ngan" })).toMatch(/address/);
  });

  it("rejects non-positive priceVnd", () => {
    expect(validatePayload({ ...validPayload, priceVnd: 0 })).toMatch(/priceVnd/);
  });

  it("rejects non-numeric priceVnd", () => {
    expect(validatePayload({ ...validPayload, priceVnd: "abc" })).toMatch(/priceVnd/);
  });

  it("strips all PII fields from the log projection", () => {
    const projection = JSON.parse(safeLogProjection(validPayload));
    for (const field of PII_FIELDS) {
      expect(projection).not.toHaveProperty(field);
    }
    expect(projection.orderCode).toBe(validPayload.orderCode);
    expect(projection.simId).toBe(validPayload.simId);
    expect(projection.priceVnd).toBe(validPayload.priceVnd);
  });

  it("safeLogProjection preserves non-PII business fields", () => {
    const projection = JSON.parse(safeLogProjection(validPayload));
    expect(projection.priceVnd).toBe(3500000);
    expect(projection.originalPriceVnd).toBe(4000000);
  });
});
