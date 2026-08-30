import { NextRequest } from "next/server";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/config";

/**
 * Trạng thái THẬT của mấy việc cấu hình mà trang /admin/seo hiển thị.
 *
 * Vì sao cần route riêng: `src/data/seoChecklist.ts` là danh sách viết tay, nên một
 * việc đã làm ngoài code (đặt biến trên Vercel, chạy migration trên Supabase) sẽ
 * vẫn hiện "chờ làm" cho tới khi có người sửa file. Route này đọc trạng thái thật
 * để trang tự chuyển xanh.
 *
 * CHỈ trả về boolean. Không trả tên biến có giá trị gì, không trả một phần khoá,
 * không trả URL property — chủ shop chỉ cần biết "đã đặt hay chưa".
 */
export const dynamic = "force-dynamic";

const coBien = (ten: string): boolean => Boolean(process.env[ten]?.trim());

/**
 * Bảng `sims_sync_state` đã tồn tại chưa. Dùng anon key + `HEAD` nên không kéo hàng
 * nào về; bảng CHƯA có thì PostgREST trả 404 (PGRST205), bảng CÓ thì trả 200 kèm 0
 * hàng (RLS chỉ cho service_role đọc — RLS lọc HÀNG, không trả 403). Phân biệt bằng
 * mã trả về, không phải bằng việc đọc được dữ liệu.
 *
 * Đọc URL + key từ `@/integrations/supabase/config` chứ KHÔNG đọc
 * `process.env.NEXT_PUBLIC_*` trực tiếp: hai biến đó KHÔNG tồn tại trên Vercel (repo
 * để giá trị mặc định ngay trong config), nên bản đầu của route này luôn thoát sớm
 * và trả `null` — tức bảng đã tạo rồi mà console vẫn báo "chưa có". Config là nguồn
 * duy nhất mà cả app đang dùng.
 */
const kiemBangSyncState = async (): Promise<boolean | null> => {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) return null;

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/sims_sync_state?select=key&limit=1`, {
      method: "HEAD",
      headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}` },
      signal: AbortSignal.timeout(8000),
    });
    // 404 = quan hệ không tồn tại. 200/401/403 = bảng có (RLS chặn anon là đúng ý).
    if (res.status === 404) return false;
    if (res.ok || res.status === 401 || res.status === 403) return true;
    return null;
  } catch {
    return null; // mạng lỗi — thà "không biết" hơn là báo sai
  }
};

export async function GET(_req: NextRequest) {
  const syncState = await kiemBangSyncState();

  return Response.json(
    {
      // Cron gọi /api/cron/sync-sims sẽ bị từ chối tới khi biến này tồn tại.
      cronSecret: coBien("CRON_SECRET"),
      // Cần đủ CẢ BA biến mới đọc được Search Console.
      gscConnected:
        coBien("GSC_SIM_SITE_URL") && coBien("GSC_SIM_CLIENT_EMAIL") && coBien("GSC_SIM_PRIVATE_KEY"),
      // null = chưa kiểm được (thiếu cấu hình Supabase hoặc mạng lỗi).
      syncState,
      kiemLuc: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
