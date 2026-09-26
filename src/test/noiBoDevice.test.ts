import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  NOI_BO_KEY,
  applyNoiBoFromUrl,
  clearNoiBoDevice,
  isNoiBoDevice,
  markNoiBoDevice,
  parseNoiBoParam,
  stripNoiBoParam,
} from "@/lib/noiBoDevice";

describe("noiBoDevice — cờ máy nội bộ", () => {
  beforeEach(() => {
    clearNoiBoDevice();
    window.localStorage.clear();
    window.history.replaceState(null, "", "/");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("mặc định không phải nội bộ", () => {
    expect(isNoiBoDevice()).toBe(false);
  });

  it("mark/clear ghi và xoá localStorage", () => {
    markNoiBoDevice();
    expect(window.localStorage.getItem(NOI_BO_KEY)).toBe("1");
    expect(isNoiBoDevice()).toBe(true);
    clearNoiBoDevice();
    expect(window.localStorage.getItem(NOI_BO_KEY)).toBeNull();
    expect(isNoiBoDevice()).toBe(false);
  });

  it("parseNoiBoParam nhận on/off và bỏ qua giá trị lạ", () => {
    expect(parseNoiBoParam("?noibo=1")).toBe("on");
    expect(parseNoiBoParam("noibo=true&utm_source=fb")).toBe("on");
    expect(parseNoiBoParam("?noibo")).toBe("on");
    expect(parseNoiBoParam("?noibo=0")).toBe("off");
    expect(parseNoiBoParam("?x=1&noibo=false")).toBe("off");
    expect(parseNoiBoParam("?noibo=abc")).toBeNull();
    expect(parseNoiBoParam("?utm_source=fb")).toBeNull();
    expect(parseNoiBoParam("")).toBeNull();
  });

  it("?noibo=1 bật cờ, ?noibo=0 tắt cờ, không có tham số thì giữ nguyên", () => {
    expect(applyNoiBoFromUrl("?noibo=1")).toBe("on");
    expect(isNoiBoDevice()).toBe(true);

    expect(applyNoiBoFromUrl("?utm_source=zalo")).toBeNull();
    expect(isNoiBoDevice()).toBe(true); // vĩnh viễn tới khi có noibo=0

    expect(applyNoiBoFromUrl("?noibo=0")).toBe("off");
    expect(isNoiBoDevice()).toBe(false);
  });

  it("applyNoiBoFromUrl mặc định đọc URL hiện tại", () => {
    window.history.replaceState(null, "", "/sim-so-dep?noibo=1");
    expect(applyNoiBoFromUrl()).toBe("on");
    expect(isNoiBoDevice()).toBe(true);
  });

  it("stripNoiBoParam gỡ noibo nhưng giữ các tham số khác", () => {
    window.history.replaceState(null, "", "/tin-tuc/abc?utm_source=fb&noibo=1#top");
    stripNoiBoParam();
    expect(window.location.pathname).toBe("/tin-tuc/abc");
    expect(window.location.search).toBe("?utm_source=fb");
    expect(window.location.hash).toBe("#top");
  });

  it("localStorage bị chặn (chế độ riêng tư): không ném lỗi, nhớ tạm trong bộ nhớ", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });

    expect(() => markNoiBoDevice()).not.toThrow();
    expect(isNoiBoDevice()).toBe(true);
    expect(() => applyNoiBoFromUrl("?noibo=0")).not.toThrow();
    expect(isNoiBoDevice()).toBe(false);
    expect(applyNoiBoFromUrl("?noibo=1")).toBe("on");
    expect(isNoiBoDevice()).toBe(true);
  });

  it("an toàn SSR (không có window)", () => {
    vi.stubGlobal("window", undefined);
    expect(isNoiBoDevice()).toBe(false);
    expect(() => markNoiBoDevice()).not.toThrow();
    expect(() => clearNoiBoDevice()).not.toThrow();
    expect(applyNoiBoFromUrl("?noibo=1")).toBeNull();
    expect(() => stripNoiBoParam()).not.toThrow();
  });
});
