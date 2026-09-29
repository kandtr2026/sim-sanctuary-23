import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

vi.mock("next/link", () => ({
  default: ({ href, children, prefetch: _prefetch, ...rest }: { href: string; children: ReactNode; prefetch?: boolean }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import SimNgaySinhFinder from "@/app/sim-ngay-thang-nam-sinh/SimNgaySinhFinder";

const mk = (rawDigits: string, price: number) => ({ rawDigits, price, network: "Mobifone" });
const reply = (items: ReturnType<typeof mk>[]) =>
  new Response(JSON.stringify({ items, total: items.length }), { status: 200 });

afterEach(() => {
  vi.restoreAllMocks();
  window.history.replaceState(null, "", "/");
});

describe("SimNgaySinhFinder — landing /sim-ngay-thang-nam-sinh", () => {
  it("nhập sai (ngày 32, tháng 13, thiếu năm) → báo lỗi, không gọi API", () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    render(<SimNgaySinhFinder samples={[]} />);
    fireEvent.change(screen.getByLabelText("Ngày (DD)"), { target: { value: "32" } });
    fireEvent.change(screen.getByLabelText("Tháng (MM)"), { target: { value: "13" } });
    fireEvent.click(screen.getByRole("button", { name: /Tìm sim theo ngày sinh/ }));
    expect(screen.getByText(/Ngày 32 không hợp lệ/)).toBeInTheDocument();
    expect(screen.getByText(/Tháng 13 không hợp lệ/)).toBeInTheDocument();
    expect(screen.getByText(/năm sinh đủ 4 số/)).toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("exact đứng trước số chứa; đổi lọc tìm lại NGAY với giá trị vừa chọn", async () => {
    const calls: string[] = [];
    const gtag = vi.fn();
    window.gtag = gtag;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      calls.push(url);
      return new URL(url, "http://x").searchParams.get("suffixes")
        ? reply([mk("0931010805", 1500000), mk("0901010805", 2000000)])
        : reply([
            mk("0901080504", 1500000),
            mk("0931010805", 1500000),
            mk("0901080510", 1500000),
            mk("0901010805", 2000000),
          ]);
    });

    render(<SimNgaySinhFinder samples={[]} />);
    fireEvent.change(screen.getByPlaceholderText("Nhập DDMMYY, ví dụ 050790"), { target: { value: "01/08/2005" } });
    fireEvent.click(screen.getByRole("button", { name: /^Tìm$/ }));

    await waitFor(() => expect(screen.getAllByText("Trùng 6 số cuối ngày sinh")).toHaveLength(2));
    const text = document.body.textContent ?? "";
    expect(text.indexOf("0931.01.08.05")).toBeGreaterThan(-1);
    expect(text.indexOf("0931.01.08.05")).toBeLessThan(text.indexOf("09.01.08.05.04"));
    expect(gtag).toHaveBeenCalledWith("event", "search", { search_term: "010805" });
    expect(calls.some((c) => c.includes("suffixes=010805") && c.includes("networks=Mobifone"))).toBe(true);
    expect(window.location.search).toContain("q=010805");

    calls.length = 0;
    fireEvent.click(screen.getByRole("button", { name: "Trên 10 triệu" }));
    await waitFor(() => expect(calls).toHaveLength(2));
    expect(calls.every((c) => c.includes("priceRanges=4%2C5%2C6%2C7%2C8"))).toBe(true);

    calls.length = 0;
    fireEvent.click(screen.getByRole("button", { name: "07x" }));
    await waitFor(() => expect(calls).toHaveLength(2));
    expect(
      calls.every((c) => c.includes("priceRanges=4%2C5%2C6%2C7%2C8") && c.includes("prefixes=070%2C076%2C077%2C078%2C079")),
    ).toBe(true);
    delete window.gtag;
  });

  it("không có exact → câu gợi ý; không có gì → CTA Zalo; lỗi mạng → nút Thử lại", async () => {
    let mode: "contains" | "none" | "fail" = "contains";
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      if (mode === "fail") throw new TypeError("network");
      const isSearch = new URL(String(input), "http://x").searchParams.get("search");
      return reply(mode === "contains" && isSearch ? [mk("0901080504", 1500000)] : []);
    });

    render(<SimNgaySinhFinder samples={[]} />);
    fireEvent.change(screen.getByPlaceholderText("Nhập DDMMYY, ví dụ 050790"), { target: { value: "010805" } });
    const tim = screen.getByRole("button", { name: /^Tìm$/ });

    fireEvent.click(tim);
    await screen.findByText(
      "Chưa có số trùng tuyệt đối 6 số cuối. CHONSOMOBIFONE gợi ý các số chứa ngày sinh gần nhất bên dưới.",
    );

    mode = "none";
    fireEvent.click(tim);
    await screen.findByText(/Kho hiện chưa có số MobiFone chứa ngày sinh/);
    expect(screen.getByRole("link", { name: /Gửi ngày sinh qua Zalo/ })).toHaveAttribute(
      "href",
      "https://zalo.me/0933686666",
    );

    mode = "fail";
    fireEvent.click(tim);
    await screen.findByRole("button", { name: "Thử lại" });
  });
});
