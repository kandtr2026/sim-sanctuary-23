import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * A6 — ghép đơn từ webhook /api/orders vào funnel chiến dịch:
 * - campaign_code khớp utm_campaign → gộp Đơn + Doanh thu vào dòng chiến dịch.
 * - campaign_code rỗng/không khớp → rơi vào bucket "(không gắn mã)".
 * - tỉ lệ lead→đơn tính đúng.
 *
 * Mock toàn bộ client Supabase vì `campaignAnalytics` chỉ phụ thuộc vào nó.
 */

// ── fake data cho query builder ──────────────────────────────────────────────
type Row = Record<string, unknown>;
const makeQuery = (rows: Row[]) => {
  const outer = {
    data: rows,
    error: null,
  };
  // Mọi mắt xích trong chuỗi .select().gte().order().limit() đều trả về `outer`
  // (có sẵn .data) chứ không phải một object rỗng.
  for (const method of ["select", "gte", "lte", "order", "limit"]) {
    (outer as unknown as Record<string, unknown>)[method] = () => outer;
  }
  return outer;
};

const visit = (utm_campaign: string | null): Row => ({
  utm_campaign,
  utm_source: null,
  utm_medium: null,
  source: null,
});

const click = (utm_campaign: string | null, type = "zalo"): Row => ({
  type,
  utm_campaign,
  utm_source: null,
  utm_medium: null,
  source: null,
});

const order = (campaign_code: string | null, price: number | null): Row => ({
  campaign_code,
  price,
});

let visitsRows: Row[] = [];
let clicksRows: Row[] = [];
let ordersRows: Row[] = [];

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      const rows =
        table === "page_visits"
          ? visitsRows
          : table === "conversion_clicks"
            ? clicksRows
            : ordersRows;
      return makeQuery(rows);
    },
  },
}));

// ── tests ─────────────────────────────────────────────────────────────────────
describe("getCampaignFunnel — ghép đơn A6", () => {
  beforeEach(() => {
    visitsRows = [];
    clicksRows = [];
    ordersRows = [];
  });

  it("gộp đơn theo campaign_code khớp utm_campaign + đếm doanh thu", async () => {
    visitsRows = [visit("gg-search-tuquy")];
    clicksRows = [click("gg-search-tuquy")];
    ordersRows = [order("gg-search-tuquy", 3_500_000), order("gg-search-tuquy", 2_900_000)];

    const { getCampaignFunnel } = await import("@/lib/campaignAnalytics");
    const rows = await getCampaignFunnel(30);
    const row = rows.find((r) => r.key === "gg-search-tuquy");
    expect(row).toBeDefined();
    expect(row!.orders).toBe(2);
    expect(row!.revenue).toBe(6_400_000);
    expect(row!.orderRate).toBe(200); // 2 đơn / 1 lead
  });

  it("đơn không gắn mã / không khớp chiến dịch → bucket '(không gắn mã)'", async () => {
    visitsRows = [visit("gg-search-tuquy")];
    clicksRows = [click("gg-search-tuquy")];
    ordersRows = [order(null, 1_000_000), order("something-else", 500_000)];

    const { getCampaignFunnel } = await import("@/lib/campaignAnalytics");
    const rows = await getCampaignFunnel(30);
    const untagged = rows.find((r) => r.key === "(không gắn mã)");
    expect(untagged).toBeDefined();
    expect(untagged!.orders).toBe(2);
    expect(untagged!.revenue).toBe(1_500_000);
    // Chiến dịch gg-search-tuquy vẫn còn lead nhưng 0 đơn
    const tuquy = rows.find((r) => r.key === "gg-search-tuquy");
    expect(tuquy!.orders).toBe(0);
    expect(tuquy!.orderRate).toBe(0);
  });

  it("không có orders nào → dòng chỉ có lead, đơn=0", async () => {
    visitsRows = [visit("fb-sodep")];
    clicksRows = [click("fb-sodep")];

    const { getCampaignFunnel } = await import("@/lib/campaignAnalytics");
    const rows = await getCampaignFunnel(30);
    const row = rows.find((r) => r.key === "fb-sodep");
    expect(row!.leads).toBe(1);
    expect(row!.orders).toBe(0);
    expect(row!.revenue).toBe(0);
    expect(row!.orderRate).toBe(0);
  });

  it("campaign_code chuẩn hoá lowercase khi nối", async () => {
    visitsRows = [visit("GG-SEARCH-TUQUY")]; // utm giữ nguyên hoa
    clicksRows = [click("GG-SEARCH-TUQUY")];
    ordersRows = [order("gg-search-tuquy", 4_000_000)]; // đơn gửi lowercase

    const { getCampaignFunnel } = await import("@/lib/campaignAnalytics");
    const rows = await getCampaignFunnel(30);
    const row = rows.find((r) => r.key === "GG-SEARCH-TUQUY");
    expect(row).toBeDefined();
    expect(row!.orders).toBe(1);
    expect(row!.revenue).toBe(4_000_000);
  });
});
