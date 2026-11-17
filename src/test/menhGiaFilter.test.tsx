import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { createElement, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { normalizeSIM, PRICE_RANGES, type NormalizedSIM } from "@/lib/simUtils";
import { cauDemMenhGia, formatGia, giaKhop, giaLabel, parseGia, withGia, GIA_FILTERS, GIA_SLUGS } from "@/lib/giaParam";
import { hanhHopMenh, locSimMenhGia } from "@/lib/menhGia";
import { nguHanhCuaSo } from "@/lib/phongThuy";
import { buildProfile, scoreSim } from "@/lib/simHopTuoi";
import { profileForHanh } from "@/app/sim-hop-menh/_lib/menhSimRanking";

/**
 * Lọc MỆNH + KHOẢNG GIÁ (TASK_MENH_PRICE_FILTER):
 *  - parse/format `?gia=`;
 *  - Thổ + 5–10 triệu chỉ ra số giá 5–10tr và hợp mệnh Thổ (cả 2 kiểu trang);
 *  - không có `gia` thì trang render như cũ (không gọi API lọc, giữ bảng server);
 *  - link mệnh ở sidebar trang chủ mang theo khoảng giá.
 */

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) =>
    createElement("a", { href, ...rest }, children),
}));

// Kho giả: đủ mọi hành × mọi khoảng giá, để lọc thật có cái mà loại.
const DIGITS = [
  "0908588258", // Thổ đậm
  "0932885588",
  "0898255828",
  "0765282858",
  "0909688558",
  "0906858958",
  "0938289838",
  "0937777666", // Kim
  "0909101010", // Thủy
  "0933443344", // Mộc
  "0909999939", // Hỏa
  "0768188668",
  "0702582588",
  "0896528825",
];
const PRICES = [500_000, 2_000_000, 4_000_000, 5_000_000, 7_500_000, 9_999_999, 10_000_000, 60_000_000];
const KHO: NormalizedSIM[] = DIGITS.flatMap((d, i) =>
  PRICES.map((p, j) => normalizeSIM(d, null, p, `s${i}-${j}`)),
);

describe("giaParam — parse/format ?gia=", () => {
  it("một slug cho mỗi bậc PRICE_RANGES", () => {
    expect(GIA_SLUGS).toHaveLength(PRICE_RANGES.length);
    GIA_SLUGS.forEach((slug, i) => {
      expect(parseGia(slug)).toEqual([i]);
      expect(formatGia([i])).toBe(slug);
    });
  });

  it("5-10 ↔ bậc 3; nhiều khoảng nối dấu phẩy, sắp xếp + bỏ trùng", () => {
    expect(parseGia("5-10")).toEqual([3]);
    expect(parseGia("5-10,3-5")).toEqual([2, 3]);
    expect(parseGia("3-5,5-10,5-10")).toEqual([2, 3]);
    expect(formatGia([3, 2])).toBe("3-5,5-10");
    expect(parseGia(["3-5", "5-10"])).toEqual([2, 3]);
  });

  it("tren-50 = 4 bậc cuối và được gộp lại khi format", () => {
    expect(parseGia("tren-50")).toEqual([5, 6, 7, 8]);
    expect(formatGia([5, 6, 7, 8])).toBe("tren-50");
    expect(formatGia([3, 5, 6, 7, 8])).toBe("5-10,tren-50");
    expect(formatGia([5, 6])).toBe("50-100,100-200");
  });

  it("chấp nhận biến thể viết tay, bỏ qua mẩu rác", () => {
    expect(parseGia("5-10tr")).toEqual([3]);
    expect(parseGia("5–10 triệu")).toEqual([3]);
    expect(parseGia(" 5_10 ")).toEqual([3]);
    expect(parseGia("abc,5-10,,999")).toEqual([3]);
    expect(parseGia("")).toEqual([]);
    expect(parseGia(null)).toEqual([]);
    expect(parseGia(undefined)).toEqual([]);
    expect(formatGia([])).toBeNull();
    expect(formatGia([42, -1])).toBeNull();
  });

  it("round-trip mọi tổ hợp nút giá", () => {
    for (const f of GIA_FILTERS) {
      expect(parseGia(formatGia(f.ranges))).toEqual([...f.ranges]);
    }
  });

  it("giaKhop đúng biên, giaLabel đọc được", () => {
    expect(giaKhop(5_000_000, [3])).toBe(true);
    expect(giaKhop(9_999_999, [3])).toBe(true);
    expect(giaKhop(10_000_000, [3])).toBe(false);
    expect(giaKhop(4_999_999, [3])).toBe(false);
    expect(giaKhop(123, [])).toBe(true);
    expect(giaLabel([3])).toBe("5–10 triệu");
    expect(giaLabel([2, 3])).toBe("3–10 triệu");
    expect(giaLabel([0])).toBe("dưới 1 triệu");
    expect(giaLabel([5, 6, 7, 8])).toBe("trên 50 triệu");
    expect(giaLabel([0, 3])).toBe("dưới 1 triệu, 5–10 triệu");
  });

  it("withGia chỉ gắn query khi có chọn giá", () => {
    expect(withGia("/sim-theo-menh/tho", [])).toBe("/sim-theo-menh/tho");
    expect(withGia("/sim-theo-menh/tho", [3])).toBe("/sim-theo-menh/tho?gia=5-10");
    expect(withGia("/sim-theo-menh/tho", [2, 3])).toBe("/sim-theo-menh/tho?gia=3-5,5-10");
  });

  it("câu đếm theo định dạng tiếng Việt", () => {
    expect(cauDemMenhGia(1261, "Thổ", [3])).toBe("1.261 số hợp mệnh Thổ giá 5–10 triệu");
  });
});

describe("locSimMenhGia — Thổ + 5–10 triệu", () => {
  const r510 = PRICE_RANGES[3];

  it("/sim-theo-menh: chỉ số giá 5–10tr có ngũ hành chính Thổ, xếp điểm giảm dần", () => {
    const out = locSimMenhGia(KHO, "theo", "Thổ", parseGia("5-10"));
    expect(out.length).toBeGreaterThan(0);
    for (const { sim } of out) {
      expect(sim.price).toBeGreaterThanOrEqual(r510.min);
      expect(sim.price).toBeLessThanOrEqual(r510.max);
      expect(nguHanhCuaSo(sim.rawDigits).chinh).toBe("Thổ");
    }
    // Đủ: mọi số Thổ 5–10tr trong kho đều có mặt.
    const expected = KHO.filter(
      (s) => s.price >= r510.min && s.price <= r510.max && nguHanhCuaSo(s.rawDigits).chinh === "Thổ",
    );
    expect(out.map((x) => x.sim.id).sort()).toEqual(expected.map((s) => s.id).sort());
    for (let i = 1; i < out.length; i++) {
      const a = out[i - 1];
      const b = out[i];
      expect(a.diem > b.diem || (a.diem === b.diem && a.sim.price <= b.sim.price)).toBe(true);
    }
  });

  it("/sim-hop-menh: chỉ số giá 5–10tr, hành Tương sinh/Tương hòa với Thổ", () => {
    const profile = profileForHanh("Thổ");
    const out = locSimMenhGia(KHO, "hop", "Thổ", parseGia("5-10"));
    expect(out.length).toBeGreaterThan(0);
    for (const { sim, diem } of out) {
      expect(sim.price).toBeGreaterThanOrEqual(r510.min);
      expect(sim.price).toBeLessThanOrEqual(r510.max);
      const sc = scoreSim(sim, profile);
      expect(hanhHopMenh(sc.simHanh, "Thổ")).toBe(true);
      expect(diem).toBe(sc.score);
    }
    for (let i = 1; i < out.length; i++) expect(out[i - 1].diem).toBeGreaterThanOrEqual(out[i].diem);
  });

  it("nhiều khoảng giá = hợp các khoảng; không chọn giá = cả kho của mệnh", () => {
    const hai = locSimMenhGia(KHO, "theo", "Thổ", [2, 3]);
    expect(hai.every(({ sim }) => sim.price >= 3_000_000 && sim.price < 10_000_000)).toBe(true);
    expect(hai.some(({ sim }) => sim.price < 5_000_000)).toBe(true);
    const tatCa = locSimMenhGia(KHO, "theo", "Thổ", []);
    expect(tatCa.length).toBeGreaterThan(hai.length);
  });

  it("hanhHopMenh: Thổ hợp Thổ (tương hòa) và Hỏa (Hỏa sinh Thổ), không hợp Mộc", () => {
    expect(hanhHopMenh("Thổ", "Thổ")).toBe(true);
    expect(hanhHopMenh("Hỏa", "Thổ")).toBe(true);
    expect(hanhHopMenh("Mộc", "Thổ")).toBe(false);
    expect(hanhHopMenh("Kim", "Thổ")).toBe(false);
  });
});

describe("/api/sim-menh", () => {
  it("Thổ + 5-10: total đúng, phân trang, toàn số 5–10tr hợp mệnh Thổ", async () => {
    vi.resetModules();
    vi.doMock("@/lib/serverSimData", () => ({ getServerSims: async () => KHO }));
    const { GET } = await import("@/app/api/sim-menh/route");
    const call = async (qs: string) => {
      const url = new URL(`http://localhost/api/sim-menh?${qs}`);
      const res = await GET({ nextUrl: url } as never);
      return { status: res.status, body: await res.json() };
    };
    const full = await call("hanh=tho&gia=5-10&limit=120");
    expect(full.status).toBe(200);
    expect(full.body.total).toBe(locSimMenhGia(KHO, "theo", "Thổ", [3]).length);
    for (const s of full.body.items as NormalizedSIM[]) {
      expect(s.price).toBeGreaterThanOrEqual(5_000_000);
      expect(s.price).toBeLessThan(10_000_000);
      expect(nguHanhCuaSo(s.rawDigits).chinh).toBe("Thổ");
    }
    const p1 = await call("hanh=tho&gia=5-10&limit=2&offset=0");
    const p2 = await call("hanh=tho&gia=5-10&limit=2&offset=2");
    expect(p1.body.items.map((s: NormalizedSIM) => s.id)).toEqual(full.body.items.slice(0, 2).map((s: NormalizedSIM) => s.id));
    expect(p2.body.items.map((s: NormalizedSIM) => s.id)).toEqual(full.body.items.slice(2, 4).map((s: NormalizedSIM) => s.id));

    const hop = await call("hanh=tho&kieu=hop&gia=5-10&limit=120");
    expect(hop.body.total).toBe(locSimMenhGia(KHO, "hop", "Thổ", [3]).length);

    expect((await call("hanh=xyz&gia=5-10")).status).toBe(400);
    vi.doUnmock("@/lib/serverSimData");
  });
});

// ── Render ──────────────────────────────────────────────────────────────────

const withQuery = (node: ReactNode) =>
  createElement(QueryClientProvider, { client: new QueryClient({ defaultOptions: { queries: { retry: false } } }) }, node);

const initialTho = KHO.filter((s) => nguHanhCuaSo(s.rawDigits).chinh === "Thổ").slice(0, 6);

const stubFetch = () => {
  const urls: URL[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const u = new URL(String(input), "http://localhost");
      urls.push(u);
      const ranges = parseGia(u.searchParams.get("gia"));
      const list = locSimMenhGia(KHO, "theo", "Thổ", ranges);
      return {
        ok: true,
        status: 200,
        json: async () => ({ items: list.map((x) => x.sim).slice(0, 60), scores: [], total: list.length }),
      } as unknown as Response;
    }),
  );
  return urls;
};

beforeEach(() => {
  window.history.replaceState(null, "", "/sim-theo-menh/tho");
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("MenhMucSearchGrid — trang /sim-theo-menh", () => {
  it("không có gia: render y như cũ (initial), không gọi API lọc giá", async () => {
    const urls = stubFetch();
    const { default: MenhMucSearchGrid } = await import("@/components/MenhMucSearchGrid");
    render(withQuery(createElement(MenhMucSearchGrid, { initial: initialTho, hanh: "Thổ", hanhSlug: "tho" })));
    expect(screen.getAllByRole("link", { name: /Chat Zalo|Zalo/i }).length).toBeGreaterThan(0);
    expect(screen.getByRole("button", { name: "Tất cả giá" })).toHaveAttribute("aria-pressed", "true");
    await new Promise((r) => setTimeout(r, 20));
    expect(urls).toHaveLength(0);
  });

  it("HTML server không phụ thuộc ?gia= (cùng một chuỗi dù URL có gia)", async () => {
    const { default: MenhMucSearchGrid } = await import("@/components/MenhMucSearchGrid");
    const el = () => withQuery(createElement(MenhMucSearchGrid, { initial: initialTho, hanh: "Thổ", hanhSlug: "tho" }));
    const html1 = renderToString(el());
    window.history.replaceState(null, "", "/sim-theo-menh/tho?gia=5-10");
    const html2 = renderToString(el());
    expect(html2).toBe(html1);
    for (const s of initialTho) expect(html1).toContain(`/sim/${s.rawDigits}`);
  });

  it("?gia=5-10 trên URL: gọi /api/sim-menh và hiện câu đếm", async () => {
    window.history.replaceState(null, "", "/sim-theo-menh/tho?gia=5-10");
    const urls = stubFetch();
    const { default: MenhMucSearchGrid } = await import("@/components/MenhMucSearchGrid");
    render(withQuery(createElement(MenhMucSearchGrid, { initial: initialTho, hanh: "Thổ", hanhSlug: "tho" })));
    await waitFor(() => expect(urls.length).toBe(1));
    expect(urls[0].pathname).toBe("/api/sim-menh");
    expect(urls[0].searchParams.get("hanh")).toBe("tho");
    expect(urls[0].searchParams.get("gia")).toBe("5-10");
    const total = locSimMenhGia(KHO, "theo", "Thổ", [3]).length;
    expect(await screen.findByText(new RegExp(`${total} số hợp mệnh Thổ giá 5–10 triệu`))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "5 - 10 triệu" })).toHaveAttribute("aria-pressed", "true");
  });

  it("bấm nút giá: ghi ?gia= lên URL; bấm Tất cả giá thì gỡ", async () => {
    const urls = stubFetch();
    const { default: MenhMucSearchGrid } = await import("@/components/MenhMucSearchGrid");
    render(withQuery(createElement(MenhMucSearchGrid, { initial: initialTho, hanh: "Thổ", hanhSlug: "tho" })));
    fireEvent.click(screen.getByRole("button", { name: "Trên 50 triệu" }));
    expect(window.location.search).toBe("?gia=tren-50");
    await waitFor(() => expect(urls.length).toBe(1));
    expect(urls[0].searchParams.get("gia")).toBe("tren-50");
    fireEvent.click(screen.getByRole("button", { name: "Tất cả giá" }));
    expect(window.location.search).toBe("");
    expect(window.location.pathname).toBe("/sim-theo-menh/tho");
  });

  it("trang /sim-hop/[muc] (không có hanhSlug) không có hàng nút giá", async () => {
    const { default: MenhMucSearchGrid } = await import("@/components/MenhMucSearchGrid");
    render(withQuery(createElement(MenhMucSearchGrid, { initial: initialTho, mucId: "TaiLoc", label: "Tài lộc" })));
    expect(screen.queryByRole("button", { name: "Tất cả giá" })).toBeNull();
  });
});

describe("MenhGiaSection — trang /sim-hop-menh", () => {
  it("không có gia: giữ nguyên bảng server (children), có gia: thay bằng kết quả lọc", async () => {
    const { MenhGiaSection } = await import("@/components/MenhGiaFilter");
    const el = () =>
      withQuery(
        createElement(MenhGiaSection, { hanhSlug: "tho", hanh: "Thổ", kieu: "hop", zaloHref: "https://zalo.me/0933686666" },
          createElement("div", { "data-testid": "bang-server" }, "bang"),
        ),
      );
    window.history.replaceState(null, "", "/sim-hop-menh/tho?gia=5-10");
    expect(renderToString(el())).toContain('data-testid="bang-server"');

    window.history.replaceState(null, "", "/sim-hop-menh/tho");
    const urls = stubFetch();
    render(el());
    expect(screen.getByTestId("bang-server")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "5 - 10 triệu" }));
    expect(screen.queryByTestId("bang-server")).toBeNull();
    await waitFor(() => expect(urls.length).toBe(1));
    expect(urls[0].searchParams.get("kieu")).toBe("hop");
  });
});

describe("AdvancedFilterSidebar — link mệnh giữ khoảng giá", () => {
  it("đã chọn 3-5 và 5-10 → /sim-theo-menh/tho?gia=3-5,5-10; chưa chọn → link trơn", async () => {
    const { default: Sidebar } = await import("@/components/AdvancedFilterSidebar");
    const { defaultFilterState } = await import("@/hooks/useSimData");
    const props = (priceRanges: number[]) => ({
      filters: { ...defaultFilterState, priceRanges },
      tagCounts: {},
      networkCounts: {},
      priceCounts: [],
      menhCounts: {},
      onTogglePriceRange: () => {},
      onToggleTag: () => {},
      onToggleNetwork: () => {},
      onUpdateFilter: () => {},
    });
    const { unmount } = render(createElement(Sidebar, props([2, 3])));
    expect(screen.getByRole("link", { name: /Mệnh Thổ/ })).toHaveAttribute("href", "/sim-theo-menh/tho?gia=3-5,5-10");
    unmount();
    render(createElement(Sidebar, props([])));
    expect(screen.getByRole("link", { name: /Mệnh Thổ/ })).toHaveAttribute("href", "/sim-theo-menh/tho");
  });
});

// Hồ sơ chấm điểm của trang hợp mệnh phải là mệnh Thổ thật.
it("profileForHanh(Thổ) có mệnh Thổ", () => {
  expect(profileForHanh("Thổ").menh).toBe("Thổ");
  expect(buildProfile(1990, 0, "nam").menh).toBeDefined();
});
