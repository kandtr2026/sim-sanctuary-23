/**
 * Tiện ích dùng chung cho các route handler /api/admin/shopee/*.
 *
 * Middleware (src/proxy.ts) chỉ chặn /admin/* nên /api/* phải tự kiểm tra
 * session. Mọi số liệu ở đây là dữ liệu kinh doanh nội bộ (credential Shopee,
 * danh sách sản phẩm đã đăng) nên không có route nào được để public.
 *
 * Client gửi access token của Supabase Auth trong header `Authorization: Bearer`.
 * Server tự verify qua REST endpoint auth/v1/user rồi kiểm tra profiles.is_admin.
 */

import { NextResponse } from "next/server";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/config";
import { ShopeeApiError } from "./client";
import { ShopeeConfigError } from "./credentials";

export interface AdminUser {
  id: string;
  email: string;
}

export async function requireAdmin(req: Request): Promise<
  { user: AdminUser } | { response: NextResponse }
> {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return { response: unauthorized("Chưa đăng nhập") };
  }
  const token = auth.slice(7);
  if (!token) {
    return { response: unauthorized("Chưa đăng nhập") };
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
    if (!res.ok) return { response: unauthorized("Phiên đăng nhập không hợp lệ") };

    const user = (await res.json()) as { id?: string; email?: string };
    if (!user?.id) return { response: unauthorized("Phiên đăng nhập không hợp lệ") };

    // Kiểm tra is_admin qua RLS "đọc dòng của mình" trên profiles.
    const pRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=is_admin&id=eq.${encodeURIComponent(user.id)}`,
      {
        headers: {
          apikey: SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      },
    );
    if (!pRes.ok) return { response: unauthorized("Không kiểm tra được quyền admin") };
    const profiles = (await pRes.json()) as { is_admin?: boolean }[];
    if (!Array.isArray(profiles) || !profiles[0]?.is_admin) {
      return {
        response: NextResponse.json(
          { error: "Tài khoản không có quyền admin" },
          { status: 403, headers: NO_STORE },
        ),
      };
    }

    return { user: { id: user.id, email: user.email || "unknown" } };
  } catch {
    return { response: unauthorized("Không xác thực được phiên") };
  }
}

function unauthorized(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 401, headers: NO_STORE });
}

/** Header chống cache: credential/token đổi sau mỗi lần uỷ quyền. */
export const NO_STORE = { "Cache-Control": "no-store" } as const;

export function jsonNoStore(body: unknown, status = 200): NextResponse {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

/**
 * Map lỗi thành HTTP status.
 * - Cấu hình thiếu / nhập sai -> 400, admin tự sửa được.
 * - Shopee từ chối -> 502, lỗi ở phía đối tác chứ không phải request của mình.
 */
export function errorResponse(err: unknown): NextResponse {
  if (err instanceof ShopeeConfigError) {
    return jsonNoStore({ error: err.message }, 400);
  }
  if (err instanceof ShopeeApiError) {
    return jsonNoStore({ error: err.message, code: err.code }, 502);
  }
  const message =
    (err as { message?: unknown })?.message
      ? String((err as { message?: unknown }).message)
      : "Lỗi không xác định";
  return jsonNoStore({ error: message }, 500);
}

/** Parse số nguyên an toàn, trả về null nếu không phải số. */
export function parseIntSafe(raw: unknown): number | null {
  const n = Number(raw);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}
