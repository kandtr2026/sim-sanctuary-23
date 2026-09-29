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
    await screen.findByText(
      "Chưa có số trùng ngày sinh 010805 trong kho đang hiển thị. Anh/chị gửi ngày sinh qua Zalo để CHONSOMOBIFONE kiểm tra thêm.",
    );
    expect(screen.getByRole("link", { name: /Gửi ngày sinh qua Zalo/ })).toHaveAttribute(
      "href",
      "https://zalo.me/0933686666",
    );

    mode = "fail";
    fireEvent.click(tim);
    await screen.findByRole("button", { name: "Thử lại" });
  });
  // QA Mon 29/09: ô nhanh phải GHI ĐÈ kết quả đang có, nhập sai không được giữ kết quả cũ.
  it("ca A–E: form 010805 → ô nhanh 050790 ghi đè; nhập sai xoá kết quả cũ; nhập lại 010805 chạy lại", async () => {
    const calls: string[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      calls.push(url);
      const sp = new URL(url, "http://x").searchParams;
      const term = sp.get("suffixes") ?? sp.get("search");
      if (term !== "010805") return reply([]);
      return sp.get("suffixes")
        ? reply([mk("0931010805", 1500000), mk("0901010805", 2000000)])
        : reply([mk("0901080504", 1500000), mk("0931010805", 1500000), mk("0901080510", 1500000), mk("0901010805", 2000000)]);
    });
    render(<SimNgaySinhFinder samples={[]} />);
    const quickInput = screen.getByPlaceholderText("Nhập DDMMYY, ví dụ 050790") as HTMLInputElement;
    const timNhanh = screen.getByRole("button", { name: /^Tìm$/ });

    // A — form 01/08/2005
    fireEvent.change(screen.getByLabelText("Ngày (DD)"), { target: { value: "01" } });
    fireEvent.change(screen.getByLabelText("Tháng (MM)"), { target: { value: "08" } });
    fireEvent.change(screen.getByLabelText("Năm (YYYY)"), { target: { value: "2005" } });
    fireEvent.click(screen.getByRole("button", { name: /Tìm sim theo ngày sinh/ }));
    await waitFor(() => expect(screen.getAllByText("Trùng 6 số cuối ngày sinh")).toHaveLength(2));
    expect(document.body.textContent).toContain("(đuôi 010805)");

    // B — ô nhanh 050790 ghi đè, không còn 010805; ô ngày/tháng/năm xoá trắng
    calls.length = 0;
    fireEvent.change(quickInput, { target: { value: "050790" } });
    fireEvent.click(timNhanh);
    await screen.findByText(/Chưa có số trùng ngày sinh 050790 trong kho đang hiển thị/);
    expect(calls.some((c) => c.includes("suffixes=050790"))).toBe(true);
    expect(document.body.textContent).toContain("(đuôi 050790)");
    expect(document.body.textContent).not.toContain("010805");
    expect((screen.getByLabelText("Ngày (DD)") as HTMLInputElement).value).toBe("");
    expect((screen.getByLabelText("Năm (YYYY)") as HTMLInputElement).value).toBe("");

    // D — nhập sai: báo lỗi, không gọi API, KHÔNG giữ kết quả cũ
    for (const bad of ["123", "abcdef", "321399"]) {
      calls.length = 0;
      fireEvent.change(quickInput, { target: { value: bad } });
      fireEvent.click(timNhanh);
      expect(screen.getByRole("alert").textContent?.length ?? 0).toBeGreaterThan(0);
      expect(calls).toHaveLength(0);
      expect(document.body.textContent).not.toContain("Kết quả cho ngày sinh");
    }

    // E — sau lỗi, nhập lại 010805 → tìm bình thường
    fireEvent.change(quickInput, { target: { value: "010805" } });
    fireEvent.click(timNhanh);
    await waitFor(() => expect(screen.getAllByText("Trùng 6 số cuối ngày sinh")).toHaveLength(2));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("gõ chồng lên số cũ trong ô nhanh → giữ 6 số vừa gõ, không nối chuỗi", () => {
    render(<SimNgaySinhFinder samples={[]} />);
    const quickInput = screen.getByPlaceholderText("Nhập DDMMYY, ví dụ 050790") as HTMLInputElement;
    fireEvent.change(quickInput, { target: { value: "010805" } });
    fireEvent.change(quickInput, { target: { value: "010805050790" } });
    expect(quickInput.value).toBe("050790");
  });
});
