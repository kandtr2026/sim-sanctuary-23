import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { ProvinceTrafficSection } from "@/components/admin/ProvinceTrafficSection";
import { gomTheoTinh } from "@/lib/vnProvince";

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
