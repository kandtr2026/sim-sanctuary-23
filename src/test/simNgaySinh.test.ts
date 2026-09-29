import { describe, it, expect } from "vitest";
import {
  birthdayDisplaySegments,
  buildSimsQuery,
  daysInMonth,
  networkLabel,
  orderBirthdayMatches,
  parseBirthForm,
  parseQuickInput,
  normalizeQuickTyping,
  PRICE_FILTERS,
  readUrlPrefill,
  segmentsToText,
  splitBirthdayMatches,
} from "@/lib/simNgaySinh";
import { PRICE_RANGES } from "@/lib/simUtils";

// Cố định "hôm nay" để biên năm không trôi theo ngày chạy test.
const NOW = new Date("2026-09-29T10:00:00+07:00");

describe("parseBirthForm — form Ngày/Tháng/Năm", () => {
  it("01/08/2005 → 010805", () => {
    const r = parseBirthForm({ ngay: "01", thang: "08", nam: "2005" }, NOW);
    expect(r.ok && r.target.ddmmyy).toBe("010805");
  });

  it("05/07/1990 → 050790", () => {
    const r = parseBirthForm({ ngay: "05", thang: "07", nam: "1990" }, NOW);
    expect(r.ok && r.target.ddmmyy).toBe("050790");
  });

  it("5/7/1990 → 050790 (ngày/tháng 1 chữ số được pad)", () => {
    const r = parseBirthForm({ ngay: "5", thang: "7", nam: "1990" }, NOW);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.target.ddmmyy).toBe("050790");
      expect(r.target.label).toBe("05/07/1990");
    }
  });

  it("chỉ lấy chữ số trong ô", () => {
    const r = parseBirthForm({ ngay: " 0 5", thang: "0a7", nam: "19-90" }, NOW);
    expect(r.ok && r.target.ddmmyy).toBe("050790");
  });

  it("ngày 32 → lỗi ngày không hợp lệ", () => {
    const r = parseBirthForm({ ngay: "32", thang: "08", nam: "2005" }, NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.ngay).toMatch(/Ngày 32 không hợp lệ/);
      expect(r.errors.thang).toBeUndefined();
      expect(r.errors.nam).toBeUndefined();
    }
  });

  it("tháng 13 → lỗi tháng không hợp lệ", () => {
    const r = parseBirthForm({ ngay: "01", thang: "13", nam: "2005" }, NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.thang).toMatch(/Tháng 13 không hợp lệ/);
      expect(r.errors.ngay).toBeUndefined();
    }
  });

  it("thiếu năm → yêu cầu nhập năm đủ 4 số", () => {
    const r = parseBirthForm({ ngay: "01", thang: "08", nam: "" }, NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.nam).toMatch(/năm sinh đủ 4 số/);
  });

  it("năm chỉ 2 số → yêu cầu đủ 4 số", () => {
    const r = parseBirthForm({ ngay: "01", thang: "08", nam: "05" }, NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.nam).toMatch(/đủ 4 số/);
  });

  it("năm ngoài 1900..năm hiện tại → lỗi khoảng năm", () => {
    const r1 = parseBirthForm({ ngay: "01", thang: "08", nam: "1899" }, NOW);
    const r2 = parseBirthForm({ ngay: "01", thang: "08", nam: "2027" }, NOW);
    expect(!r1.ok && r1.errors.nam).toMatch(/1900–2026/);
    expect(!r2.ok && r2.errors.nam).toMatch(/1900–2026/);
  });

  it("30/02 → báo tháng 2 không có ngày 30", () => {
    const r = parseBirthForm({ ngay: "30", thang: "02", nam: "1990" }, NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.ngay).toMatch(/Tháng 2 không có ngày 30/);
  });

  it("30/02 vẫn bị bắt khi thiếu năm", () => {
    const r = parseBirthForm({ ngay: "30", thang: "2", nam: "" }, NOW);
    expect(!r.ok && r.errors.ngay).toMatch(/Tháng 2 không có ngày 30/);
  });

  it("29/02: năm nhuận hợp lệ, năm thường báo lỗi", () => {
    expect(parseBirthForm({ ngay: "29", thang: "02", nam: "2000" }, NOW).ok).toBe(true);
    const r = parseBirthForm({ ngay: "29", thang: "02", nam: "2001" }, NOW);
    expect(!r.ok && r.errors.ngay).toMatch(/không nhuận/);
  });

  it("31/04 → tháng 4 chỉ có 30 ngày", () => {
    const r = parseBirthForm({ ngay: "31", thang: "04", nam: "1995" }, NOW);
    expect(!r.ok && r.errors.ngay).toMatch(/Tháng 4 không có ngày 31/);
  });

  it("bỏ trống cả 3 ô → mỗi ô một lỗi, không ném lỗi", () => {
    const r = parseBirthForm({ ngay: "", thang: "", nam: "" }, NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.errors.ngay).toBeTruthy();
      expect(r.errors.thang).toBeTruthy();
      expect(r.errors.nam).toBeTruthy();
    }
  });
});

describe("parseQuickInput — ô tìm nhanh", () => {
  it('"010805" → 010805', () => {
    const r = parseQuickInput("010805", NOW);
    expect(r.ok && r.target.ddmmyy).toBe("010805");
  });

  it("8 số DDMMYYYY → DDMMYY", () => {
    const r = parseQuickInput("05071990", NOW);
    expect(r.ok && r.target.ddmmyy).toBe("050790");
    expect(r.ok && r.target.year).toBe(1990);
  });

  it("có dấu / - . → DDMMYY", () => {
    expect(parseQuickInput("05/07/1990", NOW)).toMatchObject({ ok: true, target: { ddmmyy: "050790" } });
    expect(parseQuickInput("5-7-90", NOW)).toMatchObject({ ok: true, target: { ddmmyy: "050790" } });
    expect(parseQuickInput("01.08.2005", NOW)).toMatchObject({ ok: true, target: { ddmmyy: "010805" } });
  });

  it("ngày 32 / tháng 13 / 30-02 → lỗi dễ hiểu", () => {
    const d = parseQuickInput("320890", NOW);
    const m = parseQuickInput("011390", NOW);
    const f = parseQuickInput("30/02/1990", NOW);
    expect(!d.ok && d.error).toMatch(/Ngày 32 không hợp lệ/);
    expect(!m.ok && m.error).toMatch(/Tháng 13 không hợp lệ/);
    expect(!f.ok && f.error).toMatch(/Tháng 2 không có ngày 30/);
  });

  it("sai độ dài / rỗng / chữ → lỗi, không ném", () => {
    expect(parseQuickInput("01080", NOW).ok).toBe(false);
    expect(parseQuickInput("", NOW).ok).toBe(false);
    expect(parseQuickInput("abc", NOW).ok).toBe(false);
    expect(parseQuickInput("01/08", NOW).ok).toBe(false);
  });

  it("DDMMYY 29/02 không biết thế kỷ → chấp nhận", () => {
    expect(parseQuickInput("290201", NOW).ok).toBe(true);
    expect(daysInMonth(2, null)).toBe(29);
  });
});

describe("splitBirthdayMatches — exact trước, contains sau", () => {
  const list = [
    { rawDigits: "0901080504" },
    { rawDigits: "0901010805" },
    { rawDigits: "0931010805" },
    { rawDigits: "0901080510" },
  ];

  it("tách đúng 2 nhóm với 010805", () => {
    const { exact, contains } = splitBirthdayMatches(list, "010805");
    expect(exact.map((s) => s.rawDigits)).toEqual(["0901010805", "0931010805"]);
    expect(contains.map((s) => s.rawDigits)).toEqual(["0901080504", "0901080510"]);
  });

  it("danh sách phẳng: exact đứng TRƯỚC các số chứa", () => {
    const ordered = orderBirthdayMatches(list, "010805");
    expect(ordered.map((o) => o.sim.rawDigits)).toEqual([
      "0901010805",
      "0931010805",
      "0901080504",
      "0901080510",
    ]);
    expect(ordered.map((o) => o.kind)).toEqual(["exact", "exact", "contains", "contains"]);
  });

  it("bỏ số lặp (gộp 2 lượt API) và số không chứa DDMMYY", () => {
    const merged = [...list, { rawDigits: "0901010805" }, { rawDigits: "0909999999" }];
    const { exact, contains } = splitBirthdayMatches(merged, "010805");
    expect(exact).toHaveLength(2);
    expect(contains).toHaveLength(2);
  });
});

describe("buildSimsQuery — bộ lọc → /api/sims", () => {
  it("exact dùng suffixes, contains dùng search, luôn networks=Mobifone", () => {
    const ex = new URLSearchParams(buildSimsQuery("010805", "exact", "all", "all"));
    const ct = new URLSearchParams(buildSimsQuery("010805", "contains", "all", "all"));
    expect(ex.get("suffixes")).toBe("010805");
    expect(ex.get("search")).toBeNull();
    expect(ct.get("search")).toBe("010805");
    expect(ct.get("suffixes")).toBeNull();
    expect(ex.get("networks")).toBe("Mobifone");
    expect(ex.get("priceRanges")).toBeNull();
    expect(ex.get("prefixes")).toBeNull();
  });

  it("Trên 10 triệu → 4..8, 07x → 070,076,077,078,079", () => {
    const q = new URLSearchParams(buildSimsQuery("050790", "exact", "tren-10tr", "07x"));
    expect(q.get("priceRanges")).toBe("4,5,6,7,8");
    expect(q.get("prefixes")).toBe("070,076,077,078,079");
  });

  it("index chip giá khớp bảng PRICE_RANGES", () => {
    const min = (key: string) => {
      const f = PRICE_FILTERS.find((x) => x.key === key)!;
      return Math.min(...f.ranges.map((i) => PRICE_RANGES[i].min));
    };
    expect(min("duoi-1tr")).toBe(0);
    expect(min("1-3tr")).toBe(1_000_000);
    expect(min("3-5tr")).toBe(3_000_000);
    expect(min("5-10tr")).toBe(5_000_000);
    expect(min("tren-10tr")).toBe(10_000_000);
    const tren = PRICE_FILTERS.find((x) => x.key === "tren-10tr")!;
    expect(PRICE_RANGES[tren.ranges[tren.ranges.length - 1]].max).toBe(Infinity);
  });
});

describe("hiển thị số", () => {
  it("trùng đuôi → 0901.01.08.05, tô đoạn ngày sinh", () => {
    const seg = birthdayDisplaySegments("0901010805", "010805");
    expect(segmentsToText(seg)).toBe("0901.01.08.05");
    expect(seg.filter((s) => s.hl).map((s) => s.text)).toEqual(["01.08.05"]);
  });

  it("chứa giữa → 09.01.08.05.04", () => {
    const seg = birthdayDisplaySegments("0901080504", "010805");
    expect(segmentsToText(seg)).toBe("09.01.08.05.04");
    expect(seg.filter((s) => s.hl).map((s) => s.text)).toEqual(["01.08.05"]);
  });

  it("tên mạng MobiFone", () => {
    expect(networkLabel("Mobifone")).toBe("MobiFone");
  });
});

describe("readUrlPrefill — link Google Ads", () => {
  it("?ngay=01&thang=08&nam=2005", () => {
    expect(readUrlPrefill(new URLSearchParams("ngay=01&thang=08&nam=2005"))).toEqual({
      kind: "form",
      ngay: "01",
      thang: "08",
      nam: "2005",
    });
  });

  it("?q=010805 ưu tiên hơn form", () => {
    expect(readUrlPrefill(new URLSearchParams("q=010805&ngay=02"))).toEqual({ kind: "quick", q: "010805" });
  });

  it("không có tham số → null; rác bị lọc", () => {
    expect(readUrlPrefill(new URLSearchParams("gclid=abc"))).toBeNull();
    expect(readUrlPrefill(new URLSearchParams("ngay=<b>1</b>"))).toEqual({
      kind: "form",
      ngay: "1",
      thang: "",
      nam: "",
    });
  });
});

describe("normalizeQuickTyping — chữ khách gõ vào ô nhanh", () => {
  it("chỉ giữ số và dấu phân cách", () => {
    expect(normalizeQuickTyping("abcdef")).toBe("");
    expect(normalizeQuickTyping("05a07b90")).toBe("050790");
    expect(normalizeQuickTyping("05/07/1990")).toBe("05/07/1990");
  });
  it("gõ chồng lên số cũ (>8 chữ số liền) → giữ 6 số vừa gõ", () => {
    expect(normalizeQuickTyping("010805050790")).toBe("050790");
    expect(normalizeQuickTyping("05071990")).toBe("05071990"); // 8 số DDMMYYYY vẫn giữ
  });
});
