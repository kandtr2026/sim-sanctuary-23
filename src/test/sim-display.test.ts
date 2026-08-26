import { describe, it, expect } from "vitest";
import { groupDigitsPretty, planSimDisplay } from "@/lib/simDisplay";

/**
 * Rule global: cụm khách tìm phải hiện NGUYÊN MỘT CỤM ở đúng vị trí khách gõ.
 * Mỗi dòng dưới đây là một ca từng bị hỏng trên production 26/08/2026.
 */
describe("groupDigitsPretty — chỉ cụm 3 và 4, cụm 4 xếp trước", () => {
  const cases: Array<[string, string]> = [
    ["0703756879", "0703.756.879"],
    ["0703756", "0703.756"],
    ["07037568", "0703.7568"],
    ["070375", "070.375"],
    ["07677", "07677"],
    ["070375687", "070.375.687"],
    ["07037568799", "0703.7568.799"],
    ["07", "07"],
  ];
  it.each(cases)("%s → %s", (digits, expected) => {
    expect(groupDigitsPretty(digits).join(".")).toBe(expected);
  });
});

describe("planSimDisplay — đuôi khách tìm không bị dấu chấm cắt", () => {
  const std = "0703.756.879";
  const raw = "0703756879";

  it("*6879 → dồn 6879 thành một cụm cuối", () => {
    const plan = planSimDisplay(raw, "*6879", std);
    expect(plan.display).toBe("070.375.6879");
    expect(plan.hl).toEqual([{ start: 6, end: 10 }]);
  });

  it("gõ trần 6879 (số kết thúc bằng nó) xử lý y như *6879", () => {
    expect(planSimDisplay(raw, "6879", std).display).toBe("070.375.6879");
  });

  it("*879 đã liền sẵn ở cụm cuối → giữ nguyên format chuẩn", () => {
    const plan = planSimDisplay(raw, "*879", std);
    expect(plan.display).toBe(std);
    expect(plan.hl).toEqual([{ start: 7, end: 10 }]);
  });

  it("*79 nằm trong cụm cuối → giữ nguyên, không đẻ cụm lẻ 2 số", () => {
    expect(planSimDisplay(raw, "*79", std).display).toBe(std);
  });

  it("*68879 (đuôi 5 số) → không để cụm lẻ ở giữa", () => {
    expect(planSimDisplay("0767768879", "*68879", "0767.768.879").display).toBe("07677.68879");
  });

  it("cụm nằm giữa dãy cũng được chấm liền", () => {
    const plan = planSimDisplay("0932687953", "6879", "0932.687.953");
    expect(plan.display).toBe("0932.6879.53");
    expect(plan.hl).toEqual([{ start: 4, end: 8 }]);
  });

  it("dạng ngày sinh vẫn được giữ khi đuôi năm đã liền mạch", () => {
    const plan = planSimDisplay("0909922000", "*2000", "0909.9.2.2000");
    expect(plan.display).toBe("0909.9.2.2000");
    expect(plan.hl).toEqual([{ start: 6, end: 10 }]);
  });

  it("đầu số: 0703* tô đầu, giữ format chuẩn", () => {
    const plan = planSimDisplay("0703099889", "0703*", "0703.099.889");
    expect(plan.display).toBe("0703.099.889");
    expect(plan.hl).toEqual([{ start: 0, end: 4 }]);
  });

  it("không khớp → không đổi format, không tô gì", () => {
    const plan = planSimDisplay(raw, "*8888", std);
    expect(plan.display).toBe(std);
    expect(plan.hl).toEqual([]);
  });

  it("câu tìm rỗng → giữ nguyên display của trang", () => {
    expect(planSimDisplay(raw, "", std).display).toBe(std);
    expect(planSimDisplay(raw, "", std).hl).toEqual([]);
  });

  it("gõ đủ 10 số → sáng cả dãy, không phá format", () => {
    const plan = planSimDisplay(raw, raw, std);
    expect(plan.display).toBe(std);
    expect(plan.hl).toEqual([{ start: 0, end: 10 }]);
  });

  it("đầu*đuôi tô hai đầu", () => {
    const plan = planSimDisplay(raw, "070*6879", std);
    expect(plan.display).toBe("070.375.6879");
    expect(plan.hl).toEqual([
      { start: 0, end: 3 },
      { start: 6, end: 10 },
    ]);
  });

  it("display của trang có số khác rawDigits → bỏ, chấm lại từ rawDigits", () => {
    expect(planSimDisplay(raw, "*6879", "0909.111.222").display).toBe("070.375.6879");
  });

  it("phần dư 1 số không tách thành cụm lẻ", () => {
    // 0901438994 tìm "899": cụm nằm ở giữa, còn dư đúng 1 số ở cuối.
    const plan = planSimDisplay("0901438994", "899", "0901.438.994");
    expect(plan.display).toBe("090.143.8994");
    expect(plan.hl).toEqual([{ start: 6, end: 9 }]);
  });

  it("phần dư 2 số vẫn được đứng riêng", () => {
    expect(planSimDisplay("0932687953", "6879", "0932.687.953").display).toBe("0932.6879.53");
  });

  it("tứ quý: 4 số cuối liền nhau, không để 4-3-3 cắt (dùng ở bảng /mua-sim-tu-quy)", () => {
    expect(planSimDisplay("0933686666", "*6666", "0933.686.666").display).toBe("093.368.6666");
  });
});
