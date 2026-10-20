import { describe, it, expect, vi, afterEach } from "vitest";
import { KHO_229K_BAT, TRANG_229K, conLink229K } from "@/lib/kho229k";
import { fetchCheapSimById, fetchCheapStock } from "@/lib/cheapSimSheet";
import { getCheapSims, getCheapSnapshot } from "@/lib/serverCheapSims";

// 20/10/2026 A Khoa: "off hết kho 229k" — số đã bán lọt vào kho này.
describe("kho 229K tắt", () => {
  afterEach(() => vi.restoreAllMocks());

  it("công tắc đang tắt", () => {
    expect(KHO_229K_BAT).toBe(false);
  });

  it("không đọc sheet, không trả số nào, không cho đặt mua SIMKM", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    expect(await fetchCheapStock()).toEqual([]);
    expect(await fetchCheapSimById("SIMKM0040025")).toBeNull();
    expect(await getCheapSims()).toEqual([]);
    expect(await getCheapSnapshot(8)).toEqual([]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("gỡ link /mua-sim-gia-re khỏi danh sách, giữ link khác", () => {
    const links = [
      { label: "SIM tứ quý", href: "/mua-sim-tu-quy" },
      { label: "SIM giá rẻ", href: TRANG_229K },
      { label: "404", to: TRANG_229K },
      { path: TRANG_229K },
    ];
    expect(links.filter(conLink229K)).toEqual([{ label: "SIM tứ quý", href: "/mua-sim-tu-quy" }]);
  });
});
