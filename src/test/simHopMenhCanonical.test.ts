import { describe, it, expect, vi } from "vitest";

/**
 * Gom mệnh 25/11/2026: /sim-hop-menh/<mệnh> vẫn sống, vẫn index, follow, nhưng
 * canonical trỏ trang chính /sim-theo-menh/<mệnh> (đúng slug).
 */

vi.mock("@/lib/serverSimData", () => ({
  getServerSims: async () => [],
  getCategorySnapshot: async () => [],
}));

const { generateMetadata } = await import("@/app/sim-hop-menh/[hanh]/page");

const meta = (hanh: string) => generateMetadata({ params: Promise.resolve({ hanh }) });

describe("/sim-hop-menh/[hanh] canonical", () => {
  it("/sim-hop-menh/kim canonical là /sim-theo-menh/kim", async () => {
    const m = await meta("kim");
    expect(m.alternates?.canonical).toBe("https://www.chonsomobifone.com/sim-theo-menh/kim");
    expect(m.robots).toEqual({ index: true, follow: true });
  });

  it("cả 5 slug canonical khớp đúng slug bên /sim-theo-menh", async () => {
    for (const slug of ["kim", "moc", "thuy", "hoa", "tho"]) {
      const m = await meta(slug);
      expect(m.alternates?.canonical, slug).toBe(`https://www.chonsomobifone.com/sim-theo-menh/${slug}`);
    }
  });
});
