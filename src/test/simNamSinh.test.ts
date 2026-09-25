import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { detectSimCategories, namSinhCuaSo } from "@/lib/simCategories";
import { normalizeSIM, type NormalizedSIM } from "@/lib/simUtils";
import { filterSims, namSinhTuTruyVan } from "@/lib/simFilter";

/**
 * Lỗi trên /sim-nam-sinh (25/09/2026):
 *  1. Luật "Năm sinh" chặn trên cứng 2029 → 29/1.498 số mang năm sinh 2027–2029
 *     (0901.180.929 = 18.09.2029) — ngày chưa tới.
 *  2. Nút "Chọn nhanh năm 1990" tìm chuỗi "1990" trên TOÀN kho → ra 0909.199.038,
 *     0901.199.008… không số nào là sim năm sinh 1990.
 * Luật đọc năm hiện tại lúc chạy, nên ghim đồng hồ cho test không tự hỏng khi sang năm.
 */
const HOM_NAY = new Date("2026-09-25T12:00:00+07:00");
const sim = (digits: string, price = 1_000_000): NormalizedSIM => normalizeSIM(digits, null, price, digits);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(HOM_NAY);
});
afterEach(() => {
  vi.useRealTimers();
});

describe("năm sinh không được ở tương lai", () => {
  it("loại 4 số đuôi là năm chưa tới", () => {
    expect(detectSimCategories("0938262028")).not.toContain("Năm sinh"); // 0938.2.6.2028
    expect(namSinhCuaSo("0938262028")).toBeNull();
  });

  it("loại ngày dd.mm.yy rơi vào năm chưa tới", () => {
    expect(detectSimCategories("0932121228")).not.toContain("Năm sinh"); // 12.12.28
    expect(detectSimCategories("0901180929")).not.toContain("Năm sinh"); // 18.09.29
    expect(detectSimCategories("0774111127")).not.toContain("Năm sinh"); // 11.11.27
  });

  it("giữ năm nay và quá khứ, cận dưới 1950 như cũ", () => {
    expect(namSinhCuaSo("0931150126")).toBe(2026); // 15.01.26
    expect(namSinhCuaSo("0941062000")).toBe(2000); // …2000
    expect(namSinhCuaSo("0768141198")).toBe(1998); // 14.11.98
    expect(namSinhCuaSo("0877251251")).toBe(1951); // 25.12.51
    expect(namSinhCuaSo("0787310260")).toBeNull(); // 31.02.60 không tồn tại
  });

  it("sang năm dải tự nới, không phải sửa hằng số", () => {
    vi.setSystemTime(new Date("2028-06-02T12:00:00+07:00"));
    expect(namSinhCuaSo("0938262028")).toBe(2028);
  });
});

describe("lọc theo một năm sinh (nút Chọn nhanh năm)", () => {
  const kho = [
    sim("0909199038"), // chứa "1990" nhưng không phải năm sinh
    sim("0934191990"), // …1990
    sim("0931140190"), // 14.01.90
    sim("0931140195"), // 14.01.95
    sim("0938262028"), // năm tương lai
  ];
  const so = (xs: NormalizedSIM[]) => xs.map((s) => s.rawDigits).sort();

  it("birthYear chỉ giữ số mang đúng năm sinh đó", () => {
    expect(so(filterSims(kho, { birthYear: 1990 }))).toEqual(["0931140190", "0934191990"]);
  });

  it("tìm chuỗi chứa thì dính số không phải năm sinh — lý do không dùng cho nút năm", () => {
    expect(so(filterSims(kho, { search: "1990" }))).toContain("0909199038");
  });

  it("kết quả luôn nằm trong nhãn Năm sinh", () => {
    for (const s of filterSims(kho, { birthYear: 1990 })) expect(s.tags).toContain("Năm sinh");
  });
});

describe("đọc năm sinh từ ô tìm kiếm", () => {
  it.each([
    ["1990", 1990],
    ["*1990", 1990],
    ["*95", 1995],
    ["*05", 2005],
    ["*28", null], // 2028 chưa tới → tìm thường
    ["*40", null], // yy 30–49 không phải năm sinh
    ["090*1995", null], // đầu số + đuôi → tìm thường (vẫn ra …1995)
    ["0909", null],
    ["1234", null],
    ["", null],
  ] as const)("%s → %s", (q, y) => {
    expect(namSinhTuTruyVan(q)).toBe(y);
  });
});
