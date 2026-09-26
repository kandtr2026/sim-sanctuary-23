/**
 * Helper PHÍA SERVER cho việc loại traffic nội bộ + bot khỏi thống kê khách
 * (/admin/dashboard?tab=traffic, A Khoa 26/09). Luật + dữ liệu nằm ở SQL
 * (supabase/migrations/20260926100000_traffic_exclusions.sql): bảng
 * `traffic_exclusions`, hàm `is_internal_visit`, view `*_khach`, RPC
 * `daily_page_visits(p_days, p_all)`, `refresh_traffic_exclusions()`,
 * `note_admin_ip(p_ip)`, `traffic_exclusions_report(p_days)`.
 *
 * File này chỉ lo phần app: đọc IP request, validate body, throttle refresh, map
 * báo cáo. KHÔNG import vào Client Component (kéo theo service role + next/server).
 */

import { after } from "next/server";
import { createAdminClient, hasServiceRoleEnv } from "@/lib/shopee/admin";

type Db = ReturnType<typeof createAdminClient>;

// ─── IP ─────────────────────────────────────────────────────────────────────

/**
 * IP khách của request: Vercel đặt ở x-forwarded-for (hop đầu là client),
 * fallback x-real-ip. Cắt 64 ký tự cho an toàn cột text.
 */
export function clientIp(headers: Headers): string | null {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first.slice(0, 64);
  }
  const real = headers.get("x-real-ip")?.trim();
  return real ? real.slice(0, 64) : null;
}

const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

/**
 * Chuẩn hoá 1 IP CHÍNH XÁC (v4 hoặc v6) — KHÔNG nhận dải (/24, CIDR), khoảng
 * trắng giữa chừng hay chữ lạ. IPv4 bỏ số 0 đứng đầu; IPv6 viết thường (dạng
 * chuẩn cuối cùng do trigger DB `host(inet)` quyết). Sai → null.
 */
export function normalizeExactIp(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const ip = raw.trim();
  if (!ip || ip.length > 45) return null;

  const v4 = ip.match(IPV4);
  if (v4) {
    const parts = v4.slice(1).map(Number);
    if (parts.some((p) => p > 255)) return null;
    return parts.join(".");
  }

  // IPv6 (có thể kèm đuôi IPv4 kiểu ::ffff:1.2.3.4): chỉ hex, ':' và '.'; tối đa
  // một '::'; mỗi nhóm hex ≤4 ký tự; không có '::' thì phải đủ 8 nhóm.
  if (!/^[0-9a-f:.]+$/i.test(ip) || !ip.includes(":")) return null;
  const doubles = (ip.match(/::/g) ?? []).length;
  if (doubles > 1 || ip.includes(":::")) return null;
  const groups = ip.split(":");
  const last = groups[groups.length - 1];
  const v4Tail = last.includes(".");
  if (v4Tail) {
    const m = last.match(IPV4);
    if (!m || m.slice(1).some((p) => Number(p) > 255)) return null;
  }
  const hexGroups = v4Tail ? groups.slice(0, -1) : groups;
  if (hexGroups.some((g) => g.length > 4 || g.includes("."))) return null;
  const filled = hexGroups.filter((g) => g !== "").length + (v4Tail ? 2 : 0);
  if (doubles === 0 ? filled !== 8 || hexGroups.some((g) => g === "") : filled > 7) return null;
  return ip.toLowerCase();
}

// ─── Ghi click chuyển đổi (POST /api/track/click) ──────────────────────────

const str = (v: unknown, max: number): string | null => {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
};

export const CONVERSION_TYPES = ["zalo", "call", "messenger"] as const;
export type ConversionType = (typeof CONVERSION_TYPES)[number];

/**
 * Body của useConversionTracker → 1 dòng conversion_clicks, IP do SERVER đặt
 * (không nhận ip từ body). Thiếu type hợp lệ / path → null (không ghi).
 */
export function buildClickRow(body: unknown, ip: string | null) {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const type = typeof b.type === "string" ? b.type.trim().toLowerCase() : "";
  if (!(CONVERSION_TYPES as readonly string[]).includes(type)) return null;
  const path = str(b.path, 500);
  if (!path) return null;
  return {
    type: type as ConversionType,
    path,
    source: str(b.source, 40),
    user_agent: str(b.user_agent, 500),
    sim_number: str(b.sim_number, 20),
    position: str(b.position, 40),
    device: str(b.device, 20),
    variant: str(b.variant, 10),
    ip,
    utm_source: str(b.utm_source, 200),
    utm_medium: str(b.utm_medium, 200),
    utm_campaign: str(b.utm_campaign, 200),
    utm_term: str(b.utm_term, 200),
    utm_content: str(b.utm_content, 200),
    gclid: str(b.gclid, 300),
    fbclid: str(b.fbclid, 300),
  };
}

// ─── Query / body ───────────────────────────────────────────────────────────

/** `?all=1` (hoặc true/yes) → gồm cả nội bộ + bot. Mặc định: KHÔNG. */
export function parseAllFlag(params: URLSearchParams): boolean {
  const v = params.get("all")?.trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export type ValidationResult<T> = ({ ok: true } & T) | { ok: false; error: string };

const NOTE_MAX = 200;

/** Body POST /api/admin/traffic-exclusions: { ip, note? } — thêm IP tay. */
export function validateExclusionPost(body: unknown): ValidationResult<{ ip: string; note: string | null }> {
  if (!body || typeof body !== "object") return { ok: false, error: "Thiếu dữ liệu" };
  const b = body as Record<string, unknown>;
  const ip = normalizeExactIp(b.ip);
  if (!ip) {
    return { ok: false, error: "IP không hợp lệ — nhập đúng 1 IP (vd 1.53.114.105), không nhập dải." };
  }
  if (b.note != null && typeof b.note !== "string") return { ok: false, error: "Ghi chú phải là chữ" };
  const note = typeof b.note === "string" ? b.note.trim().slice(0, NOTE_MAX) || null : null;
  return { ok: true, ip, note };
}

/**
 * Body PATCH /api/admin/traffic-exclusions: { id, active } bật/tắt 1 dòng, hoặc
 * { ip, active } bật/tắt MỌI dòng của IP đó. Một IP có thể mang tới 3 lý do
 * (admin + staff + heavy); A Khoa bấm "Không phải nội bộ" là muốn IP đó thôi bị
 * loại hẳn, tắt riêng 1 dòng thì IP vẫn bị 2 dòng kia loại — dễ hiểu nhầm.
 */
export function validateExclusionPatch(
  body: unknown,
): ValidationResult<{ id: number | null; ip: string | null; active: boolean }> {
  if (!body || typeof body !== "object") return { ok: false, error: "Thiếu dữ liệu" };
  const b = body as Record<string, unknown>;
  if (typeof b.active !== "boolean") return { ok: false, error: "active phải là true/false" };
  if (b.ip !== undefined) {
    const ip = normalizeExactIp(b.ip);
    if (!ip) return { ok: false, error: "IP không hợp lệ" };
    return { ok: true, id: null, ip, active: b.active };
  }
  const id = typeof b.id === "string" && /^\d+$/.test(b.id.trim()) ? Number(b.id) : b.id;
  if (typeof id !== "number" || !Number.isSafeInteger(id) || id <= 0) {
    return { ok: false, error: "id không hợp lệ" };
  }
  return { ok: true, id, ip: null, active: b.active };
}

// ─── Chuỗi lượt theo ngày ──────────────────────────────────────────────────

export interface DailyCount {
  day: string;
  count: number;
}

/** Dòng RPC daily_page_visits {d, n} → {day, count}, bỏ dòng hỏng. */
export function toDaily(rows: unknown): DailyCount[] {
  if (!Array.isArray(rows)) return [];
  const out: DailyCount[] = [];
  for (const r of rows as { d?: unknown; n?: unknown }[]) {
    const day = typeof r?.d === "string" ? r.d.slice(0, 10) : null;
    const count = Number(r?.n);
    if (day && Number.isFinite(count)) out.push({ day, count });
  }
  return out;
}

export const sumDaily = (daily: DailyCount[]): number => daily.reduce((s, x) => s + x.count, 0);

/** Phần BỊ LOẠI theo ngày = tất cả − khách thật (chỉ giữ ngày > 0), tăng dần theo ngày. */
export function subtractDaily(all: DailyCount[], khach: DailyCount[]): DailyCount[] {
  const kh = new Map(khach.map((x) => [x.day, x.count]));
  return all
    .map((x) => ({ day: x.day, count: Math.max(0, x.count - (kh.get(x.day) ?? 0)) }))
    .filter((x) => x.count > 0)
    .sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));
}

// ─── Báo cáo /api/admin/traffic-exclusions ─────────────────────────────────

export interface ExclusionItem {
  id: number;
  ip: string;
  reason: string;
  note: string | null;
  active: boolean;
  auto: boolean;
  valid_from: string | null;
  valid_to: string | null;
  visits14d: number;
  lastVisit: string | null;
}

export interface ExclusionTotals {
  internalVisits14d: number;
  botVisits14d: number;
  customerVisits14d: number;
}

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const strOrNull = (v: unknown): string | null => (typeof v === "string" && v ? v : null);

/** jsonb của RPC traffic_exclusions_report (snake_case) → đúng hợp đồng API. */
export function mapExclusionReport(raw: unknown): { items: ExclusionItem[]; totals: ExclusionTotals } {
  const r = (raw && typeof raw === "object" ? raw : {}) as {
    items?: unknown;
    totals?: Record<string, unknown>;
  };
  const items: ExclusionItem[] = (Array.isArray(r.items) ? r.items : [])
    .filter((x): x is Record<string, unknown> => !!x && typeof x === "object")
    .map((x) => ({
      id: num(x.id),
      ip: String(x.ip ?? ""),
      reason: String(x.reason ?? ""),
      note: strOrNull(x.note),
      active: x.active === true,
      auto: x.auto === true,
      valid_from: strOrNull(x.valid_from),
      valid_to: strOrNull(x.valid_to),
      visits14d: num(x.visits),
      lastVisit: strOrNull(x.last_visit),
    }));
  const t = r.totals ?? {};
  return {
    items,
    totals: {
      internalVisits14d: num(t.internal),
      botVisits14d: num(t.bot),
      customerVisits14d: num(t.customer),
    },
  };
}

// ─── Lỗi "chưa áp migration" ───────────────────────────────────────────────

/**
 * Lỗi PostgREST/Postgres báo view/hàm CHƯA tồn tại (migration chưa áp) — để
 * route lùi về cách đọc cũ thay vì sập dashboard.
 */
export function isMissingDbObject(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: unknown; message?: unknown };
  const code = typeof e.code === "string" ? e.code : "";
  if (["PGRST202", "PGRST205", "42P01", "42883"].includes(code)) return true;
  const msg = typeof e.message === "string" ? e.message : "";
  return /could not find the (function|table)|does not exist/i.test(msg);
}

// ─── Refresh danh sách tự động (throttle) ──────────────────────────────────

/** Tối đa 1 lần / 10 phút / instance — refresh quét 30 ngày page_visits. */
export const REFRESH_EVERY_MS = 10 * 60_000;
let lastRefreshAt = 0;

/**
 * Gọi RPC refresh_traffic_exclusions() nếu đã quá REFRESH_EVERY_MS kể từ lần
 * trước. Không bao giờ ném lỗi. Trả số dòng đổi, hoặc null nếu bỏ qua/lỗi.
 */
export async function refreshExclusionsThrottled(db: Db, now = Date.now()): Promise<number | null> {
  if (now - lastRefreshAt < REFRESH_EVERY_MS) return null;
  lastRefreshAt = now; // đặt trước khi await: request song song không gọi trùng
  try {
    const { data, error } = await db.rpc("refresh_traffic_exclusions");
    if (error) return null;
    return num(data);
  } catch {
    return null;
  }
}

/** Chỉ cho test: xoá mốc throttle. */
export function __resetRefreshThrottle(): void {
  lastRefreshAt = 0;
}

// ─── Ghi IP máy admin (requireAdmin) ───────────────────────────────────────

/** Mỗi IP chỉ ghi ≤1 lần / 10 phút / instance — note_admin_ip nới khung +1 ngày. */
export const ADMIN_IP_EVERY_MS = 10 * 60_000;
const notedAdminIps = new Map<string, number>();

/** true nếu IP này nên được ghi lúc `now` (và đánh dấu đã ghi). */
export function shouldNoteAdminIp(ip: string, now = Date.now()): boolean {
  const last = notedAdminIps.get(ip);
  if (last !== undefined && now - last < ADMIN_IP_EVERY_MS) return false;
  notedAdminIps.set(ip, now);
  if (notedAdminIps.size > 200) {
    for (const [k, t] of notedAdminIps) {
      if (now - t >= ADMIN_IP_EVERY_MS) notedAdminIps.delete(k);
    }
  }
  return true;
}

/** Tài khoản máy (bot kiểm web "+bot@") không phải người thật → không ghi IP. */
export const isBotAccountEmail = (email: string | null | undefined): boolean => /\+bot@/i.test(email ?? "");

/**
 * Ghi nhận IP request của admin vừa xác thực OK vào traffic_exclusions
 * (reason 'admin', RPC note_admin_ip). Best-effort, không chặn request: chạy sau
 * khi trả response bằng `after()`; ngoài request scope (test) thì bắn nền.
 */
export function rememberAdminIp(req: Request, email: string | null | undefined): void {
  try {
    if (isBotAccountEmail(email)) return;
    const ip = normalizeExactIp(clientIp(req.headers));
    if (!ip || !hasServiceRoleEnv() || !shouldNoteAdminIp(ip)) return;

    const task = async () => {
      try {
        await createAdminClient().rpc("note_admin_ip", { p_ip: ip });
      } catch {
        /* best-effort */
      }
    };
    try {
      after(task);
    } catch {
      void task();
    }
  } catch {
    /* không bao giờ làm hỏng requireAdmin */
  }
}
