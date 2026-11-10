import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";

// pathname / searchParams do test điều khiển; mỗi lần đổi searchParams phải
// là object MỚI (giống Next) để useEffect chạy lại.
const nav = {
  pathname: "/",
  searchParams: new URLSearchParams(""),
};

vi.mock("next/navigation", () => ({
  usePathname: () => nav.pathname,
  useSearchParams: () => nav.searchParams,
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null } })),
    },
  },
}));

import { usePageVisitTracker } from "@/hooks/usePageVisitTracker";

const fetchMock = vi.fn();

const setUrl = (pathname: string, search = "") => {
  nav.pathname = pathname;
  nav.searchParams = new URLSearchParams(search);
};

const visitedPaths = () =>
  fetchMock.mock.calls.map((c) => JSON.parse((c[1] as RequestInit).body as string).path);

describe("usePageVisitTracker — debounce 1.5s", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    window.localStorage.clear();
    window.sessionStorage.clear();
    setUrl("/");
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("ca 1: first load → gửi fetch ngay, không chờ debounce", async () => {
    renderHook(() => usePageVisitTracker());

    await vi.advanceTimersByTimeAsync(0);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][0]).toBe("/api/track/visit");
    expect(visitedPaths()).toEqual(["/"]);
  });

  it("ca 2: gõ liên tục 5 ký tự (200ms/ký tự) → chỉ 1 fetch cuối sau 1.5s", async () => {
    const { rerender } = renderHook(() => usePageVisitTracker());
    await vi.advanceTimersByTimeAsync(0);
    expect(fetchMock).toHaveBeenCalledTimes(1); // first load
    fetchMock.mockClear();

    const typed = ["1", "12", "123", "1234", "12345"];
    for (const q of typed) {
      setUrl("/", `q=${q}`);
      rerender();
      await vi.advanceTimersByTimeAsync(200);
      expect(fetchMock).not.toHaveBeenCalled(); // đang gõ → chưa bắn
    }

    // 200ms sau ký tự cuối; còn thiếu 1300ms nữa mới đủ 1.5s.
    await vi.advanceTimersByTimeAsync(1299);
    expect(fetchMock).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(visitedPaths()).toEqual(["/?q=12345"]);

    // Không có thêm request nào về sau.
    await vi.advanceTimersByTimeAsync(5000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("ca 3: chuyển sang pathname khác → gửi fetch ngay, không chờ 1.5s", async () => {
    const { rerender } = renderHook(() => usePageVisitTracker());
    await vi.advanceTimersByTimeAsync(0);
    fetchMock.mockClear();

    setUrl("/sim/0938123456");
    rerender();
    await vi.advanceTimersByTimeAsync(0);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(visitedPaths()).toEqual(["/sim/0938123456"]);
  });

  it("đang chờ debounce mà đổi pathname → hủy timer cũ, chỉ bắn trang mới", async () => {
    const { rerender } = renderHook(() => usePageVisitTracker());
    await vi.advanceTimersByTimeAsync(0);
    fetchMock.mockClear();

    setUrl("/", "q=093");
    rerender();
    await vi.advanceTimersByTimeAsync(500);

    setUrl("/sim/0938123456");
    rerender();
    await vi.advanceTimersByTimeAsync(0);
    expect(visitedPaths()).toEqual(["/sim/0938123456"]);

    await vi.advanceTimersByTimeAsync(3000);
    expect(visitedPaths()).toEqual(["/sim/0938123456"]); // "/?q=093" không bị bắn muộn
  });

  it("unmount khi đang chờ debounce → dọn timer, không gửi fetch", async () => {
    const { rerender, unmount } = renderHook(() => usePageVisitTracker());
    await vi.advanceTimersByTimeAsync(0);
    fetchMock.mockClear();

    setUrl("/", "q=0");
    rerender();
    await vi.advanceTimersByTimeAsync(500);
    expect(vi.getTimerCount()).toBe(1);

    unmount();
    expect(vi.getTimerCount()).toBe(0);

    await vi.advanceTimersByTimeAsync(5000);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("máy nội bộ → không bao giờ gửi fetch (kể cả sau debounce)", async () => {
    window.localStorage.setItem("csm_noi_bo", "1");
    const { rerender } = renderHook(() => usePageVisitTracker());
    setUrl("/", "q=09");
    rerender();
    await vi.advanceTimersByTimeAsync(3000);

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
