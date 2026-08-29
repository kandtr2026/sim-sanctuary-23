import { NextRequest } from "next/server";

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
 * Bảng `sims_sync_state` đã tồn tại chưa. Dùng anon key + `head=true` nên không
 * kéo hàng nào về; RLS của bảng chỉ cho service_role đọc, nên anon sẽ nhận 401/403
 * khi bảng CÓ và 404 + PGRST205 khi bảng CHƯA có. Phân biệt bằng mã lỗi, không phải
 * bằng việc đọc được dữ liệu.
 */
const kiemBangSyncState = async (): Promise<boolean | null> => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  try {
    const res = await fetch(`${url}/rest/v1/sims_sync_state?select=key&limit=1`, {
      method: "HEAD",
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8000),
    });
    // 404 = quan hệ không tồn tại. 401/403 = có bảng nhưng RLS chặn anon (đúng ý).
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
