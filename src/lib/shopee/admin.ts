import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client dùng service role — BỎ QUA RLS.
 *
 * Chỉ được import trong route handler đã tự kiểm tra session admin. Không bao
 * giờ import vào Client Component: key này mà xuống trình duyệt là mất toàn
 * quyền ghi/đọc mọi bảng.
 *
 * Cần cho các bảng shopee_* vì chúng bật RLS mà không có policy nào (xem
 * supabase/migrations/20260826_shopee_sync.sql) — anon và authenticated đều bị
 * chặn, chỉ service role đọc được.
 */
export function createAdminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY để truy cập bảng shopee_*.",
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function hasServiceRoleEnv(): boolean {
  return !!(
    (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}
