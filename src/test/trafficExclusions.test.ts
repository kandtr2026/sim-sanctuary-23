import { describe, it, expect, vi, beforeEach } from "vitest";
import type { NextRequest } from "next/server";

/**
 * Lọc traffic nội bộ + bot (A Khoa 26/09) — phần thuần phía app:
 * đọc IP request, validate body POST/PATCH, ?all, trừ chuỗi ngày, map báo cáo,
 * throttle refresh / ghi IP admin, route visit-stats + track/click.
 * Luật SQL (bot regex, khung giờ admin, staff/heavy) nằm ở migration
 * 20260926100000_traffic_exclusions.sql, không test ở đây.
 */

// ── Supabase service role giả ────────────────────────────────────────────────
type RpcResult = { data: unknown; error: { code?: string; message: string } | null };
const rpcCalls: { fn: string; args: unknown }[] = [];
const inserts: { table: string; row: Record<string, unknown> }[] = [];
let rpcImpl: (fn: string, args: unknown) => RpcResult = () => ({ data: null, error: null });
let insertImpl: (table: string, row: Record<string, unknown>) => { error: { code?: string; message: string } | null } =
  () => ({ error: null });

const fakeDb = {
  rpc: async (fn: string, args?: unknown) => {
    rpcCalls.push({ fn, args });
    return rpcImpl(fn, args);
  },
  from: (table: string) => ({
    insert: async (row: Record<string, unknown>) => {
      inserts.push({ table, row });
      return insertImpl(table, row);
    },
  }),
};

vi.mock("@/lib/shopee/admin", () => ({
  createAdminClient: () => fakeDb,
  hasServiceRoleEnv: () => true,
}));

vi.mock("@/lib/shopee/http", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/shopee/http")>();
  return {
    ...actual,
    requireAdmin: async () => ({ user: { id: "u1", email: "admin@example.com" } }),
  };
});

const lib = await import("@/lib/trafficExclusions");

const fakeReq = (url: string, headers: Record<string, string> = {}, body?: unknown) =>
  ({
    nextUrl: new URL(url),
    url,
    headers: new Headers(headers),
    json: async () => {
      if (body === undefined) throw new Error("no body");
      return body;
    },
  }) as unknown as NextRequest;

beforeEach(() => {
  rpcCalls.length = 0;
  inserts.length = 0;
  rpcImpl = () => ({ data: null, error: null });
  insertImpl = () => ({ error: null });
  lib.__resetRefreshThrottle();
});

// ── IP ──────────────────────────────────────────────────────────────────────
describe("clientIp", () => {
  it("lấy hop đầu của x-forwarded-for", () => {
    expect(lib.clientIp(new Headers({ "x-forwarded-for": " 1.53.114.105 , 10.0.0.1" }))).toBe("1.53.114.105");
  });
  it("fallback x-real-ip, không có gì → null", () => {
    expect(lib.clientIp(new Headers({ "x-real-ip": "58.187.188.143" }))).toBe("58.187.188.143");
    expect(lib.clientIp(new Headers())).toBeNull();
  });
});

describe("normalizeExactIp — chỉ nhận 1 IP chính xác", () => {
  it("IPv4 hợp lệ, bỏ số 0 đầu", () => {
    expect(lib.normalizeExactIp(" 1.53.114.105 ")).toBe("1.53.114.105");
    expect(lib.normalizeExactIp("001.053.114.105")).toBe("1.53.114.105");
  });
  it("từ chối dải / CIDR / octet >255 / chữ lạ", () => {
    for (const bad of ["103.199.32.0/24", "103.199.32", "103.199.32.*", "256.1.1.1", "1.2.3.4 5", "abc", "", null, 42]) {
      expect(lib.normalizeExactIp(bad)).toBeNull();
    }
  });
  it("IPv6 hợp lệ → viết thường; sai → null", () => {
    expect(lib.normalizeExactIp("2001:DB8::1")).toBe("2001:db8::1");
    expect(lib.normalizeExactIp("::ffff:1.2.3.4")).toBe("::ffff:1.2.3.4");
    expect(lib.normalizeExactIp("1:2:3:4:5:6:7:8")).toBe("1:2:3:4:5:6:7:8");
    for (const bad of ["1::2::3", "2001:db8::/32", "1:2:3", "12345::1", "fe80::1%eth0", "::ffff:999.1.1.1"]) {
      expect(lib.normalizeExactIp(bad)).toBeNull();
    }
  });
});

// ── Query / body ────────────────────────────────────────────────────────────
describe("parseAllFlag", () => {
  it("?all=1|true|yes → true; còn lại false", () => {
    for (const v of ["1", "true", "YES"]) expect(lib.parseAllFlag(new URLSearchParams({ all: v }))).toBe(true);
    for (const qs of ["", "all=0", "all=", "all=no", "other=1"]) {
      expect(lib.parseAllFlag(new URLSearchParams(qs))).toBe(false);
    }
  });
});

describe("validateExclusionPost", () => {
  it("IP đúng + ghi chú cắt gọn", () => {
    expect(lib.validateExclusionPost({ ip: "1.53.114.105", note: "  máy chị Trâm  " })).toEqual({
      ok: true,
      ip: "1.53.114.105",
      note: "máy chị Trâm",
    });
    expect(lib.validateExclusionPost({ ip: "1.53.114.105" })).toEqual({ ok: true, ip: "1.53.114.105", note: null });
    expect(lib.validateExclusionPost({ ip: "1.53.114.105", note: "   " })).toMatchObject({ ok: true, note: null });
  });
  it("từ chối dải IP, body rỗng, note sai kiểu", () => {
    expect(lib.validateExclusionPost({ ip: "103.199.32.0/24" }).ok).toBe(false);
    expect(lib.validateExclusionPost(null).ok).toBe(false);
    expect(lib.validateExclusionPost({ ip: "1.2.3.4", note: 5 }).ok).toBe(false);
  });
  it("note dài bị cắt 200 ký tự", () => {
    const r = lib.validateExclusionPost({ ip: "1.2.3.4", note: "x".repeat(500) });
    expect(r.ok && r.note?.length).toBe(200);
  });
});

describe("validateExclusionPatch", () => {
  it("id số dương + active boolean", () => {
    expect(lib.validateExclusionPatch({ id: 7, active: false })).toEqual({ ok: true, id: 7, ip: null, active: false });
    expect(lib.validateExclusionPatch({ id: "12", active: true })).toEqual({ ok: true, id: 12, ip: null, active: true });
  });
  it("{ ip, active } → bật/tắt cả IP (mọi lý do)", () => {
    expect(lib.validateExclusionPatch({ ip: "1.53.114.105", active: false })).toEqual({ ok: true, id: null, ip: "1.53.114.105", active: false });
    expect(lib.validateExclusionPatch({ ip: "1.53.114.0/24", active: false }).ok).toBe(false);
  });
  it("từ chối id hỏng / active không phải boolean", () => {
    expect(lib.validateExclusionPatch({ id: 0, active: true }).ok).toBe(false);
    expect(lib.validateExclusionPatch({ id: 1.5, active: true }).ok).toBe(false);
    expect(lib.validateExclusionPatch({ id: "abc", active: true }).ok).toBe(false);
    expect(lib.validateExclusionPatch({ id: 3, active: "false" }).ok).toBe(false);
    expect(lib.validateExclusionPatch(undefined).ok).toBe(false);
  });
});

// ── Chuỗi ngày ──────────────────────────────────────────────────────────────
describe("toDaily / subtractDaily", () => {
  it("map {d,n} (n có thể là chuỗi bigint), bỏ dòng hỏng", () => {
    expect(lib.toDaily([{ d: "2026-09-25", n: "2727" }, { d: null, n: 1 }, { d: "2026-09-26", n: 183 }])).toEqual([
      { day: "2026-09-25", count: 2727 },
      { day: "2026-09-26", count: 183 },
    ]);
    expect(lib.toDaily(null)).toEqual([]);
  });
  it("phần bị loại = tất cả − khách, chỉ giữ ngày > 0, tăng dần", () => {
    const all = [
      { day: "2026-09-26", count: 183 },
      { day: "2026-09-25", count: 2727 },
      { day: "2026-09-20", count: 19 },
    ];
    const khach = [
      { day: "2026-09-25", count: 66 },
      { day: "2026-09-26", count: 56 },
      { day: "2026-09-20", count: 19 },
    ];
    expect(lib.subtractDaily(all, khach)).toEqual([
      { day: "2026-09-25", count: 2661 },
      { day: "2026-09-26", count: 127 },
    ]);
  });
});

// ── Báo cáo ─────────────────────────────────────────────────────────────────
describe("mapExclusionReport", () => {
  it("snake_case của RPC → đúng hợp đồng API", () => {
    const out = lib.mapExclusionReport({
      totals: { internal: 2769, bot: 4241, customer: 438 },
      items: [
        {
          id: 3,
          ip: "1.53.114.105",
          reason: "staff",
          note: null,
          active: true,
          auto: true,
          valid_from: null,
          valid_to: null,
          visits: 2106,
          last_visit: "2026-09-25T09:00:00+00:00",
        },
      ],
    });
    expect(out.totals).toEqual({ internalVisits14d: 2769, botVisits14d: 4241, customerVisits14d: 438 });
    expect(out.items[0]).toEqual({
      id: 3,
      ip: "1.53.114.105",
      reason: "staff",
      note: null,
      active: true,
      auto: true,
      valid_from: null,
      valid_to: null,
      visits14d: 2106,
      lastVisit: "2026-09-25T09:00:00+00:00",
    });
  });
  it("dữ liệu rỗng/hỏng → mảng rỗng, tổng 0", () => {
    expect(lib.mapExclusionReport(null)).toEqual({
      items: [],
      totals: { internalVisits14d: 0, botVisits14d: 0, customerVisits14d: 0 },
    });
  });
});

describe("isMissingDbObject", () => {
  it("nhận lỗi view/hàm chưa có", () => {
    expect(lib.isMissingDbObject({ code: "PGRST202", message: "Could not find the function" })).toBe(true);
    expect(lib.isMissingDbObject({ code: "PGRST205", message: "x" })).toBe(true);
    expect(lib.isMissingDbObject({ code: "42P01", message: 'relation "x" does not exist' })).toBe(true);
    expect(lib.isMissingDbObject({ code: "57014", message: "canceling statement due to statement timeout" })).toBe(
      false,
    );
    expect(lib.isMissingDbObject(null)).toBe(false);
  });
});

// ── Click ───────────────────────────────────────────────────────────────────
describe("buildClickRow", () => {
  it("giữ đúng payload useConversionTracker, IP do server đặt (bỏ ip trong body)", () => {
    const row = lib.buildClickRow(
      {
        type: "zalo",
        path: "/sim/0909686886",
        source: "google",
        user_agent: "Mozilla/5.0",
        sim_number: "0909686886",
        position: "card",
        device: "mobile",
        variant: "B",
        utm_campaign: "gg-search-tuquy",
        gclid: "abc",
        ip: "6.6.6.6",
      },
      "1.2.3.4",
    );
    expect(row).toMatchObject({
      type: "zalo",
      path: "/sim/0909686886",
      source: "google",
      sim_number: "0909686886",
      position: "card",
      device: "mobile",
      variant: "B",
      utm_campaign: "gg-search-tuquy",
      gclid: "abc",
      ip: "1.2.3.4",
    });
  });
  it("type lạ hoặc thiếu path → null", () => {
    expect(lib.buildClickRow({ type: "sms", path: "/" }, null)).toBeNull();
    expect(lib.buildClickRow({ type: "call" }, null)).toBeNull();
    expect(lib.buildClickRow(null, null)).toBeNull();
  });
});

// ── Throttle ────────────────────────────────────────────────────────────────
describe("refreshExclusionsThrottled", () => {
  it("≤1 lần / 10 phút, lỗi RPC → null không ném", async () => {
    rpcImpl = () => ({ data: 3, error: null });
    const t0 = 1_000_000_000_000;
    expect(await lib.refreshExclusionsThrottled(fakeDb as never, t0)).toBe(3);
    expect(await lib.refreshExclusionsThrottled(fakeDb as never, t0 + 60_000)).toBeNull();
    rpcImpl = () => ({ data: null, error: { message: "boom" } });
    expect(await lib.refreshExclusionsThrottled(fakeDb as never, t0 + lib.REFRESH_EVERY_MS)).toBeNull();
    expect(rpcCalls.filter((c) => c.fn === "refresh_traffic_exclusions")).toHaveLength(2);
  });
});

describe("rememberAdminIp", () => {
  it("ghi IP admin qua note_admin_ip, mỗi IP ≤1 lần/10 phút, bỏ tài khoản +bot@", async () => {
    const req = (ip: string) => ({ headers: new Headers({ "x-forwarded-for": ip }) }) as unknown as Request;
    lib.rememberAdminIp(req("9.9.9.1"), "a@example.com");
    lib.rememberAdminIp(req("9.9.9.1"), "a@example.com"); // trùng trong 10 phút → bỏ
    lib.rememberAdminIp(req("9.9.9.2"), "ci+bot@example.com"); // máy bot → bỏ
    lib.rememberAdminIp(req("103.199.32.0/24"), "a@example.com"); // không phải IP chính xác → bỏ
    await new Promise((r) => setTimeout(r, 0));
    const calls = rpcCalls.filter((c) => c.fn === "note_admin_ip");
    expect(calls).toEqual([{ fn: "note_admin_ip", args: { p_ip: "9.9.9.1" } }]);
  });
  it("shouldNoteAdminIp hết hạn sau 10 phút", () => {
    const t = 2_000_000_000_000;
    expect(lib.shouldNoteAdminIp("8.8.4.4", t)).toBe(true);
    expect(lib.shouldNoteAdminIp("8.8.4.4", t + 1000)).toBe(false);
    expect(lib.shouldNoteAdminIp("8.8.4.4", t + lib.ADMIN_IP_EVERY_MS)).toBe(true);
  });
});

// ── Route /api/admin/visit-stats ────────────────────────────────────────────
describe("GET /api/admin/visit-stats", () => {
  const ALL = [
    { d: "2026-09-25", n: 2727 },
    { d: "2026-09-26", n: 183 },
  ];
  const KHACH = [
    { d: "2026-09-25", n: 66 },
    { d: "2026-09-26", n: 56 },
  ];
  const setRpc = () => {
    rpcImpl = (fn, args) => {
      if (fn === "refresh_traffic_exclusions") return { data: 0, error: null };
      const a = args as { p_all?: boolean };
      return { data: a.p_all ? ALL : KHACH, error: null };
    };
  };

  it("mặc định chỉ khách thật + excluded = phần bị loại; có gọi refresh", async () => {
    setRpc();
    const { GET } = await import("@/app/api/admin/visit-stats/route");
    const res = await GET(fakeReq("http://localhost/api/admin/visit-stats"));
    const body = await res.json();
    expect(body.total).toBe(122);
    expect(body.daily).toEqual([
      { day: "2026-09-25", count: 66 },
      { day: "2026-09-26", count: 56 },
    ]);
    expect(body.excluded).toEqual({
      total: 2788,
      daily: [
        { day: "2026-09-25", count: 2661 },
        { day: "2026-09-26", count: 127 },
      ],
    });
    expect(rpcCalls.map((c) => c.fn)).toContain("refresh_traffic_exclusions");
  });

  it("?all=1 → gồm cả nội bộ/bot, excluded vẫn trả", async () => {
    setRpc();
    const { GET } = await import("@/app/api/admin/visit-stats/route");
    const body = await (await GET(fakeReq("http://localhost/api/admin/visit-stats?all=1"))).json();
    expect(body.total).toBe(2910);
    expect(body.excluded.total).toBe(2788);
  });

  it("RPC 2 tham số chưa có (migration chưa áp) → lùi về gọi cũ, excluded 0", async () => {
    rpcImpl = (fn, args) => {
      if (fn === "refresh_traffic_exclusions") return { data: null, error: { code: "PGRST202", message: "x" } };
      const a = args as { p_all?: boolean };
      if (a.p_all !== undefined) {
        return { data: null, error: { code: "PGRST202", message: "Could not find the function" } };
      }
      return { data: ALL, error: null };
    };
    const { GET } = await import("@/app/api/admin/visit-stats/route");
    const res = await GET(fakeReq("http://localhost/api/admin/visit-stats"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.total).toBe(2910);
    expect(body.excluded).toEqual({ total: 0, daily: [] });
  });
});

// ── Route /api/track/click ──────────────────────────────────────────────────
describe("POST /api/track/click", () => {
  it("ghi conversion_clicks kèm IP đọc từ header, trả 204", async () => {
    const { POST } = await import("@/app/api/track/click/route");
    const res = await POST(
      fakeReq("http://localhost/api/track/click", { "x-forwarded-for": "113.23.24.231, 10.0.0.1" }, {
        type: "call",
        path: "/",
        user_agent: "Mozilla/5.0",
      }),
    );
    expect(res.status).toBe(204);
    expect(inserts).toHaveLength(1);
    expect(inserts[0].table).toBe("conversion_clicks");
    expect(inserts[0].row).toMatchObject({ type: "call", path: "/", ip: "113.23.24.231" });
  });

  it("body hỏng → 204, không ghi", async () => {
    const { POST } = await import("@/app/api/track/click/route");
    const res = await POST(fakeReq("http://localhost/api/track/click", {}, undefined));
    expect(res.status).toBe(204);
    expect(inserts).toHaveLength(0);
  });

  it("cột ip chưa có → ghi lại không kèm IP", async () => {
    insertImpl = (_t, row) =>
      "ip" in row
        ? { error: { code: "PGRST204", message: "Could not find the 'ip' column of 'conversion_clicks'" } }
        : { error: null };
    const { POST } = await import("@/app/api/track/click/route");
    const res = await POST(
      fakeReq("http://localhost/api/track/click", { "x-forwarded-for": "1.1.1.1" }, { type: "zalo", path: "/" }),
    );
    expect(res.status).toBe(204);
    expect(inserts).toHaveLength(2);
    expect("ip" in inserts[1].row).toBe(false);
  });
});
