import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/**
 * A6 — gắn mã campaign vào link Zalo (`src/lib/zaloCampaignTag.ts`).
 *
 * Các trường hợp:
 * - utm_campaign có → "[Mã: <utm_campaign>]" được chèn vào ?text=.
 * - link đã có ?text= (vd /mua-ngay) → GIỮ text cũ, chỉ nối "[Mã: …]".
 * - link đã chứa "[Mã:" → bỏ qua (không tag hai lần).
 * - không utm_campaign nhưng có gclid → mã "ads".
 * - không gì cả (source internal/null) → không sửa href.
 * - SIM cụ thể từ data-sim-number hoặc /mua-ngay/<simId> → có "SIM {sim}" trong text.
 */

// ── mock attribution + source ────────────────────────────────────────────────
const mockAttribution = vi.fn<() => Record<string, string | null>>();
const mockClassify = vi.fn<() => { referrer: string | null; source: string }>();

vi.mock("@/lib/attribution", () => ({ getAttribution: () => mockAttribution() }));
vi.mock("@/lib/trackingUtils", () => ({ classifySource: () => mockClassify() }));

// ── helpers ──────────────────────────────────────────────────────────────────
const zaloAnchor = (href: string, attrs: Record<string, string> = {}): HTMLAnchorElement => {
  const el = document.createElement("a");
  el.setAttribute("href", href);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  document.body.appendChild(el);
  return el;
};

describe("tagZaloHref", () => {
  beforeEach(() => {
    mockAttribution.mockReturnValue({});
    mockClassify.mockReturnValue({ referrer: null, source: "direct" });
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("utm_campaign có → chèn [Mã: …] vào link chưa có text", async () => {
    mockAttribution.mockReturnValue({ utm_campaign: "gg-search-tuquy" });
    const { tagZaloHref } = await import("@/lib/zaloCampaignTag");
    const a = zaloAnchor("https://zalo.me/0933356666");
    const href = tagZaloHref(a);
    expect(href).toBeTruthy();
    const text = new URL(href!).searchParams.get("text");
    expect(text).toContain("[Mã: gg-search-tuquy]");
  });

  it("link đã có ?text= → giữ text cũ, chỉ nối [Mã: …]", async () => {
    mockAttribution.mockReturnValue({ utm_campaign: "gg-search-tuquy" });
    const { tagZaloHref } = await import("@/lib/zaloCampaignTag");
    const a = zaloAnchor(
      `https://zalo.me/0933356666?text=${encodeURIComponent("Xin chào, tôi muốn nhận báo giá SIM 0933686666")}`,
    );
    const href = tagZaloHref(a);
    const text = new URL(href!).searchParams.get("text");
    expect(text).toContain("Xin chào, tôi muốn nhận báo giá SIM 0933686666");
    expect(text).toContain("[Mã: gg-search-tuquy]");
  });

  it("link đã có [Mã: …] → không sửa (chống tag hai lần)", async () => {
    mockAttribution.mockReturnValue({ utm_campaign: "gg-search-tuquy" });
    const { tagZaloHref } = await import("@/lib/zaloCampaignTag");
    const a = zaloAnchor(
      `https://zalo.me/0933356666?text=${encodeURIComponent("Em quan tâm sim số đẹp. [Mã: gg-search-tuquy]")}`,
    );
    const href = tagZaloHref(a);
    expect(href).toBeUndefined();
  });

  it("không utm_campaign nhưng có gclid → mã 'ads'", async () => {
    mockAttribution.mockReturnValue({ gclid: "abc123" });
    const { tagZaloHref } = await import("@/lib/zaloCampaignTag");
    const a = zaloAnchor("https://zalo.me/0933356666");
    const href = tagZaloHref(a);
    const text = new URL(href!).searchParams.get("text");
    expect(text).toContain("[Mã: ads]");
  });

  it("source internal (không chiến dịch) → không sửa href", async () => {
    mockAttribution.mockReturnValue({});
    mockClassify.mockReturnValue({ referrer: "https://www.chonsomobifone.com/", source: "internal" });
    const { tagZaloHref } = await import("@/lib/zaloCampaignTag");
    const a = zaloAnchor("https://zalo.me/0933356666");
    const href = tagZaloHref(a);
    expect(href).toBeUndefined();
  });

  it("SIM từ data-sim-number → text có 'SIM {sim}'", async () => {
    mockAttribution.mockReturnValue({ utm_campaign: "gg-search-tuquy" });
    const { tagZaloHref } = await import("@/lib/zaloCampaignTag");
    const a = zaloAnchor("https://zalo.me/0933356666", { "data-sim-number": "0933686666" });
    const href = tagZaloHref(a);
    const text = new URL(href!).searchParams.get("text");
    expect(text).toContain("SIM 0933686666");
    expect(text).toContain("[Mã: gg-search-tuquy]");
  });

  it("trang /mua-ngay/<simId> → dùng simId làm SIM", async () => {
    mockAttribution.mockReturnValue({ utm_campaign: "gg-search-tuquy" });
    const { detectSimNumber } = await import("@/lib/zaloCampaignTag");
    const a = zaloAnchor("https://zalo.me/0933356666");
    expect(detectSimNumber(a, "/mua-ngay/SIM036227")).toBe("SIM036227");
  });
});
