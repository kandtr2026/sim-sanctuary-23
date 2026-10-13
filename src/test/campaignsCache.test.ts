import { afterEach, describe, expect, it, vi } from "vitest";
import { getActiveCampaigns, getActiveFlashSale } from "@/lib/campaigns";

const row = (over: Record<string, unknown> = {}) => ({
  id: 1,
  name: "c",
  slug: "c",
  type: "promo_banner",
  active: true,
  headline: null,
  subline: null,
  cta_label: null,
  cta_url: null,
  discount_note: null,
  target_tags: null,
  starts_at: null,
  ends_at: null,
  sort: 0,
  ...over,
});

const mockFetch = (res: Partial<Response> & { json?: () => Promise<unknown> }) => {
  const fn = vi.fn().mockResolvedValue(res);
  vi.stubGlobal("fetch", fn);
  return fn;
};

afterEach(() => vi.unstubAllGlobals());

describe("getActiveCampaigns (cached REST read)", () => {
  it("đi qua Data Cache của Next: revalidate 300s, chỉ gửi apikey (không Authorization)", async () => {
    const fn = mockFetch({ ok: true, json: async () => [] });
    await getActiveCampaigns();

    expect(fn).toHaveBeenCalledTimes(1);
    const [url, init] = fn.mock.calls[0] as [string, RequestInit & { next?: { revalidate?: number } }];
    expect(url).toContain("/rest/v1/site_campaigns");
    expect(url).toContain("active=eq.true");
    expect(url).toContain("order=sort.asc");
    expect(init.next?.revalidate).toBe(300);
    const headers = init.headers as Record<string, string>;
    expect(headers.apikey).toBeTruthy();
    expect(headers.Authorization).toBeUndefined();
    expect(init.cache).toBeUndefined(); // không no-store
    expect(init.signal).toBeUndefined(); // signal sẽ tắt cache của Next
  });

  it("vẫn lọc theo cửa sổ thời gian phía server", async () => {
    const past = new Date(Date.now() - 86_400_000).toISOString();
    const future = new Date(Date.now() + 86_400_000).toISOString();
    mockFetch({
      ok: true,
      json: async () => [
        row({ id: 1 }),
        row({ id: 2, ends_at: past }), // đã hết hạn
        row({ id: 3, starts_at: future }), // chưa bắt đầu
      ],
    });
    const out = await getActiveCampaigns();
    expect(out.map((c) => c.id)).toEqual([1]);
  });

  it("lỗi HTTP / body không phải mảng / ném lỗi → [] (không phá trang)", async () => {
    mockFetch({ ok: false, json: async () => [] });
    expect(await getActiveCampaigns()).toEqual([]);

    mockFetch({ ok: true, json: async () => ({ message: "relation does not exist" }) });
    expect(await getActiveCampaigns()).toEqual([]);

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network")));
    expect(await getActiveCampaigns()).toEqual([]);
  });

  it("getActiveFlashSale chọn flash_sale sắp hết hạn nhất", async () => {
    const t = (h: number) => new Date(Date.now() + h * 3_600_000).toISOString();
    mockFetch({
      ok: true,
      json: async () => [
        row({ id: 1, type: "flash_sale", ends_at: t(5) }),
        row({ id: 2, type: "flash_sale", ends_at: t(1) }),
        row({ id: 3, type: "promo_banner" }),
      ],
    });
    expect((await getActiveFlashSale())?.id).toBe(2);
  });
});
