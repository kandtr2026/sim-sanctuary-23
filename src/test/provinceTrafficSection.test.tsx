import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { ProvinceTrafficSection } from "@/components/admin/ProvinceTrafficSection";
import { gomHomNayHomQua, gomTheoTinh } from "@/lib/vnProvince";

/**
 * Khu "Traffic theo tỉnh/thành" trên /admin/dashboard?tab=traffic (A Khoa 30/09):
 * gọi /api/admin/visit-geo kèm token, vẽ bảng tỉnh mới (34), dòng "gồm …" cho tỉnh
 * cũ đã sáp nhập, và tách các nhóm không phải tỉnh xuống cuối.
 */
const data = {
  days: 14,
  ...gomTheoTinh([
    { country: "VN", region: "SG", city: null, luot: 191, khach: 30 },
    { country: "VN", region: "57", city: null, luot: 49, khach: 4 },
    { country: "VN", region: "HN", city: null, luot: 14, khach: 5 },
    { country: "VN", region: null, city: null, luot: 60, khach: 20 },
    { country: "CN", region: null, city: null, luot: 29, khach: 28 },
    { country: null, region: null, city: null, luot: 97, khach: 13 },
  ]),
};

const okJson = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as unknown as Response;

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("ProvinceTrafficSection", () => {
  it("vẽ bảng tỉnh + tỉnh cũ gộp + nhóm phụ ở cuối", async () => {
    const fetchMock = vi.fn(async () => okJson(data));
    vi.stubGlobal("fetch", fetchMock);
    render(createElement(ProvinceTrafficSection, { token: "tok", khachThat: true }));

    expect(await screen.findByText("TP. Hồ Chí Minh")).toBeTruthy();
    expect(screen.getByText(/gồm TP\. Hồ Chí Minh 191 · Bình Dương 49/)).toBeTruthy();
    expect(screen.getByText(/440 lượt trong 14 ngày · 2 tỉnh\/thành có khách · chỉ khách thật/)).toBeTruthy();

    const rows = screen.getAllByRole("row").slice(1).map((r) => r.textContent ?? "");
    expect(rows.map((r) => r.match(/^\d*(TP\. Hồ Chí Minh|Hà Nội|Việt Nam – chưa rõ tỉnh|Nước ngoài|Chưa có dữ liệu vị trí)/)?.[1])).toEqual([
      "TP. Hồ Chí Minh", "Hà Nội", "Việt Nam – chưa rõ tỉnh", "Nước ngoài", "Chưa có dữ liệu vị trí",
    ]);
    expect(screen.getByText(/IP Việt Nam mà CSDL vị trí chỉ biết tới quốc gia/)).toBeTruthy();

    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("/api/admin/visit-geo?days=14");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
  });

  it("đổi khoảng ngày và công tắc khách thật → gọi lại đúng tham số", async () => {
    const fetchMock = vi.fn(async () => okJson(data));
    vi.stubGlobal("fetch", fetchMock);
    const { rerender } = render(createElement(ProvinceTrafficSection, { token: "tok", khachThat: true }));
    await screen.findByText("TP. Hồ Chí Minh");

    fireEvent.click(screen.getByRole("button", { name: "30 ngày" }));
    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith("/api/admin/visit-geo?days=30", expect.anything()));

    rerender(createElement(ProvinceTrafficSection, { token: "tok", khachThat: false }));
    await waitFor(() => expect(fetchMock).toHaveBeenLastCalledWith("/api/admin/visit-geo?days=30&all=1", expect.anything()));
  });

  it("API lỗi thì báo lỗi + nút thử lại", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500, json: async () => ({ error: "RPC hỏng" }) }) as unknown as Response));
    render(createElement(ProvinceTrafficSection, { token: "tok" }));
    expect(await screen.findByText(/Không tải được traffic theo tỉnh: RPC hỏng/)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Thử lại" })).toBeTruthy();
  });
});

describe("ProvinceTrafficSection — view Hôm nay vs Hôm qua", () => {
  const dong = (country: string | null, region: string | null, hn: number, cg: number, hq: number) => ({
    country, region, city: null,
    hn_luot: hn, hn_khach: Math.ceil(hn / 2), hq_cg_luot: cg, hq_cg_khach: Math.ceil(cg / 2), hq_luot: hq, hq_khach: Math.ceil(hq / 2),
  });
  const today = {
    view: "today" as const,
    gio: "12:18",
    ...gomHomNayHomQua([dong("VN", "SG", 24, 6, 15), dong("VN", "HN", 2, 4, 6), dong("VN", null, 16, 3, 11)]),
  };

  it("bấm Hôm nay → gọi view=today, vẽ ba mốc + chênh so với cùng giờ", async () => {
    const fetchMock = vi.fn(async (url: string) => okJson(String(url).includes("view=today") ? today : data));
    vi.stubGlobal("fetch", fetchMock);
    render(createElement(ProvinceTrafficSection, { token: "tok", khachThat: true }));
    await screen.findByText(/440 lượt trong 14 ngày/);

    fireEvent.click(screen.getByRole("button", { name: "Hôm nay" }));
    expect(await screen.findByText(/Hôm nay 42 lượt \(tới 12:18\) · hôm qua cùng giờ 13 · cả ngày hôm qua 32 · chỉ khách thật/)).toBeTruthy();
    expect(fetchMock).toHaveBeenLastCalledWith("/api/admin/visit-geo?view=today", expect.anything());

    const rows = screen.getAllByRole("row").slice(1).map((r) => (r.textContent ?? "").replace(/\s+/g, " "));
    expect(rows[0]).toMatch(/^1TP\. Hồ Chí Minh24· 12 khách6\+18 \(\+300%\)15$/);
    expect(rows[1]).toMatch(/^2Hà Nội2· 1 khách4−2 \(−50%\)6$/);
    expect(rows[rows.length - 1]).toMatch(/^Tổng4213\+29 \(\+223%\)32$/);
    expect(screen.getByText(/"Hôm qua cùng giờ" = lượt hôm qua tính tới 12:18/)).toBeTruthy();
  });

  it("đổi từ Hôm nay về 14 ngày không vẽ nhầm dữ liệu khác hình", async () => {
    const fetchMock = vi.fn(async (url: string) => okJson(String(url).includes("view=today") ? today : data));
    vi.stubGlobal("fetch", fetchMock);
    render(createElement(ProvinceTrafficSection, { token: "tok" }));
    await screen.findByText(/440 lượt trong 14 ngày/);
    fireEvent.click(screen.getByRole("button", { name: "Hôm nay" }));
    await screen.findByText(/Hôm nay 42 lượt/);
    fireEvent.click(screen.getByRole("button", { name: "14 ngày" }));
    expect(await screen.findByText(/440 lượt trong 14 ngày/)).toBeTruthy();
    expect(screen.getByText("Tỷ trọng")).toBeTruthy();
  });
});
