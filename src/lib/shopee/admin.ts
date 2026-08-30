import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/integrations/supabase/config";

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
  // URL lấy từ config (nguồn duy nhất của app) chứ KHÔNG đọc
  // process.env.NEXT_PUBLIC_SUPABASE_URL: biến đó không tồn tại trên Vercel, nên
  // đọc env trực tiếp là hàm này luôn ném lỗi "thiếu biến" dù cấu hình vẫn đủ.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !key) {
    throw new Error("Thiếu SUPABASE_SERVICE_ROLE_KEY để truy cập bảng shopee_*.");
  }
  return createClient(SUPABASE_URL, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function hasServiceRoleEnv(): boolean {
  return !!(SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
