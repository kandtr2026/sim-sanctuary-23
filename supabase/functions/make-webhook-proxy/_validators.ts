/** Pure validation + redaction helpers for the Make webhook proxy.
 *
 *  Kept import-free so the Supabase edge function can bundle it and vitest can
 *  import it directly (no Deno URL imports).
 */

/** Fields that must never reach logs — they are the PII boundary of the order. */
export const PII_FIELDS = ["fullName", "phone", "address", "note"];

export type OrderPayload = Record<string, unknown>;

/** A safe projection of the order for logging: order identity + business data,
 *  never the customer's personal information. */
export const safeLogProjection = (payload: OrderPayload): string => {
  const copy = { ...payload };
  for (const key of PII_FIELDS) delete copy[key];
  return JSON.stringify(copy);
};

/** Server-side validation. The checkout validates these too, but the proxy is a
 *  public endpoint (verify_jwt = false) so it must not trust the client. Returns
 *  a human-readable reason when invalid, or null when the payload is acceptable. */
export const validatePayload = (payload: OrderPayload): string | null => {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

  if (!str(payload.orderCode)) return "missing orderCode";
  if (!str(payload.simId)) return "missing simId";
  if (str(payload.fullName).length < 6) return "fullName must be at least 6 chars";
  const phoneDigits = str(payload.phone).replace(/\D/g, "");
  if (phoneDigits.length !== 10) return "phone must be exactly 10 digits";
  if (str(payload.address).length < 20) return "address must be at least 20 chars";

  const price = Number(payload.priceVnd);
  if (!Number.isFinite(price) || price <= 0) return "priceVnd must be a positive number";

  return null;
};
