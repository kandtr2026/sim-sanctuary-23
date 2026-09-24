import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { buildProfile, scoreSim } from "@/lib/simHopTuoi";
import { normalizeSIM } from "@/lib/simUtils";

/**
 * Khoá hành vi client của /sim-phong-thuy (SimHopTuoiTool):
 *  - mỗi chip mục tiêu / giá / đầu số / sắp xếp gửi ĐÚNG giá trị vừa bấm
 *    (lỗi cũ: setState + setTimeout(fetchSims) → gửi giá trị cũ, trễ 1 nhịp);
 *  - "Xóa bộ lọc & Xem lại" xoá cả wildcard trong ô số;
 *  - chip "> 50 triệu" gửi 5,6,7,8; loại lịch được gửi lên (lich=dl|al);
 *  - ngày/tháng từ URL ("05"/"03") hiện đúng trên 3 ô select, năm 2025 có trong danh sách.
 */

let currentParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => currentParams,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: ReactNode }) =>
    createElement("a", { href, ...rest }, children),
}));

const { default: SimHopTuoiTool } = await import("@/app/sim-phong-thuy/SimHopTuoiTool");

const profile = buildProfile(1990, 5, "nam");
const scored = scoreSim(normalizeSIM("0968686868", null, 2_000_000, "s1"), profile);

const jsonResponse = (body: unknown, ok = true) =>
  ({
    ok,
    status: ok ? 200 : 400,
    json: async () => body,
  }) as unknown as Response;

const stubApi = (emptyWhen?: (u: URL) => boolean) => {
  const urls: URL[] = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      const u = new URL(String(input), "http://localhost");
      urls.push(u);
      const empty = emptyWhen?.(u) ?? false;
      return jsonResponse({
        profile,
        birth: { ngay: 15, thang: 8, nam: 1990, namAm: 1990, lich: "dl" },
        gioiTinh: "nam",
        singleEvaluation: null,
        total: empty ? 0 : 1,
        sims: empty ? [] : [scored],
        limit: 30,
        offset: 0,
      });
    }),
  );
  return urls;
};

const last = (urls: URL[]) => urls[urls.length - 1].searchParams;

beforeEach(() => {
  currentParams = new URLSearchParams();
  // jsdom không có scrollIntoView
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("SimHopTuoiTool — bộ lọc gửi đúng giá trị vừa chọn", () => {
  it("chip mục tiêu / giá / đầu số / sắp xếp không bị trễ một nhịp", async () => {
    const urls = stubApi();
    render(createElement(SimHopTuoiTool));
    await waitFor(() => expect(urls.length).toBe(1));
    expect(last(urls).get("mucTieu")).toBeNull();
    expect(last(urls).get("lich")).toBe("dl");

    fireEvent.click(await screen.findByRole("button", { name: /Tài lộc & Kinh doanh/ }));
    await waitFor(() => expect(urls.length).toBe(2));
    expect(last(urls).get("mucTieu")).toBe("TaiLoc");

    fireEvent.click(screen.getByRole("button", { name: /Công danh & Thăng tiến/ }));
    await waitFor(() => expect(urls.length).toBe(3));
    expect(last(urls).get("mucTieu")).toBe("CongDanh");

    fireEvent.click(screen.getByRole("button", { name: "< 1 triệu" }));
    await waitFor(() => expect(urls.length).toBe(4));
    expect(last(urls).get("priceRange")).toBe("0");
    expect(last(urls).get("mucTieu")).toBe("CongDanh");

    fireEvent.click(screen.getByRole("button", { name: "> 50 triệu" }));
    await waitFor(() => expect(urls.length).toBe(5));
    expect(last(urls).get("priceRange")).toBe("5,6,7,8");

    fireEvent.click(screen.getByRole("button", { name: "Tất cả giá" }));
    await waitFor(() => expect(urls.length).toBe(6));
    expect(last(urls).get("priceRange")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Đầu 07x" }));
    await waitFor(() => expect(urls.length).toBe(7));
    expect(last(urls).get("prefix")).toBe("070,079,077,076,078");

    const sortSelect = screen.getByDisplayValue("Điểm phong thuỷ cao nhất");
    fireEvent.change(sortSelect, { target: { value: "price_asc" } });
    await waitFor(() => expect(urls.length).toBe(8));
    expect(last(urls).get("sortBy")).toBe("price_asc");
    expect(last(urls).get("prefix")).toBe("070,079,077,076,078");
  });

  it("'Xóa bộ lọc & Xem lại' bỏ cả wildcard trong ô số", async () => {
    const urls = stubApi((u) => u.searchParams.has("soCanXem") || u.searchParams.has("priceRange"));
    render(createElement(SimHopTuoiTool));
    await waitFor(() => expect(urls.length).toBe(1));

    const input = screen.getByPlaceholderText(/Nhập 10 số/);
    fireEvent.change(input, { target: { value: "*1234567890" } });
    fireEvent.click(screen.getByRole("button", { name: "< 1 triệu" }));
    await waitFor(() => expect(urls.length).toBe(2));
    expect(last(urls).get("soCanXem")).toBe("*1234567890");
    expect(last(urls).get("priceRange")).toBe("0");

    fireEvent.click(await screen.findByRole("button", { name: /Xóa bộ lọc/ }));
    await waitFor(() => expect(urls.length).toBe(3));
    expect(last(urls).get("soCanXem")).toBeNull();
    expect(last(urls).get("priceRange")).toBeNull();
    expect(last(urls).get("mucTieu")).toBeNull();
    expect((input as HTMLInputElement).value).toBe("");
  });

  it("ngày/tháng dạng '05'/'03' từ URL hiện đúng, năm 2025 chọn được", async () => {
    currentParams = new URLSearchParams("nam=2025&ngay=05&thang=03");
    const urls = stubApi();
    const { container } = render(createElement(SimHopTuoiTool));
    await waitFor(() => expect(urls.length).toBe(1));
    expect(last(urls).get("ngay")).toBe("5");
    expect(last(urls).get("thang")).toBe("3");
    expect(last(urls).get("nam")).toBe("2025");
    const [selNgay, selThang, selNam] = Array.from(container.querySelectorAll("select"));
    expect((selNgay as HTMLSelectElement).value).toBe("5");
    expect((selThang as HTMLSelectElement).value).toBe("3");
    expect((selNam as HTMLSelectElement).value).toBe("2025");
  });

  it("ô ngày chỉ có số ngày thật của tháng (tháng 2/1990 có 28 ngày)", async () => {
    const urls = stubApi();
    const { container } = render(createElement(SimHopTuoiTool));
    await waitFor(() => expect(urls.length).toBe(1));
    const [selNgay, selThang] = Array.from(container.querySelectorAll("select"));
    fireEvent.change(selNgay, { target: { value: "31" } });
    fireEvent.change(selThang, { target: { value: "2" } });
    expect((selNgay as HTMLSelectElement).options.length).toBe(28);
    expect((selNgay as HTMLSelectElement).value).toBe("28");
  });

  it("nút Âm lịch được gửi lên API", async () => {
    const urls = stubApi();
    render(createElement(SimHopTuoiTool));
    await waitFor(() => expect(urls.length).toBe(1));
    fireEvent.click(screen.getByRole("button", { name: "Âm lịch" }));
    fireEvent.click(screen.getByRole("button", { name: /TÌM SIM HỢP TUỔI/ }));
    await waitFor(() => expect(urls.length).toBe(2));
    expect(last(urls).get("lich")).toBe("al");
  });
});
